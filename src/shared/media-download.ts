import { buildAssetItemFileUrl, buildGenerationOutputFileUrl, buildMediaProxyDownloadUrl } from '@/api/media-file-routes'
import { API_BASE_URL, buildAssetUrl } from '@/api/http'
import { readApiErrorMessage } from '@/api/response'
import { buildVideoDownloadFilename } from '@/shared/video-download'

export type MediaDownloadKind = 'image' | 'video' | 'auto'

const UPLOADS_PATH_PREFIX = '/uploads/'
const IMAGE_EXT_PATTERN = /\.(png|jpe?g|webp|gif|svg|bmp|avif)(\?|#|$)/i
const VIDEO_EXT_PATTERN = /\.(mp4|mov|webm|m4v|avi)(\?|#|$)/i

const sanitizeDownloadSlug = (value?: string | null) => {
  return String(value || '')
    .trim()
    .replace(/[^\w\u4e00-\u9fff-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48)
}

const inferExtensionFromUrl = (url: string) => {
  const matched = String(url || '').trim().match(/\.([a-z0-9]+)(?:\?|#|$)/i)
  return matched?.[1]?.toLowerCase() || ''
}

const isBrowserDirectFetchBlockedUrl = (url: string) => {
  const normalized = String(url || '').trim()
  if (!normalized || /^data:/i.test(normalized) || /^blob:/i.test(normalized)) {
    return false
  }

  if (normalized.startsWith(UPLOADS_PATH_PREFIX) || normalized.startsWith('/uploads/')) {
    return false
  }

  if (typeof window === 'undefined') {
    return false
  }

  if (normalized.startsWith('/') && !normalized.startsWith('//')) {
    return false
  }

  if (!/^https?:\/\//i.test(normalized)) {
    return false
  }

  try {
    const target = new URL(normalized)
    if (target.pathname.startsWith('/uploads/')) {
      return false
    }

    if (API_BASE_URL) {
      const apiOrigin = new URL(API_BASE_URL).origin
      if (target.origin === apiOrigin) {
        return false
      }
    }

    if (target.origin === window.location.origin) {
      return false
    }

    return true
  } catch {
    return true
  }
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/** 根据 URL 或显式类型判断媒体种类。 */
export const detectMediaDownloadKind = (url: string, hint?: MediaDownloadKind) => {
  if (hint && hint !== 'auto') {
    return hint
  }

  const normalized = String(url || '').trim()
  if (VIDEO_EXT_PATTERN.test(normalized)) {
    return 'video' as const
  }
  if (IMAGE_EXT_PATTERN.test(normalized)) {
    return 'image' as const
  }
  return 'image' as const
}

/** 生成图片下载文件名。 */
export const buildImageDownloadFilename = (input?: {
  prompt?: string
  recordId?: string
  extension?: string
}) => {
  const slug = sanitizeDownloadSlug(input?.prompt) || 'canana-image'
  const suffix = String(input?.recordId || '').trim().slice(-8)
  const idPart = suffix ? `-${suffix}` : ''
  const extension = String(input?.extension || 'png').replace(/^\./, '') || 'png'
  return `${slug}${idPart}-${Date.now()}.${extension}`
}

/** 解析最终下载文件名。 */
export const resolveMediaDownloadFilename = (input: {
  url: string
  kind?: MediaDownloadKind
  prompt?: string
  recordId?: string
  filename?: string
}) => {
  if (input.filename) {
    return input.filename
  }

  const kind = detectMediaDownloadKind(input.url, input.kind)
  if (kind === 'video') {
    return buildVideoDownloadFilename({
      prompt: input.prompt,
      recordId: input.recordId,
    })
  }

  return buildImageDownloadFilename({
    prompt: input.prompt,
    recordId: input.recordId,
    extension: inferExtensionFromUrl(input.url) || 'png',
  })
}

const parseFilenameFromContentDisposition = (value?: string | null) => {
  const normalized = String(value || '').trim()
  if (!normalized) {
    return ''
  }

  const utf8Match = normalized.match(/filename\*=UTF-8''([^;]+)/i)
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1])
  }

  const asciiMatch = normalized.match(/filename="([^"]+)"/i)
  return asciiMatch?.[1] || ''
}

const triggerBlobDownload = (blob: Blob, filename: string) => {
  const objectUrl = URL.createObjectURL(blob)
  try {
    const anchor = document.createElement('a')
    anchor.href = objectUrl
    anchor.download = filename
    anchor.rel = 'noopener'
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

/**
 * 下载专用 URL：本地上传资源优先走同源相对路径 /uploads/...，
 * 避免拼成 API 绝对地址后在跨域场景下只能「打开链接」无法触发 download。
 */
export const resolveDownloadRequestUrl = (inputUrl: string) => {
  const normalized = String(inputUrl || '').trim()
  if (!normalized) {
    return ''
  }

  if (/^data:/i.test(normalized) || /^blob:/i.test(normalized)) {
    return normalized
  }

  if (normalized.startsWith(UPLOADS_PATH_PREFIX)) {
    return normalized
  }

  if (/^https?:\/\//i.test(normalized)) {
    try {
      const parsed = new URL(normalized)
      if (parsed.pathname.startsWith(UPLOADS_PATH_PREFIX)) {
        return `${parsed.pathname}${parsed.search}${parsed.hash}`
      }
      return normalized
    } catch {
      return normalized
    }
  }

  if (normalized.startsWith('uploads/')) {
    return `/${normalized}`
  }

  return buildAssetUrl(normalized)
}

const fetchDownloadBlob = async (requestUrl: string) => {
  const response = await fetch(requestUrl, { credentials: 'include' })
  if (!response.ok) {
    throw new Error(`下载失败 (${response.status})`)
  }

  const blob = await response.blob()
  if (!blob.size) {
    throw new Error('下载内容为空')
  }

  return blob
}

/**
 * 读取媒体 Blob（供本机处理，如 FFmpeg 截取）。
 * 跨域直链无 CORS 时走登录态 `/api/media/proxy-download`。
 */
export const fetchMediaBlob = async (
  url: string,
  kind: MediaDownloadKind = 'auto',
): Promise<Blob> => {
  const requestUrl = resolveDownloadRequestUrl(String(url || '').trim())
  if (!requestUrl) {
    throw new Error('媒体地址无效')
  }

  if (isBrowserDirectFetchBlockedUrl(requestUrl)) {
    const apiUrl = buildMediaProxyDownloadUrl(requestUrl, {
      disposition: 'inline',
      kind: detectMediaDownloadKind(requestUrl, kind),
    })
    if (!apiUrl) {
      throw new Error('远程媒体地址无效')
    }
    const response = await fetch(apiUrl, { credentials: 'include' })
    if (!response.ok) {
      const { message } = await readApiErrorMessage(response, `读取媒体失败（${response.status}）`)
      throw new Error(message)
    }
    const blob = await response.blob()
    if (!blob.size) {
      throw new Error('媒体内容为空')
    }
    return blob
  }

  return fetchDownloadBlob(requestUrl)
}

const downloadMediaViaApiRoute = async (apiUrl: string, fallbackFilename?: string) => {
  const response = await fetch(apiUrl, { credentials: 'include' })
  if (!response.ok) {
    const { message } = await readApiErrorMessage(response, `下载失败 (${response.status})`)
    throw new Error(message)
  }

  const blob = await response.blob()
  if (!blob.size) {
    throw new Error('下载内容为空')
  }

  const filename = parseFilenameFromContentDisposition(response.headers.get('Content-Disposition'))
    || fallbackFilename
    || 'canana-media'
  triggerBlobDownload(blob, filename)
}

/** 按 URL 直链 / 代理下载（无素材 file 路由或路由失败时的回退路径）。 */
const downloadMediaViaUrl = async (input: {
  url?: string
  filename?: string
  kind?: MediaDownloadKind
  prompt?: string
  recordId?: string
}) => {
  const requestUrl = resolveDownloadRequestUrl(String(input.url || ''))
  if (!requestUrl) {
    throw new Error('下载地址无效')
  }

  if (isBrowserDirectFetchBlockedUrl(requestUrl)) {
    const filename = resolveMediaDownloadFilename({
      url: requestUrl,
      kind: input.kind,
      prompt: input.prompt,
      recordId: input.recordId,
      filename: input.filename,
    })
    const kind = detectMediaDownloadKind(requestUrl, input.kind)
    const apiUrl = buildMediaProxyDownloadUrl(requestUrl, {
      disposition: 'attachment',
      kind,
      filename,
    })
    if (!apiUrl) {
      throw new Error('远程下载地址无效')
    }
    await downloadMediaViaApiRoute(apiUrl, filename)
    return
  }

  const filename = resolveMediaDownloadFilename({
    url: requestUrl,
    kind: input.kind,
    prompt: input.prompt,
    recordId: input.recordId,
    filename: input.filename,
  })

  const blob = await fetchDownloadBlob(requestUrl)
  triggerBlobDownload(blob, filename)
}

/** 下载单个媒体文件：优先走服务端素材/产出路由，否则回退直链 fetch。 */
export const downloadMediaFile = async (input: {
  url?: string
  assetId?: string
  generationRecordId?: string
  outputIndex?: number
  filename?: string
  kind?: MediaDownloadKind
  prompt?: string
  recordId?: string
  trackDownload?: boolean
}) => {
  const assetId = String(input.assetId || '').trim()
  if (assetId) {
    const apiUrl = buildAssetItemFileUrl(assetId, {
      disposition: 'attachment',
      track: input.trackDownload !== false,
    })
    if (!apiUrl) {
      throw new Error('素材 ID 无效')
    }
    try {
      await downloadMediaViaApiRoute(apiUrl, input.filename)
      return
    } catch (error) {
      // CM 尚未提供 /api/asset-items/:id/file；有 URL 时回退直链，避免预览下载整页不可用。
      if (!String(input.url || '').trim()) {
        throw error
      }
      console.warn('素材 file 路由不可用，回退 URL 下载。', assetId, error)
    }
  }

  const generationRecordId = String(input.generationRecordId || '').trim()
  if (generationRecordId && input.outputIndex !== undefined) {
    const apiUrl = buildGenerationOutputFileUrl(generationRecordId, input.outputIndex, {
      disposition: 'attachment',
      track: input.trackDownload !== false,
    })
    if (!apiUrl) {
      throw new Error('生成记录 ID 无效')
    }
    try {
      await downloadMediaViaApiRoute(
        apiUrl,
        input.filename || resolveMediaDownloadFilename({
          url: '',
          kind: input.kind,
          prompt: input.prompt,
          recordId: input.recordId || generationRecordId,
        }),
      )
      return
    } catch (error) {
      // 同上：产出 file 路由缺失时回退 URL。
      if (!String(input.url || '').trim()) {
        throw error
      }
      console.warn('生成产出 file 路由不可用，回退 URL 下载。', generationRecordId, error)
    }
  }

  await downloadMediaViaUrl(input)
}

/** 顺序批量下载，避免浏览器拦截多个同时触发的下载。 */
export const downloadMediaFilesSequential = async (
  items: Array<{
    url?: string
    assetId?: string
    generationRecordId?: string
    outputIndex?: number
    filename?: string
    kind?: MediaDownloadKind
    prompt?: string
    recordId?: string
    trackDownload?: boolean
  }>,
  options?: {
    intervalMs?: number
  },
) => {
  const intervalMs = Math.max(0, Number(options?.intervalMs ?? 250))
  let successCount = 0

  for (const [index, item] of items.entries()) {
    try {
      await downloadMediaFile(item)
      successCount += 1
    } catch (error) {
      console.warn('批量下载失败。', item.assetId || item.url, error)
    }

    if (index < items.length - 1 && intervalMs > 0) {
      await sleep(intervalMs)
    }
  }

  return {
    successCount,
    totalCount: items.length,
  }
}
