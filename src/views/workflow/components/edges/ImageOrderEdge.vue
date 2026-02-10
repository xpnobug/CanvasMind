<script setup>
/**
 * 图片顺序边 - 显示序号标签，点击可切换顺序
 */
import { ref, computed } from 'vue'
import { BaseEdge, EdgeLabelRenderer, getBezierPath, useVueFlow } from '@vue-flow/core'
import { edges } from '../../composables/useWorkflowCanvas'

const { updateEdgeData } = useVueFlow()

const props = defineProps({
  id: String, source: String, target: String,
  sourceX: Number, sourceY: Number, targetX: Number, targetY: Number,
  sourcePosition: String, targetPosition: String,
  data: Object, markerEnd: String, style: Object
})

const showMenu = ref(false)

const orderLabels = [
  { label: '① 第一张', key: 1 },
  { label: '② 第二张', key: 2 },
  { label: '③ 第三张', key: 3 },
  { label: '④ 第四张', key: 4 },
  { label: '⑤ 第五张', key: 5 }
]

const orderOptions = computed(() => {
  const count = edges.value.filter(e => e.target === props.target && e.type === 'imageOrder').length || 1
  return orderLabels.slice(0, count)
})

const currentOrder = computed(() => props.data?.imageOrder || 1)

const path = computed(() => {
  const [p] = getBezierPath({ sourceX: props.sourceX, sourceY: props.sourceY, targetX: props.targetX, targetY: props.targetY, sourcePosition: props.sourcePosition, targetPosition: props.targetPosition })
  return p
})

const labelX = computed(() => (props.sourceX + props.targetX) / 2)
const labelY = computed(() => (props.sourceY + props.targetY) / 2)
const edgeStyle = computed(() => ({ stroke: '#3b82f6', strokeWidth: 2, ...props.style }))

const handleSelect = (newOrder) => {
  const sameEdges = edges.value.filter(e => e.target === props.target && e.type === 'imageOrder')
  const conflict = sameEdges.find(e => e.id !== props.id && e.data?.imageOrder === newOrder)
  if (conflict) updateEdgeData(conflict.id, { imageOrder: currentOrder.value })
  updateEdgeData(props.id, { imageOrder: newOrder })
  showMenu.value = false
}
</script>

<template>
  <BaseEdge :path="path" :style="edgeStyle" />
  <EdgeLabelRenderer>
    <div
      :style="{ position: 'absolute', transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`, pointerEvents: 'all' }"
      class="nodrag nopan"
    >
      <button
        @click="showMenu = !showMenu"
        style="width: 24px; height: 24px; border-radius: 50%; background: #3b82f6; color: white; border: 2px solid var(--canvas-bg, #0f0f12); font-size: 11px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: transform 0.15s;"
        @mouseenter="$el.style.transform='scale(1.15)'" @mouseleave="$el.style.transform='scale(1)'"
      >{{ currentOrder }}</button>
      <div v-if="showMenu" style="position: absolute; top: 28px; left: 50%; transform: translateX(-50%); background: var(--canvas-float-block-default, rgba(32,33,39,0.92)); backdrop-filter: blur(20px); border: 0.5px solid var(--stroke-tertiary); border-radius: 8px; padding: 4px; z-index: 100; min-width: 100px;">
        <div
          v-for="opt in orderOptions" :key="opt.key"
          @click="handleSelect(opt.key)"
          style="padding: 6px 10px; font-size: 12px; color: var(--text-primary); border-radius: 6px; cursor: pointer; white-space: nowrap;"
          @mouseenter="$el.style.background='var(--bg-block-primary-hover)'" @mouseleave="$el.style.background='transparent'"
        >{{ opt.label }}</div>
      </div>
    </div>
  </EdgeLabelRenderer>
</template>
