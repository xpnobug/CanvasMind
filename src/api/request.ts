/**
 * AI 网关前端请求封装
 * 前端只请求同源网关，由网关再转发到用户配置的第三方厂商地址。
 */

import {
  getApiKey,
  getBaseUrl,
  getEndpoint,
  setApiKey,
  setBaseUrl,
  setEndpoint,
  type AiEndpointType,
} from './provider-config'
import {
  AI_GATEWAY_REQUEST_PATH,
  createGatewayPayload,
  normalizeGatewayMethod,
} from './ai-gateway'
import { buildApiUrl } from './http'

export {
  getApiKey,
  getBaseUrl,
  getEndpoint,
  setApiKey,
  setBaseUrl,
  setEndpoint,
}

interface RequestOptions {
  url: string
  method?: string
  data?: unknown
  headers?: Record<string, string>
}
const isFormData = (value: unknown): value is FormData => typeof FormData !== 'undefined' && value instanceof FormData

/**
 * 通用 JSON/表单请求，统一走同源 AI 网关。
 */
export const request = async (
  options: RequestOptions,
  type: AiEndpointType = 'video',
) => {
  if (isFormData(options.data)) {
    const payload = createGatewayPayload(type, options)
    const response = await fetch(buildApiUrl(AI_GATEWAY_REQUEST_PATH), {
      method: 'POST',
      headers: {
        'x-upstream-base-url': payload.upstream.baseUrl,
        'x-upstream-endpoint': payload.upstream.endpoint,
        'x-upstream-method': normalizeGatewayMethod(options.method),
        ...(payload.upstream.apiKey ? { 'x-upstream-api-key': payload.upstream.apiKey } : {}),
      },
      body: options.data,
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      const msg = err?.error?.message || err?.message || `请求失败 (${response.status})`
      throw new Error(msg)
    }

    return response.json()
  }

  const response = await fetch(buildApiUrl(AI_GATEWAY_REQUEST_PATH), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(createGatewayPayload(type, options)),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    const msg = err?.error?.message || err?.message || `请求失败 (${response.status})`
    throw new Error(msg)
  }

  return response.json()
}
