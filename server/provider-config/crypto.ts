import crypto from 'node:crypto'

const DEFAULT_SECRET = 'canana-vue-provider-config-secret'
const IV_LENGTH = 12

const getSecretKey = () => {
  const secret = process.env.PROVIDER_CONFIG_SECRET || DEFAULT_SECRET
  return crypto.createHash('sha256').update(secret).digest()
}

export const encryptProviderApiKey = (plainText?: string | null) => {
  if (!plainText) return null

  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv('aes-256-gcm', getSecretKey(), iv)
  const encrypted = Buffer.concat([
    cipher.update(plainText, 'utf8'),
    cipher.final(),
  ])
  const authTag = cipher.getAuthTag()

  return `${iv.toString('base64')}.${authTag.toString('base64')}.${encrypted.toString('base64')}`
}

export const decryptProviderApiKey = (encryptedText?: string | null) => {
  if (!encryptedText) return ''

  const [ivBase64, authTagBase64, payloadBase64] = encryptedText.split('.')
  if (!ivBase64 || !authTagBase64 || !payloadBase64) {
    throw new Error('API Key 密文格式不正确')
  }

  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    getSecretKey(),
    Buffer.from(ivBase64, 'base64'),
  )
  decipher.setAuthTag(Buffer.from(authTagBase64, 'base64'))

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(payloadBase64, 'base64')),
    decipher.final(),
  ])

  return decrypted.toString('utf8')
}

export const maskApiKey = (apiKey?: string | null) => {
  if (!apiKey) return ''
  if (apiKey.length <= 8) return apiKey
  return `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}`
}
