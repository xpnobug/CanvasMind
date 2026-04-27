declare global {
  interface Window {
    __CANANA_RUNTIME_CONFIG__?: {
      VITE_API_BASE_URL?: string
      VITE_PROVIDER_DEFAULT_BASE_URL?: string
    }
  }
}

const readRuntimeApiBaseUrl = () => {
  if (typeof window === 'undefined') {
    return ''
  }

  return String(window.__CANANA_RUNTIME_CONFIG__?.VITE_API_BASE_URL || '').trim()
}

// 统一的前端后端接口基址。
export const API_BASE_URL = readRuntimeApiBaseUrl().replace(/\/+$/, '')
  || String(import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '')

// 将相对接口路径拼成可请求的完整地址。
export const buildApiUrl = (path: string) => {
  // 绝对地址直接返回，避免重复拼接。
  if (/^https?:\/\//i.test(path)) {
    return path
  }

  // 没有配置基址时，保持相对路径请求。
  if (!API_BASE_URL) {
    return path
  }

  // 统一拼出完整接口地址。
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

// 将后端返回的资源地址统一解析成可直接访问的完整地址。
export const buildAssetUrl = (path: string) => {
  const normalizedPath = String(path || '').trim()

  // 空路径直接返回，交给上层兜底。
  if (!normalizedPath) {
    return ''
  }

  // 已经是 Data URL 或绝对地址时，直接复用。
  if (
    /^data:/i.test(normalizedPath)
    || /^https?:\/\//i.test(normalizedPath)
    || /^blob:/i.test(normalizedPath)
  ) {
    return normalizedPath
  }

  // 其余以站点 API 基址补全，解决 /uploads 相对路径命中前端端口的问题。
  return buildApiUrl(normalizedPath)
}
