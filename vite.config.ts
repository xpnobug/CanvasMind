import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import fs from 'node:fs/promises'

const MOCK_AGENT_HTTP_RAW_PATH = path.resolve(__dirname, 'src/views/generate/mocks/http_raw.txt')

const createMockAgentRawPlugin = () => ({
  name: 'mock-agent-http-raw',
  configureServer(server: any) {
    const register = (targetServer: any) => {
      targetServer.middlewares.use(async (req: any, res: any, next: any) => {
        if (req.url !== '/__mock_agent_http_raw') {
          next()
          return
        }

        try {
          const content = await fs.readFile(MOCK_AGENT_HTTP_RAW_PATH, 'utf8')
          res.statusCode = 200
          res.setHeader('Content-Type', 'text/plain; charset=utf-8')
          res.end(content)
        } catch (error: any) {
          res.statusCode = 404
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify({
            message: error?.message || '读取 http_raw.txt 失败',
          }))
        }
      })
    }

    register(server)
  },
  configurePreviewServer(server: any) {
    server.middlewares.use(async (req: any, res: any, next: any) => {
      if (req.url !== '/__mock_agent_http_raw') {
        next()
        return
      }

      try {
        const content = await fs.readFile(MOCK_AGENT_HTTP_RAW_PATH, 'utf8')
        res.statusCode = 200
        res.setHeader('Content-Type', 'text/plain; charset=utf-8')
        res.end(content)
      } catch (error: any) {
        res.statusCode = 404
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.end(JSON.stringify({
          message: error?.message || '读取 http_raw.txt 失败',
        }))
      }
    })
  },
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    // 仅保留前端本地调试所需的 mock 文件服务。
    createMockAgentRawPlugin(),
  ],

  // 开发服务器配置
  server: {
    port: 5010,           // 开发服务器端口
    host: '0.0.0.0',      // 允许外部访问
    open: true,           // 启动时自动打开浏览器

    // 保留示例代理，便于接第三方接口调试。
    proxy: {
      '/jimeng-api': {
        target: 'https://api.jimeng.jianying.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/jimeng-api/, ''),
        secure: true,
      },
    },

    // 允许开发时跨域调试。
    cors: true,
  },

  // 预览服务器配置（用于预览生产构建）
  preview: {
    port: 4173,
    host: '0.0.0.0',
  },

  // 路径别名配置
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@assets': path.resolve(__dirname, 'src/assets'),
      '@styles': path.resolve(__dirname, 'src/styles'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@api': path.resolve(__dirname, 'src/api'),
      '@types': path.resolve(__dirname, 'src/types'),
    },
  },

  // 构建配置
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,  // 生产环境不生成 sourcemap

    // 代码分割
    rollupOptions: {
      output: {
        manualChunks: {
          'vue': ['vue'],
        },
      },
    },

    // 压缩配置
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,  // 移除 console
        drop_debugger: true, // 移除 debugger
      },
    },

    // 块大小警告限制（KB）
    chunkSizeWarningLimit: 1000,
  },
})
