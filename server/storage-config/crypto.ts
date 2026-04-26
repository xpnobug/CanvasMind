import crypto from 'node:crypto'

// 默认存储配置加密密钥。
const DEFAULT_SECRET = 'canana-vue-storage-config-secret'

// GCM 初始化向量长度。
const IV_LENGTH = 12

// 获取对象存储配置加密密钥。
const getSecretKey = () => {
  // 优先读取专用密钥，其次回退到 Provider 配置密钥。
  const secret = process.env.STORAGE_CONFIG_SECRET
    || process.env.PROVIDER_CONFIG_SECRET
    || DEFAULT_SECRET

  // 固定生成 32 字节摘要密钥。
  return crypto.createHash('sha256').update(secret).digest()
}

// 加密敏感文本。
const encryptText = (plainText?: string | null) => {
  if (!plainText) return ''

  // 生成随机初始化向量。
  const iv = crypto.randomBytes(IV_LENGTH)

  // 创建加密器。
  const cipher = crypto.createCipheriv('aes-256-gcm', getSecretKey(), iv)

  // 生成密文。
  const encrypted = Buffer.concat([
    cipher.update(plainText, 'utf8'),
    cipher.final(),
  ])

  // 提取鉴权标签。
  const authTag = cipher.getAuthTag()

  // 返回序列化后的密文结构。
  return `${iv.toString('base64')}.${authTag.toString('base64')}.${encrypted.toString('base64')}`
}

// 解密敏感文本。
const decryptText = (encryptedText?: string | null) => {
  if (!encryptedText) return ''

  // 解析密文结构。
  const [ivBase64, authTagBase64, payloadBase64] = encryptedText.split('.')
  if (!ivBase64 || !authTagBase64 || !payloadBase64) {
    throw new Error('对象存储密文格式不正确')
  }

  // 创建解密器。
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    getSecretKey(),
    Buffer.from(ivBase64, 'base64'),
  )

  // 写入鉴权标签。
  decipher.setAuthTag(Buffer.from(authTagBase64, 'base64'))

  // 解密原文。
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(payloadBase64, 'base64')),
    decipher.final(),
  ])

  return decrypted.toString('utf8')
}

// 生成掩码展示文本。
const maskSecret = (value?: string | null) => {
  if (!value) return ''
  if (value.length <= 8) return value
  return `${value.slice(0, 4)}...${value.slice(-4)}`
}

// 加密 Access Key。
export const encryptStorageAccessKey = (plainText?: string | null) => encryptText(plainText)

// 加密 Secret Key。
export const encryptStorageSecretKey = (plainText?: string | null) => encryptText(plainText)

// 解密 Access Key。
export const decryptStorageAccessKey = (encryptedText?: string | null) => decryptText(encryptedText)

// 解密 Secret Key。
export const decryptStorageSecretKey = (encryptedText?: string | null) => decryptText(encryptedText)

// 生成 Access Key 掩码。
export const maskStorageAccessKey = (value?: string | null) => maskSecret(value)

// 生成 Secret Key 掩码。
export const maskStorageSecretKey = (value?: string | null) => maskSecret(value)
