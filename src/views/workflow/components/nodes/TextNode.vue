<script setup>
/**
 * 文本节点组件
 */
import { ref, computed, watch } from 'vue'
import { Handle, Position, useVueFlow } from '@vue-flow/core'
import { updateNode, removeNode, duplicateNode, addNode, addEdge, nodes } from '../../composables/useWorkflowCanvas'
import { streamChatCompletions } from '../../api/chat'
import { getApiKey } from '../../api/request'
import { getAllChatModels } from '../../config/models'
import WfSelect from '../WfSelect.vue'

const props = defineProps({ id: String, data: Object })
const { updateNodeInternals } = useVueFlow()

const content = ref(props.data?.content || '')
const showActions = ref(false)
const isPolishing = ref(false)
const polishModel = ref(props.data?.polishModel || 'gemini-3-flash-preview')

const chatModelOptions = computed(() => getAllChatModels().map(m => ({ label: m.label, value: m.key })))

watch(() => props.data?.content, (v) => { if (v !== undefined) content.value = v })
watch(() => props.data?.polishModel, (v) => { if (v !== undefined) polishModel.value = v })

const handleInput = () => {
  updateNode(props.id, { content: content.value, polishModel: polishModel.value })
}

const handleDelete = () => removeNode(props.id)

const handleDuplicate = () => {
  const newId = duplicateNode(props.id)
  if (newId) setTimeout(() => updateNodeInternals(newId), 50)
}

// AI 润色提示词
const handlePolish = async () => {
  const input = content.value.trim()
  if (!input || !getApiKey()) return
  isPolishing.value = true
  const original = content.value
  try {
    let result = ''
    for await (const chunk of streamChatCompletions({
      model: polishModel.value,
      messages: [
        { role: 'system', content: '你是一个专业的AI绘画提示词专家。将用户输入的内容美化成高质量的生图提示词，包含风格、光线、构图、细节等要素。直接返回提示词，不要其他解释。' },
        { role: 'user', content: input }
      ]
    })) {
      result += chunk
    }
    if (result) {
      content.value = result
      updateNode(props.id, { content: result })
    }
  } catch {
    content.value = original
  } finally {
    isPolishing.value = false
  }
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

// 快捷创建视频配置节点
const createVideoConfig = () => {
  const node = nodes.value.find(n => n.id === props.id)
  if (!node) return
  const newId = addNode('videoConfig', {
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

        <!-- 润色模型选择 -->
        <WfSelect
          v-model="polishModel"
          :options="chatModelOptions"
          @change="updateNode(id, { polishModel: polishModel })"
          style="margin-top: 6px;"
        />

        <!-- AI 润色按钮 -->
        <button
          class="wf-node-action-btn"
          :disabled="isPolishing || !content.trim()"
          @click="handlePolish"
          style="margin-top: 6px; width: 100%; justify-content: center;"
        >
          <span v-if="isPolishing" class="wf-spinner"></span>
          <span v-else>✨</span>
          <span>{{ isPolishing ? '润色中...' : 'AI 润色' }}</span>
        </button>

        <!-- 快捷操作 -->
        <div style="display: flex; gap: 6px; margin-top: 6px;">
          <button class="wf-node-action-btn" @click="createImageConfig" style="flex: 1; justify-content: center;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>生成图片</span>
          </button>
          <button class="wf-node-action-btn" @click="createVideoConfig" style="flex: 1; justify-content: center;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>生成视频</span>
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
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" stroke-width="2"/>
          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" stroke-width="2"/>
        </svg>
        <span>复制</span>
      </button>
      <button class="wf-node-action-btn" @click="createImageConfig">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>生图</span>
      </button>
      <button class="wf-node-action-btn" @click="createVideoConfig">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>生视频</span>
      </button>
      <button class="wf-node-action-btn" @click="handleDelete">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>删除</span>
      </button>
    </div>
  </div>
</template>
