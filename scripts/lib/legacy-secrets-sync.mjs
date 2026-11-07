/**
 * 启动时旧密钥同步内部库（非 CLI 入口）。
 */
import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '@prisma/client'

const SENSITIVE_FIELD_NAME_PATTERN = /password|secret|key/i
const DEFAULT_TEMPLATE_NAME = 'OpenAI 兼容'

const getSecretKey = () => {
  const secret = process.env.PROVIDER_CONFIG_SECRET || 'canana-vue-provider-config-secret'
  return crypto.createHash('sha256').update(secret).digest()
}

const encryptProviderApiKey = (plainText) => {
  if (!plainText) {
    return null
  }

  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', getSecretKey(), iv)
  const encrypted = Buffer.concat([
    cipher.update(String(plainText), 'utf8'),
    cipher.final(),
  ])
  const authTag = cipher.getAuthTag()

  return `${iv.toString('base64')}.${authTag.toString('base64')}.${encrypted.toString('base64')}`
}

const decryptProviderApiKey = (encryptedText) => {
  if (!encryptedText) {
    return ''
  }

  const [ivBase64, authTagBase64, payloadBase64] = String(encryptedText).split('.')
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

const isSensitiveFieldName = (name) => SENSITIVE_FIELD_NAME_PATTERN.test(String(name || ''))

const processFieldValues = (fieldValues) => fieldValues.map((fieldValue) => {
  const processedValue = fieldValue.value ?? ''
  if (isSensitiveFieldName(fieldValue.name)) {
    const plain = String(processedValue)
    return {
      ...fieldValue,
      encrypted: true,
      value: plain ? encryptProviderApiKey(plain) : '',
    }
  }
  return {
    ...fieldValue,
    value: String(processedValue),
  }
})

const createPrisma = () => {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error('缺少 DATABASE_URL，无法连接数据库。')
  }

  const adapter = new PrismaMariaDb(databaseUrl)
  return new PrismaClient({
    adapter,
    log: ['error'],
  })
}

const buildSeedFileCandidates = (fileName) => {
  const normalizedName = path.basename(fileName)
  const moduleDir = path.dirname(fileURLToPath(import.meta.url))
  const seedsDirFromEnv = String(process.env.PRISMA_SEEDS_DIR || '').trim()

  const candidateDirs = [
    seedsDirFromEnv,
    path.resolve(process.cwd(), 'prisma/seeds'),
    path.resolve(process.cwd(), 'dist-service/prisma/seeds'),
    path.resolve(moduleDir, '../../prisma/seeds'),
    path.resolve(moduleDir, '../../dist-service/prisma/seeds'),
  ].filter(Boolean)

  return candidateDirs.map(dir => path.resolve(dir, normalizedName))
}

const resolvePrismaSeedFile = async (fileName) => {
  const candidates = buildSeedFileCandidates(fileName)

  for (const candidate of candidates) {
    try {
      await fs.access(candidate)
      return candidate
    } catch {
      // try next
    }
  }

  throw new Error(`找不到种子文件 ${path.basename(fileName)}，已尝试：${candidates.join(' | ')}`)
}

const mergeTemplateFields = (existingFields, seedFields) => {
  const existingMap = new Map(existingFields.map(field => [field.name, field]))
  const mergedFields = seedFields.map((seedField) => ({
    ...(existingMap.get(seedField.name) || {}),
    ...seedField,
  }))
  const seedFieldNames = new Set(seedFields.map(field => field.name))
  const extraFields = existingFields.filter(field => !seedFieldNames.has(field.name))
  return [...mergedFields, ...extraFields]
}

const isSameFieldConfig = (prevFields, nextFields) => JSON.stringify(prevFields) === JSON.stringify(nextFields)

const syncSecretFieldValuesAfterTemplateChange = async (prisma, templateId, fieldConfig) => {
  const configs = await prisma.secretConfig.findMany({ where: { templateId } })
  for (const config of configs) {
    const currentValues = Array.isArray(config.fieldValues) ? config.fieldValues : []
    const currentMap = new Map(currentValues.map(item => [item.name, item]))
    const nextValues = fieldConfig.map((field) => {
      const existing = currentMap.get(field.name)
      return existing ?? { name: field.name, value: '' }
    })
    await prisma.secretConfig.update({
      where: { id: config.id },
      data: { fieldValues: nextValues },
    })
  }
}

const syncMissingSecretTemplates = async (prisma) => {
  const seedFile = await resolvePrismaSeedFile('secret-templates.json')
  const raw = await fs.readFile(seedFile, 'utf8')
  const seeds = JSON.parse(raw)
  if (!Array.isArray(seeds)) {
    throw new Error('secret-templates.json 必须是数组')
  }

  const existing = await prisma.secretTemplate.findMany()
  const existingMap = new Map(existing.map(item => [item.name, item]))

  let created = 0
  let updated = 0
  for (const seed of seeds) {
    const name = String(seed.name || '').trim()
    if (!name) {
      continue
    }

    const existingTemplate = existingMap.get(name)
    if (existingTemplate) {
      const currentFields = Array.isArray(existingTemplate.fieldConfig) ? existingTemplate.fieldConfig : []
      const nextFields = mergeTemplateFields(currentFields, seed.fieldConfig || [])

      if (!isSameFieldConfig(currentFields, nextFields)) {
        await prisma.secretTemplate.update({
          where: { id: existingTemplate.id },
          data: { fieldConfig: nextFields },
        })
        await syncSecretFieldValuesAfterTemplateChange(prisma, existingTemplate.id, nextFields)
        updated += 1
      }
      continue
    }

    await prisma.secretTemplate.create({
      data: {
        name,
        iconUrl: String(seed.iconUrl || '').trim() || null,
        fieldConfig: seed.fieldConfig || [],
        isEnabled: seed.isEnabled !== false,
        sortOrder: Number.isFinite(Number(seed.sortOrder)) ? Number(seed.sortOrder) : 0,
      },
    })
    created += 1
  }

  const total = await prisma.secretTemplate.count()
  return { created, updated, total, seedFile }
}

const hasSecretTemplateTable = async (prisma) => {
  const rows = await prisma.$queryRaw`
    SELECT TABLE_NAME
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'secret_templates'
    LIMIT 1
  `
  return Array.isArray(rows) && rows.length > 0
}

const hasProviderColumn = async (prisma, columnName) => {
  const rows = await prisma.$queryRaw`
    SELECT COLUMN_NAME
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'ai_providers'
      AND COLUMN_NAME = ${columnName}
    LIMIT 1
  `
  return Array.isArray(rows) && rows.length > 0
}

const hasLegacyProviderApiKeyColumn = async (prisma) => hasProviderColumn(prisma, 'api_key_encrypted')

const dropLegacyProviderApiKeyColumns = async (prisma) => {
  const dropped = []
  if (await hasProviderColumn(prisma, 'api_key_encrypted')) {
    await prisma.$executeRaw`ALTER TABLE ai_providers DROP COLUMN api_key_encrypted`
    dropped.push('api_key_encrypted')
  }
  if (await hasProviderColumn(prisma, 'api_key_hint')) {
    await prisma.$executeRaw`ALTER TABLE ai_providers DROP COLUMN api_key_hint`
    dropped.push('api_key_hint')
  }
  return { dropped }
}

const resolveTemplateForProvider = async (prisma, provider) => {
  const byName = await prisma.secretTemplate.findFirst({
    where: { name: provider.name },
  })
  if (byName) {
    return byName
  }

  const fallback = await prisma.secretTemplate.findFirst({
    where: { name: DEFAULT_TEMPLATE_NAME },
  })
  if (!fallback) {
    throw new Error(`未找到密钥模板「${provider.name}」或默认模板「${DEFAULT_TEMPLATE_NAME}」`)
  }
  return fallback
}

const migrateProviderKeysToSecrets = async (prisma) => {
  const legacyColumnExists = await hasLegacyProviderApiKeyColumn(prisma)
  if (!legacyColumnExists) {
    return {
      skipped: true,
      reason: 'legacy_api_key_column_removed',
      migrated: 0,
      skippedProviders: 0,
      totalCandidates: 0,
    }
  }

  const providers = await prisma.$queryRaw`
    SELECT
      id,
      name,
      code,
      base_url AS baseUrl,
      api_key_encrypted AS apiKeyEncrypted
    FROM ai_providers
    WHERE bind_secret_id IS NULL
      AND api_key_encrypted IS NOT NULL
  `

  let migrated = 0
  let skippedProviders = 0

  for (const provider of providers) {
    let plainKey = ''
    try {
      plainKey = decryptProviderApiKey(provider.apiKeyEncrypted)
    } catch (error) {
      skippedProviders += 1
      console.warn(`[legacy-secrets-sync] 厂商 ${provider.name} (${provider.code}) 密钥解密失败:`, error instanceof Error ? error.message : error)
      continue
    }

    if (!plainKey) {
      skippedProviders += 1
      continue
    }

    const template = await resolveTemplateForProvider(prisma, provider)
    const secretName = `${provider.name}-默认`.slice(0, 100)
    const existingSecret = await prisma.secretConfig.findFirst({
      where: { templateId: template.id, name: secretName },
    })

    const fieldValues = [{ name: 'apiKey', value: plainKey }]
    const providerBaseUrl = String(provider.baseUrl || '').trim()
    if (providerBaseUrl && Array.isArray(template.fieldConfig) && template.fieldConfig.some(field => field.name === 'baseUrl')) {
      fieldValues.push({ name: 'baseUrl', value: providerBaseUrl })
    }

    const secret = existingSecret || await prisma.secretConfig.create({
      data: {
        templateId: template.id,
        name: secretName,
        fieldValues: processFieldValues(fieldValues),
        status: true,
      },
    })

    await prisma.aiProvider.update({
      where: { id: provider.id },
      data: { bindSecretId: secret.id },
    })

    migrated += 1
    console.info(`[legacy-secrets-sync] ${provider.name} (${provider.code}) → 模板「${template.name}」密钥 ${secret.id}`)
  }

  const droppedLegacyColumns = await dropLegacyProviderApiKeyColumns(prisma)

  const disabled = await prisma.$executeRaw`
    UPDATE ai_providers
    SET is_enabled = 0
    WHERE bind_secret_id IS NULL
      AND is_enabled = 1
  `.catch(() => 0)

  return {
    skipped: false,
    migrated,
    skippedProviders,
    totalCandidates: providers.length,
    disabledWithoutSecret: typeof disabled === 'number' ? disabled : 'unknown',
    droppedLegacyColumns: droppedLegacyColumns.dropped,
  }
}

const getPlainFieldValue = (field) => {
  if (!field || typeof field !== 'object') {
    return ''
  }

  const rawValue = field.value
  if (rawValue === undefined || rawValue === null || String(rawValue).trim() === '') {
    return ''
  }

  if (field.encrypted) {
    return String(decryptProviderApiKey(String(rawValue)) || '').trim()
  }

  return String(rawValue).trim()
}

const buildNextFieldValues = (templateFieldConfig, currentValues, baseUrl) => {
  const currentMap = new Map(
    (Array.isArray(currentValues) ? currentValues : []).map(item => [item.name, item]),
  )

  return templateFieldConfig.map((field) => {
    const existing = currentMap.get(field.name)

    if (field.name === 'baseUrl') {
      const existingPlain = getPlainFieldValue(existing)
      if (existingPlain) {
        return existing
      }
      if (!baseUrl) {
        return existing ?? { name: 'baseUrl', value: '' }
      }
      return { name: 'baseUrl', value: baseUrl }
    }

    return existing ?? { name: field.name, value: '' }
  })
}

const backfillSecretBaseUrls = async (prisma) => {
  const providers = await prisma.aiProvider.findMany({
    where: {
      bindSecretId: { not: null },
      baseUrl: { not: '' },
    },
    select: {
      id: true,
      code: true,
      name: true,
      baseUrl: true,
      bindSecretId: true,
    },
    orderBy: [{ sortOrder: 'desc' }, { createdAt: 'asc' }],
  })

  const stats = {
    totalProviders: providers.length,
    updated: 0,
    skippedExistingBaseUrl: 0,
    skippedNoSecret: 0,
    skippedNoTemplateField: 0,
    failed: 0,
  }

  const processedSecretIds = new Set()

  for (const provider of providers) {
    const providerBaseUrl = String(provider.baseUrl || '').trim()
    const secretId = String(provider.bindSecretId || '').trim()
    if (!providerBaseUrl || !secretId || processedSecretIds.has(secretId)) {
      continue
    }

    const secret = await prisma.secretConfig.findUnique({
      where: { id: secretId },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            fieldConfig: true,
          },
        },
      },
    })

    if (!secret) {
      stats.skippedNoSecret += 1
      continue
    }

    const fieldConfig = Array.isArray(secret.template?.fieldConfig) ? secret.template.fieldConfig : []
    if (!fieldConfig.some(field => field.name === 'baseUrl')) {
      stats.skippedNoTemplateField += 1
      processedSecretIds.add(secretId)
      continue
    }

    const currentValues = Array.isArray(secret.fieldValues) ? secret.fieldValues : []
    const currentBaseUrl = getPlainFieldValue(currentValues.find(field => field.name === 'baseUrl'))
    if (currentBaseUrl) {
      stats.skippedExistingBaseUrl += 1
      processedSecretIds.add(secretId)
      continue
    }

    const nextFieldValues = buildNextFieldValues(fieldConfig, currentValues, providerBaseUrl)

    try {
      await prisma.secretConfig.update({
        where: { id: secret.id },
        data: { fieldValues: nextFieldValues },
      })
      stats.updated += 1
      processedSecretIds.add(secretId)
    } catch (error) {
      stats.failed += 1
      console.error(`[legacy-secrets-sync] 回填 baseUrl 失败: ${secret.name}`, error)
    }
  }

  return stats
}

export const syncLegacySecrets = async () => {
  const prisma = createPrisma()
  try {
    if (!(await hasSecretTemplateTable(prisma))) {
      return { skipped: true, reason: 'secret_tables_not_ready' }
    }

    const templates = await syncMissingSecretTemplates(prisma)
    const migrateKeys = await migrateProviderKeysToSecrets(prisma)
    const backfillBaseUrl = await backfillSecretBaseUrls(prisma)

    return {
      skipped: false,
      templates,
      migrateKeys,
      backfillBaseUrl,
    }
  } finally {
    await prisma.$disconnect()
  }
}
