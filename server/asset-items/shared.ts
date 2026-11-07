import { readJsonBody, sendJson } from '../ai-gateway/shared'

export type AssetScope = 'feed' | 'mine' | 'all'
export type AssetKind = 'image' | 'video' | 'audio'
export type AssetPublishState = 'all' | 'published' | 'pending' | 'draft'

export interface AssetListQuery {
  scope: AssetScope
  assetType: AssetKind
  take: number
  page: number
  pageSize: number
  publishState: AssetPublishState
  ownerKeyword: string
  ids: string[]
  includeEditorUploads: boolean
}

export interface AssetListResult<TItem = Record<string, unknown>> {
  items: TItem[]
  summary: {
    totalCount: number
    totalPages: number
    page: number
    pageSize: number
  }
}

export type AssetActionType = 'delete' | 'publish' | 'unpublish' | 'favorite' | 'view' | 'download'

export interface AssetActionPayload {
  action: AssetActionType
  ids: string[]
  scope: AssetScope
}

// 解析资源查询参数。
export const readAssetListQuery = (requestUrl: string) => {
  const url = new URL(requestUrl, 'http://localhost')
  const rawScope = String(url.searchParams.get('scope') || '').trim().toLowerCase()
  const scope = rawScope === 'mine'
    ? 'mine'
    : rawScope === 'all'
      ? 'all'
      : 'feed'
  const rawAssetType = String(url.searchParams.get('assetType') || '').trim().toLowerCase()
  const assetType: AssetKind = rawAssetType === 'video'
    ? 'video'
    : rawAssetType === 'audio'
      ? 'audio'
      : 'image'
  const rawTake = Number(url.searchParams.get('take') || 0)
  const rawPage = Number(url.searchParams.get('page') || 1)
  const rawPageSize = Number(url.searchParams.get('pageSize') || 0)
  const rawPublishState = String(url.searchParams.get('publishState') || '').trim().toLowerCase()
  const ownerKeyword = String(url.searchParams.get('ownerKeyword') || '').trim()
  const rawIds = String(url.searchParams.get('ids') || '').trim()
  const ids = rawIds
    ? rawIds.split(',').map((id) => id.trim()).filter(Boolean).slice(0, 200)
    : []
  const includeEditorUploads = String(url.searchParams.get('includeEditorUploads') || '').toLowerCase() === 'true'
  const normalizedTake = Number.isFinite(rawTake) && rawTake > 0 ? Math.min(rawTake, 120) : 60
  const pageSize = Number.isFinite(rawPageSize) && rawPageSize > 0
    ? Math.min(rawPageSize, 120)
    : normalizedTake
  const publishState = rawPublishState === 'published'
    ? 'published'
    : rawPublishState === 'pending'
      ? 'pending'
    : rawPublishState === 'draft'
      ? 'draft'
      : 'all'

  return {
    scope,
    assetType,
    take: normalizedTake,
    page: Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1,
    pageSize,
    publishState,
    ownerKeyword,
    ids,
    includeEditorUploads,
  } satisfies AssetListQuery
}

// 返回统一的资源接口错误。
export const sendAssetItemsError = (res: any, statusCode: number, message: string) => {
  sendJson(res, statusCode, {
    message,
    error: {
      type: 'asset_items_error',
      message,
    },
  })
}

// 读取批量资源动作请求体。
export const readAssetActionBody = async (req: any) => {
  const payload = await readJsonBody(req)

  return {
    action: String((payload as any)?.action || '').trim() as AssetActionType,
    ids: Array.isArray((payload as any)?.ids)
      ? (payload as any).ids.map((id: unknown) => String(id || '').trim()).filter(Boolean)
      : [],
    scope: String((payload as any)?.scope || '').trim().toLowerCase() === 'all'
      ? 'all'
      : String((payload as any)?.scope || '').trim().toLowerCase() === 'feed'
        ? 'feed'
        : 'mine',
  } satisfies AssetActionPayload
}

export interface EditorUploadHeaders {
  assetType: AssetKind
  filename: string
  mimeType: string
  metadata: Record<string, unknown>
}

// 解析编辑器上传 raw binary 请求的 headers。
export const readEditorUploadHeaders = (req: any): EditorUploadHeaders => {
  const rawAssetType = String(req.headers['x-asset-type'] || '').trim().toLowerCase()
  const assetType: AssetKind = rawAssetType === 'video'
    ? 'video'
    : rawAssetType === 'audio'
      ? 'audio'
      : 'image'

  const filename = String(req.headers['x-upload-filename'] || '').trim() || 'untitled'
  const mimeType = String(req.headers['content-type'] || 'application/octet-stream').trim()

  // x-media-meta 是 base64 编码的 JSON,包含 width/height/durationSeconds/thumbnailUrl 等
  const rawMeta = String(req.headers['x-media-meta'] || '').trim()
  let metadata: Record<string, unknown> = {}
  if (rawMeta) {
    try {
      const decoded = Buffer.from(rawMeta, 'base64').toString('utf-8')
      const parsed = JSON.parse(decoded)
      if (parsed && typeof parsed === 'object') {
        metadata = parsed as Record<string, unknown>
      }
    } catch {
      // 忽略解析错误,空对象作为兜底
    }
  }

  return { assetType, filename, mimeType, metadata }
}
