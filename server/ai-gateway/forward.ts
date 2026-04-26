import {
  joinUpstreamUrl,
  proxyUpstreamResponse,
  readRawBuffer,
  setGatewayDebugHeaders,
  toDebugSnippet,
} from './shared'

const logGatewayForward = (payload: {
  method: string
  upstreamUrl: string
}) => {
  console.info(`[ai-gateway] -> ${payload.method} ${payload.upstreamUrl}`)
}

const logGatewayResponse = async (payload: {
  method: string
  upstreamUrl: string
  upstreamResponse: Response
}) => {
  const { method, upstreamUrl, upstreamResponse } = payload
  if (upstreamResponse.ok) {
    console.info(`[ai-gateway] <- ${upstreamResponse.status} ${method} ${upstreamUrl}`)
    return
  }

  const bodyText = await upstreamResponse.clone().text().catch(() => '')
  console.error(
    `[ai-gateway] <- ${upstreamResponse.status} ${method} ${upstreamUrl} | ${toDebugSnippet(bodyText || '[empty body]')}`,
  )
}

export const forwardMultipartRequest = async (params: {
  req: any
  res: any
  baseUrl: string
  endpoint: string
  apiKey?: string
  method: string
}) => {
  const headers = new Headers()
  const contentType = String(params.req.headers['content-type'] || '').trim()
  if (contentType) {
    headers.set('Content-Type', contentType)
  }
  if (params.apiKey) {
    headers.set('Authorization', `Bearer ${params.apiKey}`)
  }

  const bodyBuffer = params.method === 'GET' ? undefined : await readRawBuffer(params.req)
  const upstreamUrl = joinUpstreamUrl(params.baseUrl, params.endpoint)
  logGatewayForward({
    method: params.method,
    upstreamUrl,
  })

  const upstreamResponse = await fetch(upstreamUrl, {
    method: params.method,
    headers,
    body: bodyBuffer as unknown as BodyInit,
  })

  setGatewayDebugHeaders(params.res, {
    upstreamUrl,
    upstreamMethod: params.method,
    upstreamStatus: upstreamResponse.status,
  })
  await logGatewayResponse({
    method: params.method,
    upstreamUrl,
    upstreamResponse,
  })
  await proxyUpstreamResponse(upstreamResponse, params.res)
}

export const forwardGatewayPayload = async (params: {
  res: any
  upstreamUrl: string
  apiKey?: string
  method: string
  headers?: Record<string, string>
  body?: unknown
}) => {
  logGatewayForward({
    method: params.method,
    upstreamUrl: params.upstreamUrl,
  })

  const headers = new Headers()
  const forwardedHeaders = params.headers || {}

  Object.entries(forwardedHeaders).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      headers.set(key, value)
    }
  })

  if (params.apiKey && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${params.apiKey}`)
  }

  let body: BodyInit | undefined
  if (params.body !== undefined && params.method !== 'GET') {
    const isJsonLikeBody = params.body !== null
      && typeof params.body === 'object'
      && !(params.body instanceof ArrayBuffer)

    if (isJsonLikeBody) {
      if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json')
      }
      body = JSON.stringify(params.body)
    } else {
      body = params.body as BodyInit
    }
  }

  const upstreamResponse = await fetch(params.upstreamUrl, {
    method: params.method,
    headers,
    body,
  })

  setGatewayDebugHeaders(params.res, {
    upstreamUrl: params.upstreamUrl,
    upstreamMethod: params.method,
    upstreamStatus: upstreamResponse.status,
  })
  await logGatewayResponse({
    method: params.method,
    upstreamUrl: params.upstreamUrl,
    upstreamResponse,
  })
  await proxyUpstreamResponse(upstreamResponse, params.res)
}
