import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { visualizer } from 'rollup-plugin-visualizer'
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
export default defineConfig(({ mode }) => {
  // 与 canana-vue 一致：开发态 /uploads 同源代理到后端，避免跨域只能打开链接。
  const env = loadEnv(mode, process.cwd(), '')
  const apiProxyTarget = String(env.VITE_API_BASE_URL || 'http://localhost:5409').replace(/\/+$/, '')

  return {
  plugins: [
    // Vue 插件仅处理 .vue 文件，避免与 React JSX 互扰
    vue({ include: [/\.vue$/] }),
    // React 插件仅处理 .jsx/.tsx，承载 Cutia React UI（src-cutia/ 目录）
    react({ include: /\.(jsx|tsx)$/ }),
    tailwindcss(),
    // Element Plus 按需引入：自动注入命名导入（ElMessage/ElMessageBox 等）的样式
    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    // Element Plus 按需引入：自动注册模板中 <el-xxx> 组件
    Components({
      resolvers: [ElementPlusResolver()],
    }),
    // 仅保留前端本地调试所需的 mock 文件服务。
    createMockAgentRawPlugin(),
    // 构建产物体积可视化分析：每次 build 后生成 dist/stats.html，
    // 通过 ANALYZE=1 时自动打开浏览器，便于排查重复/超大依赖。
    visualizer({
      filename: 'dist/stats.html',
      gzipSize: true,
      brotliSize: true,
      open: process.env.ANALYZE === '1',
      template: 'treemap',
    }),
  ],

  // 开发服务器配置
  server: {
    port: 5010,           // 开发服务器端口
    host: '0.0.0.0',      // 允许外部访问
    open: true,           // 启动时自动打开浏览器

    // 开发环境：/uploads 走 API 同源代理；/api 不走代理（前端用 VITE_API_BASE_URL 直连后端）。
    proxy: {
      '/uploads': {
        target: apiProxyTarget,
        changeOrigin: true,
      },
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
      // Cutia React 代码根别名（详见 docs/cutia-集成-目录结构设计.md）
      '@cutia': path.resolve(__dirname, 'src-cutia'),
      // Shim：拦截 Cutia 源码对 next.js 版 i18n 工具包的引用，指向本地 stub
      // 详见 src-cutia/shims/i18next-toolkit/index.ts
      '@i18next-toolkit/nextjs-approuter': path.resolve(__dirname, 'src-cutia/shims/i18next-toolkit/index.ts'),
    },
  },

  // 构建配置
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,  // 生产环境不生成 sourcemap

    // 启用 CSS 代码分割，按异步 chunk 拆分样式
    cssCodeSplit: true,

    // 小于 4KB 的资源内联为 base64，避免过多 HTTP 请求
    assetsInlineLimit: 4096,

    // 代码分割：按厂商库与业务模块隔离，提升缓存命中率
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return
          }
          // React 相关依赖统一进 vendor，避免 vendor/react-vendor 循环引用告警
          // Vue Flow 仅工作流页用到，单独成 chunk
          if (id.includes('@vue-flow')) {
            return 'vue-flow'
          }
          // Element Plus 图标
          if (id.includes('@element-plus/icons-vue')) {
            return 'el-icons'
          }
          // Element Plus 主体
          if (id.includes('element-plus')) {
            return 'element-plus'
          }
          // Vue Router 单独
          if (id.includes('vue-router')) {
            return 'vue-router'
          }
          // Vue 核心
          if (/[\\/]node_modules[\\/]@?vue[\\/]/.test(id) && !id.includes('vue-flow')) {
            return 'vue'
          }
          // 其余第三方依赖统一进 vendor
          return 'vendor'
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
    chunkSizeWarningLimit: 500,
  },
  }
})
