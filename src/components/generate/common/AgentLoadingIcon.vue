<template>
  <!-- Agent 加载帧动画：39 张 PNG 逐帧切换 -->
  <div class="agent-loading-icon" :style="{ width: size + 'px', height: size + 'px' }">
    <img :src="frames[currentFrame]" :width="size" :height="size" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

// 导入所有帧图片
const frameModules = import.meta.glob('@/assets/image/dreamina_*.png', { eager: true, import: 'default' }) as Record<string, string>

// 按文件名排序
const frames = Object.keys(frameModules)
  .sort()
  .map(key => frameModules[key])

const props = withDefaults(defineProps<{
  size?: number
  /** 帧间隔（毫秒） */
  interval?: number
}>(), {
  size: 22,
  interval: 30
})

const currentFrame = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  timer = setInterval(() => {
    currentFrame.value = (currentFrame.value + 1) % frames.length
  }, props.interval)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.agent-loading-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.agent-loading-icon img {
  display: block;
}
</style>
