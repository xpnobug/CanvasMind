import { invalidateRedisCachePatterns, invalidateRedisCaches } from '../redis/cache-manager'
import { getOrSetJsonCache } from '../redis/json-cache'
import { redisKeys } from '../redis/keys'
import { prisma } from '../db/prisma'

const DEFAULT_GENERATION_SESSION_TITLE = '默认创作'
const NEW_GENERATION_SESSION_TITLE = '新对话'
const MAX_GENERATION_SESSION_TITLE_LENGTH = 120
const GENERATION_SESSIONS_LIST_SCOPE = 'generation-sessions-list'
const GENERATION_SESSIONS_LIST_CACHE_PATTERN = redisKeys.cache(GENERATION_SESSIONS_LIST_SCOPE, '*')
const DEFAULT_GENERATION_SESSION_SOURCE = 'generate'
const MAX_GENERATION_SESSION_SOURCE_LENGTH = 64
const normalizeGenerationSessionSource = (source?: string | null) => {
  const normalized = String(source || '').trim().slice(0, MAX_GENERATION_SESSION_SOURCE_LENGTH)
  return normalized || DEFAULT_GENERATION_SESSION_SOURCE
}
const buildGenerationSessionsListCacheKey = (currentUserId: string, source: string) =>
  redisKeys.cache(GENERATION_SESSIONS_LIST_SCOPE, `${currentUserId}:${source}`)
const buildGenerationSessionsListCachePatternForUser = (currentUserId: string) =>
  redisKeys.cache(GENERATION_SESSIONS_LIST_SCOPE, `${currentUserId}:*`)

const normalizeGenerationSessionTitle = (title?: string, fallback = NEW_GENERATION_SESSION_TITLE) => {
  const normalizedTitle = String(title || '').trim()
  return (normalizedTitle || fallback).slice(0, MAX_GENERATION_SESSION_TITLE_LENGTH)
}

const buildGenerationSessionInclude = () => ({
  _count: {
    select: {
      records: true,
    },
  },
  records: {
    take: 1,
    orderBy: {
      createdAt: 'desc' as const,
    },
    include: {
      outputs: {
        where: {
          outputType: 'IMAGE' as const,
          url: {
            not: null,
          },
        },
        take: 1,
        orderBy: {
          sortOrder: 'asc' as const,
        },
      },
    },
  },
})

const serializeGenerationSession = (session: any) => ({
  id: session.id,
  source: String(session.source || DEFAULT_GENERATION_SESSION_SOURCE),
  title: session.title,
  isDefault: Boolean(session.isDefault),
  sortOrder: Number(session.sortOrder || 0),
  recordCount: Number(session._count?.records || 0),
  coverImageUrl: session.records?.[0]?.outputs?.[0]?.url || '',
  lastRecordAt: session.lastRecordAt,
  createdAt: session.createdAt,
  updatedAt: session.updatedAt,
})

// 确保每个用户在每个 source 入口下至少有一个默认会话。
export const ensureDefaultGenerationSession = async (tx: any, currentUserId: string, source?: string | null) => {
  const normalizedSource = normalizeGenerationSessionSource(source)
  const existingDefaultSession = await tx.generationSession.findFirst({
    where: {
      userId: currentUserId,
      source: normalizedSource,
      isDefault: true,
    },
  })

  if (existingDefaultSession) {
    return existingDefaultSession
  }

  return tx.generationSession.create({
    data: {
      userId: currentUserId,
      source: normalizedSource,
      title: DEFAULT_GENERATION_SESSION_TITLE,
      isDefault: true,
      sortOrder: 0,
    },
  })
}

// 会话内记录变动后，重算最近一条记录时间，保证左侧排序稳定。
export const refreshGenerationSessionLastRecordAt = async (tx: any, sessionId: string) => {
  const latestRecord = await tx.generationRecord.findFirst({
    where: { sessionId },
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      createdAt: true,
    },
  })

  await tx.generationSession.update({
    where: { id: sessionId },
    data: {
      lastRecordAt: latestRecord?.createdAt || null,
    },
  })
}

// 校验并返回目标会话；未传会话时按 source 回退到默认会话。
export const resolveGenerationSessionForUser = async (
  tx: any,
  currentUserId: string,
  sessionId?: string | null,
  source?: string | null,
) => {
  const normalizedSessionId = String(sessionId || '').trim()
  const normalizedSource = normalizeGenerationSessionSource(source)

  if (!normalizedSessionId) {
    return ensureDefaultGenerationSession(tx, currentUserId, normalizedSource)
  }

  const existingSession = await tx.generationSession.findFirst({
    where: {
      id: normalizedSessionId,
      userId: currentUserId,
    },
  })

  if (!existingSession) {
    throw new Error('目标会话不存在或无权访问')
  }

  return existingSession
}

// 获取当前用户在指定 source 下的全部生成会话，若不存在则自动创建默认会话。
export const listGenerationSessions = async (currentUserId: string, source?: string | null) => {
  const normalizedUserId = String(currentUserId || '').trim()
  const normalizedSource = normalizeGenerationSessionSource(source)
  return getOrSetJsonCache({
    key: buildGenerationSessionsListCacheKey(normalizedUserId, normalizedSource),
    ttlSeconds: 60,
    factory: async () => {
      await prisma.$transaction(async (tx) => {
        await ensureDefaultGenerationSession(tx, normalizedUserId, normalizedSource)
      })

      const sessions = await prisma.generationSession.findMany({
        where: {
          userId: normalizedUserId,
          source: normalizedSource,
        },
        include: buildGenerationSessionInclude(),
        orderBy: [
          { isDefault: 'desc' },
          { lastRecordAt: 'desc' },
          { updatedAt: 'desc' },
        ],
      })

      return sessions.map(serializeGenerationSession)
    },
  })
}

export const invalidateGenerationSessionsCache = async (
  currentUserId?: string | null,
  source?: string | null,
) => {
  const normalizedUserId = String(currentUserId || '').trim()
  if (normalizedUserId) {
    const normalizedSource = String(source || '').trim()
    if (normalizedSource) {
      await invalidateRedisCaches([buildGenerationSessionsListCacheKey(normalizedUserId, normalizedSource)])
      return
    }
    // 无 source 时清当前用户所有 source 的缓存（用 pattern）
    await invalidateRedisCachePatterns([buildGenerationSessionsListCachePatternForUser(normalizedUserId)])
    return
  }

  await invalidateRedisCachePatterns([GENERATION_SESSIONS_LIST_CACHE_PATTERN])
}

// 创建新会话。
export const createGenerationSession = async (
  payload: { title?: string; source?: string },
  currentUserId: string,
) => {
  const normalizedSource = normalizeGenerationSessionSource(payload.source)
  const session = await prisma.$transaction(async (tx) => {
    await ensureDefaultGenerationSession(tx, currentUserId, normalizedSource)

    return tx.generationSession.create({
      data: {
        userId: currentUserId,
        source: normalizedSource,
        title: normalizeGenerationSessionTitle(payload.title),
        isDefault: false,
        sortOrder: 0,
      },
      include: buildGenerationSessionInclude(),
    })
  })

  await invalidateGenerationSessionsCache(currentUserId, normalizedSource)
  return serializeGenerationSession(session)
}

// 重命名会话。
export const updateGenerationSession = async (id: string, payload: { title?: string }, currentUserId: string) => {
  const existingSession = await prisma.generationSession.findFirst({
    where: {
      id,
      userId: currentUserId,
    },
  })

  if (!existingSession) {
    throw new Error('会话不存在或无权访问')
  }

  const session = await prisma.generationSession.update({
    where: { id },
    data: {
      title: normalizeGenerationSessionTitle(payload.title, existingSession.isDefault ? DEFAULT_GENERATION_SESSION_TITLE : NEW_GENERATION_SESSION_TITLE),
    },
    include: buildGenerationSessionInclude(),
  })

  await invalidateGenerationSessionsCache(currentUserId, existingSession.source)
  return serializeGenerationSession(session)
}

// 删除会话，同时级联删除该会话下的生成记录。
export const deleteGenerationSession = async (id: string, currentUserId: string) => {
  let deletedSource = DEFAULT_GENERATION_SESSION_SOURCE
  await prisma.$transaction(async (tx) => {
    const existingSession = await tx.generationSession.findFirst({
      where: {
        id,
        userId: currentUserId,
      },
    })

    if (!existingSession) {
      throw new Error('会话不存在或无权访问')
    }

    if (existingSession.isDefault) {
      throw new Error('默认会话不允许删除')
    }

    deletedSource = String(existingSession.source || DEFAULT_GENERATION_SESSION_SOURCE)

    await tx.generationSession.delete({
      where: { id },
    })

    await ensureDefaultGenerationSession(tx, currentUserId, deletedSource)
  })

  await invalidateGenerationSessionsCache(currentUserId, deletedSource)
  return {
    id,
  }
}
