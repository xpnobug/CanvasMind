# Kejike Relay Adapter Checklist

> Status: isolated, disabled by default, and not integrated into production routing. This checklist records only repository-verifiable implementation and test evidence. It does not authorize access to or changes on any external relay service.

## Scope and Boundary

- [x] Adapter is isolated under `server/isolated-relay-adapter/adapter.ts`.
- [x] `server/index.ts`, existing authentication, billing, generation, task code, Prisma schema, and production environment files remain untouched.
- [x] No registration, recharge, model generation, video submission, task mutation, or ledger write endpoint is exposed.
- [x] The adapter does not import or call existing ledger, billing, authentication, generation, or task services.
- [x] No deployment or production integration was performed.

## Disabled-By-Default Behavior

- [x] The adapter is enabled only when `enabled === true`.
- [x] A request under `/__isolated_relay` returns `503 ISOLATED_RELAY_DISABLED` when disabled.
- [x] Disabled handling does not call `fetch`.
- [x] Requests outside the isolated namespace return `null` and are left for existing routing.

Evidence: `scripts/tests/test-isolated-relay-adapter.mjs` covers disabled handling, no network call, and namespace isolation.

## SSRF and Upstream Controls

- [x] Upstream base URL must be valid HTTPS.
- [x] Upstream hostname must match the configured allowlist.
- [x] Upstream URL credentials, query data, and fragments are rejected.
- [x] Only the fixed `/__isolated_relay/status` mapping is allowed; arbitrary request paths are rejected.
- [x] Upstream requests use `redirect: 'error'`.
- [x] The status probe sends no `Authorization` header, regardless of any future credential configuration.

Evidence: `scripts/tests/test-isolated-relay-adapter.mjs` asserts HTTPS/host/path validation, exact headers without Authorization, and `redirect: 'error'`.

## Secret Handling

- [x] Status responses contain only normalized availability information.
- [x] Upstream exception details are replaced with a generic error message.
- [x] Session cookie helper emits `HttpOnly`, `Secure`, and `SameSite=Strict` attributes.
- [x] No token is returned in responses or written by the adapter.

Evidence: `server/isolated-relay-adapter/adapter.ts` and `scripts/tests/test-isolated-relay-adapter.mjs`.

## Contract-Gated Features

- [ ] Formal SSO/OIDC or equivalent authorization-code contract is confirmed.
- [ ] User identity, token exchange, rotation, revocation, and CSRF contract are confirmed.
- [ ] User-scoped model, image, video, billing, recharge, and asynchronous job contracts are confirmed.
- [ ] Idempotency, refund, cancellation, webhook signing, replay protection, and reconciliation contracts are confirmed.
- [ ] Any future authenticated endpoint has an explicit reviewed authorization contract and does not reuse the status probe.

Until every required contract is confirmed and separately reviewed, keep this adapter isolated and disabled.

## Repository References

- Verified in-repo plan: `.openbitfun/plans/kejike-centralized-auth-billing.plan.md`.
- Verified implementation: `server/isolated-relay-adapter/adapter.ts`.
- Verified tests: `scripts/tests/test-isolated-relay-adapter.mjs`.
- Existing parent-workspace or external audit paths are intentionally not cited here as repository evidence; they are unavailable for verification in this repository.

## Verification Commands

- `npx tsx scripts/tests/test-isolated-relay-adapter.mjs`
- `npm run test:scripts`
- `npx tsc --noEmit --strict --target ES2022 --module NodeNext --moduleResolution NodeNext --skipLibCheck server/isolated-relay-adapter/adapter.ts`
