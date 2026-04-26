import { PROVIDER_CONFIG_MATCH_PATHS } from './constants'
import { handleProviderConfigRequest } from './request-handler'

const attachProviderConfigMiddleware = (server: any) => {
  server.middlewares.use(async (req: any, res: any, next: any) => {
    const requestUrl = String(req.url || '').split('?')[0]
    if (!PROVIDER_CONFIG_MATCH_PATHS.includes(requestUrl as any)) {
      next()
      return
    }

    await handleProviderConfigRequest(req, res)
  })
}

export const createProviderConfigPlugin = () => ({
  name: 'provider-config-plugin',
  configureServer(server: any) {
    attachProviderConfigMiddleware(server)
  },
  configurePreviewServer(server: any) {
    attachProviderConfigMiddleware(server)
  },
})
