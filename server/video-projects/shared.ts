import { readJsonBody, sendJson } from '../ai-gateway/shared'

export type VideoProjectScope = 'mine' | 'all'

export interface VideoProjectListQuery {
  scope: VideoProjectScope
  page: number
  pageSize: number
  keyword: string
}

export interface VideoProjectListResult<TItem = Record<string, unknown>> {
  items: TItem[]
  summary: {
    totalCount: number
    totalPages: number
    page: number
    pageSize: number
  }
}

// SerializedProject 在 cutia 端的契约结构（字段命名与 src-cutia/types/project.ts 保持一致）
export interface SerializedProjectBody {
  metadata: {
    id: string
    name: string
    thumbnail?: string
    duration: number
    createdAt: string
    updatedAt: string
  }
  scenes: unknown[]
  currentSceneId?: string
  settings: Record<string, unknown>
  version: number
  timelineViewState?: Record<string, unknown> | null
  agentMessages?: unknown[] | null
}

export const readVideoProjectListQuery = (requestUrl: string): VideoProjectListQuery => {
  const url = new URL(requestUrl, 'http://localhost')
  const rawScope = String(url.searchParams.get('scope') || '').trim().toLowerCase()
  const rawPage = Number(url.searchParams.get('page') || 1)
  const rawPageSize = Number(url.searchParams.get('pageSize') || 0)
  const keyword = String(url.searchParams.get('keyword') || '').trim()

  const pageSize = Number.isFinite(rawPageSize) && rawPageSize > 0
    ? Math.min(rawPageSize, 120)
    : 60
  const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1

  return {
    scope: rawScope === 'all' ? 'all' : 'mine',
    page,
    pageSize,
    keyword,
  }
}

// 读取并最低限度校验保存项目的请求体（详细字段 schema 在 service.upsert 内做）
export const readVideoProjectBody = async (req: any): Promise<SerializedProjectBody | null> => {
  const payload = (await readJsonBody(req)) as Record<string, unknown> | null
  if (!payload || typeof payload !== 'object') return null

  const metadata = (payload as any).metadata
  if (!metadata || typeof metadata !== 'object' || !metadata.id || typeof metadata.id !== 'string') {
    return null
  }

  return {
    metadata: {
      id: String(metadata.id).trim(),
      name: String(metadata.name || '').trim() || '未命名项目',
      thumbnail: metadata.thumbnail ? String(metadata.thumbnail) : undefined,
      duration: Number(metadata.duration || 0),
      createdAt: String(metadata.createdAt || new Date().toISOString()),
      updatedAt: String(metadata.updatedAt || new Date().toISOString()),
    },
    scenes: Array.isArray((payload as any).scenes) ? (payload as any).scenes : [],
    currentSceneId: (payload as any).currentSceneId ? String((payload as any).currentSceneId) : '',
    settings: ((payload as any).settings as Record<string, unknown>) || {},
    version: Number((payload as any).version || 3),
    timelineViewState: ((payload as any).timelineViewState as Record<string, unknown>) || null,
    agentMessages: Array.isArray((payload as any).agentMessages) ? (payload as any).agentMessages : null,
  }
}

export const sendVideoProjectsError = (res: any, statusCode: number, message: string) => {
  sendJson(res, statusCode, {
    message,
    error: {
      type: 'video_projects_error',
      message,
    },
  })
}

// 把数据库记录转回 SerializedProject 形态（与 cutia 类型严格对齐，零转换）
export const serializeVideoProject = (record: any) => {
  return {
    metadata: {
      ...((record.metadataJson as object) || {}),
      id: record.id,
      name: record.name,
      thumbnail: record.thumbnail ?? undefined,
      // 优先使用 metadataJson 内嵌的 createdAt/updatedAt（cutia 写入时填的），不存在再回退到 DB 列
      createdAt: ((record.metadataJson as any)?.createdAt) || record.createdAt,
      updatedAt: ((record.metadataJson as any)?.updatedAt) || record.updatedAt,
      duration: Number((record.metadataJson as any)?.duration ?? record.durationSeconds ?? 0),
    },
    scenes: (record.scenesJson as unknown[]) || [],
    currentSceneId: record.currentSceneId || '',
    settings: (record.settingsJson as Record<string, unknown>) || {},
    version: record.version,
    timelineViewState: (record.timelineViewStateJson as Record<string, unknown>) || undefined,
    agentMessages: (record.agentMessagesJson as unknown[]) || undefined,
  }
}

// 列表返回精简版（不含 scenes，节省带宽）
export const serializeVideoProjectListItem = (record: any) => {
  return {
    metadata: {
      id: record.id,
      name: record.name,
      thumbnail: record.thumbnail ?? undefined,
      duration: Number((record.metadataJson as any)?.duration ?? record.durationSeconds ?? 0),
      createdAt: ((record.metadataJson as any)?.createdAt) || record.createdAt,
      updatedAt: ((record.metadataJson as any)?.updatedAt) || record.updatedAt,
    },
    durationSeconds: record.durationSeconds ?? undefined,
    thumbnail: record.thumbnail ?? undefined,
    updatedAt: record.updatedAt,
    version: record.version,
    owner: record.user
      ? {
          id: record.user.id || '',
          name: String(record.user.name || '').trim() || '创作者',
          email: String(record.user.email || '').trim(),
        }
      : undefined,
  }
}

export const resolveVideoProjectPagination = (query: VideoProjectListQuery, totalCount: number) => {
  const pageSize = Math.min(120, Math.max(1, Number(query.pageSize || 60)))
  const totalPages = Math.max(1, Math.ceil(Math.max(0, totalCount) / pageSize))
  const page = Math.min(Math.max(1, Number(query.page || 1)), totalPages)
  const skip = (page - 1) * pageSize
  return { page, pageSize, totalPages, totalCount: Math.max(0, totalCount), skip }
}
