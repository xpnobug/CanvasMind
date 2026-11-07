import crypto from 'node:crypto'
import type { Prisma } from '@prisma/client'
import { invalidateAdminDashboardOverviewCache } from '../admin-dashboard/service'
import { invalidateAdminUsersCaches } from '../admin-users/service'
import { invalidateRedisCachePatterns } from '../redis/cache-manager'
import { getOrSetJsonCache } from '../redis/json-cache'
import { redisKeys } from '../redis/keys'
import { prisma } from '../db/prisma'
import { saveUploadedBuffer } from '../storage/service'
import type { AssetActionPayload, AssetKind, AssetListQuery, AssetListResult } from './shared'

const DEFAULT_AUTHOR = {
  id: '',
  name: '创作者',
  avatarSrc: '',
  email: '',
}

const PUBLIC_ASSET_ITEMS_SCOPE = 'asset-items-public'
const MINE_ASSET_ITEMS_SCOPE = 'asset-items-mine'
const ALL_ASSET_ITEMS_SCOPE = 'asset-items-all'
const PUBLIC_ASSET_ITEMS_CACHE_PATTERN = redisKeys.cache(PUBLIC_ASSET_ITEMS_SCOPE, '*')
const MINE_ASSET_ITEMS_CACHE_PATTERN = redisKeys.cache(MINE_ASSET_ITEMS_SCOPE, '*')
const ALL_ASSET_ITEMS_CACHE_PATTERN = redisKeys.cache(ALL_ASSET_ITEMS_SCOPE, '*')

const buildAssetItemsQueryHash = (query: AssetListQuery) => {
  return crypto
    .createHash('sha1')
    .update(JSON.stringify({
      scope: String(query.scope || '').trim(),
      assetType: String(query.assetType || '').trim(),
      page: Number(query.page || 1),
      pageSize: Number(query.pageSize || 0),
      take: Number(query.take || 0),
      publishState: String(query.publishState || '').trim(),
      ownerKeyword: String(query.ownerKeyword || '').trim(),
      includeEditorUploads: query.includeEditorUploads ? 1 : 0,
    }))
    .digest('hex')
}

// 把前端 assetType('image' | 'video' | 'audio') 映射为 Prisma enum。
const toPrismaAssetType = (kind: AssetListQuery['assetType']) => {
  if (kind === 'video') return 'VIDEO' as const
  if (kind === 'audio') return 'AUDIO' as const
  return 'IMAGE' as const
}

const buildPublicAssetItemsCacheKey = (query: AssetListQuery) => {
  return redisKeys.cache(PUBLIC_ASSET_ITEMS_SCOPE, buildAssetItemsQueryHash(query))
}

const buildMineAssetItemsCacheKey = (query: AssetListQuery, currentUserId: string) => {
  return redisKeys.cache(MINE_ASSET_ITEMS_SCOPE, `${currentUserId}:${buildAssetItemsQueryHash(query)}`)
}

const buildAllAssetItemsCacheKey = (query: AssetListQuery) => {
  return redisKeys.cache(ALL_ASSET_ITEMS_SCOPE, buildAssetItemsQueryHash(query))
}

export const invalidateAssetItemsCaches = async () => {
  await invalidateRedisCachePatterns([
    PUBLIC_ASSET_ITEMS_CACHE_PATTERN,
    MINE_ASSET_ITEMS_CACHE_PATTERN,
    ALL_ASSET_ITEMS_CACHE_PATTERN,
  ])
}

// 统一把关联用户信息映射为前端作者结构。
const serializeOwner = (user: { id?: string | null; name?: string | null; email?: string | null; avatarUrl?: string | null } | null | undefined) => {
  if (!user) {
    return DEFAULT_AUTHOR
  }

  return {
    id: String(user.id || '').trim(),
    name: String(user.name || '').trim() || DEFAULT_AUTHOR.name,
    email: String(user.email || '').trim(),
    avatarSrc: String(user.avatarUrl || '').trim(),
  }
}

// 统一构建资源 owner 查询条件，支持按用户 ID、昵称、邮箱模糊检索。
const buildOwnerWhereInput = (ownerKeyword: string) => {
  const keyword = String(ownerKeyword || '').trim()
  if (!keyword) {
    return undefined
  }

  return {
    OR: [
      {
        user: {
          id: {
            contains: keyword,
          },
        },
      },
      {
        user: {
          name: {
            contains: keyword,
          },
        },
      },
      {
        user: {
          email: {
            contains: keyword,
          },
        },
      },
    ],
  } satisfies Prisma.AssetItemWhereInput
}

// 统一构建后台资源发布状态过滤条件。
const buildPublishStateWhereInput = (publishState: AssetListQuery['publishState']) => {
  if (publishState === 'published') {
    return {
      visibility: 'PUBLIC' as const,
      publishStatus: 'PUBLISHED' as const,
      reviewStatus: 'APPROVED' as const,
    }
  }

  if (publishState === 'draft') {
    return {
      publishStatus: 'DRAFT' as const,
      reviewStatus: {
        not: 'PENDING' as const,
      },
    }
  }

  if (publishState === 'pending') {
    return {
      publishStatus: 'DRAFT' as const,
      reviewStatus: 'PENDING' as const,
    }
  }

  return {}
}

// 统一把分页参数裁剪到可用范围，避免各资源查询重复处理。
const resolvePagination = (query: AssetListQuery, totalCount: number) => {
  const pageSize = Math.min(120, Math.max(1, Number(query.pageSize || query.take || 60)))
  const totalPages = Math.max(1, Math.ceil(Math.max(0, totalCount) / pageSize))
  const page = Math.min(Math.max(1, Number(query.page || 1)), totalPages)
  const skip = (page - 1) * pageSize

  return {
    page,
    pageSize,
    totalPages,
    totalCount: Math.max(0, totalCount),
    skip,
  }
}

// 统一组装资源分页结果，保持后台各列表返回结构一致。
const buildAssetListResult = (items: ReturnType<typeof serializeAssetItem>[], pagination: ReturnType<typeof resolvePagination>) => {
  return {
    items,
    summary: {
      totalCount: pagination.totalCount,
      totalPages: pagination.totalPages,
      page: pagination.page,
      pageSize: pagination.pageSize,
    },
  } satisfies AssetListResult<ReturnType<typeof serializeAssetItem>>
}

// 数据库存储值转前端资源类型。
const toAssetType = (assetType: string) => String(assetType || '').toLowerCase() === 'video'
  ? 'video'
  : 'image'

// 统一把数据库资源映射为前端可直接消费的结构。
const serializeAssetItem = (record: any) => {
  const assetType = toAssetType(record.assetType)
  const previewUrl = record.thumbnailUrl || record.coverUrl || record.fileUrl

  return {
    id: record.id,
    assetType,
    title: record.title || '',
    description: record.description || '',
    fileUrl: record.fileUrl,
    previewUrl,
    coverUrl: record.coverUrl || '',
    thumbnailUrl: record.thumbnailUrl || '',
    fileSizeBytes: record.fileSizeBytes ? Number(record.fileSizeBytes) : undefined,
    promptText: record.promptText || '',
    modelLabel: record.modelLabel || '',
    aspectRatio: record.aspectRatio || '',
    favoriteCount: record.favoriteCount || 0,
    viewCount: record.viewCount || 0,
    downloadCount: record.downloadCount || 0,
    width: record.width || undefined,
    height: record.height || undefined,
    durationSeconds: record.durationSeconds || undefined,
    mimeType: record.mimeType || undefined,
    visibility: String(record.visibility || '').toLowerCase(),
    publishStatus: String(record.publishStatus || '').toLowerCase(),
    reviewStatus: String(record.reviewStatus || '').toLowerCase(),
    source: String(record.source || '').toLowerCase(),
    generationRecordId: record.generationRecordId || '',
    generationOutputId: record.generationOutputId || '',
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    publishedAt: record.publishedAt,
    owner: serializeOwner(record.user),
    sourceMeta: record.sourceMetaJson || {},
  }
}

// 查询首页公开瀑布流。
export const listPublicAssetItems = async (query: AssetListQuery) => {
  return getOrSetJsonCache({
    key: buildPublicAssetItemsCacheKey(query),
    ttlSeconds: 45,
    factory: async () => {
      const where: Prisma.AssetItemWhereInput = {
        assetType: toPrismaAssetType(query.assetType),
        isDeleted: false,
        visibility: 'PUBLIC',
        publishStatus: 'PUBLISHED',
        reviewStatus: 'APPROVED',
        source: { not: 'EDITOR_UPLOAD' as const },
      }
      const totalCount = await prisma.assetItem.count({ where })
      const pagination = resolvePagination(query, totalCount)
      const records = await prisma.assetItem.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: [
          { publishedAt: 'desc' },
          { createdAt: 'desc' },
        ],
        skip: pagination.skip,
        take: pagination.pageSize,
      })

      return buildAssetListResult(records.map(serializeAssetItem), pagination)
    },
  })
}

// 查询当前用户资产。
export const listMineAssetItems = async (query: AssetListQuery, currentUserId: string) => {
  // ids batch 反查: 用于加载视频项目时根据项目 JSON 中的 mediaId 集合反查 AssetItem。
  // 此路径不走缓存(每次 ids 集合不同),直接 DB 命中。
  if (query.ids.length > 0) {
    const records = await prisma.assetItem.findMany({
      where: {
        userId: currentUserId,
        id: { in: query.ids },
        isDeleted: false,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    })
    // 保持返回顺序与输入 ids 一致, 缺失的项跳过(死引用容错)
    const byId = new Map(records.map((r) => [r.id, r]))
    const orderedItems = query.ids
      .map((id) => byId.get(id))
      .filter((record): record is NonNullable<typeof record> => Boolean(record))
      .map(serializeAssetItem)
    return {
      items: orderedItems,
      summary: {
        totalCount: orderedItems.length,
        totalPages: 1,
        page: 1,
        pageSize: orderedItems.length,
      },
    }
  }

  return getOrSetJsonCache({
    key: buildMineAssetItemsCacheKey(query, currentUserId),
    ttlSeconds: 30,
    factory: async () => {
      const publishStateWhere = buildPublishStateWhereInput(query.publishState)
      const where: Prisma.AssetItemWhereInput = {
        userId: currentUserId,
        assetType: toPrismaAssetType(query.assetType),
        isDeleted: false,
        // 默认排除编辑器上传的工作素材, 让主站资产库保持纯净。
        // 编辑器内"我的资产" tab 通过 includeEditorUploads=true 显示全部。
        ...(query.includeEditorUploads ? {} : { source: { not: 'EDITOR_UPLOAD' as const } }),
        ...publishStateWhere,
      }
      const totalCount = await prisma.assetItem.count({ where })
      const pagination = resolvePagination(query, totalCount)

      const records = await prisma.assetItem.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: [
          query.publishState === 'published'
            ? { publishedAt: 'desc' }
            : { createdAt: 'desc' },
          { createdAt: 'desc' },
        ],
        skip: pagination.skip,
        take: pagination.pageSize,
      })

      return buildAssetListResult(records.map(serializeAssetItem), pagination)
    },
  })
}

// 查询全站资源，供后台按用户维度统一管理。
export const listAllAssetItems = async (query: AssetListQuery) => {
  return getOrSetJsonCache({
    key: buildAllAssetItemsCacheKey(query),
    ttlSeconds: 30,
    factory: async () => {
      const publishStateWhere = buildPublishStateWhereInput(query.publishState)
      const ownerWhere = buildOwnerWhereInput(query.ownerKeyword)
      const where: Prisma.AssetItemWhereInput = {
        assetType: toPrismaAssetType(query.assetType),
        isDeleted: false,
        // admin 全量管理界面默认不显示编辑器工作素材, includeEditorUploads=true 才显示
        ...(query.includeEditorUploads ? {} : { source: { not: 'EDITOR_UPLOAD' as const } }),
        ...publishStateWhere,
        ...ownerWhere,
      }
      const totalCount = await prisma.assetItem.count({ where })
      const pagination = resolvePagination(query, totalCount)

      const records = await prisma.assetItem.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: [
          query.publishState === 'published'
            ? { publishedAt: 'desc' }
            : { createdAt: 'desc' },
          { createdAt: 'desc' },
        ],
        skip: pagination.skip,
        take: pagination.pageSize,
      })

      return buildAssetListResult(records.map(serializeAssetItem), pagination)
    },
  })
}

// 批量更新资源状态。
export const applyAssetAction = async (payload: AssetActionPayload, currentUserId: string, isAdminUser = false) => {
  if (!payload.ids.length) {
    throw new Error('缺少资源 ID')
  }

  if (payload.scope === 'feed') {
    throw new Error('公开资源不支持直接执行后台动作')
  }

  if (payload.scope === 'all' && !isAdminUser) {
    throw new Error('只有管理员可以操作全站资源')
  }

  if (payload.scope === 'all' && !['delete', 'publish', 'unpublish'].includes(payload.action)) {
    throw new Error('全站资源仅支持删除、发布和下架操作')
  }

  const where: Prisma.AssetItemWhereInput = {
    id: { in: payload.ids },
    isDeleted: false,
  }

  if (!(payload.scope === 'all' && isAdminUser)) {
    where.userId = currentUserId
  }

  const invalidateRelatedCaches = async () => {
    await invalidateAssetItemsCaches()

    if (payload.scope === 'all' && isAdminUser) {
      await invalidateAdminDashboardOverviewCache()
      await invalidateAdminUsersCaches()
      return
    }

    await invalidateAdminDashboardOverviewCache(currentUserId)
    await invalidateAdminUsersCaches(currentUserId)
  }

  switch (payload.action) {
    case 'delete': {
      const result = await prisma.assetItem.updateMany({
        where,
        data: {
          isDeleted: true,
          visibility: 'PRIVATE',
          publishStatus: 'HIDDEN',
        },
      })

      await invalidateRelatedCaches()
      return {
        action: payload.action,
        affectedCount: result.count,
      }
    }

    case 'publish': {
      if (payload.scope !== 'all' || !isAdminUser) {
        const result = await prisma.assetItem.updateMany({
          where,
          data: {
            visibility: 'PRIVATE',
            publishStatus: 'DRAFT',
            reviewStatus: 'PENDING',
            publishedAt: null,
          },
        })

        await invalidateRelatedCaches()
        return {
          action: payload.action,
          affectedCount: result.count,
        }
      }

      const result = await prisma.assetItem.updateMany({
        where,
        data: {
          visibility: 'PUBLIC',
          publishStatus: 'PUBLISHED',
          reviewStatus: 'APPROVED',
          publishedAt: new Date(),
        },
      })

      await invalidateRelatedCaches()
      return {
        action: payload.action,
        affectedCount: result.count,
      }
    }

    case 'unpublish': {
      const result = await prisma.assetItem.updateMany({
        where,
        data: {
          visibility: 'PRIVATE',
          publishStatus: 'DRAFT',
          reviewStatus: 'APPROVED',
          publishedAt: null,
        },
      })

      await invalidateRelatedCaches()
      return {
        action: payload.action,
        affectedCount: result.count,
      }
    }

    case 'favorite': {
      const result = await prisma.assetItem.updateMany({
        where,
        data: {
          favoriteCount: {
            increment: 1,
          },
        },
      })

      return {
        action: payload.action,
        affectedCount: result.count,
      }
    }

    case 'view': {
      const result = await prisma.assetItem.updateMany({
        where,
        data: {
          viewCount: {
            increment: 1,
          },
        },
      })

      return {
        action: payload.action,
        affectedCount: result.count,
      }
    }

    case 'download': {
      const result = await prisma.assetItem.updateMany({
        where,
        data: {
          downloadCount: {
            increment: 1,
          },
        },
      })

      return {
        action: payload.action,
        affectedCount: result.count,
      }
    }

    default:
      throw new Error('不支持的资源动作')
  }
}

// 把前端编辑器 upload headers 的 assetType('image'|'video'|'audio') 映射为 Prisma enum。
const editorAssetKindToPrisma = (kind: AssetKind) => {
  if (kind === 'video') return 'VIDEO' as const
  if (kind === 'audio') return 'AUDIO' as const
  return 'IMAGE' as const
}

// 从编辑器上传的 buffer 写入 AssetItem。
// 用于 cutia 编辑器内 MediaManager.addMediaAsset 异步触发的云端同步。
// 不复用主站 /api/storage/upload(那个不写 AssetItem,且无业务校验)。
export const uploadAssetItemFromEditor = async (input: {
  buffer: Buffer
  filename: string
  mimeType: string
  assetType: AssetKind
  userId: string
  metadata: Record<string, unknown>
}) => {
  // 调用通用上传, 自动走对象存储(优先)或本地上传
  const uploaded = await saveUploadedBuffer({
    buffer: input.buffer,
    filename: input.filename,
    mimeType: input.mimeType,
    category: 'editor-uploads',
  })

  const meta = input.metadata || {}
  const widthNum = Number(meta.width)
  const heightNum = Number(meta.height)
  const durationNum = Number(meta.durationSeconds ?? meta.duration)
  const thumbnailUrl = String(meta.thumbnailUrl || '').trim() || null
  const title = String(meta.title || input.filename || '').trim().slice(0, 255)

  const record = await prisma.assetItem.create({
    data: {
      userId: input.userId,
      assetType: editorAssetKindToPrisma(input.assetType),
      title,
      fileUrl: uploaded.publicUrl,
      thumbnailUrl,
      mimeType: input.mimeType,
      width: Number.isFinite(widthNum) && widthNum > 0 ? Math.floor(widthNum) : null,
      height: Number.isFinite(heightNum) && heightNum > 0 ? Math.floor(heightNum) : null,
      durationSeconds: Number.isFinite(durationNum) && durationNum > 0 ? Math.round(durationNum) : null,
      fileSizeBytes: BigInt(input.buffer.byteLength),
      source: 'EDITOR_UPLOAD',
      visibility: 'PRIVATE',
      publishStatus: 'HIDDEN',
      reviewStatus: 'APPROVED',
      sourceMetaJson: meta as Prisma.InputJsonValue,
    },
    include: {
      user: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
    },
  })

  // 失效"我的列表"缓存(包含 EDITOR_UPLOAD 过滤的也要刷)
  await invalidateAssetItemsCaches()

  return serializeAssetItem(record)
}
