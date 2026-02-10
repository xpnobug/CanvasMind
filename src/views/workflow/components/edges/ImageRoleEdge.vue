<script setup>
/**
 * 图片角色边 - 首帧/尾帧/参考图选择
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

const roleOptions = [
  { label: '首帧', key: 'first_frame_image' },
  { label: '尾帧', key: 'last_frame_image' },
  { label: '参考图', key: 'input_reference' }
]

const currentRole = computed(() => props.data?.imageRole || 'first_frame_image')
const currentRoleLabel = computed(() => roleOptions.find(o => o.key === currentRole.value)?.label || '首帧')

const path = computed(() => {
  const [p] = getBezierPath({ sourceX: props.sourceX, sourceY: props.sourceY, targetX: props.targetX, targetY: props.targetY, sourcePosition: props.sourcePosition, targetPosition: props.targetPosition })
  return p
})

const labelX = computed(() => (props.sourceX + props.targetX) / 2)
const labelY = computed(() => (props.sourceY + props.targetY) / 2)
const edgeStyle = computed(() => ({ stroke: '#6366f1', strokeWidth: 2, ...props.style }))

const handleSelect = (role) => {
  if (role === 'first_frame_image' || role === 'last_frame_image') {
    edges.value
      .filter(e => e.target === props.target && e.id !== props.id && e.data?.imageRole === role)
      .forEach(e => {
        updateEdgeData(e.id, { imageRole: role === 'first_frame_image' ? 'last_frame_image' : 'first_frame_image' })
      })
  }
  updateEdgeData(props.id, { imageRole: role })
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
        style="padding: 3px 10px; border-radius: 12px; background: var(--canvas-float-block-default, rgba(32,33,39,0.92)); backdrop-filter: blur(20px); border: 0.5px solid var(--stroke-tertiary); color: var(--text-primary); font-size: 11px; cursor: pointer; display: flex; align-items: center; gap: 4px; transition: transform 0.15s;"
        @mouseenter="$el.style.transform='scale(1.05)'" @mouseleave="$el.style.transform='scale(1)'"
      >
        {{ currentRoleLabel }}
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <div v-if="showMenu" style="position: absolute; top: 28px; left: 50%; transform: translateX(-50%); background: var(--canvas-float-block-default, rgba(32,33,39,0.92)); backdrop-filter: blur(20px); border: 0.5px solid var(--stroke-tertiary); border-radius: 8px; padding: 4px; z-index: 100; min-width: 80px;">
        <div
          v-for="opt in roleOptions" :key="opt.key"
          @click="handleSelect(opt.key)"
          style="padding: 6px 10px; font-size: 12px; color: var(--text-primary); border-radius: 6px; cursor: pointer; white-space: nowrap;"
          @mouseenter="$el.style.background='var(--bg-block-primary-hover)'" @mouseleave="$el.style.background='transparent'"
        >{{ opt.label }}</div>
      </div>
    </div>
  </EdgeLabelRenderer>
</template>
