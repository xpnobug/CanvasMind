// 统一的前端后端接口基址。
export const API_BASE_URL = String(import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '')

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
