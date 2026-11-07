import { Prisma } from '@prisma/client'
import { prisma } from '../db/prisma'
import {
  resolveVideoProjectPagination,
  serializeVideoProject,
  serializeVideoProjectListItem,
  type SerializedProjectBody,
  type VideoProjectListQuery,
  type VideoProjectListResult,
} from './shared'

const buildKeywordWhereInput = (keyword: string): Prisma.VideoProjectWhereInput | undefined => {
  const value = String(keyword || '').trim()
  if (!value) return undefined
  return { name: { contains: value } }
}

// 查询当前用户的视频项目列表。返回精简结构（不含 scenes）。
export const listMineVideoProjects = async (query: VideoProjectListQuery, userId: string) => {
  const where: Prisma.VideoProjectWhereInput = {
    userId,
    isDeleted: false,
    ...(buildKeywordWhereInput(query.keyword) || {}),
  }

  const totalCount = await prisma.videoProject.count({ where })
  const pagination = resolveVideoProjectPagination(query, totalCount)

  const records = await prisma.videoProject.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
    skip: pagination.skip,
    take: pagination.pageSize,
    select: {
      id: true,
      name: true,
      thumbnail: true,
      version: true,
      currentSceneId: true,
      durationSeconds: true,
      metadataJson: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  return {
    items: records.map(serializeVideoProjectListItem),
    summary: {
      totalCount: pagination.totalCount,
      totalPages: pagination.totalPages,
      page: pagination.page,
      pageSize: pagination.pageSize,
    },
  } satisfies VideoProjectListResult<ReturnType<typeof serializeVideoProjectListItem>>
}

// 管理员查询全部用户的视频项目（含被软删的，按更新时间倒序）。
export const listAllVideoProjects = async (query: VideoProjectListQuery) => {
  const where: Prisma.VideoProjectWhereInput = {
    ...(buildKeywordWhereInput(query.keyword) || {}),
  }

  const totalCount = await prisma.videoProject.count({ where })
  const pagination = resolveVideoProjectPagination(query, totalCount)

  const records = await prisma.videoProject.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
    skip: pagination.skip,
    take: pagination.pageSize,
    select: {
      id: true,
      name: true,
      thumbnail: true,
      version: true,
      currentSceneId: true,
      durationSeconds: true,
      metadataJson: true,
      isDeleted: true,
      createdAt: true,
      updatedAt: true,
      user: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
    },
  })

  return {
    items: records.map(serializeVideoProjectListItem),
    summary: {
      totalCount: pagination.totalCount,
      totalPages: pagination.totalPages,
      page: pagination.page,
      pageSize: pagination.pageSize,
    },
  } satisfies VideoProjectListResult<ReturnType<typeof serializeVideoProjectListItem>>
}

// 加载单个项目完整数据（含 scenes）。非管理员只能加载自己的。
export const getVideoProjectById = async ({ id, userId, isAdmin }: { id: string; userId: string; isAdmin: boolean }) => {
  const record = await prisma.videoProject.findUnique({ where: { id } })
  if (!record || record.isDeleted) return null
  if (!isAdmin && record.userId !== userId) {
    return { forbidden: true as const }
  }
  return serializeVideoProject(record)
}

// 全量 upsert 项目。首次保存创建，已有则覆盖（含软删恢复 isDeleted=false）。
// 越权（试图覆盖别人的项目）→ 返回 { forbidden: true }。
export const upsertVideoProject = async ({
  id,
  userId,
  isAdmin,
  body,
}: {
  id: string
  userId: string
  isAdmin: boolean
  body: SerializedProjectBody
}) => {
  const existing = await prisma.videoProject.findUnique({ where: { id }, select: { userId: true, isDeleted: true } })
  if (existing && !isAdmin && existing.userId !== userId) {
    return { forbidden: true as const }
  }

  const ownerId = existing?.userId ?? userId
  const durationSeconds = Number.isFinite(body.metadata.duration) ? Math.round(body.metadata.duration) : 0

  const record = await prisma.videoProject.upsert({
    where: { id },
    create: {
      id,
      userId: ownerId,
      name: body.metadata.name,
      thumbnail: body.metadata.thumbnail ?? null,
      version: body.version,
      metadataJson: body.metadata as unknown as Prisma.InputJsonValue,
      settingsJson: body.settings as Prisma.InputJsonValue,
      scenesJson: body.scenes as unknown as Prisma.InputJsonValue,
      timelineViewStateJson: body.timelineViewState
        ? (body.timelineViewState as Prisma.InputJsonValue)
        : Prisma.JsonNull,
      agentMessagesJson: body.agentMessages
        ? (body.agentMessages as unknown as Prisma.InputJsonValue)
        : Prisma.JsonNull,
      currentSceneId: body.currentSceneId || null,
      durationSeconds,
    },
    update: {
      name: body.metadata.name,
      thumbnail: body.metadata.thumbnail ?? null,
      version: body.version,
      metadataJson: body.metadata as unknown as Prisma.InputJsonValue,
      settingsJson: body.settings as Prisma.InputJsonValue,
      scenesJson: body.scenes as unknown as Prisma.InputJsonValue,
      timelineViewStateJson: body.timelineViewState
        ? (body.timelineViewState as Prisma.InputJsonValue)
        : Prisma.JsonNull,
      agentMessagesJson: body.agentMessages
        ? (body.agentMessages as unknown as Prisma.InputJsonValue)
        : Prisma.JsonNull,
      currentSceneId: body.currentSceneId || null,
      durationSeconds,
      isDeleted: false,
    },
  })

  return serializeVideoProject(record)
}

// 软删除项目（管理员可删任何人的）。
export const softDeleteVideoProject = async ({ id, userId, isAdmin }: { id: string; userId: string; isAdmin: boolean }) => {
  const existing = await prisma.videoProject.findUnique({ where: { id }, select: { userId: true } })
  if (!existing) return { notFound: true as const }
  if (!isAdmin && existing.userId !== userId) {
    return { forbidden: true as const }
  }

  await prisma.videoProject.update({ where: { id }, data: { isDeleted: true } })
  return { ok: true as const }
}
