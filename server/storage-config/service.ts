import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { prisma } from '../db/prisma'
import {
  decryptStorageAccessKey,
  decryptStorageSecretKey,
  encryptStorageAccessKey,
  encryptStorageSecretKey,
  maskStorageAccessKey,
  maskStorageSecretKey,
} from './crypto'
import type { ObjectStorageConfigPayload } from './shared'

// 默认对象存储场景。
const DEFAULT_SCENE = 'global'

// 将数据库记录转换为前端可用结构。
const serializeStorageConfig = (record: any) => {
  return {
    id: record.id,
    name: record.name,
    code: record.code,
    providerType: String(record.providerType || '').toLowerCase(),
    accessKeyHint: maskStorageAccessKey(decryptStorageAccessKey(record.accessKeyEncrypted)),
    secretKeyHint: maskStorageSecretKey(decryptStorageSecretKey(record.secretKeyEncrypted)),
    endpoint: record.endpoint,
    bucket: record.bucket,
    domain: record.domain || '',
    region: record.region || '',
    sortOrder: record.sortOrder || 999,
    description: record.description || '',
    isEnabled: Boolean(record.isEnabled),
    isDefault: Boolean(record.isDefault),
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  }
}

// 规范化对象存储编码。
const normalizeStorageCode = (code?: string) => {
  // 统一转换成安全编码。
  return String(code || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
}

// 列出对象存储配置。
export const listObjectStorageConfigs = async () => {
  const records = await prisma.objectStorageConfig.findMany({
    where: {
      userId: null,
      scene: DEFAULT_SCENE,
    },
    orderBy: [
      { isDefault: 'desc' },
      { sortOrder: 'asc' },
      { createdAt: 'asc' },
    ],
  })

  return records.map(serializeStorageConfig)
}

// 创建对象存储配置。
export const createObjectStorageConfig = async (payload: ObjectStorageConfigPayload) => {
  const name = String(payload.name || '').trim()
  const code = normalizeStorageCode(payload.code)
  const accessKey = String(payload.accessKey || '').trim()
  const secretKey = String(payload.secretKey || '').trim()
  const endpoint = String(payload.endpoint || '').trim().replace(/\/+$/, '')
  const bucket = String(payload.bucket || '').trim()
  const domain = String(payload.domain || '').trim().replace(/\/+$/, '')
  const region = String(payload.region || '').trim()
  const sortOrder = Number(payload.sortOrder ?? 999)
  const description = String(payload.description || '').trim()
  const isEnabled = payload.isEnabled !== false
  const isDefault = payload.isDefault === true

  if (!name) throw new Error('名称不能为空')
  if (!code) throw new Error('编码不能为空')
  if (!accessKey) throw new Error('Access Key 不能为空')
  if (!secretKey) throw new Error('Secret Key 不能为空')
  if (!endpoint) throw new Error('Endpoint 不能为空')
  if (!bucket) throw new Error('Bucket 不能为空')

  if (isDefault) {
    await prisma.objectStorageConfig.updateMany({
      where: {
        userId: null,
        scene: DEFAULT_SCENE,
      },
      data: {
        isDefault: false,
      },
    })
  }

  const created = await prisma.objectStorageConfig.create({
    data: {
      userId: null,
      scene: DEFAULT_SCENE,
      name,
      code,
      providerType: 'S3_COMPATIBLE',
      accessKeyEncrypted: encryptStorageAccessKey(accessKey),
      secretKeyEncrypted: encryptStorageSecretKey(secretKey),
      endpoint,
      bucket,
      domain: domain || null,
      region: region || null,
      sortOrder: Number.isFinite(sortOrder) ? sortOrder : 999,
      description: description || null,
      isEnabled,
      isDefault,
    },
  })

  return serializeStorageConfig(created)
}

// 更新对象存储配置。
export const updateObjectStorageConfig = async (id: string, payload: ObjectStorageConfigPayload) => {
  const existing = await prisma.objectStorageConfig.findUnique({
    where: { id },
  })

  if (!existing) {
    throw new Error('对象存储配置不存在')
  }

  const name = String(payload.name ?? existing.name).trim()
  const code = normalizeStorageCode(payload.code ?? existing.code)
  const accessKey = String(payload.accessKey || '').trim() || decryptStorageAccessKey(existing.accessKeyEncrypted)
  const secretKey = String(payload.secretKey || '').trim() || decryptStorageSecretKey(existing.secretKeyEncrypted)
  const endpoint = String(payload.endpoint ?? existing.endpoint).trim().replace(/\/+$/, '')
  const bucket = String(payload.bucket ?? existing.bucket).trim()
  const domain = String(payload.domain ?? existing.domain ?? '').trim().replace(/\/+$/, '')
  const region = String(payload.region ?? existing.region ?? '').trim()
  const sortOrder = Number(payload.sortOrder ?? existing.sortOrder)
  const description = String(payload.description ?? existing.description ?? '').trim()
  const isEnabled = payload.isEnabled ?? existing.isEnabled
  const isDefault = payload.isDefault ?? existing.isDefault

  if (!name) throw new Error('名称不能为空')
  if (!code) throw new Error('编码不能为空')
  if (!accessKey) throw new Error('Access Key 不能为空')
  if (!secretKey) throw new Error('Secret Key 不能为空')
  if (!endpoint) throw new Error('Endpoint 不能为空')
  if (!bucket) throw new Error('Bucket 不能为空')

  if (isDefault) {
    await prisma.objectStorageConfig.updateMany({
      where: {
        userId: null,
        scene: DEFAULT_SCENE,
        NOT: { id },
      },
      data: {
        isDefault: false,
      },
    })
  }

  const updated = await prisma.objectStorageConfig.update({
    where: { id },
    data: {
      name,
      code,
      accessKeyEncrypted: encryptStorageAccessKey(accessKey),
      secretKeyEncrypted: encryptStorageSecretKey(secretKey),
      endpoint,
      bucket,
      domain: domain || null,
      region: region || null,
      sortOrder: Number.isFinite(sortOrder) ? sortOrder : 999,
      description: description || null,
      isEnabled: Boolean(isEnabled),
      isDefault: Boolean(isDefault),
    },
  })

  return serializeStorageConfig(updated)
}

// 激活指定对象存储配置。
export const activateObjectStorageConfig = async (id: string) => {
  const existing = await prisma.objectStorageConfig.findUnique({
    where: { id },
  })

  if (!existing) {
    throw new Error('对象存储配置不存在')
  }

  await prisma.objectStorageConfig.updateMany({
    where: {
      userId: null,
      scene: DEFAULT_SCENE,
    },
    data: {
      isDefault: false,
    },
  })

  const updated = await prisma.objectStorageConfig.update({
    where: { id },
    data: {
      isDefault: true,
      isEnabled: true,
    },
  })

  return serializeStorageConfig(updated)
}

// 获取当前生效的对象存储配置。
export const getActiveObjectStorageConfig = async () => {
  const record = await prisma.objectStorageConfig.findFirst({
    where: {
      userId: null,
      scene: DEFAULT_SCENE,
      isEnabled: true,
    },
    orderBy: [
      { isDefault: 'desc' },
      { sortOrder: 'asc' },
      { createdAt: 'asc' },
    ],
  })

  if (!record) {
    return null
  }

  return {
    id: record.id,
    name: record.name,
    code: record.code,
    providerType: record.providerType,
    endpoint: record.endpoint,
    bucket: record.bucket,
    domain: record.domain || '',
    region: record.region || '',
    accessKey: decryptStorageAccessKey(record.accessKeyEncrypted),
    secretKey: decryptStorageSecretKey(record.secretKeyEncrypted),
  }
}

// 使用当前启用的对象存储上传文件。
export const uploadBufferToActiveObjectStorage = async (input: {
  key: string
  buffer: Buffer
  mimeType?: string
}) => {
  const activeConfig = await getActiveObjectStorageConfig()

  if (!activeConfig) {
    return null
  }

  const s3Client = new S3Client({
    region: activeConfig.region || 'auto',
    endpoint: activeConfig.endpoint,
    forcePathStyle: true,
    credentials: {
      accessKeyId: activeConfig.accessKey,
      secretAccessKey: activeConfig.secretKey,
    },
  })

  await s3Client.send(new PutObjectCommand({
    Bucket: activeConfig.bucket,
    Key: input.key,
    Body: input.buffer,
    ContentType: input.mimeType || 'application/octet-stream',
  }))

  if (activeConfig.domain) {
    return {
      storageCode: activeConfig.code,
      publicUrl: `${activeConfig.domain.replace(/\/+$/, '')}/${input.key.replace(/^\/+/, '')}`,
      relativePath: input.key,
    }
  }

  return {
    storageCode: activeConfig.code,
    publicUrl: `${activeConfig.endpoint.replace(/\/+$/, '')}/${activeConfig.bucket}/${input.key.replace(/^\/+/, '')}`,
    relativePath: input.key,
  }
}
