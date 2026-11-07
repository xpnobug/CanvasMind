import { readRawBuffer, sendJson } from '../ai-gateway/shared'
import { requireAdminSessionUser, requireCurrentSessionUser } from '../auth/session'
import { isPrismaConfigured } from '../db/prisma'
import {
  readAssetActionBody,
  readAssetListQuery,
  readEditorUploadHeaders,
  sendAssetItemsError,
} from './shared'
import {
  applyAssetAction,
  listAllAssetItems,
  listMineAssetItems,
  listPublicAssetItems,
  uploadAssetItemFromEditor,
} from './service'
import {
  ASSET_ITEMS_ALLOWED_MIME_PREFIXES,
  ASSET_ITEMS_BASE_PATH,
  ASSET_ITEMS_MAX_UPLOAD_BYTES,
  ASSET_ITEMS_UPLOAD_PATH,
} from './constants'

// 处理资源列表请求。
export const handleAssetItemsRequest = async (req: any, res: any) => {
  try {
    if (!isPrismaConfigured()) {
      sendAssetItemsError(res, 500, '缺少 DATABASE_URL，暂时无法使用资源存储。')
      return
    }

    const requestUrl = String(req.url || '')
    const pathname = requestUrl.split('?')[0]

    // POST /api/asset-items/upload — cutia 编辑器素材上传专用入口
    if (req.method === 'POST' && pathname === ASSET_ITEMS_UPLOAD_PATH) {
      const currentUser = await requireCurrentSessionUser(req, res)
      if (!currentUser) {
        return
      }

      const headers = readEditorUploadHeaders(req)
      // MIME 前缀校验, 防止非媒体文件混入
      const mimeAllowed = ASSET_ITEMS_ALLOWED_MIME_PREFIXES.some((prefix) =>
        headers.mimeType.toLowerCase().startsWith(prefix),
      )
      if (!mimeAllowed) {
        sendAssetItemsError(res, 415, `不支持的 MIME 类型: ${headers.mimeType}`)
        return
      }

      const buffer = await readRawBuffer(req)
      if (!buffer.byteLength) {
        sendAssetItemsError(res, 400, '上传内容不能为空')
        return
      }
      if (buffer.byteLength > ASSET_ITEMS_MAX_UPLOAD_BYTES) {
        sendAssetItemsError(res, 413, `文件大小超过上限 (${Math.round(ASSET_ITEMS_MAX_UPLOAD_BYTES / 1024 / 1024)}MB)`)
        return
      }

      const data = await uploadAssetItemFromEditor({
        buffer,
        filename: headers.filename,
        mimeType: headers.mimeType,
        assetType: headers.assetType,
        userId: currentUser.id,
        metadata: headers.metadata,
      })
      sendJson(res, 200, { data })
      return
    }

    if (req.method === 'GET' && pathname === ASSET_ITEMS_BASE_PATH) {
      const query = readAssetListQuery(requestUrl)
      if (query.scope === 'mine') {
        const currentUser = await requireCurrentSessionUser(req, res)
        if (!currentUser) {
          return
        }

        const data = await listMineAssetItems(query, currentUser.id)
        sendJson(res, 200, { data })
        return
      }

      if (query.scope === 'all') {
        const currentUser = await requireAdminSessionUser(req, res)
        if (!currentUser) {
          return
        }

        const data = await listAllAssetItems(query)
        sendJson(res, 200, { data })
        return
      }

      const data = await listPublicAssetItems(query)
      sendJson(res, 200, { data })
      return
    }

    if (req.method === 'POST' && pathname === `${ASSET_ITEMS_BASE_PATH}/actions`) {
      const currentUser = await requireCurrentSessionUser(req, res)
      if (!currentUser) {
        return
      }

      const payload = await readAssetActionBody(req)
      if (payload.scope === 'feed') {
        sendAssetItemsError(res, 400, '公开资源不支持直接执行后台动作')
        return
      }

      if (payload.scope === 'all' && currentUser.role !== 'ADMIN') {
        sendAssetItemsError(res, 403, '只有管理员可以操作全站资源')
        return
      }

      const data = await applyAssetAction(payload, currentUser.id, currentUser.role === 'ADMIN')
      sendJson(res, 200, { data })
      return
    }

    sendAssetItemsError(res, 405, 'Method Not Allowed')
  } catch (error: any) {
    sendAssetItemsError(res, 500, error?.message || '处理资源请求失败')
  }
}
