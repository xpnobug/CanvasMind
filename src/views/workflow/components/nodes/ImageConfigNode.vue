<script setup>
/**
 * 图片配置节点组件
 * 收集连接的提示词和参考图，调用图片生成 API
 */
import { ref, computed, watch, onMounted } from 'vue'
import { Handle, Position, useVueFlow } from '@vue-flow/core'
import { updateNode, removeNode, duplicateNode, addNode, addEdge, nodes, edges } from '../../composables/useWorkflowCanvas'
import { IMAGE_MODELS, BANANA_SIZE_OPTIONS, SEEDREAM_SIZE_OPTIONS, SEEDREAM_4K_SIZE_OPTIONS, SEEDREAM_QUALITY_OPTIONS, getAllImageModels } from '../../config/models'
import { generateImage } from '../../api/image'
import WfSelect from '../WfSelect.vue'

const props = defineProps({ id: String, data: Object })
const { updateNodeInternals } = useVueFlow()

const showActions = ref(false)
const isGenerating = ref(false)

// 本地状态
const model = ref(props.data?.model || 'nano-banana-pro')
const size = ref(props.data?.size || '1x1')
const quality = ref(props.data?.quality || 'standard')

// 模型选项（包含自定义模型）
const modelOptions = computed(() => getAllImageModels().map(m => ({ label: m.label, value: m.key })))

// 当前模型配置
const currentModel = computed(() => IMAGE_MODELS.find(m => m.key === model.value))

// 尺寸选项（根据模型和画质动态变化）
const sizeOptions = computed(() => {
  const m = currentModel.value
  if (!m || !m.sizes?.length) return []
  if (m.getSizesByQuality) {
    return m.getSizesByQuality(quality.value).map(s => ({ label: s.label, value: s.key }))
  }
  if (m.key === 'nano-banana-pro' || m.key === 'nano-banana') {
    return BANANA_SIZE_OPTIONS.map(s => ({ label: s.label, value: s.key }))
  }
  return SEEDREAM_SIZE_OPTIONS.map(s => ({ label: s.label, value: s.key }))
})

// 画质选项
const qualityOptions = computed(() => {
  const m = currentModel.value
  if (!m?.qualities) return []
  return m.qualities.map(q => ({ label: q.label, value: q.key }))
})

// 连接的提示词数量
const promptCount = computed(() => {
  return edges.value.filter(e => e.target === props.id && (e.type === 'promptOrder' || !e.type)).length
})

// 连接的参考图数量
const refImageCount = computed(() => {
  return edges.value.filter(e => e.target === props.id && e.type === 'imageOrder').length
})

// 监听外部数据变化
watch(() => props.data, (d) => {
  if (d?.model !== undefined) model.value = d.model
  if (d?.size !== undefined) size.value = d.size
  if (d?.quality !== undefined) quality.value = d.quality
}, { deep: true })

const updateConfig = () => {
  updateNode(props.id, { model: model.value, size: size.value, quality: quality.value })
}

// 收集连接的提示词和参考图
const collectInputs = () => {
  const connectedEdges = edges.value.filter(e => e.target === props.id)
  const prompts = []
  const refImages = []

  for (const edge of connectedEdges) {
    const src = nodes.value.find(n => n.id === edge.source)
    if (!src) continue

    if (src.type === 'text') {
      const content = src.data?.content || ''
      if (content) prompts.push({ order: edge.data?.promptOrder || 1, content })
    } else if (src.type === 'image') {
      const imageData = src.data?.base64 || src.data?.url
      if (imageData) refImages.push({ order: edge.data?.imageOrder || 1, imageData })
    }
  }

  prompts.sort((a, b) => a.order - b.order)
  refImages.sort((a, b) => a.order - b.order)

  return {
    prompt: prompts.map(p => p.content).join('\n'),
    refImages: refImages.map(r => r.imageData)
  }
}

// 生成图片
const handleGenerate = async () => {
  const { prompt, refImages } = collectInputs()
  if (!prompt && !refImages.length) return

  isGenerating.value = true
  let outputNodeId = null
  try {
    const params = { model: model.value, prompt: prompt || '', n: 1 }
    if (size.value && currentModel.value?.sizes?.length) params.size = size.value
    if (quality.value) params.quality = quality.value
    if (refImages.length) params.image = refImages

    // 先创建带 loading 状态的输出节点
    const node = nodes.value.find(n => n.id === props.id)
    outputNodeId = addNode('image', {
      x: (node?.position?.x || 0) + 400,
      y: node?.position?.y || 0
    }, { url: '', label: '生成中...', loading: true })
    addEdge({ source: props.id, target: outputNodeId, sourceHandle: 'right', targetHandle: 'left' })
    setTimeout(() => updateNodeInternals(outputNodeId), 50)

    const result = await generateImage(params)
    const url = result?.data?.[0]?.url || result?.data?.[0]?.b64_json

    if (url) {
      updateNode(outputNodeId, { url, label: '生成结果', loading: false })
      updateNode(props.id, { executed: true, outputNodeId })
    } else {
      updateNode(outputNodeId, { label: '生成失败', loading: false, error: '未返回图片' })
      updateNode(props.id, { error: '未返回图片' })
    }
  } catch (err) {
    console.error('图片生成失败:', err)
    const msg = err.message || '图片生成失败'
    if (outputNodeId) updateNode(outputNodeId, { label: '生成失败', loading: false, error: msg })
    updateNode(props.id, { error: msg })
  } finally {
    isGenerating.value = false
  }
}

const handleDelete = () => removeNode(props.id)
const handleDuplicate = () => {
  const newId = duplicateNode(props.id)
  if (newId) setTimeout(() => updateNodeInternals(newId), 50)
}

// 监听自动执行标志
watch(
  () => props.data?.autoExecute,
  (shouldExecute) => {
    if (shouldExecute && !isGenerating.value) {
      updateNode(props.id, { autoExecute: false })
      setTimeout(() => handleGenerate(), 200)
    }
  }
)
</script>

<template>
  <div class="wf-node-wrapper" @mouseenter="showActions = true" @mouseleave="showActions = false">
    <div class="wf-node wf-node-image-config" :class="{ selected: data.selected }">
      <!-- 头部 -->
      <div class="wf-node-header">
        <div class="wf-node-header-left">
          <span class="wf-node-header-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </span>
          <span class="wf-node-header-title">{{ data.label || '文生图' }}</span>
        </div>
        <button class="wf-btn wf-btn-sm" @click="handleDelete">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>

      <!-- 配置内容 -->
      <div class="wf-node-body" style="display: flex; flex-direction: column; gap: 8px;">
        <!-- 连接信息 -->
        <div style="display: flex; gap: 8px; font-size: 11px; color: var(--text-tertiary);">
          <span>提示词: {{ promptCount }}</span>
          <span v-if="refImageCount">参考图: {{ refImageCount }}</span>
        </div>

        <!-- 模型选择 -->
        <div>
          <label class="wf-node-label">模型</label>
          <WfSelect v-model="model" :options="modelOptions" @change="updateConfig" />
        </div>

        <!-- 画质选择 -->
        <div v-if="qualityOptions.length">
          <label class="wf-node-label">画质</label>
          <WfSelect v-model="quality" :options="qualityOptions" @change="updateConfig" />
        </div>

        <!-- 尺寸选择 -->
        <div v-if="sizeOptions.length">
          <label class="wf-node-label">尺寸</label>
          <WfSelect v-model="size" :options="sizeOptions" @change="updateConfig" />
        </div>

        <!-- 生成按钮 -->
        <button
          class="wf-node-generate-btn green"
          :disabled="isGenerating || (!promptCount && !refImageCount)"
          @click="handleGenerate"
        >
          <span v-if="isGenerating" class="wf-spinner"></span>
          <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M13 10V3L4 14h7v7l9-11h-7z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          {{ isGenerating ? '生成中...' : '生成图片' }}
        </button>
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
      <button class="wf-node-action-btn" @click="handleDelete">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>删除</span>
      </button>
    </div>
  </div>
</template>
