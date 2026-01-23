// API 请求工具
import { ErrorHandler } from './errorHandler'

// 类型定义
export interface RequestOptions extends RequestInit {
  headers?: Record<string, string>
  skipRetry?: boolean // 跳过自动重试
  skipErrorHandler?: boolean // 跳过错误处理
}

export interface ApiResponse<T = any> {
  data?: T
  code?: number
  message?: string
  [key: string]: any
}

const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5409'

/**
 * 通用请求方法（带错误处理和重试）
 */
export async function request<T = any>(
  url: string,
  options: RequestOptions = {}
): Promise<T> {
  const defaultOptions: RequestOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  }

  const makeRequest = async (): Promise<T> => {
    try {
      const response = await fetch(`${API_BASE_URL}${url}`, {
        ...defaultOptions,
        ...options
      })

      if (!response.ok) {
        const error: any = new Error(`HTTP error! status: ${response.status}`)
        error.code = response.status
        
        // 尝试解析错误响应
        try {
          const errorData = await response.json()
          error.message = errorData.message || errorData.msg || error.message
        } catch {
          // 无法解析响应体
        }
        
        throw error
      }

      return await response.json()
    } catch (error: any) {
      // 如果不跳过错误处理，则分类错误
      if (!options.skipErrorHandler) {
        const context = ErrorHandler.classifyError(error)
        
        // 可重试的错误且未跳过重试
        if (context.canRetry && !options.skipRetry && context.retryCount === 0) {
          return await ErrorHandler.retry(() => makeRequest(), context)
        }
      }
      
      throw error
    }
  }

  return makeRequest()
}

/**
 * GET 请求
 */
export function get<T = any>(
  url: string,
  params: Record<string, any> = {}
): Promise<T> {
  const queryString = new URLSearchParams(params).toString()
  const fullUrl = queryString ? `${url}?${queryString}` : url
  
  return request<T>(fullUrl, {
    method: 'GET'
  })
}

/**
 * POST 请求
 */
export function post<T = any>(
  url: string,
  data: Record<string, any> = {}
): Promise<T> {
  return request<T>(url, {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

/**
 * 文件上传
 */
export async function upload<T = any>(
  url: string,
  formData: FormData
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    method: 'POST',
    body: formData
  })
  return response.json()
}

export { API_BASE_URL }
