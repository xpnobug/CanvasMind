<script setup lang="ts">
/**
 * 画布小地图（包装 @vue-flow/minimap）
 *
 * 加位置、开关、节点颜色映射（按 type 取 lv-theme brand 色）。
 * 默认位置：bottom-24 left-6，240×160。
 */
import { MiniMap } from '@vue-flow/minimap'
import type { Node } from '@vue-flow/core'

defineProps<{
  visible: boolean
}>()

/** 根据节点类型映射小色块颜色（与设计文档对照） */
const nodeColor = (node: Node) => {
  const cs = getComputedStyle(document.body)
  const fallback = cs.getPropertyValue('--stroke-primary').trim() || '#888'
  switch (node.type) {
    case 'image':
      return cs.getPropertyValue('--brand-image').trim() || '#39acff'
    case 'video':
      return cs.getPropertyValue('--brand-video').trim() || '#6b68ff'
    case 'imageConfig':
    case 'videoConfig':
    case 'llmConfig':
      return cs.getPropertyValue('--brand-main-default').trim() || '#00cae0'
    default:
      return fallback
  }
}
</script>

<template>
  <Transition name="canvas-minimap">
    <div v-if="visible" class="canvas-minimap-wrapper" data-canvas-no-zoom @click.stop>
      <MiniMap
        position="bottom-left"
        :pannable="true"
        :zoomable="true"
        :node-color="nodeColor"
        :node-stroke-width="2"
        :mask-color="'rgba(0, 0, 0, 0.18)'"
      />
    </div>
  </Transition>
</template>

<style scoped>
.canvas-minimap-wrapper {
  position: absolute;
  left: 24px;
  bottom: 96px;
  width: 240px;
  height: 160px;
  z-index: 49;
/*  background: var(--canvas-float-block-default);*/
 /* border: 0.5px solid var(--stroke-secondary);*/
  border-radius: var(--lv-border-radius-large);
  overflow: hidden;
  pointer-events: auto;
}

/** Vue Flow MiniMap 内部根容器适配玻璃风 */
.canvas-minimap-wrapper :deep(.vue-flow__minimap) {
  position: absolute;
  inset: 0;
  margin: 0;
  background: transparent;
  border: 0;
  border-radius: 0;
  box-shadow: none;
}

.canvas-minimap-enter-active,
.canvas-minimap-leave-active {
  transition: opacity 0.16s, transform 0.16s;
}
.canvas-minimap-enter-from,
.canvas-minimap-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.96);
}
</style>
