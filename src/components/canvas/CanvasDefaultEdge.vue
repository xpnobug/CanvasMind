<script setup lang="ts">
/**
 * Vue Flow 默认连线（hover 时中央显示删除按钮）
 *
 * - 贝塞尔路径，hover 时 stroke-width 2 → 3 + drop-shadow
 * - 中点放 EdgeDeleteButton（复用 3 类语义边的删除组件）
 * - 注册到 workflow/index.vue 的 edgeTypes.default
 */
import { computed, ref } from 'vue'
import { BaseEdge, EdgeLabelRenderer, getBezierPath, useVueFlow, type Position } from '@vue-flow/core'
import EdgeDeleteButton from '@/views/workflow/components/EdgeDeleteButton.vue'

const props = defineProps<{
  id: string
  sourceX: number
  sourceY: number
  targetX: number
  targetY: number
  sourcePosition: Position
  targetPosition: Position
  selected?: boolean
  style?: Record<string, unknown>
}>()

const { onEdgeMouseEnter, onEdgeMouseLeave } = useVueFlow()
const isHover = ref(false)

onEdgeMouseEnter(({ edge }) => {
  if (edge.id === props.id) isHover.value = true
})
onEdgeMouseLeave(({ edge }) => {
  if (edge.id === props.id) isHover.value = false
})

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

const labelX = computed(() => (props.sourceX + props.targetX) / 2)
const labelY = computed(() => (props.sourceY + props.targetY) / 2)

const edgeStyle = computed(() => ({
  stroke: '#9da2a8',
  strokeWidth: isHover.value || props.selected ? 3 : 2,
  filter: isHover.value || props.selected ? 'drop-shadow(0 0 6px rgba(157, 162, 168, 0.55))' : 'none',
  transition: 'stroke-width 0.18s cubic-bezier(0.4, 0, 0.2, 1), filter 0.18s ease-out',
  ...props.style,
}))
</script>

<template>
  <BaseEdge :path="path" :style="edgeStyle" />
  <EdgeLabelRenderer>
    <div
      :style="{
        position: 'absolute',
        transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
        pointerEvents: 'all',
      }"
      class="nodrag nopan canvas-default-edge-label"
      @mouseenter="isHover = true"
      @mouseleave="isHover = false"
    >
      <EdgeDeleteButton :edge-id="id" :visible="isHover || selected" />
    </div>
  </EdgeLabelRenderer>
</template>

<style scoped>
.canvas-default-edge-label {
  width: 22px;
  height: 22px;
}
</style>
