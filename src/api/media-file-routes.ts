import { buildApiUrl } from './http'

export type MediaFileRouteDisposition = 'attachment' | 'inline'

const appendRouteQuery = (
  basePath: string,
  options?: {
    disposition?: MediaFileRouteDisposition
    track?: boolean
  },
) => {
  const params = new URLSearchParams()
  params.set('disposition', options?.disposition || 'attachment')
  params.set('track', options?.track === false ? '0' : '1')
  return buildApiUrl(`${basePath}?${params.toString()}`)
}

/** 按素材 ID 构建服务端下载路由。 */
export const buildAssetItemFileUrl = (
  assetId: string,
  options?: {
    disposition?: MediaFileRouteDisposition
    track?: boolean
  },
) => {
  const normalizedId = String(assetId || '').trim()
  if (!normalizedId) {
    return ''
  }
  return appendRouteQuery(`/api/asset-items/${encodeURIComponent(normalizedId)}/file`, options)
}

/** 按生成记录 + 输出序号构建服务端下载路由。 */
export const buildGenerationOutputFileUrl = (
  recordId: string,
  outputIndex: number,
  options?: {
    disposition?: MediaFileRouteDisposition
    track?: boolean
  },
) => {
  const normalizedRecordId = String(recordId || '').trim()
  if (!normalizedRecordId) {
    return ''
  }
  const normalizedIndex = Math.max(0, Math.floor(Number(outputIndex) || 0))
  return appendRouteQuery(
    `/api/generation-records/${encodeURIComponent(normalizedRecordId)}/outputs/${normalizedIndex}/file`,
    options,
  )
}

/** 按远程 URL 构建登录态代理下载路由（导入画布等无记录 id 场景）。 */
export const buildMediaProxyDownloadUrl = (
  url: string,
  options?: {
    disposition?: MediaFileRouteDisposition
    kind?: 'image' | 'video' | 'auto'
    filename?: string
  },
) => {
  const normalizedUrl = String(url || '').trim()
  if (!normalizedUrl) {
    return ''
  }
  const params = new URLSearchParams()
  params.set('url', normalizedUrl)
  params.set('disposition', options?.disposition || 'attachment')
  if (options?.kind && options.kind !== 'auto') {
    params.set('kind', options.kind)
  }
  if (options?.filename) {
    params.set('filename', options.filename)
  }
  return buildApiUrl(`/api/media/proxy-download?${params.toString()}`)
}
