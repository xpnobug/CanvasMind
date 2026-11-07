import { buildApiUrl } from './http'
import { readApiData } from './response'

export interface PersistedGenerationSession {
  id: string
  source: string
  title: string
  isDefault: boolean
  sortOrder: number
  recordCount: number
  coverImageUrl: string
  lastRecordAt?: string
  createdAt: string
  updatedAt: string
}

export interface GenerationSessionUpsertPayload {
  title?: string
  source?: string
}

const GENERATION_SESSIONS_API_PATH = '/api/generation-sessions'

// 获取当前用户在指定 source 入口下的生成会话列表（不传 source 默认归到 generate）
export const listGenerationSessions = async (source?: string) => {
  const query = source ? `?source=${encodeURIComponent(source)}` : ''
  const response = await fetch(buildApiUrl(`${GENERATION_SESSIONS_API_PATH}${query}`), {
    method: 'GET',
    credentials: 'include',
  })
  return readApiData<PersistedGenerationSession[]>(response)
}

// 创建新会话（payload.source 决定归属入口）
export const createGenerationSession = async (payload: GenerationSessionUpsertPayload = {}) => {
  const response = await fetch(buildApiUrl(GENERATION_SESSIONS_API_PATH), {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  return readApiData<PersistedGenerationSession>(response, {
    showErrorMessage: true,
  })
}

// 更新会话
export const updateGenerationSession = async (id: string, payload: GenerationSessionUpsertPayload) => {
  const response = await fetch(buildApiUrl(`${GENERATION_SESSIONS_API_PATH}/${encodeURIComponent(id)}`), {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  return readApiData<PersistedGenerationSession>(response, {
    showErrorMessage: true,
  })
}

// 删除会话
export const deleteGenerationSession = async (id: string) => {
  const response = await fetch(buildApiUrl(`${GENERATION_SESSIONS_API_PATH}/${encodeURIComponent(id)}`), {
    method: 'DELETE',
    credentials: 'include',
  })
  return readApiData<{ id: string }>(response, {
    showErrorMessage: true,
  })
}
