<template>
  <div class="home-header-Z8R5qZ">
    <div class="header-bto0dS">
      开启你的
      <TypeSelector />
      即刻造梦！
    </div>
    <!-- 首页配置：不可折叠、默认展开、弹窗强制向下弹出 -->
    <GenerateContentGenerator
      class="home-header-content-generator-RI50Ki"
      :collapsible="false"
      :default-expanded="true"
      popup-placement="bottom"
      @send="handleSend"
    />
    <TaskIndicator />
    <HomeBanner />
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import TypeSelector from './TypeSelector.vue'
import GenerateContentGenerator from '@/components/generate/ContentGenerator.vue'
import TaskIndicator from './TaskIndicator.vue'
import HomeBanner from './HomeBanner.vue'

const router = useRouter()

const handleSend = (message, type, options) => {
  router.push({
    path: '/generate',
    query: {
      message,
      type,
      ...(options?.model && { model: options.model }),
      ...(options?.ratio && { ratio: options.ratio }),
      ...(options?.resolution && { resolution: options.resolution })
    }
  })
}
</script>
