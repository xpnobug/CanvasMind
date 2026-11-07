<script setup lang="ts">
/**
 * Vue Flow 临时连线组件（拖出连线时的虚线预览）
 *
 * 视觉对齐 infinite-canvas/canvas-connections.tsx 的 ActiveConnectionPath：
 * 贝塞尔 + dasharray 虚线 + brand 色描边。
 *
 * 在 workflow/index.vue 中通过 `:connection-line-component="CanvasConnectionLine"` 注入。
 */
import { computed } from 'vue'
import { getBezierPath, type Position } from '@vue-flow/core'

const props = defineProps<{
  sourceX: number
  sourceY: number
  targetX: number
  targetY: number
  sourcePosition: Position
  targetPosition: Position
}>()

const path = computed(() => {
  const [p] = getBezierPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    targetX: props.targetX,
    targetY: props.targetY,
    sourcePosition: props.sourcePosition,
    targetPosition: props.targetPosition,
  })
  return p
})

const strokeColor = computed(() => {
  if (typeof window === 'undefined') return '#00cae0'
  const value = getComputedStyle(document.body).getPropertyValue('--brand-main-default').trim()
  return value || '#00cae0'
})
</script>

<template>
  <path
    :d="path"
    fill="none"
    :stroke="strokeColor"
    stroke-width="2"
    stroke-dasharray="5 5"
    stroke-linecap="round"
    style="pointer-events: none"
  />
</template>
