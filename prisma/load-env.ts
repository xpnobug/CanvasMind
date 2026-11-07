import { config } from 'dotenv'
import { existsSync } from 'node:fs'
import path from 'node:path'

/**
 * Prisma CLI 默认不读 `.env.development`。
 * 加载顺序（命中第一个即停）：
 * 1. 显式 ENV_FILE
 * 2. NODE_ENV=production → .env.production
 * 3. 本地默认 .env.development，其次 .env
 */
export const loadPrismaEnv = () => {
  const cwd = process.cwd()
  const explicitFile = String(process.env.ENV_FILE || '').trim()
  const candidates = explicitFile
    ? [explicitFile]
    : process.env.NODE_ENV === 'production'
      ? ['.env.production', '.env.development', '.env']
      : ['.env.development', '.env', '.env.production']

  for (const file of candidates) {
    const envPath = path.resolve(cwd, file)
    if (existsSync(envPath)) {
      config({ path: envPath })
      return file
    }
  }

  return null
}
