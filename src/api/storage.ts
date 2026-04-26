import { buildApiUrl } from './http'

// 本地文件上传分类。
export type StorageUploadCategory = 'general' | 'asset' | 'avatar' | 'publish' | 'reference'

// 上传成功后返回的文件信息。
export interface UploadedStorageFile {
  filePath: string
  relativePath: string
  publicUrl: string
  filename: string
  mimeType: string
  size: number
  storageType?: 'local' | 'object'
  storageCode?: string
}

// 上传浏览器文件到后端本地存储。
export const uploadStorageFile = async (
  file: File,
  category: StorageUploadCategory = 'general',
) => {
  // 以原始二进制方式发给后端，避免额外 multipart 依赖。
  const response = await fetch(buildApiUrl('/api/storage/upload'), {
    method: 'POST',
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
      'x-upload-filename': encodeURIComponent(file.name || 'file'),
      'x-upload-category': category,
    },
    body: file,
  })

  // 解析返回内容。
  const payload = await response.json().catch(() => ({}))

  // 非成功状态直接抛错。
  if (!response.ok) {
    throw new Error(payload?.error?.message || payload?.message || '上传失败')
  }

  // 返回后端保存结果。
  return payload?.data as UploadedStorageFile
}
