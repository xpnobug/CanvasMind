import { isVideoProjectsPath } from './constants'
import { handleVideoProjectsRequest } from './request-handler'

// 挂载视频项目接口中间件（Vite dev/preview 阶段使用,生产环境通过 server/index.ts 注册）。
const attachVideoProjectsMiddleware = (server: any) => {
  server.middlewares.use(async (req: any, res: any, next: any) => {
    const requestUrl = String(req.url || '').split('?')[0]
    if (!isVideoProjectsPath(requestUrl)) {
      next()
      return
    }

    await handleVideoProjectsRequest(req, res)
  })
}

export const createVideoProjectsPlugin = () => ({
  name: 'video-projects-plugin',
  configureServer(server: any) {
    attachVideoProjectsMiddleware(server)
  },
  configurePreviewServer(server: any) {
    attachVideoProjectsMiddleware(server)
  },
})
