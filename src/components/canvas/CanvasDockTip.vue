<script setup lang="ts">
/**
 * 画布 Dock 工具栏上方的小提示（DockTip）
 *
 * infinite-canvas 的 DockTip 跟随当前 hover 的工具栏按钮中心横向定位，
 * 显示在工具栏上方，颜色与工具栏对调（背景=文字主色，文字=胶囊背景色）。
 */
import { computed } from 'vue'

const props = defineProps<{
  label: string
  /** 按钮中心相对工具栏父容器左侧的 X 像素 */
  x: number
  visible?: boolean
}>()

const visibleResolved = computed(() => props.visible !== false && !!props.label)
const style = computed(() => ({
  left: `${props.x}px`,
}))
</script>

<template>
  <Transition name="canvas-dock-tip">
    <div v-if="visibleResolved" class="canvas-dock-tip" :style="style" role="tooltip">
      {{ label }}
    </div>
  </Transition>
</template>

<style scoped>
.canvas-dock-tip {
  position: absolute;
  bottom: calc(100% + 8px);
  transform: translateX(-50%);
  padding: 4px 10px;
  background: var(--text-primary);
  color: var(--canvas-float-block-default);
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  border-radius: var(--lv-border-radius-medium);
  pointer-events: none;
  user-select: none;
  z-index: 60;
}

.canvas-dock-tip-enter-active,
.canvas-dock-tip-leave-active {
  transition: opacity 0.12s ease-out, transform 0.12s ease-out;
}
.canvas-dock-tip-enter-from,
.canvas-dock-tip-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(4px);
}
</style>
