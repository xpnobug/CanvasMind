import fs from 'node:fs/promises'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { config as loadEnvFile } from 'dotenv'
import { runStartupLegacySecretsSync } from './lib/run-startup-legacy-secrets-sync.mjs'

// 执行子命令；默认收集输出，必要时再决定是否原样透传。
const runCommand = (command, args, options = {}) => {
  return new Promise((resolve, reject) => {
    const outputChunks = []
    const errorChunks = []

    // 启动子进程。
    const child = spawn(command, args, {
      stdio: ['inherit', 'pipe', 'pipe'],
      shell: process.platform === 'win32',
      env: options.env ?? process.env,
    })

    child.stdout?.on('data', (chunk) => {
      outputChunks.push(chunk)
      if (options.forwardStdout) {
        process.stdout.write(chunk)
      }
    })

    child.stderr?.on('data', (chunk) => {
      errorChunks.push(chunk)
      if (options.forwardStderr) {
        process.stderr.write(chunk)
      }
    })

    // 监听命令执行失败场景。
    child.on('error', reject)

    // 根据退出码判断命令是否成功。
    child.on('close', (code) => {
      const stdout = Buffer.concat(outputChunks).toString('utf8')
      const stderr = Buffer.concat(errorChunks).toString('utf8')

      if (code === 0) {
        resolve({ stdout, stderr })
        return
      }

      reject(new Error(`${command} ${args.join(' ')} 执行失败，退出码: ${code}\n${stderr || stdout}`))
    })
  })
}

// 判断生产环境配置文件是否存在。
const hasProductionEnvFile = async () => {
  try {
    await fs.access(path.resolve(process.cwd(), '.env.production'))
    return true
  } catch {
    return false
  }
}

// 从 Prisma migrate deploy 输出里提取核心信息，避免把整段原始日志直接打出来。
const summarizePrismaMigrateOutput = (rawText) => {
  const normalizedText = String(rawText || '')

  const datasourceMatch = normalizedText.match(/Datasource "db": MySQL database "([^"]+)" at "([^"]+)"/)
  const migrationCountMatch = normalizedText.match(/(\d+)\s+migrations found in prisma\/migrations/i)
  const noPendingMatch = /No pending migrations to apply\./i.test(normalizedText)
  const appliedMatch = normalizedText.match(/Applying migration/i)

  return {
    databaseName: datasourceMatch?.[1] || '',
    databaseAddress: datasourceMatch?.[2] || '',
    migrationCount: migrationCountMatch?.[1] || '',
    statusText: noPendingMatch
      ? '没有待执行迁移'
      : appliedMatch
        ? '已执行迁移'
        : '迁移检查已完成',
  }
}

const resolveRedisStatusText = () => {
  const enabled = ['1', 'true', 'yes', 'on'].includes(String(process.env.REDIS_ENABLED || '').trim().toLowerCase())
  if (!enabled) {
    return '未启用'
  }

  const host = String(process.env.REDIS_HOST || '').trim() || '127.0.0.1'
  const port = String(process.env.REDIS_PORT || '').trim() || '6379'
  const database = String(process.env.REDIS_DATABASE || '').trim() || '0'
  return `已启用 (${host}:${port}/${database})`
}

// 启动生产环境应用。
const start = async () => {
  const hasEnvFile = await hasProductionEnvFile()
  console.info('[start-production] 启动准备中')
  console.info(`[start-production] 环境文件: ${hasEnvFile ? '.env.production' : '未检测到 .env.production，使用当前进程环境变量'}`)

  if (hasEnvFile) {
    loadEnvFile({ path: path.resolve(process.cwd(), '.env.production') })
    process.env.ENV_FILE = '.env.production'
  }

  // 先执行数据库迁移，创建 secret 相关表；删旧密钥列由后续同步负责。
  console.info('[start-production] 正在检查数据库迁移')
  const migrateResult = await runCommand('npx', ['prisma', 'migrate', 'deploy'])
  const migrationSummary = summarizePrismaMigrateOutput(`${migrateResult.stdout}\n${migrateResult.stderr}`)
  console.info(
    `[start-production] 数据库迁移检查完成: ${migrationSummary.databaseName || 'unknown'} @ ${migrationSummary.databaseAddress || 'unknown'} · `
    + `${migrationSummary.migrationCount || '0'} 个迁移 · ${migrationSummary.statusText}`,
  )

  // 迁移建表后，再把旧 api_key 写入 secret_configs，最后删除 legacy 列。
  try {
    await runStartupLegacySecretsSync()
  } catch (error) {
    console.error('[start-production] 旧版厂商密钥同步失败，将继续启动', error)
  }

  // 根据运行环境决定是否显式加载 .env.production。
  const serverArgs = hasEnvFile
    ? ['--env-file=.env.production', 'dist-service/server/index.js']
    : ['dist-service/server/index.js']

  console.info(`[start-production] Redis: ${resolveRedisStatusText()}`)
  console.info('[start-production] 正在启动后端服务')

  // 再启动正式后端服务，由后端统一承载 API 与静态前端。
  await runCommand('node', serverArgs, {
    forwardStdout: true,
    forwardStderr: true,
  })
}

// 执行启动流程，并在失败时返回非零退出码。
start().catch((error) => {
  // 输出启动失败原因，便于排查部署问题。
  console.error('[start-production] 启动失败', error)
  process.exit(1)
})
