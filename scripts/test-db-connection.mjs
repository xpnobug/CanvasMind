#!/usr/bin/env node
/**
 * 测试 MySQL 连接（读取指定 env 文件中的 DATABASE_URL）
 *
 * 用法：
 *   node scripts/test-db-connection.mjs .env.development
 *   node scripts/test-db-connection.mjs .env.production
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const envFile = process.argv[2] || '.env.development'
const envPath = path.resolve(process.cwd(), envFile)

const loadEnvFile = async (filePath) => {
  const content = await fs.readFile(filePath, 'utf8')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIndex = trimmed.indexOf('=')
    if (eqIndex <= 0) continue
    const key = trimmed.slice(0, eqIndex).trim()
    let value = trimmed.slice(eqIndex + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    process.env[key] = value
  }
}

const maskDatabaseUrl = (url) => String(url || '').replace(/:([^:@/]+)@/, ':***@')

const main = async () => {
  try {
    await fs.access(envPath)
  } catch {
    console.error(`[db:test] 找不到环境文件: ${envPath}`)
    process.exit(1)
  }

  await loadEnvFile(envPath)

  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    console.error(`[db:test] ${envFile} 中未配置 DATABASE_URL`)
    process.exit(1)
  }

  console.log(`[db:test] 环境文件: ${envFile}`)
  console.log(`[db:test] DATABASE_URL: ${maskDatabaseUrl(databaseUrl)}`)

  const { PrismaMariaDb } = await import('@prisma/adapter-mariadb')
  const { PrismaClient } = await import('@prisma/client')

  const adapter = new PrismaMariaDb(databaseUrl)
  const prisma = new PrismaClient({ adapter })

  try {
    const info = await prisma.$queryRaw`SELECT DATABASE() AS db, VERSION() AS version`
    const migrations = await prisma.$queryRaw`SELECT COUNT(*) AS cnt FROM _prisma_migrations`
    console.log('[db:test] 连接成功')
    console.log('[db:test] 数据库信息:', info)
    console.log('[db:test] 已应用迁移数:', migrations)
  } catch (error) {
    console.error('[db:test] 连接失败:', error.message)
    const cause = error?.meta?.driverAdapterError?.cause
    if (cause) {
      console.error('[db:test] 详细原因:', typeof cause === 'object' ? JSON.stringify(cause, null, 2) : cause)
    }
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error('[db:test] 执行异常:', error)
  process.exit(1)
})
