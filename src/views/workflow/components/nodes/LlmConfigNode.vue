<script setup>
/**
 * LLM 配置节点 - 文本生成（故事拆分等）
 */
import { ref, computed, watch } from 'vue'
import { Handle, Position, useVueFlow } from '@vue-flow/core'
import { updateNode, removeNode, duplicateNode, nodes, edges } from '../../composables/useWorkflowCanvas'
import { streamChatCompletions } from '../../api/chat'
import { getApiKey } from '../../api/request'
import { getAllChatModels } from '../../config/models'
import WfSelect from '../WfSelect.vue'

const props = defineProps({ id: String, data: Object })
const { updateNodeInternals } = useVueFlow()

const showActions = ref(false)
const isGenerating = ref(false)
const systemPrompt = ref(props.data?.systemPrompt || '')
const model = ref(props.data?.model || 'gemini-3-flash-preview')
const outputContent = ref(props.data?.outputContent || '')
const outputFormat = ref(props.data?.outputFormat || 'text')

const outputFormatOptions = [
  { label: '纯文本', value: 'text' },
  { label: 'JSON', value: 'json' },
  { label: 'Markdown', value: 'markdown' }
]

const modelOptions = computed(() => getAllChatModels().map(m => ({ label: m.label, value: m.key })))

watch(() => props.data, (d) => {
  if (d?.systemPrompt !== undefined) systemPrompt.value = d.systemPrompt
  if (d?.model !== undefined) model.value = d.model
  if (d?.outputContent !== undefined) outputContent.value = d.outputContent
  if (d?.outputFormat !== undefined) outputFormat.value = d.outputFormat
}, { deep: true })

const updateConfig = () => {
  updateNode(props.id, { systemPrompt: systemPrompt.value, model: model.value, outputContent: outputContent.value, outputFormat: outputFormat.value })
}

const getInput = () => {
  return edges.value
    .filter(e => e.target === props.id)
    .map(e => {
      const src = nodes.value.find(n => n.id === e.source)
      if (src?.type === 'text') return src.data?.content
      if (src?.type === 'llmConfig') return src.data?.outputContent
      return ''
    })
    .filter(Boolean)
    .join('\n\n')
}

const handleGenerate = async () => {
  if (!getApiKey()) return
  const input = getInput()
  if (!input && !systemPrompt.value) return

  isGenerating.value = true
  outputContent.value = ''

  try {
    const messages = []
    let sysContent = systemPrompt.value || ''
    if (outputFormat.value === 'json') sysContent += '\n\n请以合法的 JSON 格式输出结果，不要包含其他内容。'
    else if (outputFormat.value === 'markdown') sysContent += '\n\n请以 Markdown 格式输出结果。'
    if (sysContent) messages.push({ role: 'system', content: sysContent })
    messages.push({ role: 'user', content: input || '请根据系统提示词生成内容' })

    for await (const chunk of streamChatCompletions({ model: model.value, messages })) {
      outputContent.value += chunk
    }
    updateNode(props.id, { outputContent: outputContent.value })
  } catch (err) {
    console.error('LLM 生成失败:', err)
  } finally {
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
  if (newId) setTimeout(() => updateNodeInternals(newId), 50)
}
</script>

<template>
  <div class="wf-node-wrapper" @mouseenter="showActions = true" @mouseleave="showActions = false">
    <div class="wf-node wf-node-llm" :class="{ selected: data.selected }">
      <div class="wf-node-header">
        <div class="wf-node-header-left">
          <span class="wf-node-header-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </span>
          <span class="wf-node-header-title">{{ data.label || 'LLM 文本生成' }}</span>
        </div>
        <button class="wf-btn wf-btn-sm" @click="handleDelete">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        </button>
      </div>

      <div class="wf-node-body" style="display: flex; flex-direction: column; gap: 8px;">
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

      <Handle type="target" :position="Position.Left" id="left" />
      <Handle type="source" :position="Position.Right" id="right" />
    </div>

    <div v-show="showActions" class="wf-node-actions">
      <button class="wf-node-action-btn" @click="handleDuplicate">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" stroke-width="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" stroke-width="2"/></svg>
        <span>复制</span>
      </button>
      <button class="wf-node-action-btn" @click="handleDelete">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <span>删除</span>
      </button>
    </div>
  </div>
</template>
