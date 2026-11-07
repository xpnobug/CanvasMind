import assert from 'node:assert/strict'
import { createIsolatedRelayAdapter, createSessionCookie, ISOLATED_RELAY_NAMESPACE, ISOLATED_RELAY_STATUS_PATH, isDisallowedOperationName } from '../../server/isolated-relay-adapter/adapter.ts'

const baseConfig = {
  upstreamBaseUrl: 'https://relay.example.test/api',
  allowedHosts: ['relay.example.test'],
}

const makeFetch = ({ response, error } = {}) => {
  const calls = []
  const fetchImpl = async (url, init) => {
    calls.push({ url: String(url), init })
    if (error) throw error
    return response || new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } })
  }
  return { calls, fetchImpl }
}

const disabledFetch = makeFetch()
const disabledAdapter = createIsolatedRelayAdapter({ ...baseConfig, fetchImpl: disabledFetch.fetchImpl })
const disabled = await disabledAdapter.handle({ method: 'GET', pathname: ISOLATED_RELAY_STATUS_PATH })
assert.equal(disabled?.status, 503)
assert.equal(disabled?.body.code, 'ISOLATED_RELAY_DISABLED')
assert.equal(disabledFetch.calls.length, 0, 'disabled adapter must not make network calls')
assert.equal(await disabledAdapter.handle({ method: 'GET', pathname: '/api/status' }), null, 'other namespaces must be untouched')

const enabledFetch = makeFetch()
const enabledAdapter = createIsolatedRelayAdapter({ ...baseConfig, enabled: true, fetchImpl: enabledFetch.fetchImpl })
const status = await enabledAdapter.handle({ method: 'GET', pathname: ISOLATED_RELAY_STATUS_PATH })
assert.equal(status?.status, 200)
assert.equal(enabledFetch.calls[0].url, 'https://relay.example.test/api/status')
assert.deepEqual(enabledFetch.calls[0].init.headers, { Accept: 'application/json' })
assert.equal(enabledFetch.calls[0].init.redirect, 'error')
assert.equal(JSON.stringify(status), JSON.stringify({
  status: 200,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  body: { ok: true, status: 'available' },
}), 'responses must not contain auth tokens')

assert.equal((await enabledAdapter.handle({ method: 'GET', pathname: `${ISOLATED_RELAY_NAMESPACE}/arbitrary` }))?.status, 404)
assert.equal((await enabledAdapter.handle({ method: 'POST', pathname: ISOLATED_RELAY_STATUS_PATH }))?.status, 405)

assert.throws(() => createIsolatedRelayAdapter({ ...baseConfig, upstreamBaseUrl: 'http://relay.example.test' }), /HTTPS/)
assert.throws(() => createIsolatedRelayAdapter({ ...baseConfig, upstreamBaseUrl: 'https://127.0.0.1' }), /allowlisted/)
assert.throws(() => createIsolatedRelayAdapter({ ...baseConfig, upstreamBaseUrl: 'https://relay.example.test@evil.example' }), /credentials|allowlisted/)

const failingFetch = makeFetch({ error: new Error('upstream URL included a secret') })
const failed = await createIsolatedRelayAdapter({ ...baseConfig, enabled: true, fetchImpl: failingFetch.fetchImpl }).handle({
  method: 'GET',
  pathname: ISOLATED_RELAY_STATUS_PATH,
})
assert.equal(failed?.status, 502)
assert.equal(JSON.stringify(failed).includes('secret'), false)
assert.equal(JSON.stringify(failed).includes('upstream URL'), false)

const cookie = createSessionCookie('opaque-session-id')
assert.match(cookie, /HttpOnly/)
assert.match(cookie, /Secure/)
assert.match(cookie, /SameSite=Strict/)
assert.equal(cookie.includes('Authorization'), false)

for (const operation of ['register', 'recharge', 'generate', 'video', 'task']) {
  assert.equal(isDisallowedOperationName(operation), true)
}
assert.equal(isDisallowedOperationName('status'), false)

console.log('isolated relay adapter tests passed')
