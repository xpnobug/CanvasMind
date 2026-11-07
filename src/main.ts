import { createApp } from 'vue'
// 注：Cutia 编辑器主题（@theme inline / @custom-variant / @utility）通过
// styles.css 内部的 @import 引入，让 Tailwind v4 编译其 at-rules；
// 不可在此处用 JS import 加载，会绕过 Tailwind 管线导致样式失效。
import '@styles/styles.css'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'
import { useSystemInitStore } from './stores/system-init'
import { useSystemSettingsStore } from './stores/system-settings'

const app = createApp(App)

// Element Plus 组件通过 unplugin-vue-components 自动按需注册（含样式），
// 全局配置（locale / size / zIndex）由 App.vue 中的 ElConfigProvider 统一提供
app.use(router)

app.mount('#app')

// 应用挂载后再异步加载会话/系统配置，避免阻塞首屏渲染
const authStore = useAuthStore()
const systemInitStore = useSystemInitStore()
const systemSettingsStore = useSystemSettingsStore()

void Promise.allSettled([
  systemInitStore.loadStatus(),
  authStore.loadSession(),
  authStore.loadMethods(),
  systemSettingsStore.loadPublicSettings(),
])
