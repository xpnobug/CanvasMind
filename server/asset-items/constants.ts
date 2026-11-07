export const ASSET_ITEMS_BASE_PATH = '/api/asset-items'

export const ASSET_ITEMS_UPLOAD_PATH = '/api/asset-items/upload'

// 单文件上传软上限 (与编辑器素材体积上限对齐, 100 MB)。
export const ASSET_ITEMS_MAX_UPLOAD_BYTES = 100 * 1024 * 1024

// 编辑器上传允许的 MIME 前缀。
export const ASSET_ITEMS_ALLOWED_MIME_PREFIXES = ['image/', 'video/', 'audio/']

export const isAssetItemsPath = (requestPath: string) => {
  return requestPath === ASSET_ITEMS_BASE_PATH || requestPath.startsWith(`${ASSET_ITEMS_BASE_PATH}/`)
}
