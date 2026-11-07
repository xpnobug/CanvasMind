<script setup lang="ts">
/**
 * LLM 配置节点 - 文本生成（故事拆分等）
 * 通过服务端任务统一执行，复用 generate 页的任务事件 SSE
 */
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useVueFlow } from '@vue-flow/core'
import { CopyDocument, Delete, ChatDotRound } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import CanvasNodeHoverToolbar, { type NodeToolbarAction } from '@/components/canvas/CanvasNodeHoverToolbar.vue'
import CanvasConfigNodeShell from '@/components/canvas/CanvasConfigNodeShell.vue'
import {
  updateNode,
  removeNode,
  duplicateNode,
  nodes,
  edges,
  type WorkflowCanvasNode,
  type WorkflowLlmConfigNodeData,
} from '../../composables/useWorkflowCanvas'
import { getAllChatModels, getDefaultChatModelKey, loadPublicModelCatalog } from '@/config/models'
import { createGenerationTask, resolveGenerationTaskModel, subscribeGenerationTaskEvents } from '@/api/generation-tasks'
import WfSelect from '@/components/common/WfSelect.vue'

const props = defineProps<{
  id: string
  data: WorkflowLlmConfigNodeData & { selected?: boolean }
  selected?: boolean
}>()
const isSelected = computed(() => props.selected || props.data?.selected)
const handleAddLeft = () => ElMessage.info('从左侧追加上游节点：接入中')
const handleAddRight = () => ElMessage.info('从右侧追加下游节点：接入中')
const { updateNodeInternals } = useVueFlow()

const showActions = ref(false)
const isGenerating = ref(false)
const taskStreamController = ref<AbortController | null>(null)
const systemPrompt = ref(props.data?.systemPrompt || '')
const model = ref(props.data?.model || getDefaultChatModelKey())
const outputContent = ref(props.data?.outputContent || '')
const outputFormat = ref(props.data?.outputFormat || 'text')

const outputFormatOptions = [
  { label: '纯文本', value: 'text' },
  { label: 'JSON', value: 'json' },
  { label: 'Markdown', value: 'markdown' }
]

const modelOptions = computed(() => getAllChatModels().map(m => ({ label: m.label, value: m.key })))
const isTextNode = (node?: WorkflowCanvasNode): node is WorkflowCanvasNode<'text'> => node?.type === 'text'
const isLlmNode = (node?: WorkflowCanvasNode): node is WorkflowCanvasNode<'llmConfig'> => node?.type === 'llmConfig'

watch(
  modelOptions,
  (options) => {
    const values = options.map(item => item.value)
    if (!values.length) return
    if (!values.includes(model.value)) {
      model.value = getDefaultChatModelKey() || values[0]
      updateConfig()
    }
  },
  { immediate: true },
)

onMounted(() => {
  void loadPublicModelCatalog()
})

onUnmounted(() => {
  taskStreamController.value?.abort()
  taskStreamController.value = null
})

watch(
  [
    () => props.data?.systemPrompt,
    () => props.data?.model,
    () => props.data?.outputContent,
    () => props.data?.outputFormat,
  ],
  ([sp, m, oc, of]) => {
    if (sp !== undefined) systemPrompt.value = sp
    if (m !== undefined) model.value = m
    if (oc !== undefined) outputContent.value = oc
    if (of !== undefined) outputFormat.value = of
  },
)

const updateConfig = () => {
  updateNode(props.id, { systemPrompt: systemPrompt.value, model: model.value, outputContent: outputContent.value, outputFormat: outputFormat.value })
}

const getInput = () => {
  return edges.value
    .filter(e => e.target === props.id)
    .map(e => {
      const src = nodes.value.find(n => n.id === e.source)
      if (isTextNode(src)) return src.data.content
      if (isLlmNode(src)) return src.data.outputContent
      return ''
    })
    .filter(Boolean)
    .join('\n\n')
}

const cleanupTaskStream = () => {
  taskStreamController.value?.abort()
  taskStreamController.value = null
}

const handleGenerate = async () => {
  const input = getInput()
  if (!input && !systemPrompt.value) return

  isGenerating.value = true
  outputContent.value = ''
  cleanupTaskStream()

  try {
    const messages: Array<{ role: 'system' | 'user'; content: string }> = []
    let sysContent = systemPrompt.value || ''
    if (outputFormat.value === 'json') sysContent += '\n\n请以合法的 JSON 格式输出结果，不要包含其他内容。'
    else if (outputFormat.value === 'markdown') sysContent += '\n\n请以 Markdown 格式输出结果。'
    if (sysContent) messages.push({ role: 'system', content: sysContent })
    messages.push({ role: 'user', content: input || '请根据系统提示词生成内容' })

    const { providerId, modelKey } = resolveGenerationTaskModel({
      modelKey: model.value,
      category: 'CHAT',
      missingModelMessage: '缺少对话模型标识',
    })

    updateNode(props.id, {
      loading: true,
      error: '',
      outputContent: '',
      taskRecordId: '',
    })

    const saved = await createGenerationTask({
      source: 'workflow',
      type: 'agent',
      prompt: input || '请根据系统提示词生成内容',
      model: model.value,
      modelKey,
      skill: 'general',
      requestBody: {
        providerId,
        model: modelKey,
        messages,
        stream: true,
      },
    })

    const taskRecordId = String(saved.id || '').trim()
    if (!taskRecordId) {
      throw new Error('LLM 任务创建失败')
    }

    updateNode(props.id, {
      loading: true,
      error: '',
      taskRecordId,
    })

    const controller = new AbortController()
    taskStreamController.value = controller

    void subscribeGenerationTaskEvents(taskRecordId, {
      signal: controller.signal,
      onEvent: (event) => {
        if (event.type === 'content_delta') {
          const nextContent = typeof event.content === 'string'
            ? event.content
            : `${outputContent.value}${String(event.delta || '')}`
          outputContent.value = nextContent
          updateNode(props.id, {
            loading: true,
            error: '',
            outputContent: nextContent,
          })
          return
        }

        if (event.type === 'snapshot' || event.type === 'completed') {
          const nextContent = typeof event.record?.content === 'string'
            ? event.record.content
            : outputContent.value
          outputContent.value = nextContent
          updateNode(props.id, {
            loading: !event.done,
            error: '',
            outputContent: nextContent,
          })
        }

        if (event.type === 'failed') {
          const message = String(event.message || event.record?.error || 'LLM 生成失败').trim() || 'LLM 生成失败'
          updateNode(props.id, {
            loading: false,
            error: message,
          })
        }

        if (event.type === 'stopped') {
          updateNode(props.id, {
            loading: false,
            error: '任务已停止',
          })
        }

        if (event.done) {
          isGenerating.value = false
          cleanupTaskStream()
        }
      },
    }).catch((err: unknown) => {
      if (controller.signal.aborted) {
        return
      }

      const message = err instanceof Error ? err.message : 'LLM 任务订阅失败'
      updateNode(props.id, {
        loading: false,
        error: message,
      })
      isGenerating.value = false
      cleanupTaskStream()
    })
  } catch (err) {
    console.error('LLM 生成失败:', err)
    const message = err instanceof Error ? err.message : 'LLM 生成失败'
    updateNode(props.id, {
      loading: false,
      error: message,
    })
    isGenerating.value = false
  }
}

const handleCopy = async () => {
  if (!outputContent.value) return
  try { await navigator.clipboard.writeText(outputContent.value) } catch {}
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
</script>

<template>
  <div class="llm-config-node-outer" @mouseenter="showActions = true" @mouseleave="showActions = false">
    <CanvasConfigNodeShell
      :node-id="id"
      :label="data?.label || 'LLM 文本生成'"
      :icon="ChatDotRound"
      :selected="isSelected"
      type="llm-config"
      :min-width="340"
      :min-height="280"
      @add-left="handleAddLeft"
      @add-right="handleAddRight"
    >
      <div class="wf-node-body" style="display: flex; flex-direction: column; gap: 8px; padding: 16px;">
        <div>
          <label class="wf-node-label">系统提示词</label>
          <textarea v-model="systemPrompt" @blur="updateConfig" @wheel.stop @mousedown.stop placeholder="设定 AI 的角色和行为规则..." style="min-height: 60px; max-height: 120px;" />
        </div>

        <div>
          <label class="wf-node-label">模型</label>
          <WfSelect v-model="model" :options="modelOptions" @change="updateConfig" />
        </div>

        <div>
          <label class="wf-node-label">输出格式</label>
          <WfSelect v-model="outputFormat" :options="outputFormatOptions" @change="updateConfig" />
        </div>

        <button class="wf-node-generate-btn purple" :disabled="isGenerating" @click="handleGenerate">
          <span v-if="isGenerating" class="wf-spinner"></span>
          <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M13 10V3L4 14h7v7l9-11h-7z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          {{ isGenerating ? '生成中...' : '执行生成' }}
        </button>

        <div v-if="outputContent">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
            <label class="wf-node-label" style="margin: 0;">生成结果</label>
            <button class="wf-node-action-btn" @click="handleCopy" style="padding: 2px 8px;">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" stroke-width="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" stroke-width="2"/></svg>
              <span>复制</span>
            </button>
          </div>
          <div @wheel.stop @mousedown.stop style="background: var(--bg-block-secondary-default); border: 0.5px solid var(--stroke-tertiary); border-radius: 8px; padding: 8px; font-size: 11px; color: var(--text-primary); max-height: 150px; overflow-y: auto; white-space: pre-wrap; cursor: text; user-select: text;">{{ outputContent }}</div>
        </div>
      </div>

      <template #overlay>
        <CanvasNodeHoverToolbar :visible="showActions" :actions="hoverActions" />
      </template>
    </CanvasConfigNodeShell>
  </div>
</template>
