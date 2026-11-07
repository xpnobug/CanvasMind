/**
 * 独立中转站 adapter 骨架。
 *
 * 该模块刻意不接入 server/index.ts，也不依赖认证、计费、账本或生成任务。
 * 当前仅保留一个可审计的状态探针路径，避免在接口契约确认前开放写操作。
 */

export const ISOLATED_RELAY_NAMESPACE = '/__isolated_relay'
export const ISOLATED_RELAY_STATUS_PATH = `${ISOLATED_RELAY_NAMESPACE}/status`

const SESSION_COOKIE_NAME = 'isolated_relay_session'
const DEFAULT_SESSION_MAX_AGE_SECONDS = 60 * 60

const ALLOWED_PATHS = new Set([ISOLATED_RELAY_STATUS_PATH])
const DISALLOWED_OPERATION_NAMES = new Set([
  'register',
  'recharge',
  'generate',
  'video',
  'task',
])

export type RelayRequest = {
  method?: string
  pathname: string
}

export type RelayResponse = {
  status: number
  headers: Record<string, string>
  body: Record<string, unknown>
}

export type IsolatedRelayConfig = {
  enabled?: boolean
  upstreamBaseUrl: string
  allowedHosts: readonly string[]
  fetchImpl?: typeof fetch
}

type NormalizedConfig = {
  enabled: boolean
  upstreamBaseUrl: URL
  allowedHosts: ReadonlySet<string>
  fetchImpl: typeof fetch
}

const jsonHeaders = (): Record<string, string> => ({
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
})

const response = (status: number, body: Record<string, unknown>, extraHeaders: Record<string, string> = {}): RelayResponse => ({
  status,
  headers: { ...jsonHeaders(), ...extraHeaders },
  body,
})

const isNamespacePath = (pathname: string) => (
  pathname === ISOLATED_RELAY_NAMESPACE || pathname.startsWith(`${ISOLATED_RELAY_NAMESPACE}/`)
)

const normalizeHost = (host: string) => host.trim().toLowerCase().replace(/\.$/, '')

const validateUpstream = (rawBaseUrl: string, allowedHosts: readonly string[]) => {
  let url: URL
  try {
    url = new URL(rawBaseUrl)
  } catch {
    throw new Error('isolated relay upstreamBaseUrl must be a valid URL')
  }

  if (url.protocol !== 'https:') {
    throw new Error('isolated relay upstreamBaseUrl must use HTTPS')
  }
  if (url.username || url.password || url.search || url.hash) {
    throw new Error('isolated relay upstreamBaseUrl must not contain credentials or query data')
  }

  const normalizedAllowedHosts = new Set(allowedHosts.map(normalizeHost).filter(Boolean))
  if (!normalizedAllowedHosts.has(normalizeHost(url.hostname))) {
    throw new Error('isolated relay upstream host is not allowlisted')
  }

  url.pathname = url.pathname.replace(/\/+$/, '')
  return { url, normalizedAllowedHosts }
}

const buildUpstreamUrl = (baseUrl: URL, pathname: string) => {
  // pathname is selected from ALLOWED_PATHS; callers cannot supply an arbitrary URL.
  const url = new URL(baseUrl.toString())
  url.pathname = `${url.pathname}/${pathname.slice(ISOLATED_RELAY_NAMESPACE.length).replace(/^\/+/, '')}`
  url.search = ''
  url.hash = ''
  return url
}

const safeErrorMessage = (error: unknown) => {
  // Never expose upstream exception text: it can contain URLs, headers, or credentials.
  void error
  return 'isolated relay upstream request failed'
}

export const createSessionCookie = (opaqueBackendSessionId: string, maxAgeSeconds = DEFAULT_SESSION_MAX_AGE_SECONDS) => {
  if (!opaqueBackendSessionId || /[\r\n;]/.test(opaqueBackendSessionId)) {
    throw new Error('invalid isolated relay session id')
  }
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(opaqueBackendSessionId)}; Max-Age=${maxAgeSeconds}; Path=${ISOLATED_RELAY_NAMESPACE}; HttpOnly; Secure; SameSite=Strict`
}

export const createIsolatedRelayAdapter = (config: IsolatedRelayConfig) => {
  const upstream = validateUpstream(config.upstreamBaseUrl, config.allowedHosts)
  const normalized: NormalizedConfig = {
    enabled: config.enabled === true,
    upstreamBaseUrl: upstream.url,
    allowedHosts: upstream.normalizedAllowedHosts,
    fetchImpl: config.fetchImpl || fetch,
  }

  return {
    async handle(request: RelayRequest): Promise<RelayResponse | null> {
      if (!isNamespacePath(request.pathname)) return null

      if (!normalized.enabled) {
        return response(503, {
          ok: false,
          code: 'ISOLATED_RELAY_DISABLED',
          message: 'isolated relay adapter is disabled',
        })
      }

      if (!ALLOWED_PATHS.has(request.pathname)) {
        return response(404, { ok: false, code: 'ISOLATED_RELAY_PATH_NOT_ALLOWED' })
      }
      if ((request.method || 'GET').toUpperCase() !== 'GET') {
        return response(405, { ok: false, code: 'ISOLATED_RELAY_METHOD_NOT_ALLOWED' }, { Allow: 'GET' })
      }

      const upstreamUrl = buildUpstreamUrl(normalized.upstreamBaseUrl, request.pathname)
      if (!normalized.allowedHosts.has(normalizeHost(upstreamUrl.hostname)) || upstreamUrl.protocol !== 'https:') {
        return response(500, { ok: false, code: 'ISOLATED_RELAY_CONFIGURATION_ERROR' })
      }

      try {
        const upstreamResponse = await normalized.fetchImpl(upstreamUrl, {
          method: 'GET',
          redirect: 'error',
          headers: { Accept: 'application/json' },
        })
        return response(upstreamResponse.ok ? 200 : 502, {
          ok: upstreamResponse.ok,
          status: upstreamResponse.ok ? 'available' : 'unavailable',
        })
      } catch (error) {
        return response(502, { ok: false, code: 'ISOLATED_RELAY_UPSTREAM_ERROR', message: safeErrorMessage(error) })
      }
    },
  }
}

/** 仅用于测试/审计，确保未来扩展不会误开放高风险操作名。 */
export const isDisallowedOperationName = (name: string) => DISALLOWED_OPERATION_NAMES.has(name.toLowerCase())
