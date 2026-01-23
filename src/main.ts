import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import '@styles/styles.css'
import App from './App.vue'
// @ts-ignore - router will be migrated to TypeScript in task 4.1
import router from './router'

const app = createApp(App)

// 全局注册 Element Plus
app.use(ElementPlus, {
  locale: zhCn,  // 中文语言包
  size: 'default' // 默认尺寸
})

app.use(router)
app.mount('#app')
