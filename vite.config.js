import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],

  // 开发服务器配置
  server: {
    port: 5010,           // 开发服务器端口
    host: '0.0.0.0',      // 允许外部访问
    open: true,           // 启动时自动打开浏览器

    // 跨域代理配置
    proxy: {
      // 代理 /api 请求到后端服务器
      '/api': {
        target: 'http://localhost:8080',  // 后端服务器地址
        changeOrigin: true,               // 修改请求头中的 Origin
        rewrite: (path) => path.replace(/^\/api/, ''), // 重写路径
        secure: false,                    // 如果是 https，需要配置证书
        ws: true,                         // 支持 WebSocket
      },

      // 示例：代理即梦AI的API（如果需要）
      '/jimeng-api': {
        target: 'https://api.jimeng.jianying.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/jimeng-api/, ''),
        secure: true,
      },
    },

    // CORS 配置
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
