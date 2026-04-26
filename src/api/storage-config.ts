import { buildApiUrl } from './http'

// 对象存储配置结构。
export interface StorageConfigItem {
  id: string
  name: string
  code: string
  providerType: string
  accessKeyHint: string
  secretKeyHint: string
  endpoint: string
  bucket: string
  domain: string
  region: string
  sortOrder: number
  description: string
  isEnabled: boolean
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

// 创建或更新对象存储时使用的表单结构。
export interface StorageConfigPayload {
  name: string
  code: string
  accessKey: string
  secretKey: string
  endpoint: string
  bucket: string
  domain?: string
  region?: string
  sortOrder?: number
  description?: string
  isEnabled?: boolean
  isDefault?: boolean
}

// 对象存储配置接口基础路径。
const STORAGE_CONFIGS_API_PATH = '/api/storage/configs'

// 统一解析响应数据。
const readJson = async <T>(response: Response) => {
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload?.error?.message || payload?.message || '请求失败')
  }
  return payload?.data as T
}

// 查询对象存储配置列表。
export const listStorageConfigs = async () => {
  const response = await fetch(buildApiUrl(STORAGE_CONFIGS_API_PATH), {
    method: 'GET',
  })
  return readJson<StorageConfigItem[]>(response)
}

// 创建对象存储配置。
export const createStorageConfig = async (payload: StorageConfigPayload) => {
  const response = await fetch(buildApiUrl(STORAGE_CONFIGS_API_PATH), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  return readJson<StorageConfigItem>(response)
}

// 更新对象存储配置。
export const updateStorageConfig = async (id: string, payload: Partial<StorageConfigPayload>) => {
  const response = await fetch(buildApiUrl(`${STORAGE_CONFIGS_API_PATH}/${encodeURIComponent(id)}`), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  return readJson<StorageConfigItem>(response)
}

// 启用某一条对象存储配置。
export const activateStorageConfig = async (id: string) => {
  const response = await fetch(buildApiUrl(`${STORAGE_CONFIGS_API_PATH}/${encodeURIComponent(id)}/activate`), {
    method: 'POST',
  })
  return readJson<StorageConfigItem>(response)
}
