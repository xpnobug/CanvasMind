import 'dotenv/config'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import prismaClientPackage from '@prisma/client'
import type { PrismaClient as PrismaClientInstance } from '@prisma/client'

const { PrismaClient } = prismaClientPackage

declare global {
  // eslint-disable-next-line no-var
  var __cananaPrisma__: PrismaClientInstance | undefined
}

/**
 * PrismaClient 单例。
 * 开发模式下复用实例，避免 Vite / Node 热更新反复创建连接。
 */
const createPrismaClient = () => {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    throw new Error('缺少 DATABASE_URL，无法初始化 PrismaClient。')
  }

  const adapter = new PrismaMariaDb(databaseUrl)

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })
}

export const isPrismaConfigured = () => Boolean(process.env.DATABASE_URL)

export const getPrismaClient = () => {
  if (globalThis.__cananaPrisma__) {
    return globalThis.__cananaPrisma__
  }

  const prisma = createPrismaClient()

  globalThis.__cananaPrisma__ = prisma

  return prisma
}

export const prisma = new Proxy({} as PrismaClientInstance, {
  get(_target, prop, receiver) {
    const client = getPrismaClient()
    return Reflect.get(client, prop, receiver)
  },
})

export default prisma
