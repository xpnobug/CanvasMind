import { spawn } from 'node:child_process'

// 以继承标准输入输出的方式运行命令。
const runCommand = (command, args) => {
  return new Promise((resolve, reject) => {
    // 启动子进程并透传日志到当前终端。
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: process.platform === 'win32',
      env: process.env,
    })

    // 监听命令执行失败场景。
    child.on('error', reject)

    // 根据退出码判断命令是否成功。
    child.on('close', (code) => {
      if (code === 0) {
        resolve()
        return
      }

      reject(new Error(`${command} ${args.join(' ')} 执行失败，退出码: ${code}`))
    })
  })
}

// 启动生产环境应用。
const start = async () => {
  // 先执行数据库迁移，确保表结构已就绪。
  await runCommand('npx', ['prisma', 'migrate', 'deploy'])

  // 再启动正式后端服务，由后端统一承载 API 与静态前端。
  await runCommand('npm', ['run', 'start:server'])
}

// 执行启动流程，并在失败时返回非零退出码。
start().catch((error) => {
  // 输出启动失败原因，便于排查部署问题。
  console.error('[start-production] 启动失败', error)
  process.exit(1)
})
