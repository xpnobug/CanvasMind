import { readJsonBody, sendJson } from '../ai-gateway/shared'

export interface GenerationSessionPayload {
  title?: string
  source?: string
}

// 读取生成会话请求体
export const readGenerationSessionBody = async (req: any) => {
  const payload = await readJsonBody(req)
  return payload as GenerationSessionPayload
}

// 返回统一的生成会话接口错误
export const sendGenerationSessionError = (res: any, statusCode: number, message: string) => {
  sendJson(res, statusCode, {
    message,
    error: {
      type: 'generation_session_error',
      message,
    },
  })
}
