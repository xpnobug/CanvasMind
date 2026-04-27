import { createServer } from 'node:http'
import fs from 'node:fs/promises'
import path from 'node:path'
import { AI_GATEWAY_MATCH_PATHS } from './ai-gateway/constants'
import { handleAiGatewayRequest } from './ai-gateway/request-handler'
import { isAuthPath } from './auth/constants'
import { handleAuthRequest } from './auth/request-handler'
import { isAssetItemsPath } from './asset-items/constants'
import { handleAssetItemsRequest } from './asset-items/request-handler'
import { isGenerationRecordsPath } from './generation-records/constants'
import { handleGenerationRecordsRequest } from './generation-records/request-handler'
import { PROVIDER_CONFIG_MATCH_PATHS } from './provider-config/constants'
import { handleProviderConfigRequest } from './provider-config/request-handler'
import { isStorageConfigsPath } from './storage-config/constants'
import { handleStorageConfigRequest } from './storage-config/request-handler'
import { isStorageUploadPath } from './storage/constants'
import { handleStorageUploadRequest } from './storage/request-handler'
import { getUploadsDir } from './storage/service'

// 后端服务默认监听端口。
const DEFAULT_SERVER_PORT = 5409

// 前端构建产物默认目录。
const DEFAULT_STATIC_DIST_DIR = path.resolve(process.cwd(), 'dist')

// 上传文件公开访问前缀。
const UPLOADS_PUBLIC_PATH_PREFIX = '/uploads/'

// 允许跨域访问的来源列表。
const DEFAULT_CORS_ALLOWED_ORIGINS = [
  'http://localhost:5010',
  'http://127.0.0.1:5010',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
]

// 读取服务端口配置。
const readServerPort = () => {
  // 读取环境变量中的端口配置。
  const rawPort = Number(process.env.SERVER_PORT || DEFAULT_SERVER_PORT)

  // 返回合法端口，否则回退默认值。
  return Number.isFinite(rawPort) && rawPort > 0 ? rawPort : DEFAULT_SERVER_PORT
}

// 读取静态资源目录配置。
const readStaticDistDir = () => {
  // 优先读取显式配置的静态目录。
  const configuredDir = String(process.env.STATIC_DIST_DIR || '').trim()

  // 未配置时回退到项目 dist 目录。
  return configuredDir ? path.resolve(configuredDir) : DEFAULT_STATIC_DIST_DIR
}

// 读取允许跨域的来源配置。
const readAllowedOrigins = () => {
  // 读取逗号分隔的来源字符串。
  const rawOrigins = String(process.env.CORS_ALLOWED_ORIGINS || '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)

  // 优先使用环境变量，否则使用本地开发默认值。
  return rawOrigins.length ? rawOrigins : DEFAULT_CORS_ALLOWED_ORIGINS
}

// 读取前端运行时公开配置。
const readRuntimeClientConfig = () => ({
  VITE_API_BASE_URL: String(process.env.VITE_API_BASE_URL || '').trim(),
  VITE_PROVIDER_DEFAULT_BASE_URL: String(process.env.VITE_PROVIDER_DEFAULT_BASE_URL || 'https://api.chatfire.site/v1').trim(),
})

// 将运行时配置脚本注入到首页 HTML 中。
const injectRuntimeClientConfig = (html: string) => {
  const runtimeConfigScript = `<script>window.__CANANA_RUNTIME_CONFIG__=${JSON.stringify(readRuntimeClientConfig())}</script>`

  // 优先注入到 head 尾部，保证主脚本执行前即可读取。
  if (html.includes('</head>')) {
    return html.replace('</head>', `${runtimeConfigScript}</head>`)
  }

  return `${runtimeConfigScript}${html}`
}

// 判断当前路径是否命中 AI 网关。
const isAiGatewayPath = (requestPath: string) => {
  // 复用现有路径常量统一判断。
  return AI_GATEWAY_MATCH_PATHS.includes(requestPath as (typeof AI_GATEWAY_MATCH_PATHS)[number])
}

// 判断当前路径是否命中厂商配置接口。
const isProviderConfigPath = (requestPath: string) => {
  // 复用现有路径常量统一判断。
  return PROVIDER_CONFIG_MATCH_PATHS.includes(requestPath as (typeof PROVIDER_CONFIG_MATCH_PATHS)[number])
}

// 处理上传目录中的公开文件访问。
const handleUploadsRequest = async (req: any, res: any, requestPath: string) => {
  // 仅允许 GET 请求读取上传文件。
  if (req.method !== 'GET') {
    return false
  }

  // 非上传资源路径直接跳过。
  if (!requestPath.startsWith(UPLOADS_PUBLIC_PATH_PREFIX)) {
    return false
  }

  // 读取上传根目录。
  const uploadsDir = getUploadsDir()

  // 将公开路径转换成相对文件路径。
  const relativePath = decodeURIComponent(requestPath.slice(UPLOADS_PUBLIC_PATH_PREFIX.length))

  // 计算真实文件路径。
  const filePath = path.resolve(uploadsDir, relativePath)

  // 防止目录穿越到上传目录之外。
  if (!filePath.startsWith(uploadsDir)) {
    return false
  }

  // 文件不存在则返回未处理。
  if (!(await isFileExists(filePath))) {
    return false
  }

  // 读取文件并返回。
  const fileBuffer = await fs.readFile(filePath)
  res.statusCode = 200
  res.setHeader('Content-Type', getContentTypeByFilePath(filePath))
  res.end(fileBuffer)
  return true
}

// 根据文件后缀推导响应类型。
const getContentTypeByFilePath = (filePath: string) => {
  // 读取文件扩展名。
  const extname = path.extname(filePath).toLowerCase()

  // 返回常用静态资源的内容类型。
  switch (extname) {
    case '.html':
      return 'text/html; charset=utf-8'
    case '.js':
      return 'application/javascript; charset=utf-8'
    case '.css':
      return 'text/css; charset=utf-8'
    case '.json':
      return 'application/json; charset=utf-8'
    case '.svg':
      return 'image/svg+xml'
    case '.png':
      return 'image/png'
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg'
    case '.webp':
      return 'image/webp'
    case '.gif':
      return 'image/gif'
    case '.ico':
      return 'image/x-icon'
    case '.woff':
      return 'font/woff'
    case '.woff2':
      return 'font/woff2'
    case '.txt':
      return 'text/plain; charset=utf-8'
    default:
      return 'application/octet-stream'
  }
}

// 判断目标文件是否存在且为普通文件。
const isFileExists = async (filePath: string) => {
  try {
    // 读取文件状态信息。
    const stat = await fs.stat(filePath)

    // 仅普通文件允许直接返回。
    return stat.isFile()
  } catch {
    // 不存在或无权限时按不存在处理。
    return false
  }
}

// 处理静态资源与前端路由回退。
const handleStaticRequest = async (req: any, res: any, requestPath: string) => {
  // 仅允许 GET 请求读取静态资源。
  if (req.method !== 'GET') {
    return false
  }

  // 读取静态资源根目录。
  const staticDistDir = readStaticDistDir()

  // 将请求路径解码为真实文件路径片段。
  const decodedPath = decodeURIComponent(requestPath || '/')

  // 规范化请求路径，避免目录穿越。
  const normalizedPath = decodedPath === '/' ? '/index.html' : decodedPath

  // 拼接静态资源目标文件。
  const candidateFilePath = path.resolve(staticDistDir, `.${normalizedPath}`)

  // 若目标文件不在静态目录内，则直接拒绝。
  if (!candidateFilePath.startsWith(staticDistDir)) {
    return false
  }

  // 优先返回精确命中的静态文件。
  if (await isFileExists(candidateFilePath)) {
    const fileBuffer = await fs.readFile(candidateFilePath)
    const contentType = getContentTypeByFilePath(candidateFilePath)
    const responseBody = contentType.startsWith('text/html')
      ? injectRuntimeClientConfig(fileBuffer.toString('utf8'))
      : fileBuffer
    res.statusCode = 200
    res.setHeader('Content-Type', contentType)
    res.end(responseBody)
    return true
  }

  // 非文件请求尝试回退到单页应用入口。
  const indexFilePath = path.resolve(staticDistDir, 'index.html')
  if (await isFileExists(indexFilePath)) {
    const fileBuffer = await fs.readFile(indexFilePath)
    res.statusCode = 200
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.end(injectRuntimeClientConfig(fileBuffer.toString('utf8')))
    return true
  }

  // 没有可用静态资源时返回未处理。
  return false
}

// 为响应写入统一的跨域头。
const applyCorsHeaders = (req: any, res: any) => {
  // 读取浏览器发起请求时的来源。
  const requestOrigin = String(req.headers.origin || '')

  // 读取允许跨域的来源白名单。
  const allowedOrigins = readAllowedOrigins()

  // 判断当前来源是否在白名单中。
  const allowOrigin = allowedOrigins.includes(requestOrigin) ? requestOrigin : allowedOrigins[0]

  // 写入允许的来源。
  res.setHeader('Access-Control-Allow-Origin', allowOrigin)

  // 声明允许携带的请求方法。
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')

  // 声明允许的请求头。
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type,Authorization,x-upstream-base-url,x-upstream-endpoint,x-upstream-api-key,x-upstream-method',
  )

  // 允许跨域请求携带 Cookie。
  res.setHeader('Access-Control-Allow-Credentials', 'true')

  // 告诉代理和浏览器当前响应会随 Origin 变化。
  res.setHeader('Vary', 'Origin')
}

// 返回统一的 JSON 响应。
const sendJson = (res: any, statusCode: number, data: unknown) => {
  // 设置状态码。
  res.statusCode = statusCode

  // 设置响应内容类型。
  res.setHeader('Content-Type', 'application/json; charset=utf-8')

  // 输出 JSON 内容。
  res.end(JSON.stringify(data))
}

// 返回健康检查响应。
const handleHealthRequest = (res: any) => {
  // 返回服务可用状态。
  sendJson(res, 200, {
    message: 'ok',
    data: {
      status: 'running',
    },
  })
}

// 将请求分发给对应的业务处理器。
const dispatchRequest = async (req: any, res: any) => {
  // 读取当前请求路径。
  const requestUrl = String(req.url || '')

  // 截取不带查询参数的路径部分。
  const requestPath = requestUrl.split('?')[0]

  // 健康检查接口直接返回。
  if (requestPath === '/api/health') {
    handleHealthRequest(res)
    return
  }

  // 命中 AI 网关时走网关转发逻辑。
  if (isAiGatewayPath(requestPath)) {
    await handleAiGatewayRequest(req, res)
    return
  }

  // 命中认证接口时走登录逻辑。
  if (isAuthPath(requestPath)) {
    await handleAuthRequest(req, res)
    return
  }

  // 命中厂商配置接口时走配置逻辑。
  if (isProviderConfigPath(requestPath)) {
    await handleProviderConfigRequest(req, res)
    return
  }

  // 命中文件上传接口时走本地存储逻辑。
  if (isStorageUploadPath(requestPath)) {
    await handleStorageUploadRequest(req, res)
    return
  }

  // 命中对象存储配置接口时走对象存储配置逻辑。
  if (isStorageConfigsPath(requestPath)) {
    await handleStorageConfigRequest(req, res)
    return
  }

  // 命中生成记录接口时走生成记录逻辑。
  if (isGenerationRecordsPath(requestPath)) {
    await handleGenerationRecordsRequest(req, res)
    return
  }

  // 命中资源接口时走资源逻辑。
  if (isAssetItemsPath(requestPath)) {
    await handleAssetItemsRequest(req, res)
    return
  }

  // 命中上传文件公开访问路径时直接返回文件。
  if (await handleUploadsRequest(req, res, requestPath)) {
    return
  }

  // 非接口请求尝试交给静态前端资源处理。
  if (await handleStaticRequest(req, res, requestPath)) {
    return
  }

  // 其余路径统一返回未找到。
  sendJson(res, 404, {
    message: '接口不存在',
    error: {
      type: 'not_found',
      message: '接口不存在',
    },
  })
}

// 创建独立 Node 后端服务。
const server = createServer(async (req, res) => {
  // 先写入统一跨域头，保证前端跨域可访问。
  applyCorsHeaders(req, res)

  // 预检请求直接返回空响应即可。
  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.end()
    return
  }

  try {
    // 分发业务请求到对应处理器。
    await dispatchRequest(req, res)
  } catch (error: any) {
    // 打印未捕获异常，便于排查服务端问题。
    console.error('[server] 请求处理失败', error)

    // 返回统一异常响应。
    sendJson(res, 500, {
      message: error?.message || '服务内部异常',
      error: {
        type: 'server_error',
        message: error?.message || '服务内部异常',
      },
    })
  }
})

// 读取最终监听端口。
const serverPort = readServerPort()

// 启动服务并输出日志。
server.listen(serverPort, '0.0.0.0', () => {
  // 输出启动完成日志，方便开发和部署确认。
  console.info(`[server] 独立后端服务已启动: http://0.0.0.0:${serverPort}`)
})
