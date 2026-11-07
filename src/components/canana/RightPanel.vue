<script setup>
import { ref, nextTick, watch, computed, onMounted, onBeforeUnmount } from 'vue'
import ContentGenerator from '@/components/generate/ContentGenerator.vue'
import SidebarEmptyState from '@/components/canana/SidebarEmptyState.vue'
import AssistantSessionList from '@/components/canvas/AssistantSessionList.vue'
import {
  createGenerationTask,
  subscribeGenerationTaskEvents,
  resolveGenerationTaskModel,
} from '@/api/generation-tasks'
import { listGenerationRecords } from '@/api/generation-records'
import {
  loadPublicModelCatalog,
  getDefaultImageModelKey,
  getDefaultChatModelKey,
} from '@/config/models'
import { appendImageReferencesToRequestBody } from '@/shared/image-generation-request'
import { useAssistantSessions } from '@/composables/useAssistantSessions'

const props = defineProps({
  title: { type: String, default: '' },
  visible: { type: Boolean, default: false },
  initialMessage: { type: String, default: '' }
})

const emit = defineEmits(['close', 'message-received', 'add-image-to-canvas'])

// 会话列表（与 /generate 通过 source='canvas-assistant' 物理隔离）
const {
  sessions: assistantSessions,
  activeSession,
  activeSessionId,
  loadSessions,
  createNewSession,
  renameSessionTitle,
  removeSessionById,
  setActive,
  ensureSession,
  ASSISTANT_SOURCE,
} = useAssistantSessions()

const sessionListVisible = ref(false)
const sessionListAnchor = ref(null)
const headerTitleText = computed(() => activeSession.value?.title || props.title || '未命名对话')

const openSessionList = () => {
  sessionListVisible.value = !sessionListVisible.value
}
const closeSessionList = () => {
  sessionListVisible.value = false
}

const handleSessionSelect = (id) => {
  if (id === activeSessionId.value) {
    closeSessionList()
    return
  }
  setActive(id)
  cleanupStreams()
  closeSessionList()
  // 切换会话后加载该会话的历史 records
  void loadSessionHistory(id)
}

const handleSessionCreate = async () => {
  try {
    const created = await createNewSession()
    messages.value = []
    hasMessages.value = false
    cleanupStreams()
    // 新会话还没有 records，不需要 loadSessionHistory，留空展示空态
    void created
  } catch (err) {
    console.error('[RightPanel] create session failed', err)
  } finally {
    closeSessionList()
  }
}

const handleSessionRename = async (id, title) => {
  try {
    await renameSessionTitle(id, title)
  } catch (err) {
    console.error('[RightPanel] rename session failed', err)
  }
}

const handleSessionDelete = async (id) => {
  try {
    const wasActive = activeSessionId.value === id
    await removeSessionById(id)
    if (wasActive) {
      cleanupStreams()
      // 删除当前会话后，切换到新选中的会话并加载它的历史
      if (activeSessionId.value) {
        void loadSessionHistory(activeSessionId.value)
      } else {
        messages.value = []
        hasMessages.value = false
      }
    }
  } catch (err) {
    console.error('[RightPanel] delete session failed', err)
  }
}

// 是否有消息（用于决定显示空状态还是消息列表）
const hasMessages = ref(false)

// 消息数据
const messages = ref([])

const inputMessage = ref('')
const messagesContainer = ref(null)
const toggleCollapse = (msg) => { msg.collapsed = !msg.collapsed }

// 图片上传
const uploadedImages = ref([])
const fileInputRef = ref(null)
const imagesExpanded = ref(false)
const hoveredImageId = ref(null)

// 最近一次发送时 ContentGenerator 选择的创建类型（image/agent/video...）
const lastCreationType = ref('agent')
// 最近一次 ContentGenerator 透传过来的图片生成参数（count/model/ratio/quality 等）
const lastImageOptions = ref({})

// 跟踪进行中的流式请求，用于卸载时统一 abort
const activeStreams = []

const registerStream = (controller) => {
  activeStreams.push(controller)
}

const cleanupStreams = () => {
  while (activeStreams.length) {
    const c = activeStreams.shift()
    try { c?.abort() } catch { /* ignore */ }
  }
}

onMounted(() => {
  // 后台拉取模型清单（getDefault*ModelKey 依赖此调用）
  void loadPublicModelCatalog()
  // 拉取助手会话列表（首次会自动建默认会话），然后加载当前会话历史
  void (async () => {
    await loadSessions()
    if (activeSessionId.value) {
      await loadSessionHistory(activeSessionId.value)
    }
  })()
})

onBeforeUnmount(cleanupStreams)

// 把后端持久化的 record 映射为前端 UI 消息行
const mapRecordToMessages = (record) => {
  const ts = record.createdAt ? new Date(record.createdAt).getTime() : Date.now()
  const baseId = record.id || String(ts)
  const out = []
  const refImages = Array.isArray(record.referenceImages) ? record.referenceImages.filter(Boolean) : []
  if (record.prompt) {
    if (refImages.length) {
      out.push({
        id: `${baseId}-u`,
        type: 'user-with-ref',
        content: record.prompt,
        referenceImages: refImages,
      })
    } else {
      out.push({
        id: `${baseId}-u`,
        type: 'user',
        content: record.prompt,
      })
    }
  }
  const rtype = String(record.type || '').trim()
  if (rtype === 'image') {
    const images = Array.isArray(record.images) ? record.images.filter(Boolean) : []
    out.push({
      id: `${baseId}-a`,
      type: 'ai-images',
      summary: (record.prompt || '图片生成').slice(0, 10) + (record.prompt?.length > 10 ? '...' : ''),
      collapsed: false,
      images,
      totalCount: images.length,
      loading: !record.done && !images.length,
      error: record.error || '',
    })
  } else if (rtype === 'agent' || rtype === 'chat') {
    out.push({
      id: `${baseId}-a`,
      type: 'ai-text',
      content: record.content || '',
      loading: !record.done && !record.content,
      error: record.error || '',
    })
  }
  return out
}

// 拉取指定会话的历史记录并填充到 messages（time asc）
const loadSessionHistory = async (sessionId) => {
  if (!sessionId) {
    messages.value = []
    hasMessages.value = false
    return
  }
  try {
    const all = await listGenerationRecords()
    const list = Array.isArray(all) ? all : []
    const filtered = list
      .filter((r) => r.sessionId === sessionId && (r.source || 'generate') === ASSISTANT_SOURCE)
      .sort((a, b) => {
        const at = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const bt = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return at - bt
      })
    const mapped = []
    for (const record of filtered) {
      mapped.push(...mapRecordToMessages(record))
    }
    messages.value = mapped
    hasMessages.value = mapped.length > 0
    scrollToBottom()
  } catch (err) {
    console.error('[RightPanel] loadSessionHistory failed', err)
  }
}

const triggerUpload = () => {
  fileInputRef.value?.click()
}

const handleFileChange = (e) => {
  const files = e.target.files
  if (!files) return

  for (const file of files) {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (event) => {
        uploadedImages.value.push({
          id: Date.now() + Math.random(),
          src: event.target.result,
          name: file.name
        })
      }
      reader.readAsDataURL(file)
    }
  }
  // 清空input以便重复选择同一文件
  e.target.value = ''
}

const removeUploadedImage = (id) => {
  uploadedImages.value = uploadedImages.value.filter(img => img.id !== id)
}

// 图片预览
const previewImage = ref(null)
const openPreview = (src) => {
  previewImage.value = src
}
const closePreview = () => {
  previewImage.value = null
}

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

// 把 messages 数组里的最后一项以响应式代理形式取回，便于后续 mutation 触发 UI 更新
const tailMessage = () => messages.value[messages.value.length - 1]

const handleAddImageToCanvas = (url) => {
  if (!url) return
  emit('add-image-to-canvas', { url })
}

// 仅允许栅格格式的参考图（svg/pdf/heic 等矢量格式上游 PIL 解码会失败）
const RASTER_REFERENCE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'])
const isRasterReferenceUrl = (url) => {
  if (!url) return false
  if (typeof url === 'string' && url.startsWith('data:image/')) {
    // 排除 svg+xml
    return !url.startsWith('data:image/svg')
  }
  const clean = String(url).split('?')[0].split('#')[0]
  const dot = clean.lastIndexOf('.')
  if (dot < 0) return true
  return RASTER_REFERENCE_EXTENSIONS.has(clean.slice(dot + 1).toLowerCase())
}

// 调用图片生成 API（写入到指定 aiMsg.images）
const runImageGeneration = async (prompt, refImages, aiMsg) => {
  try {
    const opts = lastImageOptions.value || {}
    const rawRefs = Array.isArray(refImages) ? refImages : []
    const filteredRefs = rawRefs.filter(isRasterReferenceUrl)
    if (rawRefs.length > filteredRefs.length) {
      aiMsg.error = '已忽略非栅格格式（SVG 等）的参考图，图生图模型不支持'
    }
    // ContentGenerator 把张数放在 options.count，缺省给 1（与底部输入框的默认一致）
    const count = Math.max(1, Math.min(8, Number(opts.count) || 1))
    const fallbackKey = String(opts.modelKey || opts.model || '').trim() || getDefaultImageModelKey() || ''
    const { providerId, modelKey } = resolveGenerationTaskModel({
      modelKey: fallbackKey,
      fallbackModelKey: fallbackKey,
      category: 'IMAGE',
      missingModelMessage: '未匹配到有效图片模型，请先在后台配置模型',
    })
    const requestBody = {
      model: modelKey,
      prompt: prompt || '',
      n: count,
      providerId,
    }
    // 透传 size/quality（ContentGenerator 里 ratio 对应 size、resolution 对应 quality）
    const sizeValue = String(opts.size || opts.ratio || '').trim()
    if (sizeValue) requestBody.size = sizeValue
    const qualityValue = String(opts.quality || opts.resolution || '').trim()
    if (qualityValue) requestBody.quality = qualityValue

    const hasRef = filteredRefs.length > 0
    const normalizedBody = hasRef
      ? appendImageReferencesToRequestBody(requestBody, filteredRefs)
      : requestBody

    const saved = await createGenerationTask({
      source: ASSISTANT_SOURCE,
      sessionId: activeSessionId.value || undefined,
      type: 'image',
      requestMode: hasRef ? 'image-edit' : 'image-generation',
      prompt: prompt || '',
      modelKey,
      ratio: sizeValue || undefined,
      resolution: qualityValue || undefined,
      referenceImages: hasRef ? [...filteredRefs] : [],
      requestBody: normalizedBody,
    })

    const taskId = String(saved?.id || '').trim()
    if (!taskId) throw new Error('图片任务创建失败')

    const controller = new AbortController()
    registerStream(controller)

    await subscribeGenerationTaskEvents(taskId, {
      signal: controller.signal,
      onEvent: (event) => {
        if (event.type === 'snapshot' || event.type === 'completed') {
          const urls = Array.isArray(event.record?.images)
            ? event.record.images.filter(Boolean)
            : []
          if (urls.length) {
            aiMsg.images = urls
            aiMsg.totalCount = urls.length
            aiMsg.loading = false
            scrollToBottom()
          }
        }
        if (event.type === 'failed') {
          aiMsg.error = String(event.message || event.record?.error || '图片生成失败')
          aiMsg.loading = false
          scrollToBottom()
        }
        if (event.type === 'stopped') {
          aiMsg.error = aiMsg.error || '任务已停止'
          aiMsg.loading = false
        }
      },
    })
  } catch (err) {
    console.error('[RightPanel] image generation failed', err)
    aiMsg.error = err?.message || '图片生成失败'
    aiMsg.loading = false
    scrollToBottom()
  }
}

// 调用流式对话 API（走 createGenerationTask({ type:'agent' }) + SSE 订阅，后端持久化 record，刷新可恢复）
const runChatStream = async (prompt, aiMsg) => {
  try {
    const fallbackKey = getDefaultChatModelKey() || ''
    const { providerId, modelKey } = resolveGenerationTaskModel({
      modelKey: fallbackKey,
      fallbackModelKey: fallbackKey,
      category: 'CHAT',
      missingModelMessage: '未匹配到有效对话模型，请先在后台配置模型',
    })
    const saved = await createGenerationTask({
      source: ASSISTANT_SOURCE,
      sessionId: activeSessionId.value || undefined,
      type: 'agent',
      prompt,
      modelKey,
      requestBody: {
        model: modelKey,
        providerId,
        messages: [{ role: 'user', content: prompt }],
        stream: true,
      },
    })

    const taskId = String(saved?.id || '').trim()
    if (!taskId) throw new Error('对话任务创建失败')

    const controller = new AbortController()
    registerStream(controller)
    aiMsg.content = ''

    await subscribeGenerationTaskEvents(taskId, {
      signal: controller.signal,
      onEvent: (event) => {
        if (event.type === 'content_delta') {
          if (typeof event.delta === 'string' && event.delta) {
            aiMsg.content += event.delta
            scrollToBottom()
          } else if (typeof event.content === 'string') {
            aiMsg.content = event.content
            scrollToBottom()
          }
          return
        }
        if (event.type === 'snapshot') {
          const snapshotContent = String(event.record?.content || '')
          if (snapshotContent && snapshotContent.length > aiMsg.content.length) {
            aiMsg.content = snapshotContent
            scrollToBottom()
          }
          return
        }
        if (event.type === 'completed') {
          const finalContent = String(event.record?.content || '')
          if (finalContent) aiMsg.content = finalContent
          aiMsg.loading = false
          scrollToBottom()
          return
        }
        if (event.type === 'failed') {
          aiMsg.error = String(event.message || event.record?.error || '对话失败')
          aiMsg.loading = false
          scrollToBottom()
          return
        }
        if (event.type === 'stopped') {
          aiMsg.error = aiMsg.error || '任务已停止'
          aiMsg.loading = false
        }
      },
    })
  } catch (err) {
    if (err?.name === 'AbortError') return
    console.error('[RightPanel] chat stream failed', err)
    aiMsg.error = err?.message || '对话失败'
    aiMsg.loading = false
    scrollToBottom()
  }
}

// 发送消息
const sendMessage = async () => {
  const content = inputMessage.value.trim()
  const hasImagesLocal = uploadedImages.value.length > 0

  if (!content && !hasImagesLocal) return

  // 确保有活跃会话（首次发送会自动定位到默认会话）
  try {
    await ensureSession()
  } catch (err) {
    console.error('[RightPanel] ensureSession failed', err)
    return
  }

  hasMessages.value = true

  const userId = Date.now()
  const refImages = uploadedImages.value.map(img => img.src)

  if (hasImagesLocal) {
    messages.value.push({
      id: userId,
      type: 'user-with-ref',
      referenceImages: refImages,
      content: content || '请根据图片生成',
    })
  } else {
    messages.value.push({
      id: userId,
      type: 'user',
      content,
    })
  }

  // 清空输入
  inputMessage.value = ''
  uploadedImages.value = []
  scrollToBottom()

  // 路由到对应模型 API：有参考图 / 显式选 image → 图片生成；否则走文本对话
  const goImage = hasImagesLocal || lastCreationType.value === 'image'
  if (goImage) {
    messages.value.push({
      id: userId + 1,
      type: 'ai-images',
      summary: (content || '图片生成').slice(0, 10) + (content.length > 10 ? '...' : ''),
      collapsed: false,
      images: [],
      totalCount: 0,
      loading: true,
      error: '',
    })
    scrollToBottom()
    await runImageGeneration(content || '请根据参考图生成', refImages, tailMessage())
  } else {
    messages.value.push({
      id: userId + 1,
      type: 'ai-text',
      content: '',
      loading: true,
      error: '',
    })
    scrollToBottom()
    await runChatStream(content, tailMessage())
  }
}

// 处理 ContentGenerator 发送事件
const handlePromptSend = (message, type, options) => {
  inputMessage.value = message
  lastCreationType.value = type || 'agent'
  lastImageOptions.value = options && typeof options === 'object' ? options : {}
  uploadedImages.value = Array.isArray(options?.referenceImages)
    ? options.referenceImages.map((src, index) => ({
        id: Date.now() + index + Math.random(),
        src,
        name: `reference-${index + 1}`,
      }))
    : []
  void sendMessage()
}

// 回车发送
const handleKeydown = (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    void sendMessage()
  }
}

// 监听从中间底部传来的消息（画布触发的入口）：作为文本对话发起
watch(() => props.initialMessage, async (newMessage) => {
  if (!newMessage || !newMessage.trim()) return

  // 确保有活跃会话再发送
  try {
    await ensureSession()
  } catch (err) {
    console.error('[RightPanel] ensureSession failed', err)
    return
  }

  hasMessages.value = true
  const userId = Date.now()
  messages.value.push({
    id: userId,
    type: 'user',
    content: newMessage,
  })

  emit('message-received')
  scrollToBottom()

  messages.value.push({
    id: userId + 1,
    type: 'ai-text',
    content: '',
    loading: true,
    error: '',
  })
  scrollToBottom()
  await runChatStream(newMessage, tailMessage())
})

// 计算内容生成器高度（用于任务指示器定位）
const contentGeneratorHeight = computed(() => hasMessages.value ? 102 : 102)
</script>

<template>
  <div class="agent-X3m2wp">
    <div class="chat-container">
      <!-- 头部 -->
      <div class="chat-header">
        <div
          ref="sessionListAnchor"
          class="trigger-container"
          tabindex="0"
          role="button"
          @click="openSessionList"
        >
          <div class="lv-typography title-vBcivv">{{ headerTitleText }}</div>
          <div class="arrow-icon-uG49Bu">
            <svg width="14" height="14" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" fill="none" role="presentation" xmlns="http://www.w3.org/2000/svg">
              <g>
                <path data-follow-fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" d="M21.01 7.982A1.2 1.2 0 0 1 21 9.679l-8.156 8.06a1.2 1.2 0 0 1-1.688 0L3 9.68a1.2 1.2 0 0 1 1.687-1.707L12 15.199l7.313-7.227a1.2 1.2 0 0 1 1.697.01Z" fill="currentColor"></path>
              </g>
            </svg>
          </div>
        </div>
        <div class="actions-bl5UWA">
          <!-- 筛选按钮 -->
<!--          <div class="filter-button">
            <svg width="16" height="16" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" fill="none" role="presentation" xmlns="http://www.w3.org/2000/svg" class="filter-icon">
              <g>
                <path data-follow-fill="currentColor" d="M4.927 2.86a2 2 0 0 0-2 2v1.672a3 3 0 0 0 .879 2.121l2.828 2.829a1 1 0 0 1 .293.707v4.605a2 2 0 0 0 .971 1.715l3.757 2.254a1.5 1.5 0 0 0 2.272-1.286V12.19a1 1 0 0 1 .293-.707l2.828-2.829a3 3 0 0 0 .88-2.121V4.86a2 2 0 0 0-2-2h-11Zm0 2h11v1.672a1 1 0 0 1-.293.707l-2.828 2.828a3 3 0 0 0-.879 2.122v6.405l-3-1.8v-4.605a3 3 0 0 0-.879-2.122L5.22 7.24a1 1 0 0 1-.293-.707V4.86Zm11 8.14a1 1 0 0 1 1-1h5a1 1 0 1 1 0 2h-5a1 1 0 0 1-1-1Zm0 4a1 1 0 0 1 1-1h3a1 1 0 1 1 0 2h-3a1 1 0 0 1-1-1Z" clip-rule="evenodd" fill-rule="evenodd" fill="currentColor"></path>
              </g>
            </svg>
          </div>-->
          <!-- 新建对话按钮 -->
          <div class="operation-button-bwA7yT" title="新建对话" @click="handleSessionCreate">
            <svg width="16" height="16" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" fill="none" role="presentation" xmlns="http://www.w3.org/2000/svg">
              <g>
                <path data-follow-fill="currentColor" d="M17.5 2.5A4.5 4.5 0 0 1 22 6.998l.004 7.5a4.5 4.5 0 0 1-4.5 4.503h-5.027a1 1 0 0 0-.542.16l-4.15 2.68A1 1 0 0 1 6.241 21v-2.009a4.5 4.5 0 0 1-4.238-4.49L2 7.003A4.5 4.5 0 0 1 6.5 2.5h11Zm-11 2A2.5 2.5 0 0 0 4 7.001l.004 7.501a2.5 2.5 0 0 0 2.5 2.499h.738a1 1 0 0 1 1 1v1.163l2.609-1.684a2.999 2.999 0 0 1 1.626-.479h5.027a2.5 2.5 0 0 0 2.5-2.502L20 6.999A2.5 2.5 0 0 0 17.5 4.5h-11ZM12 7.2a1 1 0 0 1 1 1v1.5h1.5a1 1 0 1 1 0 2H13v1.5a1 1 0 1 1-2 0v-1.5H9.5a1 1 0 1 1 0-2H11V8.2a1 1 0 0 1 1-1Z" fill="currentColor"></path>
              </g>
            </svg>
          </div>
          <!-- 关闭面板按钮 -->
          <div class="operation-button-bwA7yT" @click="emit('close')">
            <svg width="16" height="16" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" fill="none" role="presentation" xmlns="http://www.w3.org/2000/svg">
              <g>
                <path data-follow-fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" d="M7 12a1 1 0 0 1 1-1h10.312L14.29 6.977a1 1 0 0 1 1.414-1.414l5.728 5.73a1 1 0 0 1 0 1.414l-5.728 5.73a1 1 0 1 1-1.414-1.414L18.31 13H8a1 1 0 0 1-1-1Zm-2.998 9a1 1 0 0 1-1-1L3 4a1 1 0 1 1 2 0l.002 16a1 1 0 0 1-1 1Z" fill="currentColor"></path>
              </g>
            </svg>
          </div>
        </div>
      </div>

      <!-- 会话列表浮层 -->
      <AssistantSessionList
        :visible="sessionListVisible"
        :sessions="assistantSessions"
        :active-id="activeSessionId"
        :anchor="sessionListAnchor"
        @close="closeSessionList"
        @create="handleSessionCreate"
        @select="handleSessionSelect"
        @rename="handleSessionRename"
        @delete="handleSessionDelete"
      />

      <!-- 隐藏的文件上传输入框 -->
      <input type="file" multiple accept="image/*" class="hidden-file-input" ref="fileInputRef" @change="handleFileChange">

      <!-- 空状态 - 使用可复用组件 -->
      <SidebarEmptyState
        v-if="!hasMessages"
        @upload="triggerUpload"
      />

      <!-- 消息列表 -->
      <div v-else class="chat-messages-list" ref="messagesContainer">
        <template v-for="msg in messages" :key="msg.id">
          <!-- 用户消息（右对齐） -->
          <div v-if="msg.type === 'user'" class="message-row user-MkS7tH">
            <div class="user-bubble">{{ msg.content }}</div>
          </div>

          <!-- AI 图片回复 -->
          <div v-else-if="msg.type === 'ai-images'" class="message-row ai">
            <div class="ai-block">
              <!-- 摘要标题 -->
              <div class="summary-header" @click="toggleCollapse(msg)">
                <span>{{ msg.summary }}</span>
                <svg :class="{ 'rotated-Kj9mNl': msg.collapsed }" width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M21.01 7.982A1.2 1.2 0 0 1 21 9.679l-8.156 8.06a1.2 1.2 0 0 1-1.688 0L3 9.68a1.2 1.2 0 0 1 1.687-1.707L12 15.199l7.313-7.227a1.2 1.2 0 0 1 1.697.01Z" fill="currentColor"/>
                </svg>
              </div>
              <!-- 加载占位 -->
              <div v-if="msg.loading && !msg.images.length" class="ai-images-loading">
                <span class="ai-images-spinner" />
                <span>图片生成中…</span>
              </div>
              <!-- 错误 -->
              <div v-else-if="msg.error" class="ai-images-error">{{ msg.error }}</div>
              <!-- 图片网格 -->
              <div v-else class="images-row" v-show="!msg.collapsed">
                <div v-for="(img, idx) in msg.images" :key="idx" class="image-cell" @click="openPreview(img)">
                  <img :src="img" />
                  <button class="image-cell-add" title="添加到画布" @click.stop="handleAddImageToCanvas(img)">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
                    </svg>
                  </button>
                  <div v-if="idx === msg.images.length - 1 && msg.totalCount > msg.images.length" class="more-badge">
                    {{ msg.totalCount - msg.images.length }}+
                  </div>
                </div>
              </div>
              <!-- AI 提示 -->
              <div class="ai-notice">以上内容由 AI 生成</div>
              <!-- 操作按钮 -->
<!--              <div class="action-row">
                <div class="action-left">
                  <button class="action-btn-Wp3kLl">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="m8.56 5.73 3.95-2.78a.5.5 0 0 1 .79.41v2.23h2.72v2H9.19a1 1 0 0 1-.63-.23c-.52-.36-.61-1.2 0-1.63Z" fill="currentColor"/></svg>
                    <span>重新生成</span>
                  </button>
                  <button class="action-btn-Wp3kLl icon-only-Kj8mNp">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M7.06 10.15c-.2 0-.39.03-.58.06.06-.21.13-.42.23-.61.1-.28.26-.52.42-.76.13-.26.37-.44.54-.66.18-.22.43-.36.62-.54.19-.19.44-.28.64-.42.21-.12.39-.25.58-.31l.48-.2a.54.54 0 0 0 .31-.62l-.19-.76a.56.56 0 0 0-.67-.4l-.62.15c-.24.05-.5.17-.79.28-.29.13-.62.21-.92.42-.31.2-.67.36-.98.62-.3.27-.67.5-.94.85-.3.32-.59.66-.82 1.04-.26.37-.44.77-.63 1.17-.17.4-.31.8-.42 1.2a10.83 10.83 0 0 0-.34 2.19c-.03.64-.01 1.18.02 1.57.01.18.04.36.06.48l.02.15.02-.01a4.04 4.04 0 1 0 3.95-4.88Zm9.87 0c-.2 0-.39.03-.58.06.06-.21.12-.42.23-.61.1-.28.26-.52.42-.76.13-.26.37-.44.54-.66.18-.22.43-.36.62-.54.19-.19.44-.28.64-.42.21-.12.39-.25.58-.31l.48-.2a.54.54 0 0 0 .31-.62l-.19-.76a.56.56 0 0 0-.67-.4l-.62.15c-.24.04-.5.17-.79.28-.28.13-.61.21-.92.42-.31.2-.66.36-.98.62-.3.27-.67.5-.94.85-.3.32-.59.66-.82 1.04-.26.37-.44.77-.63 1.17-.17.4-.31.8-.42 1.2a10.83 10.83 0 0 0-.34 2.19c-.03.64-.01 1.18.02 1.57.01.18.04.36.06.48l.02.15.02-.01a4.04 4.04 0 1 0 3.95-4.88Z" fill="currentColor"/></svg>
                  </button>
                </div>
                <div class="action-right">
                  <button class="feedback-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M11.1 0a3.7 3.7 0 0 1 3.7 3.7v2.6h4.4a2.8 2.8 0 0 1 2.79 3.22l-1.24 8.1A2.8 2.8 0 0 1 17.96 20H5.1a3.08 3.08 0 0 1-3.09-2.67A1 1 0 0 1 2 17.2v-6.3c.21-1.48 1.48-2.78 3.1-2.9h1.8L10.19.59A1 1 0 0 1 11.1 0Z" fill="currentColor"/></svg>
                  </button>
                  <button class="feedback-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M18.89 4a3.08 3.08 0 0 1 3.1 2.67c0 .04 0 .09 0 .13v6.3c0 .04 0 .09 0 .13-.2 1.48-1.47 2.78-3.09 2.77h-1.8l-3.29 7.4a1 1 0 0 1-.91.6 3.7 3.7 0 0 1-3.7-3.7v-2.6h-4.4a2.8 2.8 0 0 1-2.8-3.22L3.24 6.38A2.8 2.8 0 0 1 6.03 4h12.86Z" fill="currentColor"/></svg>
                  </button>
                </div>
              </div>-->
            </div>
          </div>

          <!-- AI 文本流式回复 -->
          <div v-else-if="msg.type === 'ai-text'" class="message-row ai">
            <div class="ai-text-bubble">
              <div v-if="msg.content" class="ai-text-content">{{ msg.content }}</div>
              <div v-else-if="msg.loading" class="ai-text-typing">
                <span class="ai-text-dot" />
                <span class="ai-text-dot" />
                <span class="ai-text-dot" />
              </div>
              <div v-if="msg.error" class="ai-text-error">{{ msg.error }}</div>
            </div>
          </div>

          <!-- 用户消息（带参考图）：右对齐气泡 + 图片缩略图 -->
          <div v-else-if="msg.type === 'user-with-ref'" class="message-row user-with-ref-row">
            <div class="user-with-ref-bubble">
              <div v-if="msg.referenceImages?.length" class="user-with-ref-thumbs">
                <div
                  v-for="(imageSrc, index) in msg.referenceImages"
                  :key="`${msg.id}-${index}`"
                  class="user-with-ref-thumb"
                  @click="openPreview(imageSrc)"
                >
                  <img :src="imageSrc" alt="参考图" />
                </div>
              </div>
              <div v-if="msg.content" class="user-with-ref-text">{{ msg.content }}</div>
            </div>
          </div>

          <!-- 生成的图片组 -->
          <div v-else-if="msg.type === 'generated-images'" class="message-row">
            <div class="generated-grid">
              <div v-for="(img, idx) in msg.images" :key="idx" class="gen-image-cell" @click="openPreview(img)">
                <img :src="img" />
              </div>
            </div>
            <!-- 操作按钮 -->
            <div class="gen-actions">
              <button class="action-btn-Wp3kLl">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M3.76 8a2.5 2.5 0 0 1 2.5-2.5h10.77a2.5 2.5 0 0 1 2.5 2.5v1.78a3.25 3.25 0 0 1 2-.08V8a4.5 4.5 0 0 0-4.5-4.5H6.26a4.5 4.5 0 0 0-4.5 4.5v7.93a4.5 4.5 0 0 0 4.5 4.5h5.84a2.44 2.44 0 0 1-.05-.57v-1.43H6.26a2.5 2.5 0 0 1-2.5-2.5V8Zm17.67 3.96a1 1 0 0 0-1.41 0l-5.77 5.7a.25.25 0 0 0-.07.18v2.37c0 .14.11.25.25.25h2.35a.25.25 0 0 0 .18-.08l5.71-5.79a1 1 0 0 0 0-1.41l-1.22-1.22Z" fill="currentColor"/></svg>
                <span>重新编辑</span>
              </button>
              <button class="action-btn-Wp3kLl">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="m8.56 5.73 3.95-2.78a.5.5 0 0 1 .79.41v2.23h2.72v2H9.19a1 1 0 0 1-.63-.23c-.52-.36-.61-1.2 0-1.63Z" fill="currentColor"/></svg>
                <span>再次生成</span>
              </button>
            </div>
          </div>
        </template>
      </div>

      <!-- 底部内容生成器 -->
      <ContentGenerator
        class="dimension-layout-FUl4Nj canvas-layout content-generator-XxJXPs"
        style="--content-generator-collapse-transition-duration:350ms;--content-generator-collapse-transition-timing-function:cubic-bezier(0.15,0.75,0.3,1)"
        layout="sidebar"
        :collapsible="false"
        :default-expanded="true"
        popup-placement="top"
        @send="handlePromptSend"
      />

      <!-- 任务指示器容器 -->
      <div
        data-task-indicator-container="true"
        class="task-indicator-container-m3Oy09"
        :style="`--content-generator-collapse-transition-duration:350ms;--content-generator-collapse-transition-timing-function:cubic-bezier(0.15,0.75,0.3,1);--content-generator-height:${contentGeneratorHeight}px`"
      ></div>
    </div>

    <!-- 图片预览弹窗 -->
    <Teleport to="body">
      <div v-if="previewImage" class="image-preview-overlay" @click="closePreview">
        <div class="preview-container" @click.stop>
          <img :src="previewImage" class="preview-image" />
          <button class="preview-close" @click="closePreview">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M19.58 6.12a1.2 1.2 0 0 0-1.7-1.7L12 10.3 6.12 4.42a1.2 1.2 0 1 0-1.7 1.7L10.3 12l-5.88 5.88a1.2 1.2 0 0 0 1.7 1.7L12 13.7l5.88 5.88a1.2 1.2 0 1 0 1.7-1.7L13.7 12l5.88-5.88Z" fill="currentColor"/>
            </svg>
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
/* AI 图片加载/错误态 */
.ai-images-loading {
  align-items: center;
  color: var(--text-tertiary);
  display: inline-flex;
  font-size: 12px;
  gap: 8px;
  padding: 16px 0;
}
.ai-images-spinner {
  animation: ai-spin 0.8s linear infinite;
  border: 2px solid var(--stroke-secondary);
  border-radius: 50%;
  border-top-color: var(--brand-main-default);
  display: inline-block;
  height: 16px;
  width: 16px;
}
@keyframes ai-spin { to { transform: rotate(360deg); } }
.ai-images-error {
  color: #ef4444;
  font-size: 12px;
  padding: 12px 0;
}

/* 单图右上角"加入画布" + 按钮 */
.image-cell {
  position: relative;
}
.image-cell-add {
  align-items: center;
  background: rgba(0, 0, 0, 0.55);
  border: 0;
  border-radius: 50%;
  color: #fff;
  cursor: pointer;
  display: inline-flex;
  height: 22px;
  justify-content: center;
  opacity: 0;
  position: absolute;
  right: 4px;
  top: 4px;
  transition: opacity 0.15s ease, transform 0.15s ease;
  width: 22px;
}
.image-cell:hover .image-cell-add { opacity: 1; }
.image-cell-add:hover { transform: scale(1.08); }

/* AI 文本流式回复气泡 */
.message-row.ai > .ai-text-bubble {
  background: var(--bg-block-secondary, rgba(255, 255, 255, 0.04));
  border-radius: 16px;
  color: var(--text-primary);
  font-size: 14px;
  line-height: 1.6;
  max-width: 85%;
  padding: 12px 16px;
  white-space: pre-wrap;
  word-break: break-word;
}
.ai-text-error {
  color: #ef4444;
  font-size: 12px;
  margin-top: 6px;
}
.ai-text-typing {
  align-items: center;
  display: inline-flex;
  gap: 4px;
  padding: 4px 0;
}
.ai-text-dot {
  animation: ai-typing 1s infinite ease-in-out;
  background: var(--text-tertiary);
  border-radius: 50%;
  display: inline-block;
  height: 6px;
  width: 6px;
}
.ai-text-dot:nth-child(2) { animation-delay: 0.15s; }
.ai-text-dot:nth-child(3) { animation-delay: 0.3s; }
@keyframes ai-typing {
  0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
  30% { opacity: 1; transform: translateY(-2px); }
}

/* 用户消息（带参考图）：右对齐气泡 + 缩略图 */
.message-row.user-with-ref-row {
  display: flex;
  justify-content: flex-end;
}
.user-with-ref-bubble {
  align-items: flex-end;
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-width: 85%;
}
.user-with-ref-thumbs {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: flex-end;
}
.user-with-ref-thumb {
  background: var(--bg-block-secondary, rgba(255, 255, 255, 0.06));
  border-radius: 8px;
  cursor: pointer;
  flex: 0 0 auto;
  height: 72px;
  overflow: hidden;
  transition: transform 0.15s ease;
  width: 72px;
}
.user-with-ref-thumb:hover {
  transform: scale(1.03);
}
.user-with-ref-thumb img {
  display: block;
  height: 100%;
  object-fit: cover;
  width: 100%;
}
.user-with-ref-text {
  background: var(--bg-block-primary-default);
  border-radius: 16px;
  color: var(--text-primary);
  font-size: 14px;
  line-height: 1.5;
  padding: 12px 16px;
  word-break: break-word;
}

/* 图片预览弹窗 */
.image-preview-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100000;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.preview-container {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
}

.preview-image {
  max-width: 90vw;
  max-height: 90vh;
  object-fit: contain;
  border-radius: 8px;
  animation: scaleIn 0.2s ease;
}

@keyframes scaleIn {
  from { transform: scale(0.9); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.preview-close {
  position: absolute;
  top: -40px;
  right: 0;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 50%;
  color: white;
  cursor: pointer;
  transition: background 0.2s;
}

.preview-close:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>
