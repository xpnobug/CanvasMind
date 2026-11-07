<script setup lang="ts">
/**
 * 视频配置节点 - 模型/比例/时长选择 + 生成
 */
import { ref, computed, watch, onMounted } from 'vue'
import { useVueFlow } from '@vue-flow/core'
import { CopyDocument, Delete, VideoCamera } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import CanvasNodeHoverToolbar, { type NodeToolbarAction } from '@/components/canvas/CanvasNodeHoverToolbar.vue'
import CanvasConfigNodeShell from '@/components/canvas/CanvasConfigNodeShell.vue'
import {
  updateNode,
  removeNode,
  duplicateNode,
  addNode,
  addEdge,
  nodes,
  edges,
  type WorkflowCanvasNode,
  type WorkflowVideoConfigNodeData,
} from '../../composables/useWorkflowCanvas'
import { VIDEO_RATIO_LIST, getAllVideoModels, getDefaultVideoModelKey, getModelByName, loadPublicModelCatalog } from '@/config/models'
import { resolveGatewayUpstream } from '@/api/ai-gateway'
import { createVideoTask, pollVideoTask } from '../../api/video'
import WfSelect from '@/components/common/WfSelect.vue'

const props = defineProps<{
  id: string
  data: WorkflowVideoConfigNodeData & { selected?: boolean }
  selected?: boolean
}>()
const isSelected = computed(() => props.selected || props.data?.selected)
const handleAddLeft = () => ElMessage.info('从左侧追加上游节点：接入中')
const handleAddRight = () => ElMessage.info('从右侧追加下游节点：接入中')
const { updateNodeInternals } = useVueFlow()

const showActions = ref(false)
const isGenerating = ref(false)
const progress = ref(0)

interface WorkflowVideoModelLike {
  ratios?: string[]
  durs?: Array<{ label: string; key: number | string }>
}

const isTextNode = (node?: WorkflowCanvasNode): node is WorkflowCanvasNode<'text'> => node?.type === 'text'
const isImageNode = (node?: WorkflowCanvasNode): node is WorkflowCanvasNode<'image'> => node?.type === 'image'
const readImageRole = (data: unknown) => (data && typeof data === 'object' && 'imageRole' in data
  ? String((data as { imageRole?: string }).imageRole || 'input_reference')
  : 'input_reference')
const readVideoResultUrl = (result: { data?: Array<{ url?: string }> | Record<string, unknown> | null; url?: string }) => {
  if (Array.isArray(result.data)) {
    return result.data[0]?.url || result.url
  }
  return result.url
}

const model = ref(props.data?.model || getDefaultVideoModelKey())
const ratio = ref(props.data?.ratio || '16x9')
const duration = ref(props.data?.duration || 5)

const currentModel = computed<WorkflowVideoModelLike | null>(() => getModelByName(model.value) as WorkflowVideoModelLike | null)
const modelOptions = computed(() => getAllVideoModels().map(m => ({ label: m.label, value: m.key })))
const ratioOptions = computed(() => (currentModel.value?.ratios || []).map((r) => {
  const item = VIDEO_RATIO_LIST.find(v => v.key === r)
  return { label: item?.label || r, value: r }
}))
const durationOptions = computed(() => (currentModel.value?.durs || []).map((d) => ({ label: d.label, value: d.key })))

// 连接的输入
const promptCount = computed(() => edges.value.filter(e => e.target === props.id && (e.type === 'promptOrder' || !e.type)).length)

watch(
  [() => props.data?.model, () => props.data?.ratio, () => props.data?.duration],
  ([m, r, d]) => {
    if (m !== undefined) model.value = m
    if (r !== undefined) ratio.value = r
    if (d !== undefined) duration.value = d
  },
)

onMounted(() => {
  void loadPublicModelCatalog()
})

const updateConfig = () => {
  updateNode(props.id, { model: model.value, ratio: ratio.value, duration: duration.value })
}

// 收集输入
const collectInputs = () => {
  const incoming = edges.value.filter(e => e.target === props.id)
  let prompt = ''
  const images: Array<{ url: string; role: string }> = []

  for (const edge of incoming) {
    const src = nodes.value.find(n => n.id === edge.source)
    if (!src) continue
    if (isTextNode(src) && src.data.content) prompt = src.data.content
    if (isImageNode(src) && src.data.url) {
      images.push({ url: src.data.url, role: readImageRole(edge.data) })
    }
  }
  return { prompt, images }
}

const handleGenerate = async () => {
  const { prompt, images } = collectInputs()
  if (!prompt && !images.length) return

  isGenerating.value = true
  progress.value = 0
  let outputNodeId: string | null = null

  try {
    const { providerId, modelKey } = await resolveGatewayUpstream('video', {
      modelValue: model.value,
    })
    const formData = new FormData()
    formData.append('model', modelKey)
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
    const createdOutputNodeId = outputNodeId
    setTimeout(() => updateNodeInternals([createdOutputNodeId]), 50)

    const task = await createVideoTask(formData)
    const taskId = task?.id || task?.task_id

    if (taskId && providerId) {
      const result = await pollVideoTask(taskId, providerId)
      const videoUrl = readVideoResultUrl(result)

      if (videoUrl) {
        updateNode(outputNodeId, { url: videoUrl, label: '生成视频', loading: false })
        updateNode(props.id, { executed: true, outputNodeId: outputNodeId || undefined })
      } else {
        updateNode(outputNodeId, { label: '生成失败', loading: false, error: '未返回视频' })
        updateNode(props.id, { error: '未返回视频' })
      }
    } else if (taskId) {
      updateNode(outputNodeId, { label: '生成失败', loading: false, error: '未匹配到视频厂商配置' })
      updateNode(props.id, { error: '未匹配到视频厂商配置' })
    } else {
      updateNode(outputNodeId, { label: '生成失败', loading: false, error: '任务创建失败' })
      updateNode(props.id, { error: '任务创建失败' })
    }
  } catch (err: unknown) {
    console.error('视频生成失败:', err)
    const msg = err instanceof Error ? err.message : '视频生成失败'
    if (outputNodeId) updateNode(outputNodeId, { label: '生成失败', loading: false, error: msg })
    updateNode(props.id, { error: msg })
  } finally {
    isGenerating.value = false
  }
}

const handleDelete = () => removeNode(props.id)
const handleDuplicate = () => {
  const newId = duplicateNode(props.id)
  if (newId) setTimeout(() => updateNodeInternals([newId]), 50)
}

const hoverActions = computed<NodeToolbarAction[]>(() => [
  { id: 'duplicate', label: '复制', icon: CopyDocument, onClick: handleDuplicate },
  { id: 'delete', label: '删除', icon: Delete, danger: true, onClick: handleDelete },
])

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
  <div class="video-config-node-outer" @mouseenter="showActions = true" @mouseleave="showActions = false">
    <CanvasConfigNodeShell
      :node-id="id"
      :label="data?.label || '图生视频'"
      :icon="VideoCamera"
      :selected="isSelected"
      type="video-config"
      :min-width="320"
      :min-height="240"
      @add-left="handleAddLeft"
      @add-right="handleAddRight"
    >
      <div class="wf-node-body" style="display: flex; flex-direction: column; gap: 8px; padding: 16px;">
        <div style="font-size: 11px; color: var(--text-tertiary);">输入: {{ promptCount }}</div>

        <div>
          <label class="wf-node-label">模型</label>
          <WfSelect v-model="model" :options="modelOptions" @change="updateConfig" />
        </div>

        <div v-if="ratioOptions.length">
          <label class="wf-node-label">比例</label>
          <WfSelect v-model="ratio" :options="ratioOptions" @change="updateConfig" />
        </div>

        <div v-if="durationOptions.length">
          <label class="wf-node-label">时长</label>
          <WfSelect v-model="duration" :options="durationOptions" @change="updateConfig" />
        </div>

        <button class="wf-node-generate-btn amber" :disabled="isGenerating" @click="handleGenerate">
          <span v-if="isGenerating" class="wf-spinner"></span>
          <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M13 10V3L4 14h7v7l9-11h-7z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          {{ isGenerating ? '生成中...' : '生成视频' }}
        </button>
      </div>

      <template #overlay>
        <CanvasNodeHoverToolbar :visible="showActions" :actions="hoverActions" />
      </template>
    </CanvasConfigNodeShell>
  </div>
</template>
