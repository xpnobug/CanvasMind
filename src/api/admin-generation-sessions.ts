import { adminDelete, adminGet, adminPatch } from './admin-request'

export type AdminGenerationSessionStatus = 'ALL' | 'HAS_ERROR' | 'RUNNING' | 'COMPLETED' | 'EMPTY'
export type AdminGenerationSessionType = 'ALL' | 'IMAGE' | 'VIDEO' | 'AGENT' | 'DIGITAL_HUMAN' | 'MOTION'
/** 列表筛选字段；后端暂不消费，前端仅作 UI 占位。 */
export type AdminGenerationSessionOrigin =
  | 'ALL'
  | 'GENERATE'
  | 'OMNI'
  | 'WORKFLOW'
  | 'CANVAS_ASSISTANT'
  | 'CUTIA_EDITOR'
  | 'PLAYLET'

export interface AdminGenerationSessionItem {
  id: string
  title: string
  /** Pro 字段：CM 列表暂可能缺省 */
  source?: string
  originCategory?: 'generate' | 'omni' | 'workflow' | 'canvas-assistant' | 'cutia-editor' | 'playlet' | 'other'
  originLabel?: string
  workflowId?: string | null
  isDefault: boolean
  sortOrder: number
  coverImageUrl: string
  coverPreviewKind?: 'video' | 'image' | 'none'
  lastRecordAt?: string
  createdAt: string
  updatedAt: string
  user: {
    id: string
    name: string
    email: string
    avatarUrl: string
  }
  latestRecord: null | {
    id: string
    type: string
    status: string
    prompt: string
    error: string
    createdAt: string
    skill: string
    model: string
    feature?: string
  }
  recordCount: number
  failedRecordCount: number
  runningRecordCount: number
  completedRecordCount: number
}

export interface AdminGenerationSessionListResult {
  items: AdminGenerationSessionItem[]
  summary: {
    totalCount: number
    totalPages: number
    page: number
    pageSize: number
  }
}

export interface AdminSessionRecordItem {
  id: string
  sessionId: string
  sessionTitle?: string
  type: string
  prompt: string
  content: string
  error: string
  model: string
  modelKey: string
  ratio: string
  resolution: string
  duration: string
  feature: string
  skill: string
  done: boolean
  stopped?: boolean
  agentTaskId?: string
  createdAt: string
  images: string[]
  outputs: Array<{
    outputType: string
    url?: string
    textContent?: string
    sortOrder?: number
    metaJson?: Record<string, unknown> | null
  }>
  agentRun?: Record<string, unknown>
}

export interface AdminSessionRecordListResult {
  items: AdminSessionRecordItem[]
  summary: {
    totalCount: number
    totalPages: number
    page: number
    pageSize: number
  }
}

export interface ListAdminGenerationSessionsOptions {
  keyword?: string
  userKeyword?: string
  status?: AdminGenerationSessionStatus
  type?: AdminGenerationSessionType
  page?: number
  pageSize?: number
}

const ADMIN_GENERATION_SESSIONS_BASE_PATH = '/api/admin/generation-sessions'

// 查询后台会话列表。
export const listAdminGenerationSessions = async (options: ListAdminGenerationSessionsOptions = {}) => {
  return adminGet<AdminGenerationSessionListResult>(ADMIN_GENERATION_SESSIONS_BASE_PATH, {
    query: {
      keyword: String(options.keyword || '').trim(),
      userKeyword: String(options.userKeyword || '').trim(),
      status: options.status || 'ALL',
      type: options.type || 'ALL',
      page: options.page || 1,
      pageSize: options.pageSize || 12,
    },
  })
}

// 查询后台会话详情。
export const getAdminGenerationSessionDetail = async (id: string) => {
  return adminGet<AdminGenerationSessionItem>(`${ADMIN_GENERATION_SESSIONS_BASE_PATH}/${encodeURIComponent(id)}`)
}

// 查询指定会话下的生成记录。
export const listAdminGenerationSessionRecords = async (id: string, page = 1, pageSize = 10) => {
  return adminGet<AdminSessionRecordListResult>(`${ADMIN_GENERATION_SESSIONS_BASE_PATH}/${encodeURIComponent(id)}/records`, {
    query: {
      page,
      pageSize,
    },
  })
}

// 后台重命名会话。
export const updateAdminGenerationSession = async (id: string, title: string) => {
  return adminPatch<AdminGenerationSessionItem>(`${ADMIN_GENERATION_SESSIONS_BASE_PATH}/${encodeURIComponent(id)}`, { title }, {
    showSuccessMessage: true,
    showErrorMessage: true,
    successMessage: '会话已更新',
  })
}

// 后台删除会话。
export const deleteAdminGenerationSession = async (id: string) => {
  return adminDelete<{ id: string }>(`${ADMIN_GENERATION_SESSIONS_BASE_PATH}/${encodeURIComponent(id)}`, {
    showSuccessMessage: true,
    showErrorMessage: true,
    successMessage: '会话已删除',
  })
}
