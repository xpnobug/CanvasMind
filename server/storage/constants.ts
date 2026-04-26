// 文件上传接口基础路径。
export const STORAGE_UPLOAD_PATH = '/api/storage/upload'

// 判断当前请求是否命中文件上传接口。
export const isStorageUploadPath = (requestPath: string) => {
  // 仅当前固定路径视为上传接口。
  return requestPath === STORAGE_UPLOAD_PATH
}
