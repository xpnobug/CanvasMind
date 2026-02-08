/**
 * 工作流 HTTP 请求工具
 * 基于 fetch 的轻量请求封装
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.chatfire.site/v1'

let baseUrl = localStorage.getItem('workflow-api-base-url') || BASE_URL

export const setBaseUrl = (url) => {
  baseUrl = url
  localStorage.setItem('workflow-api-base-url', url)
}

export const getBaseUrl = () => baseUrl

export const getApiKey = () => localStorage.getItem('workflow-api-key') || ''

// API 路径配置
const DEFAULT_ENDPOINTS = {
  chat: '/chat/completions',
  image: '/images/generations',
  video: '/videos'
}

export const getEndpoint = (type) => {
  const custom = localStorage.getItem(`wf-endpoint-${type}`)
  return custom || DEFAULT_ENDPOINTS[type] || ''
}

export const setEndpoint = (type, path) => {
  localStorage.setItem(`wf-endpoint-${type}`, path)
}

/**
 * 通用请求函数
 */
export const request = async ({ url, method = 'get', data, headers = {} }) => {
  const apiKey = getApiKey()
  const reqHeaders = {
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

  const options = { method, headers: reqHeaders }
  if (data && method !== 'get') {
    options.body = isFormData ? data : JSON.stringify(data)
  }

  const response = await fetch(`${baseUrl}${url}`, options)

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    const msg = err?.error?.message || err?.message || `请求失败 (${response.status})`
    throw new Error(msg)
  }

  return response.json()
}
