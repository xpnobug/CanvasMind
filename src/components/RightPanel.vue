<script setup>
import { ref, nextTick, watch } from 'vue'

const props = defineProps({
  title: { type: String, default: '' },
  visible: { type: Boolean, default: false },
  initialMessage: { type: String, default: '' }
})

const emit = defineEmits(['close', 'message-received'])

// 消息数据
const messages = ref([
  {
    id: 1,
    type: 'user',
    content: '一只可爱的蓝色猫咪'
  },
  {
    id: 2,
    type: 'ai-images',
    summary: '可爱蓝猫形象生成',
    collapsed: false,
    images: [
      'https://picsum.photos/200/267?random=1',
      'https://picsum.photos/200/267?random=2',
      'https://picsum.photos/200/267?random=3',
    ],
    totalCount: 7
  },
  {
    id: 3,
    type: 'user-with-ref',
    avatar: 'https://picsum.photos/40/40?random=10',
    content: '参考图1的角色特征，生成半身像表情包，大笑表情，双手捧腹，眼睛眯成一条线，嘴...',
    meta: '图片 4.1 | 3:4 | 2K'
  },
  {
    id: 4,
    type: 'generated-images',
    images: [
      'https://picsum.photos/200/267?random=11',
      'https://picsum.photos/200/267?random=12',
      'https://picsum.photos/200/267?random=13',
      'https://picsum.photos/200/267?random=14',
    ]
  }
])

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
  const hasImages = uploadedImages.value.length > 0
  
  if (!content && !hasImages) return
  
  // 添加用户消息
  const newId = Date.now()
  
  if (hasImages) {
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
</script>

<template>
  <aside class="right-panel" :class="{ open: visible }">
    <div class="chat-container">
      <!-- 顶部标题栏 -->
      <div class="chat-header">
        <div class="header-left">
          <span class="header-title">{{ title || '生成二次元手办多风格图片' }}</span>
          <svg class="dropdown-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M21.01 7.982A1.2 1.2 0 0 1 21 9.679l-8.156 8.06a1.2 1.2 0 0 1-1.688 0L3 9.68a1.2 1.2 0 0 1 1.687-1.707L12 15.199l7.313-7.227a1.2 1.2 0 0 1 1.697.01Z" fill="currentColor"/>
          </svg>
        </div>
        <div class="header-actions">
          <button class="header-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M4.927 2.86a2 2 0 0 0-2 2v1.672a3 3 0 0 0 .879 2.121l2.828 2.829a1 1 0 0 1 .293.707v4.605a2 2 0 0 0 .971 1.715l3.757 2.254a1.5 1.5 0 0 0 2.272-1.286V12.19a1 1 0 0 1 .293-.707l2.828-2.829a3 3 0 0 0 .88-2.121V4.86a2 2 0 0 0-2-2h-11Z" fill="currentColor"/>
            </svg>
          </button>
          <button class="header-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M17.5 2.5A4.5 4.5 0 0 1 22 7v7a4.5 4.5 0 0 1-4.5 4.5h-5a1 1 0 0 0-.54.16l-4.15 2.68A1 1 0 0 1 6.24 21v-2a4.5 4.5 0 0 1-4.24-4.5V7A4.5 4.5 0 0 1 6.5 2.5h11Z" fill="currentColor"/>
            </svg>
          </button>
          <button class="header-btn" @click="emit('close')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M7 12a1 1 0 0 1 1-1h10.3L14.3 7a1 1 0 0 1 1.4-1.4l5.7 5.7a1 1 0 0 1 0 1.4l-5.7 5.7a1 1 0 0 1-1.4-1.4l4-4H8a1 1 0 0 1-1-1Zm-3 9a1 1 0 0 1-1-1V4a1 1 0 1 1 2 0v16a1 1 0 0 1-1 1Z" fill="currentColor"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- 消息列表 -->
      <div class="chat-messages" ref="messagesContainer">
        <template v-for="msg in messages" :key="msg.id">
          <!-- 用户消息（右对齐） -->
          <div v-if="msg.type === 'user'" class="message-row user">
            <div class="user-bubble">{{ msg.content }}</div>
          </div>

          <!-- AI 图片回复 -->
          <div v-else-if="msg.type === 'ai-images'" class="message-row ai">
            <div class="ai-block">
              <!-- 摘要标题 -->
              <div class="summary-header" @click="toggleCollapse(msg)">
                <span>{{ msg.summary }}</span>
                <svg :class="{ rotated: msg.collapsed }" width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M21.01 7.982A1.2 1.2 0 0 1 21 9.679l-8.156 8.06a1.2 1.2 0 0 1-1.688 0L3 9.68a1.2 1.2 0 0 1 1.687-1.707L12 15.199l7.313-7.227a1.2 1.2 0 0 1 1.697.01Z" fill="currentColor"/>
                </svg>
              </div>
              <!-- 图片网格 -->
              <div class="images-row" v-show="!msg.collapsed">
                <div v-for="(img, idx) in msg.images" :key="idx" class="image-cell" @click="openPreview(img)">
                  <img :src="img" />
                  <div v-if="idx === msg.images.length - 1 && msg.totalCount > msg.images.length" class="more-badge">
                    {{ msg.totalCount - msg.images.length }}+
                  </div>
                </div>
              </div>
              <!-- AI 提示 -->
              <div class="ai-notice">以上内容由 AI 生成</div>
              <!-- 操作按钮 -->
              <div class="action-row">
                <div class="action-left">
                  <button class="action-btn"><svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="m8.56 5.73 3.95-2.78a.5.5 0 0 1 .79.41v2.23h2.72v2H9.19a1 1 0 0 1-.63-.23c-.52-.36-.61-1.2 0-1.63Z" fill="currentColor"/></svg><span>重新生成</span></button>
                  <button class="action-btn icon-only"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M7.06 10.15c-.2 0-.39.03-.58.06.06-.21.13-.42.23-.61.1-.28.26-.52.42-.76.13-.26.37-.44.54-.66.18-.22.43-.36.62-.54.19-.19.44-.28.64-.42.21-.12.39-.25.58-.31l.48-.2a.54.54 0 0 0 .31-.62l-.19-.76a.56.56 0 0 0-.67-.4l-.62.15c-.24.05-.5.17-.79.28-.29.13-.62.21-.92.42-.31.2-.67.36-.98.62-.3.27-.67.5-.94.85-.3.32-.59.66-.82 1.04-.26.37-.44.77-.63 1.17-.17.4-.31.8-.42 1.2a10.83 10.83 0 0 0-.34 2.19c-.03.64-.01 1.18.02 1.57.01.18.04.36.06.48l.02.15.02-.01a4.04 4.04 0 1 0 3.95-4.88Zm9.87 0c-.2 0-.39.03-.58.06.06-.21.12-.42.23-.61.1-.28.26-.52.42-.76.13-.26.37-.44.54-.66.18-.22.43-.36.62-.54.19-.19.44-.28.64-.42.21-.12.39-.25.58-.31l.48-.2a.54.54 0 0 0 .31-.62l-.19-.76a.56.56 0 0 0-.67-.4l-.62.15c-.24.04-.5.17-.79.28-.28.13-.61.21-.92.42-.31.2-.66.36-.98.62-.3.27-.67.5-.94.85-.3.32-.59.66-.82 1.04-.26.37-.44.77-.63 1.17-.17.4-.31.8-.42 1.2a10.83 10.83 0 0 0-.34 2.19c-.03.64-.01 1.18.02 1.57.01.18.04.36.06.48l.02.15.02-.01a4.04 4.04 0 1 0 3.95-4.88Z" fill="currentColor"/></svg></button>
                </div>
                <div class="action-right">
                  <button class="feedback-btn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M11.1 0a3.7 3.7 0 0 1 3.7 3.7v2.6h4.4a2.8 2.8 0 0 1 2.79 3.22l-1.24 8.1A2.8 2.8 0 0 1 17.96 20H5.1a3.08 3.08 0 0 1-3.09-2.67A1 1 0 0 1 2 17.2v-6.3c.21-1.48 1.48-2.78 3.1-2.9h1.8L10.19.59A1 1 0 0 1 11.1 0Z" fill="currentColor"/></svg></button>
                  <button class="feedback-btn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M18.89 4a3.08 3.08 0 0 1 3.1 2.67c0 .04 0 .09 0 .13v6.3c0 .04 0 .09 0 .13-.2 1.48-1.47 2.78-3.09 2.77h-1.8l-3.29 7.4a1 1 0 0 1-.91.6 3.7 3.7 0 0 1-3.7-3.7v-2.6h-4.4a2.8 2.8 0 0 1-2.8-3.22L3.24 6.38A2.8 2.8 0 0 1 6.03 4h12.86Z" fill="currentColor"/></svg></button>
                </div>
              </div>
            </div>
          </div>

          <!-- 用户消息（带参考图） -->
          <div v-else-if="msg.type === 'user-with-ref'" class="message-row user-ref">
            <div class="ref-avatar">
              <img :src="msg.avatar" />
            </div>
            <div class="ref-content">
              <div class="ref-text">{{ msg.content }}</div>
              <div class="ref-meta">{{ msg.meta }}</div>
            </div>
          </div>

          <!-- 生成的图片组 -->
          <div v-else-if="msg.type === 'generated-images'" class="message-row generated">
            <div class="generated-grid">
              <div v-for="(img, idx) in msg.images" :key="idx" class="gen-image-cell" @click="openPreview(img)">
                <img :src="img" />
              </div>
            </div>
            <!-- 操作按钮 -->
            <div class="gen-actions">
              <button class="action-btn"><svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M3.76 8a2.5 2.5 0 0 1 2.5-2.5h10.77a2.5 2.5 0 0 1 2.5 2.5v1.78a3.25 3.25 0 0 1 2-.08V8a4.5 4.5 0 0 0-4.5-4.5H6.26a4.5 4.5 0 0 0-4.5 4.5v7.93a4.5 4.5 0 0 0 4.5 4.5h5.84a2.44 2.44 0 0 1-.05-.57v-1.43H6.26a2.5 2.5 0 0 1-2.5-2.5V8Zm17.67 3.96a1 1 0 0 0-1.41 0l-5.77 5.7a.25.25 0 0 0-.07.18v2.37c0 .14.11.25.25.25h2.35a.25.25 0 0 0 .18-.08l5.71-5.79a1 1 0 0 0 0-1.41l-1.22-1.22Z" fill="currentColor"/></svg><span>重新编辑</span></button>
              <button class="action-btn"><svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="m8.56 5.73 3.95-2.78a.5.5 0 0 1 .79.41v2.23h2.72v2H9.19a1 1 0 0 1-.63-.23c-.52-.36-.61-1.2 0-1.63Z" fill="currentColor"/></svg><span>再次生成</span></button>
              <button class="action-btn icon-only"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M18.05 4.1a1 1 0 1 0-2 0v2.8a1 1 0 1 0 2 0v-.45h3.1a1 1 0 1 0 0-2h-3.1V4.1Zm-4 2.35H2.85a1 1 0 0 1 0-2h11.2v2Zm-7 3.25a1 1 0 0 0-1 1v.4H2.85a1 1 0 1 0 0 2h3.2v.4a1 1 0 1 0 2 0v-2.8a1 1 0 0 0-1-1Zm14.1 3.4H10.05v-2h11.1a1 1 0 1 1 0 2Z" fill="currentColor"/></svg></button>
              <button class="action-btn icon-only"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4Zm0 6a2 2 0 1 1 0-4 2 2 0 0 1 0 4Zm0 6a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z" fill="currentColor"/></svg></button>
            </div>
          </div>
        </template>
      </div>

      <!-- 底部输入区域 -->
      <div class="chat-input-wrapper">
        <div class="input-container">
          <!-- 上传的图片预览 + 添加按钮 -->
          <div class="upload-area" v-if="uploadedImages.length > 0">
            <div class="upload-content">
              <div 
                class="images-stack-wrapper"
                :class="{ expanded: imagesExpanded }"
                @mouseenter="imagesExpanded = true"
                @mouseleave="imagesExpanded = false; hoveredImageId = null"
              >
                <div class="images-container">
                  <div 
                    v-for="(img, idx) in uploadedImages" 
                    :key="img.id" 
                    class="stack-item"
                    :class="{ expanded: imagesExpanded }"
                    :style="{ 
                      '--stack-index': idx,
                      '--stack-total': uploadedImages.length,
                      '--rotate': imagesExpanded ? '0deg' : `${(idx - uploadedImages.length + 1) * 8}deg`,
                      '--translate-x': imagesExpanded ? `${idx * 62}px` : '0px',
                      zIndex: imagesExpanded ? (hoveredImageId === img.id ? 100 : 1) : idx
                    }"
                    @mouseenter="hoveredImageId = img.id"
                    @mouseleave="hoveredImageId = null"
                  >
                    <!-- 智能参考标签 - hover时显示 -->
                    <div class="smart-ref-tooltip" :class="{ visible: hoveredImageId === img.id && imagesExpanded }">
                      <span>智能参考</span>
                    </div>
                    <!-- 关闭按钮 - 在图片右上角 -->
                    <button 
                      class="close-image-btn" 
                      :class="{ visible: hoveredImageId === img.id && imagesExpanded }"
                      @click.stop="removeUploadedImage(img.id)"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M19.58 6.12a1.2 1.2 0 0 0-1.7-1.7L12 10.3 6.12 4.42a1.2 1.2 0 1 0-1.7 1.7L10.3 12l-5.88 5.88a1.2 1.2 0 0 0 1.7 1.7L12 13.7l5.88 5.88a1.2 1.2 0 1 0 1.7-1.7L13.7 12l5.88-5.88Z" fill="currentColor"/>
                      </svg>
                    </button>
                    <img :src="img.src" @click.stop="openPreview(img.src)" />
                  </div>
                  <!-- 添加按钮 -->
                  <button 
                    class="add-btn"
                    :class="{ expanded: imagesExpanded }"
                    :style="{ 
                      '--translate-x': imagesExpanded ? `${uploadedImages.length * 62}px` : '0px'
                    }"
                    @click.stop="triggerUpload"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M12 4a1 1 0 0 1 1 1v6h6a1 1 0 1 1 0 2h-6v6a1 1 0 1 1-2 0v-6H5a1 1 0 1 1 0-2h6V5a1 1 0 0 1 1-1Z" fill="currentColor"/>
                    </svg>
                  </button>
                </div>
              </div>
              <input 
                type="text" 
                v-model="inputMessage" 
                class="text-input" 
                placeholder="描述想要生成的图片"
                @keydown="handleKeydown"
              />
            </div>
          </div>
          
          <!-- 默认输入区域（无图片时） -->
          <div class="input-row" v-else>
            <input 
              type="text" 
              v-model="inputMessage" 
              class="text-input" 
              placeholder="输入内容"
              @keydown="handleKeydown"
            />
          </div>
          
          <!-- 下方：工具栏按钮 + 发送按钮 -->
          <div class="input-toolbar">
            <div class="toolbar-left">
              <button class="toolbar-btn active">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M11.8 5.79c1.25-.93 2.19-1.37 2.47-1.1.49.49-1.26 3.03-3.91 5.68-4.33 4.33-6.71 8.97-5.32 10.36.29.29.72.41 1.26.39.42.02.92-.07 1.48-.25-2.12.9-3.86 1-4.76.1-1.87-1.87.61-7.4 5.55-12.35l.02-.02.1-.1.06-.06.11-.11c.97-.95 1.96-1.8 2.94-2.55Zm5.55 11.57c1.53-1.53 3.2-2.35 3.72-1.82.53.52-.29 2.19-1.82 3.72-1.53 1.53-3.2 2.35-3.72 1.82-.53-.52.29-2.19 1.82-3.72Z" fill="currentColor"/></svg>
              </button>
              <button class="toolbar-btn" @click="triggerUpload">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15.15 2.49a4.48 4.48 0 0 1 3.14 1.32c.8.8 1.32 1.91 1.33 3.13 0 1.24-.51 2.5-1.62 3.61l-6.24 6.24c-.61.61-1.36.88-2.1.84a2.85 2.85 0 0 1-1.83-.84 2.85 2.85 0 0 1-.84-1.82c-.05-.75.23-1.49.84-2.1l5.21-5.21a1 1 0 0 1 1.41 1.41l-5.21 5.21c-.22.23-.26.42-.25.57.01.17.1.37.26.53a.85.85 0 0 0 .53.26c.15.01.34-.03.57-.25l6.24-6.24c.77-.77 1.03-1.54 1.03-2.18a2.46 2.46 0 0 0-.74-1.73 2.48 2.48 0 0 0-1.73-.73c-.65 0-1.41.26-2.18 1.02l-6.24 6.24c-1.16 1.16-1.57 2.38-1.54 3.46.03 1.1.52 2.14 1.3 2.92.78.78 1.83 1.27 2.93 1.3 1.08.03 2.29-.38 3.45-1.53l6.46-6.46a1 1 0 0 1 1.41 1.41l-6.46 6.46c-1.51 1.51-3.25 2.17-4.92 2.12-1.66-.05-3.17-.78-4.28-1.88-1.11-1.1-1.84-2.62-1.89-4.28-.05-1.67.61-3.41 2.12-4.93l6.24-6.24c1.1-1.1 2.36-1.61 3.6-1.61Z" fill="currentColor"/></svg>
              </button>
              <button class="toolbar-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M18.05 4.1a1 1 0 1 0-2 0v2.8a1 1 0 1 0 2 0v-.45h3.1a1 1 0 1 0 0-2h-3.1V4.1Zm-4 2.35H2.85a1 1 0 0 1 0-2h11.2v2Zm-7 3.25a1 1 0 0 0-1 1v.4H2.85a1 1 0 1 0 0 2h3.2v.4a1 1 0 1 0 2 0v-2.8a1 1 0 0 0-1-1Zm14.1 3.4H10.05v-2h11.1a1 1 0 1 1 0 2Zm-10.1 3a1 1 0 0 0-1 1v.4H2.85a1 1 0 1 0 0 2h3.2v.4a1 1 0 1 0 2 0v-2.8a1 1 0 0 0-1-1Zm14.1 3.4H10.05v-2h11.1a1 1 0 1 1 0 2Z" fill="currentColor"/></svg>
              </button>
              <button class="toolbar-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M11.61 2.25a8.5 8.5 0 0 1 6.67 13.76l3.41 3.41a1 1 0 1 1-1.41 1.41l-3.41-3.41a8.46 8.46 0 0 1-6.67 1.71v-2.04a6.5 6.5 0 1 0-5.1-6.34c0 .08 0 .17.01.25H3.11a8.5 8.5 0 0 1 8.5-8.75Z" fill="currentColor"/><path d="M7.77 12.57a.94.94 0 0 1 1.35 0 .98.98 0 0 1 0 1.37l-4 4.06a.95.95 0 0 1-1.35 0l-2.3-2.34a.98.98 0 0 1 0-1.37.94.94 0 0 1 1.35 0l1.62 1.65 3.32-3.38Z" fill="#00CAE0"/></svg>
              </button>
              <button class="toolbar-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M13.4 20.6c.29 0 .53.24.45.52a1.9 1.9 0 0 1-3.72-.32.19.19 0 0 1 .18-.2h3.09ZM11.99 1.5a7.95 7.95 0 0 1 7.95 7.95 7.94 7.94 0 0 1-3.76 6.75 2.95 2.95 0 0 1-2.94 2.75h-2.24s-.87 0-.87-.95.87-.95.87-.95h2.24l.1-.01c.53-.05.94-.5.94-1.04v-.35a.95.95 0 0 1 .51-.84A6.05 6.05 0 0 0 12.3 3.41l-.31-.01A6.05 6.05 0 0 0 6.14 11s.26.75-.74 1c-.94.25-1.21-1-1.21-1a7.95 7.95 0 0 1 7.8-9.5Z" fill="currentColor"/></svg>
              </button>
            </div>
            <!-- 发送按钮 -->
            <button class="send-btn" @click="sendMessage" :disabled="!inputMessage.trim() && uploadedImages.length === 0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 3c.42 0 .81.18 1.08.46l5.98 5.98.1.11a1.5 1.5 0 0 1-2.22 2.01l-3.44-3.44V19.5a1.5 1.5 0 0 1-3 0V8.12l-3.44 3.44a1.5 1.5 0 0 1-2.22-2.01l.1-.11 6-6 .03-.03.06-.05.04-.04c.03-.02.06-.04.09-.06l.01-.01a1.43 1.43 0 0 1 .1-.06l.03-.02c.21-.11.45-.17.7-.17Z" fill="currentColor"/>
              </svg>
            </button>
          </div>
          
          <!-- 隐藏的文件输入 -->
          <input 
            type="file" 
            ref="fileInputRef"
            accept="image/*"
            multiple
            style="display: none"
            @change="handleFileChange"
          />
        </div>
      </div>
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
  </aside>
</template>

<style scoped>
.right-panel {
  position: fixed;
  right: 0;
  top: 0;
  bottom: 0;
  width: 440px;
  background: var(--canvas-sidebar-bg, #0d0d0d);
  border-left: 1px solid var(--stroke-tertiary);
  transform: translateX(100%);
  transition: transform 0.25s ease;
  z-index: 10000;
  display: flex;
  flex-direction: column;
}
.right-panel.open { transform: translateX(0); }

.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
}

/* 顶部标题栏 */
.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid var(--stroke-tertiary);
}
.header-left {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}
.header-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dropdown-arrow { color: var(--text-tertiary); }
.header-actions { display: flex; gap: 8px; }
.header-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}
.header-btn:hover {
  background: var(--bg-block-primary-hover);
  color: var(--text-primary);
}

/* 消息列表 */
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  padding-bottom: 160px;
}
.message-row { margin-bottom: 20px; }

/* 用户消息 */
.message-row.user { display: flex; justify-content: flex-end; }
.user-bubble {
  background: var(--bg-block-primary-default, #2a2a2a);
  border-radius: 16px;
  padding: 12px 16px;
  color: var(--text-primary);
  font-size: 14px;
  line-height: 1.5;
  max-width: 85%;
}

/* AI 图片回复 */
.ai-block { width: 100%; }
.summary-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  cursor: pointer;
  color: var(--text-primary);
  font-size: 14px;
}
.summary-header svg {
  color: var(--text-tertiary);
  transition: transform 0.2s;
}
.summary-header svg.rotated { transform: rotate(180deg); }

.images-row {
  display: flex;
  gap: 2px;
  margin-bottom: 12px;
}
.image-cell {
  flex: 1;
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  aspect-ratio: 0.75;
  cursor: pointer;
  transition: transform 0.2s;
}
.image-cell:hover {
  transform: scale(1.02);
}
.image-cell img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.more-badge {
  position: absolute;
  right: 8px;
  bottom: 8px;
  background: rgba(0,0,0,0.6);
  color: white;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
}

.ai-notice {
  color: var(--text-tertiary);
  font-size: 12px;
  margin-bottom: 12px;
}

.action-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.action-left, .action-right { display: flex; gap: 8px; }
.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: var(--bg-block-primary-default, #2a2a2a);
  border: none;
  border-radius: 20px;
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}
.action-btn:hover {
  background: var(--bg-block-primary-hover);
  color: var(--text-primary);
}
.action-btn.icon-only { padding: 8px; border-radius: 50%; }
.feedback-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: var(--text-tertiary);
  cursor: pointer;
  transition: color 0.2s;
}
.feedback-btn:hover { color: var(--text-primary); }

/* 用户消息（带参考图） */
.message-row.user-ref {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}
.ref-avatar {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
}
.ref-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.ref-content { flex: 1; }
.ref-text {
  color: var(--text-primary);
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 4px;
}
.ref-meta {
  color: var(--text-tertiary);
  font-size: 12px;
}

/* 生成的图片组 */
.generated-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 2px;
  margin-bottom: 12px;
}
.gen-image-cell {
  aspect-ratio: 0.75;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s;
}
.gen-image-cell:hover {
  transform: scale(1.02);
}
.gen-image-cell img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.gen-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* 底部输入区域 */
.chat-input-wrapper {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px;
  background: linear-gradient(to top, var(--canvas-sidebar-bg, #141419) 80%, transparent);
}
.input-container {
  background: var(--input-bg, rgba(32, 33, 39, 0.72));
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 14px 16px;
  border: 1px solid var(--input-border, transparent);
}
.input-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

/* 图片上传区域 */
.upload-area {
  margin-bottom: 12px;
}
.upload-content {
  display: flex;
  align-items: flex-end;
  gap: 12px;
}
.images-stack-wrapper {
  position: relative;
  flex-shrink: 0;
}
.images-container {
  position: relative;
  height: 72px;
  display: flex;
  align-items: flex-end;
}

/* 图片项 - 统一样式，通过CSS变量控制动画 */
.stack-item {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 54px;
  height: 72px;
  border-radius: 6px;
  overflow: visible;
  transform-origin: center bottom;
  transform: rotate(var(--rotate)) translateX(var(--translate-x));
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}
.stack-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 6px;
  border: 2px solid white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}
.stack-item.expanded img {
  border-color: var(--brand-main-default, #00cae0);
  box-shadow: 0 2px 12px rgba(0, 202, 224, 0.3);
}

/* 智能参考提示 - 在图片上方 */
.smart-ref-tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%) translateY(10px);
  display: flex;
  align-items: center;
  padding: 8px 16px;
  background: var(--menu-bg, rgba(50, 54, 62, 0.95));
  border-radius: 8px;
  font-size: 14px;
  color: var(--text-primary);
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: all 0.2s ease;
  margin-bottom: 8px;
  z-index: 1000;
}
.smart-ref-tooltip.visible {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
  pointer-events: auto;
}

/* 关闭按钮 - 在图片右上角 */
.close-image-btn {
  position: absolute;
  top: -10px;
  right: -10px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--menu-bg, rgba(30, 32, 38, 0.95));
  border: none;
  border-radius: 50%;
  color: var(--text-primary);
  cursor: pointer;
  opacity: 0;
  transform: scale(0.8);
  transition: all 0.2s ease;
  z-index: 10;
}
.close-image-btn.visible {
  opacity: 1;
  transform: scale(1);
}
.close-image-btn:hover {
  background: var(--bg-block-primary-hover);
}

/* 添加按钮 */
.add-btn {
  position: absolute;
  left: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-block-primary-pressed, rgba(80, 84, 92, 0.95));
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 200;
  /* 收起状态：圆形，在图片右下角 */
  width: 32px;
  height: 32px;
  border-radius: 50%;
  transform: translateX(44px) translateY(0);
}
.add-btn.expanded {
  /* 展开状态：方形，与图片对齐 */
  width: 54px;
  height: 72px;
  border-radius: 6px;
  border: 2px solid var(--stroke-secondary);
  background: var(--bg-block-primary-default);
  transform: translateX(var(--translate-x));
}
.add-btn:hover {
  background: var(--bg-block-primary-hover);
  color: var(--text-primary);
}

.upload-content .text-input {
  flex: 1;
}
.text-input.full-width {
  width: 100%;
  margin-left: 0;
}
.ref-thumb {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  object-fit: cover;
  flex-shrink: 0;
}
.ref-label {
  color: var(--text-primary);
  font-size: 14px;
  flex-shrink: 0;
}
.text-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text-primary);
  font-size: 14px;
  padding: 0;
  margin-left: 8px;
}
.text-input::placeholder {
  color: var(--text-placeholder);
}
.input-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.toolbar-left {
  display: flex;
  gap: 4px;
}
.toolbar-btn {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-block-primary-default);
  border: 1px solid var(--stroke-secondary);
  border-radius: 10px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;
}
.toolbar-btn:hover {
  background: var(--bg-block-primary-hover);
  color: var(--text-primary);
}
.toolbar-btn.active {
  color: var(--brand-main-default, #00cae0);
}
.send-btn {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--brand-main-default);
  border: none;
  border-radius: 50%;
  color: #fff;
  cursor: pointer;
  transition: all 0.15s ease;
  flex-shrink: 0;
}
.send-btn:hover:not(:disabled) {
  background: var(--brand-main-hover);
}
.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
