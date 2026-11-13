import { buildAssetUrl } from '@/api/http'
import type { PersistedAssetItem } from '@/api/asset-items'

const VIDEO_FILE_PATTERN = /\.(mp4|mov|webm|m4v|avi)(\?|#|$)/i

/** 判断地址是否指向视频文件，避免把 mp4 当作图片 poster 使用。 */
export const isVideoFileUrl = (raw?: string | null) => {
  return VIDEO_FILE_PATTERN.test(String(raw || '').trim())
}

/** 仅解析可当作图片展示的地址。 */
export const resolveImageAssetUrl = (raw?: string | null) => {
  const value = String(raw || '').trim()
  if (!value || isVideoFileUrl(value)) {
    return ''
  }
  return buildAssetUrl(value)
}

/** 视频主资源地址（可播放）。 */
export const resolveAssetVideoUrl = (item: PersistedAssetItem) => {
  const raw = item.fileUrl || item.previewUrl || item.coverUrl || item.thumbnailUrl
  return raw ? buildAssetUrl(raw) : ''
}

/** 视频封面：仅使用图片地址。 */
export const resolveAssetVideoPosterUrl = (item: PersistedAssetItem) => {
  return resolveImageAssetUrl(item.thumbnailUrl)
    || resolveImageAssetUrl(item.coverUrl)
    || resolveImageAssetUrl(item.previewUrl)
}

/** 图片预览地址。 */
export const resolveAssetImagePreviewUrl = (item: PersistedAssetItem) => {
  return resolveImageAssetUrl(item.thumbnailUrl)
    || resolveImageAssetUrl(item.coverUrl)
    || resolveImageAssetUrl(item.previewUrl)
    || resolveImageAssetUrl(item.fileUrl)
}

/** 列表/卡片预览：视频返回封面，图片返回预览图。 */
export const resolveAssetPreviewUrl = (item: PersistedAssetItem) => {
  if (item.assetType === 'video') {
    return resolveAssetVideoPosterUrl(item) || resolveAssetVideoUrl(item)
  }
  return resolveAssetImagePreviewUrl(item)
}
