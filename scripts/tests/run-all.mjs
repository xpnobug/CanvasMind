#!/usr/bin/env node
/**
 * 批量运行 scripts/tests 下的单元测试脚本（不含需 Cookie 的集成测试）
 *
 * 用法：npm run test:scripts
 * 单个：npx tsx scripts/tests/test-edit-prompt.mjs
 */

import { readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '../..')

/** 需外部服务 / Cookie，不纳入批量运行 */
const SKIP_FILES = new Set([
  'test-research-task.mjs',
])

const runScript = (filePath) => new Promise((resolve, reject) => {
  const child = spawn('npx', ['tsx', filePath], {
    cwd: rootDir,
    stdio: 'inherit',
    env: {
      ...process.env,
    },
    shell: process.platform === 'win32',
  })

  child.on('error', reject)
  child.on('close', (code) => {
    if (code === 0) {
      resolve()
      return
    }
    reject(new Error(`${path.basename(filePath)} 退出码 ${code}`))
  })
})

const main = async () => {
  const files = (await readdir(__dirname))
    .filter((name) => name.startsWith('test-') && name.endsWith('.mjs'))
    .filter((name) => !SKIP_FILES.has(name))
    .sort()

  if (files.length === 0) {
    console.log('[test:scripts] 未找到可运行的测试脚本')
    return
  }

  console.log(`[test:scripts] 运行 ${files.length} 个脚本…`)

  for (const file of files) {
    console.log(`\n>>> ${file}`)
    await runScript(path.join(__dirname, file))
  }

  console.log('\n[test:scripts] 全部通过')
}

main().catch((error) => {
  console.error('\n[test:scripts] 失败:', error.message)
  process.exit(1)
})
