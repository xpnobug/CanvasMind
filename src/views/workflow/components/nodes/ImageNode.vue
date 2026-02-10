<script setup>
/**
 * 图片节点组件
 * 展示生成的图片，支持上传、URL输入和预览
 */
import { ref, watch } from 'vue'
import { Handle, Position, useVueFlow } from '@vue-flow/core'
import { updateNode, removeNode, duplicateNode, addNode, addEdge, nodes } from '../../composables/useWorkflowCanvas'

const props = defineProps({ id: String, data: Object })
const { updateNodeInternals } = useVueFlow()

const showActions = ref(false)
const imageUrl = ref(props.data?.url || '')
const isLoading = ref(!!props.data?.loading)
const errorMsg = ref(props.data?.error || '')
const urlInput = ref('')
const urlLoading = ref(false)

watch(() => props.data, (d) => {
  if (d?.url !== undefined) imageUrl.value = d.url
  if (d?.loading !== undefined) isLoading.value = d.loading
  if (d?.error !== undefined) errorMsg.value = d.error
}, { deep: true })

// 上传图片
const handleUpload = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      imageUrl.value = ev.target.result
      updateNode(props.id, { url: ev.target.result, base64: ev.target.result })
    }
    reader.readAsDataURL(file)
  }
  input.click()
}

// URL 输入加载图片
const handleUrlSubmit = () => {
  const url = urlInput.value.trim()
  if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) return
  urlLoading.value = true
  const img = new Image()
  img.onload = () => {
    updateNode(props.id, { url, label: '网络图片' })
    imageUrl.value = url
    urlInput.value = ''
    urlLoading.value = false
  }
  img.onerror = () => { urlLoading.value = false }
  img.src = url
}

// 预览图片（新窗口）
const handlePreview = () => {
  if (imageUrl.value) window.open(imageUrl.value, '_blank')
}

// 下载图片
const handleDownload = async () => {
  if (!imageUrl.value) return
  try {
    const res = await fetch(imageUrl.value)
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `image_${Date.now()}.png`
    a.click()
    URL.revokeObjectURL(url)
  } catch {
    window.open(imageUrl.value, '_blank')
  }
}

// 快捷创建图生图
const createImageConfig = () => {
  const node = nodes.value.find(n => n.id === props.id)
  if (!node) return
  const newId = addNode('imageConfig', {
    x: (node.position?.x || 0) + 380,
    y: node.position?.y || 0
  })
  addEdge({
    source: props.id,
    target: newId,
    sourceHandle: 'right',
    targetHandle: 'left',
    type: 'imageOrder',
    data: { imageOrder: 1 }
  })
  setTimeout(() => updateNodeInternals(newId), 50)
}

// 快捷创建视频生成
const createVideoConfig = () => {
  const node = nodes.value.find(n => n.id === props.id)
  if (!node) return
  const x = (node.position?.x || 0), y = (node.position?.y || 0)
  const textId = addNode('text', { x: x + 300, y: y - 100 }, { content: '', label: '提示词' })
  const configId = addNode('videoConfig', { x: x + 600, y }, { label: '视频生成' })
  addEdge({ source: props.id, target: configId, sourceHandle: 'right', targetHandle: 'left', type: 'imageRole', data: { imageRole: 'first_frame_image' } })
  addEdge({ source: textId, target: configId, sourceHandle: 'right', targetHandle: 'left', type: 'promptOrder', data: { promptOrder: 1 } })
  setTimeout(() => { updateNodeInternals(textId); updateNodeInternals(configId) }, 50)
}

const handleDelete = () => removeNode(props.id)
const handleDuplicate = () => {
  const newId = duplicateNode(props.id)
  if (newId) setTimeout(() => updateNodeInternals(newId), 50)
}
</script>

<template>
  <div class="wf-node-wrapper" @mouseenter="showActions = true" @mouseleave="showActions = false">
    <div class="wf-node wf-node-image" :class="{ selected: data.selected }">
      <!-- 头部 -->
      <div class="wf-node-header">
        <div class="wf-node-header-left">
          <span class="wf-node-header-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </span>
          <span class="wf-node-header-title">{{ data.label || '图片' }}</span>
        </div>
        <button class="wf-btn wf-btn-sm" @click="handleDelete">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>

      <!-- 内容 -->
      <div class="wf-node-body">
        <div class="wf-media-preview" @mousedown.stop>
          <!-- 加载中 -->
          <div v-if="isLoading" class="wf-generating-overlay square">
            <div class="wf-generating-pulse"></div>
            <div class="wf-generating-icon"><img src="../../assets/loading.webp" alt="" /></div>
            <span class="wf-generating-text">创作中</span>
          </div>
          <!-- 错误状态 -->
          <div v-else-if="errorMsg" class="wf-media-error">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#ef4444" stroke-width="2"/><path d="M15 9l-6 6M9 9l6 6" stroke="#ef4444" stroke-width="2" stroke-linecap="round"/></svg>
            <span>{{ errorMsg }}</span>
          </div>
          <!-- 有图片 -->
          <img v-else-if="imageUrl" :src="imageUrl" alt="生成图片" style="max-height: 300px; object-fit: contain;" />
          <!-- URL 加载中 -->
          <div v-else-if="urlLoading" class="wf-generating-overlay square">
            <div class="wf-generating-pulse"></div>
            <span class="wf-generating-text">加载中...</span>
          </div>
          <!-- 空状态：上传 + URL 输入 -->
          <div v-else class="wf-media-placeholder" style="cursor: default;">
            <div style="text-align: center; cursor: pointer;" @click="handleUpload">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style="margin: 0 auto 8px;">
                <path d="M12 5v14m-7-7h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              <span>点击上传图片</span>
            </div>
            <div style="display: flex; align-items: center; gap: 6px; margin-top: 8px; padding-top: 8px; border-top: 0.5px solid var(--stroke-tertiary, rgba(204,221,255,0.08));">
              <input
                v-model="urlInput"
                placeholder="输入图片地址..."
                @keydown.enter="handleUrlSubmit"
                @mousedown.stop
                style="flex: 1; background: var(--bg-block-secondary-default); border: 0.5px solid var(--stroke-tertiary); border-radius: 6px; padding: 4px 8px; color: var(--text-primary); font-size: 11px; outline: none;"
              />
              <button class="wf-node-action-btn" @click="handleUrlSubmit" :disabled="!urlInput.trim()" style="padding: 4px 8px; white-space: nowrap;">
                <span>预览</span>
              </button>
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div v-if="imageUrl" style="display: flex; gap: 6px; margin-top: 8px;">
          <button class="wf-node-action-btn" @click="createImageConfig" style="flex: 1; justify-content: center;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>图生图</span>
          </button>
          <button class="wf-node-action-btn" @click="createVideoConfig" style="flex: 1; justify-content: center;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>生成视频</span>
          </button>
          <button class="wf-node-action-btn" @click="handlePreview" title="预览">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
            </svg>
          </button>
          <button class="wf-node-action-btn" @click="handleDownload" title="下载">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
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
