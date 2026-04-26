import { readJsonBody, sendJson } from '../ai-gateway/shared'

// 前端提交的对象存储配置结构。
export interface ObjectStorageConfigPayload {
  name?: string
  code?: string
  accessKey?: string
  secretKey?: string
  endpoint?: string
  bucket?: string
  domain?: string
  region?: string
  sortOrder?: number
  description?: string
  isEnabled?: boolean
  isDefault?: boolean
}

// 读取对象存储配置请求体。
export const readStorageConfigBody = async (req: any) => {
  // 读取并转换 JSON 请求体。
  const payload = await readJsonBody(req)

  return payload as ObjectStorageConfigPayload
}

// 返回统一的对象存储配置错误。
export const sendStorageConfigError = (res: any, statusCode: number, message: string) => {
  // 统一封装错误响应结构。
  sendJson(res, statusCode, {
    message,
    error: {
      type: 'storage_config_error',
      message,
    },
  })
}
