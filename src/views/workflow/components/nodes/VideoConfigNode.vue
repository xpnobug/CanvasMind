<script setup>
/**
 * 视频配置节点 - 模型/比例/时长选择 + 生成
 */
import { ref, computed, watch } from 'vue'
import { Handle, Position, useVueFlow } from '@vue-flow/core'
import { updateNode, removeNode, duplicateNode, addNode, addEdge, nodes, edges } from '../../composables/useWorkflowCanvas'
import { VIDEO_MODELS, VIDEO_RATIO_LIST, getAllVideoModels } from '../../config/models'
import { createVideoTask, pollVideoTask } from '../../api/video'

const props = defineProps({ id: String, data: Object })
const { updateNodeInternals } = useVueFlow()

const showActions = ref(false)
const isGenerating = ref(false)
const progress = ref(0)

const model = ref(props.data?.model || 'veo3.1')
const ratio = ref(props.data?.ratio || '16x9')
const duration = ref(props.data?.duration || 5)

const currentModel = computed(() => VIDEO_MODELS.find(m => m.key === model.value))
const modelOptions = computed(() => getAllVideoModels().map(m => ({ label: m.label, value: m.key })))
const ratioOptions = computed(() => (currentModel.value?.ratios || []).map(r => {
  const item = VIDEO_RATIO_LIST.find(v => v.key === r)
  return { label: item?.label || r, value: r }
}))
const durationOptions = computed(() => (currentModel.value?.durs || []).map(d => ({ label: d.label, value: d.key })))

// 连接的输入
const promptCount = computed(() => edges.value.filter(e => e.target === props.id && (e.type === 'promptOrder' || !e.type)).length)

watch(() => props.data, (d) => {
  if (d?.model !== undefined) model.value = d.model
  if (d?.ratio !== undefined) ratio.value = d.ratio
  if (d?.duration !== undefined) duration.value = d.duration
}, { deep: true })

const updateConfig = () => {
  updateNode(props.id, { model: model.value, ratio: ratio.value, duration: duration.value })
}

// 收集输入
const collectInputs = () => {
  const incoming = edges.value.filter(e => e.target === props.id)
  let prompt = ''
  const images = []

  for (const edge of incoming) {
    const src = nodes.value.find(n => n.id === edge.source)
    if (!src) continue
    if (src.type === 'text' && src.data?.content) prompt = src.data.content
    if (src.type === 'image' && src.data?.url) {
      images.push({ url: src.data.url, role: edge.data?.imageRole || 'input_reference' })
    }
  }
  return { prompt, images }
}

const handleGenerate = async () => {
  const { prompt, images } = collectInputs()
  if (!prompt && !images.length) return

  isGenerating.value = true
  progress.value = 0
  let outputNodeId = null

  try {
    const formData = new FormData()
    formData.append('model', model.value)
    if (prompt) formData.append('prompt', prompt)
    formData.append('ratio', ratio.value)
    formData.append('duration', String(duration.value))

    for (const img of images) {
      if (img.url.startsWith('data:') || img.url.startsWith('blob:')) {
        const res = await fetch(img.url)
        const blob = await res.blob()
        formData.append(img.role, blob, 'image.png')
      } else {
        formData.append(img.role, img.url)
      }
    }

    // 先创建带 loading 状态的输出节点
    const node = nodes.value.find(n => n.id === props.id)
    outputNodeId = addNode('video', {
      x: (node?.position?.x || 0) + 400,
      y: node?.position?.y || 0
    }, { url: '', label: '视频生成中...', loading: true })
    addEdge({ source: props.id, target: outputNodeId, sourceHandle: 'right', targetHandle: 'left' })
    setTimeout(() => updateNodeInternals(outputNodeId), 50)

    const task = await createVideoTask(formData)
    const taskId = task?.id || task?.task_id

    if (taskId) {
      const result = await pollVideoTask(taskId)
      const videoUrl = result?.data?.[0]?.url || result?.url

      if (videoUrl) {
        updateNode(outputNodeId, { url: videoUrl, label: '生成视频', loading: false })
        updateNode(props.id, { executed: true, outputNodeId })
      } else {
        updateNode(outputNodeId, { label: '生成失败', loading: false })
      }
    } else {
      updateNode(outputNodeId, { label: '生成失败', loading: false })
    }
  } catch (err) {
    console.error('视频生成失败:', err)
    if (outputNodeId) updateNode(outputNodeId, { label: '生成失败', loading: false })
  } finally {
    isGenerating.value = false
  }
}

const handleDelete = () => removeNode(props.id)
const handleDuplicate = () => {
  const newId = duplicateNode(props.id)
  if (newId) setTimeout(() => updateNodeInternals(newId), 50)
}
</script>

<template>
  <div class="wf-node-wrapper" @mouseenter="showActions = true" @mouseleave="showActions = false">
    <div class="wf-node wf-node-video-config" :class="{ selected: data.selected }">
      <div class="wf-node-header">
        <div class="wf-node-header-left">
          <span class="wf-node-header-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </span>
          <span class="wf-node-header-title">{{ data.label || '视频生成' }}</span>
        </div>
        <button class="wf-btn wf-btn-sm" @click="handleDelete">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        </button>
      </div>

      <div class="wf-node-body" style="display: flex; flex-direction: column; gap: 8px;">
        <div style="font-size: 11px; color: var(--text-tertiary);">输入: {{ promptCount }}</div>

        <div>
          <label class="wf-node-label">模型</label>
          <select v-model="model" @change="updateConfig" @mousedown.stop style="width: 100%; background: var(--bg-block-secondary-default); border: 0.5px solid var(--stroke-tertiary); border-radius: 8px; padding: 6px 8px; color: var(--text-primary); font-size: 12px; outline: none; cursor: pointer;">
            <option v-for="opt in modelOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
        </div>

        <div v-if="ratioOptions.length">
          <label class="wf-node-label">比例</label>
          <select v-model="ratio" @change="updateConfig" @mousedown.stop style="width: 100%; background: var(--bg-block-secondary-default); border: 0.5px solid var(--stroke-tertiary); border-radius: 8px; padding: 6px 8px; color: var(--text-primary); font-size: 12px; outline: none; cursor: pointer;">
            <option v-for="opt in ratioOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
        </div>

        <div v-if="durationOptions.length">
          <label class="wf-node-label">时长</label>
          <select v-model="duration" @change="updateConfig" @mousedown.stop style="width: 100%; background: var(--bg-block-secondary-default); border: 0.5px solid var(--stroke-tertiary); border-radius: 8px; padding: 6px 8px; color: var(--text-primary); font-size: 12px; outline: none; cursor: pointer;">
            <option v-for="opt in durationOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
        </div>

        <button class="wf-node-generate-btn amber" :disabled="isGenerating" @click="handleGenerate">
          <span v-if="isGenerating" class="wf-spinner"></span>
          <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M13 10V3L4 14h7v7l9-11h-7z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          {{ isGenerating ? '生成中...' : '生成视频' }}
        </button>
      </div>

      <Handle type="target" :position="Position.Left" id="left" />
      <Handle type="source" :position="Position.Right" id="right" />
    </div>

    <div v-show="showActions" class="wf-node-actions">
      <button class="wf-node-action-btn" @click="handleDuplicate">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" stroke-width="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" stroke-width="2"/></svg>
        <span>复制</span>
      </button>
    </div>
  </div>
</template>
