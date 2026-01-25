<template>
  <div class="home-header-Z8R5qZ">
    <div class="header-bto0dS">
      开启你的
      <TypeSelector />
      即刻造梦！
    </div>
    <!-- 首页配置：不可折叠、默认展开、弹窗方向自动判断 -->
    <GenerateContentGenerator
      class="home-header-content-generator-RI50Ki"
      :collapsible="false"
      :default-expanded="true"
    />
    <TaskIndicator />
    <HomeBanner />
  </div>
</template>

<script setup>
import TypeSelector from './TypeSelector.vue'
import GenerateContentGenerator from '@/components/generate/ContentGenerator.vue'
import TaskIndicator from './TaskIndicator.vue'
import HomeBanner from './HomeBanner.vue'
</script>
