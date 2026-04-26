import { readJsonBody, sendJson } from '../ai-gateway/shared'

export interface RuntimeCustomModelInput {
  label: string
  key: string
}

export interface ProviderRuntimePayload {
  baseUrl?: string
  apiKey?: string
  chatEndpoint?: string
  imageEndpoint?: string
  videoEndpoint?: string
  defaultChatModel?: string
  customModels?: {
    image?: RuntimeCustomModelInput[]
    video?: RuntimeCustomModelInput[]
    chat?: RuntimeCustomModelInput[]
  }
}

export const readProviderRuntimeBody = async (req: any) => {
  const payload = await readJsonBody(req)
  return payload as ProviderRuntimePayload
}

export const sendProviderRuntimeError = (res: any, statusCode: number, message: string) => {
  sendJson(res, statusCode, {
    message,
    error: {
      type: 'provider_config_error',
      message,
    },
  })
}

export const normalizeCustomModelList = (input?: RuntimeCustomModelInput[]) => {
  if (!Array.isArray(input)) return []

  return input
    .map(item => ({
      label: String(item?.label || '').trim(),
      key: String(item?.key || '').trim(),
    }))
    .filter(item => item.label && item.key)
}
