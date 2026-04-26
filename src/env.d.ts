/// <reference types="vite/client" />

// Vue 模块声明
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// 环境变量类型定义
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_PROVIDER_DEFAULT_BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
