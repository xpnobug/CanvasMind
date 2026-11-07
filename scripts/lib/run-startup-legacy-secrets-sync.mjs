import { syncLegacySecrets } from './legacy-secrets-sync.mjs'
import { printLegacySecretsSyncSummary } from './legacy-secrets-sync-summary.mjs'

/**
 * 在 prisma migrate deploy 之后执行：建表 → 迁密钥 → 删 legacy 列。
 */
export const runStartupLegacySecretsSync = async () => {
  if (!String(process.env.DATABASE_URL || '').trim()) {
    printLegacySecretsSyncSummary({ skipped: true, reason: 'database_not_configured' })
    return { skipped: true, reason: 'database_not_configured' }
  }

  console.info('[start-production] 正在同步密钥模板与厂商旧密钥…')
  const result = await syncLegacySecrets()
  printLegacySecretsSyncSummary(result)
  return result
}
