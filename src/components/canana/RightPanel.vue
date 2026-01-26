<script setup>
import { ref, nextTick, watch, computed } from 'vue'
import ContentGenerator from '@/components/generate/ContentGenerator.vue'
import SidebarEmptyState from '@/components/canana/SidebarEmptyState.vue'

const props = defineProps({
  title: { type: String, default: '' },
  visible: { type: Boolean, default: false },
  initialMessage: { type: String, default: '' }
})

const emit = defineEmits(['close', 'message-received'])

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

// 发送消息
const sendMessage = () => {
  const content = inputMessage.value.trim()
  const hasImagesLocal = uploadedImages.value.length > 0

  if (!content && !hasImagesLocal) return

  // 标记有消息
  hasMessages.value = true

  // 添加用户消息
  const newId = Date.now()

  if (hasImagesLocal) {
    // 带图片的消息
    messages.value.push({
      id: newId,
      type: 'user-with-ref',
      avatar: uploadedImages.value[0].src,
      content: content || '请根据图片生成',
      meta: `图片 ${uploadedImages.value.length} 张`
    })
  } else {
    // 纯文本消息
    messages.value.push({
      id: newId,
      type: 'user',
      content
    })
  }

  // 清空输入
  inputMessage.value = ''
  uploadedImages.value = []

  // 滚动到底部
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })

  // 模拟AI回复（2秒后）
  setTimeout(() => {
    messages.value.push({
      id: Date.now(),
      type: 'ai-images',
      summary: (content || '图片生成').slice(0, 10) + '...',
      collapsed: false,
      images: [
        `https://picsum.photos/200/267?random=${Date.now()}`,
        `https://picsum.photos/200/267?random=${Date.now() + 1}`,
        `https://picsum.photos/200/267?random=${Date.now() + 2}`,
        `https://picsum.photos/200/267?random=${Date.now() + 3}`,
      ],
      totalCount: 4
    })
    nextTick(() => {
      if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
      }
    })
  }, 2000)
}

// 处理 ContentGenerator 发送事件
const handlePromptSend = (message, type) => {
  inputMessage.value = message
  sendMessage()
}

// 回车发送
const handleKeydown = (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendMessage()
  }
}

// 监听从中间底部传来的消息
watch(() => props.initialMessage, (newMessage) => {
  if (newMessage && newMessage.trim()) {
    // 标记有消息
    hasMessages.value = true

    // 添加用户消息
    messages.value.push({
      id: Date.now(),
      type: 'user',
      content: newMessage
    })

    // 通知父组件消息已接收
    emit('message-received')

    // 滚动到底部
    nextTick(() => {
      if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
      }
    })

    // 模拟AI回复
    setTimeout(() => {
      messages.value.push({
        id: Date.now(),
        type: 'ai-images',
        summary: newMessage.slice(0, 10) + '...',
        collapsed: false,
        images: [
          `https://picsum.photos/200/267?random=${Date.now()}`,
          `https://picsum.photos/200/267?random=${Date.now() + 1}`,
          `https://picsum.photos/200/267?random=${Date.now() + 2}`,
          `https://picsum.photos/200/267?random=${Date.now() + 3}`,
        ],
        totalCount: 4
      })
      nextTick(() => {
        if (messagesContainer.value) {
          messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
        }
      })
    }, 2000)
  }
})

// 计算内容生成器高度（用于任务指示器定位）
const contentGeneratorHeight = computed(() => hasMessages.value ? 102 : 102)
</script>

<template>
  <div class="agent-X3m2wp">
    <div class="chat-container-R89Jq6">
      <!-- 头部 -->
      <div class="chat-header-irtdzC">
        <div class="trigger-container-vbLYgU" tabindex="0">
          <div class="lv-typography title-vBcivv">{{ title || '未命名对话' }}</div>
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
          <div class="filter-button-IXmviq">
            <svg width="16" height="16" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" fill="none" role="presentation" xmlns="http://www.w3.org/2000/svg" class="filter-icon-lD9OcS">
              <g>
                <path data-follow-fill="currentColor" d="M4.927 2.86a2 2 0 0 0-2 2v1.672a3 3 0 0 0 .879 2.121l2.828 2.829a1 1 0 0 1 .293.707v4.605a2 2 0 0 0 .971 1.715l3.757 2.254a1.5 1.5 0 0 0 2.272-1.286V12.19a1 1 0 0 1 .293-.707l2.828-2.829a3 3 0 0 0 .88-2.121V4.86a2 2 0 0 0-2-2h-11Zm0 2h11v1.672a1 1 0 0 1-.293.707l-2.828 2.828a3 3 0 0 0-.879 2.122v6.405l-3-1.8v-4.605a3 3 0 0 0-.879-2.122L5.22 7.24a1 1 0 0 1-.293-.707V4.86Zm11 8.14a1 1 0 0 1 1-1h5a1 1 0 1 1 0 2h-5a1 1 0 0 1-1-1Zm0 4a1 1 0 0 1 1-1h3a1 1 0 1 1 0 2h-3a1 1 0 0 1-1-1Z" clip-rule="evenodd" fill-rule="evenodd" fill="currentColor"></path>
              </g>
            </svg>
          </div>
          <!-- 新建对话按钮（禁用） -->
          <div :class="['operation-button-bwA7yT', { 'disabled-kGgYs7': !hasMessages }]">
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

      <!-- 隐藏的文件上传输入框 -->
      <input type="file" multiple accept="image/*" class="hidden-file-input-sjqNJu" ref="fileInputRef" @change="handleFileChange">

      <!-- 空状态 - 使用可复用组件 -->
      <SidebarEmptyState
        v-if="!hasMessages"
        @upload="triggerUpload"
      />

      <!-- 消息列表 -->
      <div v-else class="chat-messages-list-KjR9xE" ref="messagesContainer">
        <template v-for="msg in messages" :key="msg.id">
          <!-- 用户消息（右对齐） -->
          <div v-if="msg.type === 'user'" class="message-row-FjP2xZ user-MkS7tH">
            <div class="user-bubble-Wp3kLl">{{ msg.content }}</div>
          </div>

          <!-- AI 图片回复 -->
          <div v-else-if="msg.type === 'ai-images'" class="message-row-FjP2xZ ai-RnT4wK">
            <div class="ai-block-RtY5vW">
              <!-- 摘要标题 -->
              <div class="summary-header-Hj8kPl" @click="toggleCollapse(msg)">
                <span>{{ msg.summary }}</span>
                <svg :class="{ 'rotated-Kj9mNl': msg.collapsed }" width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M21.01 7.982A1.2 1.2 0 0 1 21 9.679l-8.156 8.06a1.2 1.2 0 0 1-1.688 0L3 9.68a1.2 1.2 0 0 1 1.687-1.707L12 15.199l7.313-7.227a1.2 1.2 0 0 1 1.697.01Z" fill="currentColor"/>
                </svg>
              </div>
              <!-- 图片网格 -->
              <div class="images-row-Wp4kMn" v-show="!msg.collapsed">
                <div v-for="(img, idx) in msg.images" :key="idx" class="image-cell-Rk9pLq" @click="openPreview(img)">
                  <img :src="img" />
                  <div v-if="idx === msg.images.length - 1 && msg.totalCount > msg.images.length" class="more-badge-Tj8kNp">
                    {{ msg.totalCount - msg.images.length }}+
                  </div>
                </div>
              </div>
              <!-- AI 提示 -->
              <div class="ai-notice-Kp3mRl">以上内容由 AI 生成</div>
              <!-- 操作按钮 -->
              <div class="action-row-Hn7kLp">
                <div class="action-left-Rn9kMp">
                  <button class="action-btn-Wp3kLl">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="m8.56 5.73 3.95-2.78a.5.5 0 0 1 .79.41v2.23h2.72v2H9.19a1 1 0 0 1-.63-.23c-.52-.36-.61-1.2 0-1.63Z" fill="currentColor"/></svg>
                    <span>重新生成</span>
                  </button>
                  <button class="action-btn-Wp3kLl icon-only-Kj8mNp">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M7.06 10.15c-.2 0-.39.03-.58.06.06-.21.13-.42.23-.61.1-.28.26-.52.42-.76.13-.26.37-.44.54-.66.18-.22.43-.36.62-.54.19-.19.44-.28.64-.42.21-.12.39-.25.58-.31l.48-.2a.54.54 0 0 0 .31-.62l-.19-.76a.56.56 0 0 0-.67-.4l-.62.15c-.24.05-.5.17-.79.28-.29.13-.62.21-.92.42-.31.2-.67.36-.98.62-.3.27-.67.5-.94.85-.3.32-.59.66-.82 1.04-.26.37-.44.77-.63 1.17-.17.4-.31.8-.42 1.2a10.83 10.83 0 0 0-.34 2.19c-.03.64-.01 1.18.02 1.57.01.18.04.36.06.48l.02.15.02-.01a4.04 4.04 0 1 0 3.95-4.88Zm9.87 0c-.2 0-.39.03-.58.06.06-.21.12-.42.23-.61.1-.28.26-.52.42-.76.13-.26.37-.44.54-.66.18-.22.43-.36.62-.54.19-.19.44-.28.64-.42.21-.12.39-.25.58-.31l.48-.2a.54.54 0 0 0 .31-.62l-.19-.76a.56.56 0 0 0-.67-.4l-.62.15c-.24.04-.5.17-.79.28-.28.13-.61.21-.92.42-.31.2-.66.36-.98.62-.3.27-.67.5-.94.85-.3.32-.59.66-.82 1.04-.26.37-.44.77-.63 1.17-.17.4-.31.8-.42 1.2a10.83 10.83 0 0 0-.34 2.19c-.03.64-.01 1.18.02 1.57.01.18.04.36.06.48l.02.15.02-.01a4.04 4.04 0 1 0 3.95-4.88Z" fill="currentColor"/></svg>
                  </button>
                </div>
                <div class="action-right-Tp4kNl">
                  <button class="feedback-btn-Rn7kLp">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M11.1 0a3.7 3.7 0 0 1 3.7 3.7v2.6h4.4a2.8 2.8 0 0 1 2.79 3.22l-1.24 8.1A2.8 2.8 0 0 1 17.96 20H5.1a3.08 3.08 0 0 1-3.09-2.67A1 1 0 0 1 2 17.2v-6.3c.21-1.48 1.48-2.78 3.1-2.9h1.8L10.19.59A1 1 0 0 1 11.1 0Z" fill="currentColor"/></svg>
                  </button>
                  <button class="feedback-btn-Rn7kLp">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M18.89 4a3.08 3.08 0 0 1 3.1 2.67c0 .04 0 .09 0 .13v6.3c0 .04 0 .09 0 .13-.2 1.48-1.47 2.78-3.09 2.77h-1.8l-3.29 7.4a1 1 0 0 1-.91.6 3.7 3.7 0 0 1-3.7-3.7v-2.6h-4.4a2.8 2.8 0 0 1-2.8-3.22L3.24 6.38A2.8 2.8 0 0 1 6.03 4h12.86Z" fill="currentColor"/></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 用户消息（带参考图） -->
          <div v-else-if="msg.type === 'user-with-ref'" class="message-row-FjP2xZ user-ref-Kp9mNl">
            <div class="ref-avatar-Wp3kLl">
              <img :src="msg.avatar" />
            </div>
            <div class="ref-content-Rn8kMp">
              <div class="ref-text-Tj7kNl">{{ msg.content }}</div>
              <div class="ref-meta-Kp4mLp">{{ msg.meta }}</div>
            </div>
          </div>

          <!-- 生成的图片组 -->
          <div v-else-if="msg.type === 'generated-images'" class="message-row-FjP2xZ">
            <div class="generated-grid-Wp5kMn">
              <div v-for="(img, idx) in msg.images" :key="idx" class="gen-image-cell-Rk8pLq" @click="openPreview(img)">
                <img :src="img" />
              </div>
            </div>
            <!-- 操作按钮 -->
            <div class="gen-actions-Tp3kNl">
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
        class="dimension-layout-FUl4Nj canvas-layout-blZ0JP content-generator-XxJXPs"
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
