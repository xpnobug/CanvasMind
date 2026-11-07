import { loadPrismaEnv } from './prisma/load-env'
import { defineConfig, env } from 'prisma/config'

loadPrismaEnv()

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
})
