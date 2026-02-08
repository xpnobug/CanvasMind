<script setup>
/**
 * 文本节点组件
 */
import { ref, watch } from 'vue'
import { Handle, Position, useVueFlow } from '@vue-flow/core'
import { updateNode, removeNode, duplicateNode, addNode, addEdge, nodes } from '../../composables/useWorkflowCanvas'

const props = defineProps({ id: String, data: Object })
const { updateNodeInternals } = useVueFlow()

const content = ref(props.data?.content || '')
const showActions = ref(false)

watch(() => props.data?.content, (v) => { if (v !== undefined) content.value = v })

const handleInput = () => {
  updateNode(props.id, { content: content.value })
}

const handleDelete = () => removeNode(props.id)

const handleDuplicate = () => {
  const newId = duplicateNode(props.id)
  if (newId) setTimeout(() => updateNodeInternals(newId), 50)
}

// 快捷创建文生图配置节点
const createImageConfig = () => {
  const node = nodes.value.find(n => n.id === props.id)
  if (!node) return
  const newId = addNode('imageConfig', {
    x: node.position.x + 380,
    y: node.position.y
  })
  addEdge({
    source: props.id,
    target: newId,
    sourceHandle: 'right',
    targetHandle: 'left',
    type: 'promptOrder',
    data: { promptOrder: 1 }
  })
  setTimeout(() => updateNodeInternals(newId), 50)
}
</script>

<template>
  <div class="wf-node-wrapper" @mouseenter="showActions = true" @mouseleave="showActions = false">
    <div class="wf-node wf-node-text" :class="{ selected: data.selected }">
      <!-- 头部 -->
      <div class="wf-node-header">
        <div class="wf-node-header-left">
          <span class="wf-node-header-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M4 6h16M4 12h8m-8 6h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </span>
          <span class="wf-node-header-title">{{ data.label || '文本输入' }}</span>
        </div>
        <button class="wf-btn wf-btn-sm" @click="handleDelete">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>

      <!-- 内容 -->
      <div class="wf-node-body">
        <textarea
          v-model="content"
          @input="handleInput"
          @wheel.stop
          @mousedown.stop
          placeholder="输入文本内容..."
          rows="4"
          style="min-height: 80px; max-height: 160px; overflow-y: auto;"
        />

        <!-- 快捷操作 -->
        <div style="display: flex; gap: 6px; margin-top: 8px;">
          <button class="wf-node-action-btn" @click="createImageConfig" style="flex: 1; justify-content: center;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>生成图片</span>
          </button>
        </div>
      </div>

      <!-- 连接点 -->
      <Handle type="target" :position="Position.Left" id="left" />
      <Handle type="source" :position="Position.Right" id="right" />
    </div>

    <!-- 悬浮操作 -->
    <div v-show="showActions" class="wf-node-actions">
      <button class="wf-node-action-btn" @click="handleDuplicate">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
          <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" stroke-width="2"/>
          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" stroke-width="2"/>
        </svg>
        <span>复制</span>
      </button>
    </div>
  </div>
</template>
