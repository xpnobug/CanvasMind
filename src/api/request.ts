/**
 * 通用 HTTP 请求工具
 * 基于 fetch 的轻量请求封装，支持 API 地址和密钥配置
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.chatfire.site/v1'

let baseUrl = localStorage.getItem('workflow-api-base-url') || BASE_URL

export const setBaseUrl = (url: string) => {
  baseUrl = url
  localStorage.setItem('workflow-api-base-url', url)
}

export const getBaseUrl = () => baseUrl

export const getApiKey = () => localStorage.getItem('workflow-api-key') || ''

// API 路径配置
const DEFAULT_ENDPOINTS: Record<string, string> = {
  chat: '/chat/completions',
  image: '/images/generations',
  video: '/videos'
}

export const getEndpoint = (type: string) => {
  const custom = localStorage.getItem(`wf-endpoint-${type}`)
  return custom || DEFAULT_ENDPOINTS[type] || ''
}

export const setEndpoint = (type: string, path: string) => {
  localStorage.setItem(`wf-endpoint-${type}`, path)
}

interface RequestOptions {
  url: string
  method?: string
  data?: unknown
  headers?: Record<string, string>
}

/**
 * 通用请求函数
 */
export const request = async ({ url, method = 'get', data, headers = {} }: RequestOptions) => {
  const apiKey = getApiKey()
  const reqHeaders: Record<string, string> = {
    ...headers,
    ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {})
  }

  if (!reqHeaders['Content-Type'] && method !== 'get') {
    reqHeaders['Content-Type'] = 'application/json'
  }

  const isFormData = headers['Content-Type'] === 'multipart/form-data'
  if (isFormData) {
    delete reqHeaders['Content-Type']
  }

  const options: RequestInit = { method, headers: reqHeaders }
  if (data && method !== 'get') {
    options.body = isFormData ? (data as BodyInit) : JSON.stringify(data)
  }

  const response = await fetch(`${baseUrl}${url}`, options)

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    const msg = err?.error?.message || err?.message || `请求失败 (${response.status})`
    throw new Error(msg)
  }

  return response.json()
}
