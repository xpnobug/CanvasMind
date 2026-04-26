/**
 * 厂商运行时配置
 * 统一管理前端缓存，并通过同源后端接口持久化到数据库。
 */

import { DEFAULT_CHAT_MODEL } from '@/config/models'
import { buildApiUrl } from './http'

export type AiEndpointType = 'chat' | 'image' | 'video'
export type CustomModelCategory = 'image' | 'video' | 'chat'

const DEFAULT_BASE_URL = import.meta.env.VITE_PROVIDER_DEFAULT_BASE_URL || 'https://api.chatfire.site/v1'
const PROVIDER_RUNTIME_API_PATH = '/api/provider-config/runtime'

const DEFAULT_ENDPOINTS: Record<AiEndpointType, string> = {
  chat: '/chat/completions',
  image: '/images/generations',
  video: '/videos',
}

const STORAGE_KEYS = {
  baseUrl: 'workflow-api-base-url',
  apiKey: 'workflow-api-key',
  agentModel: 'agent-chat-model',
}

export interface RuntimeCustomModel {
  label: string
  key: string
}

export interface ProviderRuntimeConfig {
  baseUrl: string
  apiKey: string
  chatEndpoint: string
  imageEndpoint: string
  videoEndpoint: string
  defaultChatModel: string
  customModels: Record<CustomModelCategory, RuntimeCustomModel[]>
}

export interface UpstreamRequestConfig {
  baseUrl: string
  apiKey?: string
  endpoint: string
}

const isClient = () => typeof window !== 'undefined'

const readStorage = (key: string) => {
  if (!isClient()) return ''
  return window.localStorage.getItem(key) || ''
}

const writeStorage = (key: string, value: string) => {
  if (!isClient()) return
  window.localStorage.setItem(key, value)
}

const getCustomModelStorageKey = (category: CustomModelCategory) => `wf-custom-${category}-models`

const readCustomModels = (category: CustomModelCategory): RuntimeCustomModel[] => {
  if (!isClient()) return []

  try {
    const raw = window.localStorage.getItem(getCustomModelStorageKey(category)) || '[]'
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return parsed
      .map(item => ({
        label: String(item?.label || '').trim(),
        key: String(item?.key || '').trim(),
      }))
      .filter(item => item.label && item.key)
  } catch {
    return []
  }
}

const writeCustomModels = (category: CustomModelCategory, models: RuntimeCustomModel[]) => {
  if (!isClient()) return
  window.localStorage.setItem(getCustomModelStorageKey(category), JSON.stringify(models))
}

const getDefaultConfig = (): ProviderRuntimeConfig => ({
  baseUrl: readStorage(STORAGE_KEYS.baseUrl) || DEFAULT_BASE_URL,
  apiKey: readStorage(STORAGE_KEYS.apiKey),
  chatEndpoint: readStorage('wf-endpoint-chat') || DEFAULT_ENDPOINTS.chat,
  imageEndpoint: readStorage('wf-endpoint-image') || DEFAULT_ENDPOINTS.image,
  videoEndpoint: readStorage('wf-endpoint-video') || DEFAULT_ENDPOINTS.video,
  defaultChatModel: readStorage(STORAGE_KEYS.agentModel) || DEFAULT_CHAT_MODEL,
  customModels: {
    image: readCustomModels('image'),
    video: readCustomModels('video'),
    chat: readCustomModels('chat'),
  },
})

let runtimeConfigCache: ProviderRuntimeConfig = getDefaultConfig()
let loadRuntimeConfigPromise: Promise<ProviderRuntimeConfig> | null = null

const normalizeRuntimeConfig = (input?: Partial<ProviderRuntimeConfig>): ProviderRuntimeConfig => ({
  baseUrl: String(input?.baseUrl || '').trim() || DEFAULT_BASE_URL,
  apiKey: String(input?.apiKey || '').trim(),
  chatEndpoint: String(input?.chatEndpoint || '').trim() || DEFAULT_ENDPOINTS.chat,
  imageEndpoint: String(input?.imageEndpoint || '').trim() || DEFAULT_ENDPOINTS.image,
  videoEndpoint: String(input?.videoEndpoint || '').trim() || DEFAULT_ENDPOINTS.video,
  defaultChatModel: String(input?.defaultChatModel || '').trim() || DEFAULT_CHAT_MODEL,
  customModels: {
    image: Array.isArray(input?.customModels?.image) ? input!.customModels!.image : [],
    video: Array.isArray(input?.customModels?.video) ? input!.customModels!.video : [],
    chat: Array.isArray(input?.customModels?.chat) ? input!.customModels!.chat : [],
  },
})

const writeRuntimeConfigToStorage = (config: ProviderRuntimeConfig) => {
  writeStorage(STORAGE_KEYS.baseUrl, config.baseUrl)
  writeStorage(STORAGE_KEYS.apiKey, config.apiKey)
  writeStorage('wf-endpoint-chat', config.chatEndpoint)
  writeStorage('wf-endpoint-image', config.imageEndpoint)
  writeStorage('wf-endpoint-video', config.videoEndpoint)
  writeStorage(STORAGE_KEYS.agentModel, config.defaultChatModel)
  writeCustomModels('image', config.customModels.image)
  writeCustomModels('video', config.customModels.video)
  writeCustomModels('chat', config.customModels.chat)
}

const applyRuntimeConfig = (config: Partial<ProviderRuntimeConfig>) => {
  runtimeConfigCache = normalizeRuntimeConfig(config)
  writeRuntimeConfigToStorage(runtimeConfigCache)
  return runtimeConfigCache
}

export const getBaseUrl = () => runtimeConfigCache.baseUrl

export const setBaseUrl = (url: string) => {
  runtimeConfigCache = {
    ...runtimeConfigCache,
    baseUrl: url.trim() || DEFAULT_BASE_URL,
  }
  writeStorage(STORAGE_KEYS.baseUrl, runtimeConfigCache.baseUrl)
}

export const getApiKey = () => runtimeConfigCache.apiKey

export const setApiKey = (apiKey: string) => {
  runtimeConfigCache = {
    ...runtimeConfigCache,
    apiKey: apiKey.trim(),
  }
  writeStorage(STORAGE_KEYS.apiKey, runtimeConfigCache.apiKey)
}

export const getEndpoint = (type: AiEndpointType) => {
  const map = {
    chat: runtimeConfigCache.chatEndpoint,
    image: runtimeConfigCache.imageEndpoint,
    video: runtimeConfigCache.videoEndpoint,
  }
  return map[type]
}

export const setEndpoint = (type: AiEndpointType, path: string) => {
  const nextValue = path.trim() || DEFAULT_ENDPOINTS[type]
  runtimeConfigCache = {
    ...runtimeConfigCache,
    ...(type === 'chat' ? { chatEndpoint: nextValue } : {}),
    ...(type === 'image' ? { imageEndpoint: nextValue } : {}),
    ...(type === 'video' ? { videoEndpoint: nextValue } : {}),
  }
  writeStorage(`wf-endpoint-${type}`, nextValue)
}

export const getProviderRuntimeConfig = () => runtimeConfigCache

export const getCustomModels = (category: CustomModelCategory) => runtimeConfigCache.customModels[category]

export const setCustomModels = (category: CustomModelCategory, models: RuntimeCustomModel[]) => {
  runtimeConfigCache = {
    ...runtimeConfigCache,
    customModels: {
      ...runtimeConfigCache.customModels,
      [category]: models,
    },
  }
  writeCustomModels(category, models)
}

export const loadProviderRuntimeConfig = async (force = false) => {
  if (loadRuntimeConfigPromise && !force) {
    return loadRuntimeConfigPromise
  }

  loadRuntimeConfigPromise = fetch(buildApiUrl(PROVIDER_RUNTIME_API_PATH), {
    method: 'GET',
  })
    .then(async (response) => {
      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error?.error?.message || error?.message || '读取配置失败')
      }

      const payload = await response.json()
      return applyRuntimeConfig(payload?.data || {})
    })
    .catch(() => {
      return runtimeConfigCache
    })
    .finally(() => {
      loadRuntimeConfigPromise = null
    })

  return loadRuntimeConfigPromise
}

export const saveProviderRuntimeConfig = async (config: Partial<ProviderRuntimeConfig>) => {
  const payload = normalizeRuntimeConfig({
    ...runtimeConfigCache,
    ...config,
  })

  const response = await fetch(buildApiUrl(PROVIDER_RUNTIME_API_PATH), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error?.error?.message || error?.message || '保存配置失败')
  }

  const result = await response.json()
  return applyRuntimeConfig(result?.data || payload)
}

export const getUpstreamRequestConfig = (
  type: AiEndpointType,
  endpointOverride?: string,
): UpstreamRequestConfig => ({
  baseUrl: getBaseUrl(),
  apiKey: getApiKey() || undefined,
  endpoint: endpointOverride || getEndpoint(type),
})
