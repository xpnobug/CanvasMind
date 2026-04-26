import fs from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'
import { uploadBufferToActiveObjectStorage } from '../storage-config/service'

// 默认上传根目录。
const DEFAULT_UPLOADS_DIR = path.resolve(process.cwd(), 'uploads')

// 读取上传目录配置。
const readUploadsDir = () => {
  // 优先读取环境变量指定的目录。
  const configuredDir = String(process.env.UPLOADS_DIR || '').trim()

  // 未配置时回退到项目根目录下的 uploads。
  return configuredDir ? path.resolve(configuredDir) : DEFAULT_UPLOADS_DIR
}

// 根据 MIME 类型推导扩展名。
const getExtensionByMimeType = (mimeType: string) => {
  switch (String(mimeType || '').toLowerCase()) {
    case 'image/jpeg':
      return '.jpg'
    case 'image/png':
      return '.png'
    case 'image/webp':
      return '.webp'
    case 'image/gif':
      return '.gif'
    case 'image/svg+xml':
      return '.svg'
    case 'video/mp4':
      return '.mp4'
    case 'video/webm':
      return '.webm'
    case 'text/plain':
      return '.txt'
    case 'application/json':
      return '.json'
    default:
      return ''
  }
}

// 从原始文件名中提取可用扩展名。
const getSafeExtension = (filename: string, mimeType: string) => {
  // 提取原始文件名的扩展名。
  const originalExtension = path.extname(String(filename || '').trim()).toLowerCase()

  // 原始扩展名存在时优先使用。
  if (originalExtension) {
    return originalExtension
  }

  // 否则退回 MIME 类型映射。
  return getExtensionByMimeType(mimeType)
}

// 规范化上传分类名称。
const normalizeCategory = (category: string) => {
  // 仅保留安全字符，避免目录穿越和特殊路径。
  const normalized = String(category || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9/_-]+/g, '-')
    .replace(/^\/+|\/+$/g, '')

  // 未传值时统一归档到 general。
  return normalized || 'general'
}

// 确保目标目录存在。
const ensureDirectory = async (directoryPath: string) => {
  // 递归创建目录。
  await fs.mkdir(directoryPath, { recursive: true })
}

// 生成上传对象的存储键。
const buildStorageObjectKey = (input: {
  filename?: string
  mimeType?: string
  category?: string
}) => {
  // 规范化分类目录名。
  const category = normalizeCategory(input.category || 'general')

  // 构造按日期分层的目录片段。
  const dateSegment = new Date().toISOString().slice(0, 10).replace(/-/g, '')

  // 生成安全扩展名。
  const extension = getSafeExtension(input.filename || '', input.mimeType || '')

  // 生成唯一文件名，避免冲突。
  const uniqueFilename = `${Date.now()}-${crypto.randomUUID()}${extension}`

  // 返回对象存储可复用的键名。
  return `${category}/${dateSegment}/${uniqueFilename}`
}

// 将文件缓冲区保存到本地上传目录。
export const saveUploadedBuffer = async (input: {
  buffer: Buffer
  filename?: string
  mimeType?: string
  category?: string
}) => {
  // 先生成统一对象键，保证本地与对象存储路径规则一致。
  const storageObjectKey = buildStorageObjectKey(input)

  // 优先尝试上传到当前启用的对象存储。
  const uploadedObject = await uploadBufferToActiveObjectStorage({
    key: storageObjectKey,
    buffer: input.buffer,
    mimeType: input.mimeType,
  })

  // 若存在启用的对象存储，则直接返回对象存储结果。
  if (uploadedObject) {
    return {
      filePath: uploadedObject.relativePath,
      relativePath: uploadedObject.relativePath,
      publicUrl: uploadedObject.publicUrl,
      filename: path.basename(uploadedObject.relativePath),
      mimeType: input.mimeType || 'application/octet-stream',
      size: input.buffer.byteLength,
      storageType: 'object',
      storageCode: uploadedObject.storageCode,
    }
  }

  // 解析上传根目录。
  const uploadsDir = readUploadsDir()

  // 生成本地文件存储目录。
  const targetDirectory = path.join(uploadsDir, path.dirname(storageObjectKey))

  // 确保存储目录存在。
  await ensureDirectory(targetDirectory)

  // 拼出完整落盘路径。
  const filePath = path.join(uploadsDir, storageObjectKey)

  // 将文件内容写入磁盘。
  await fs.writeFile(filePath, input.buffer)

  // 计算相对上传根目录的路径。
  const relativePath = path.relative(uploadsDir, filePath).split(path.sep).join('/')

  // 返回前端可直接访问的 URL。
  return {
    filePath,
    relativePath,
    publicUrl: `/uploads/${relativePath}`,
    filename: path.basename(relativePath),
    mimeType: input.mimeType || 'application/octet-stream',
    size: input.buffer.byteLength,
    storageType: 'local',
    storageCode: 'local',
  }
}

// 获取上传根目录，供静态文件服务复用。
export const getUploadsDir = () => {
  return readUploadsDir()
}
