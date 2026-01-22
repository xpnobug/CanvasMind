<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ImageModelSelector, RatioSelector, ModeSelector } from './prompt-editor'

const emit = defineEmits(['send'])

const prompt = ref('')
const isExpanded = ref(false)
const inspirationSearch = ref(true)
const creativeDesign = ref(true)
const editorRef = ref(null)
const containerRef = ref(null)

// 模式选择
const modeOptions = [
  { id: 'agent', label: 'Agent 模式', icon: 'agent' },
  { id: 'image', label: '图片生成', icon: 'image' },
  { id: 'video', label: '视频生成', icon: 'video' }
]
const selectedMode = ref('image')

// 图片生成模式的配置
const imageModelOptions = [
  { 
    id: 'v4.5', 
    label: '图片 4.5', 
    displayVersion: '4.5',
    seedreamVersion: 'Seedream 4.5',
    isNew: true,
    description: '强化一致性、风格与图文响应',
    thumbnail: 'https://lf3-lv-buz.vlabstatic.com/obj/image-lvweb-buz/ies/lvweb/dreamina_cn/static/image/model/4.5.webp'
  },
  { 
    id: 'v4.1', 
    label: '图片 4.1', 
    displayVersion: '4.1',
    seedreamVersion: 'Seedream 4.0 Design',
    isNew: true,
    description: '更专业的创意、美学和一致性保持',
    thumbnail: 'https://lf3-lv-buz.vlabstatic.com/obj/image-lvweb-buz/ies/lvweb/dreamina_cn/static/image/model/4.1.webp'
  },
  { 
    id: 'v4.0', 
    label: '图片 4.0', 
    displayVersion: '4.0',
    seedreamVersion: 'Seedream 4.0',
    isNew: false,
    description: '支持多参考图、系列组图生成',
    thumbnail: 'https://lf3-lv-buz.vlabstatic.com/obj/image-lvweb-buz/ies/lvweb/dreamina_cn/static/image/model/4.0.webp'
  },
  { 
    id: 'v3.1', 
    label: '图片 3.1', 
    displayVersion: '3.1',
    seedreamVersion: 'Seedream 3.1',
    isNew: false,
    description: '丰富的美学多样性，画面更鲜明生动',
    thumbnail: 'https://lf3-lv-buz.vlabstatic.com/obj/image-lvweb-buz/ies/lvweb/dreamina_cn/static/image/model/3.1.webp'
  },
  { 
    id: 'v3.0', 
    label: '图片 3.0', 
    displayVersion: '3.0',
    seedreamVersion: 'Seedream 3.0',
    isNew: false,
    description: '影视质感，文字更准，直出2k高清图',
    thumbnail: 'https://lf3-lv-buz.vlabstatic.com/obj/image-lvweb-buz/ies/lvweb/dreamina_cn/static/image/model/3.0.webp'
  },
  { 
    id: 'v2.0-pro', 
    label: '图片 2.0 Pro', 
    displayVersion: '2.0',
    versionSuffix: 'PRO',
    seedreamVersion: 'Seedream 2.0 Pro',
    isNew: false,
    description: '极具想象力，擅长写真摄影',
    thumbnail: 'https://lf3-lv-buz.vlabstatic.com/obj/image-lvweb-buz/ies/lvweb/dreamina_cn/static/image/model/2.0.webp'
  }
]
const selectedImageModel = ref('v4.5')

// 图片比例/分辨率状态（用于 RatioSelector 组件的 v-model）
const selectedImageRatio = ref('smart')
const selectedImageResolution = ref('2k')
const imageWidth = ref(2048)
const imageHeight = ref(2048)
const sizeLocked = ref(true)

const imageCount = ref(3)

// 视频生成模式的配置
const videoModelOptions = [
  { id: 'v3.0-fast', label: '视频 3.0 Fast' },
  { id: 'v3.0', label: '视频 3.0' },
  { id: 'v2.1', label: '视频 2.1' }
]
const selectedVideoModel = ref('v3.0-fast')

const videoFrameOptions = [
  { id: 'start-end', label: '首尾帧' },
  { id: 'start', label: '首帧' },
  { id: 'end', label: '尾帧' },
  { id: 'none', label: '无' }
]
const selectedVideoFrame = ref('start-end')
const showVideoFrameMenu = ref(false)

const videoRatioOptions = [
  { id: '16:9', label: '16:9' },
  { id: '9:16', label: '9:16' },
  { id: '1:1', label: '1:1' },
  { id: '4:3', label: '4:3' },
  { id: '3:4', label: '3:4' }
]
const selectedVideoRatio = ref('16:9')

const videoResolutionOptions = [
  { id: '1080p', label: '1080P' },
  { id: '720p', label: '720P' }
]
const selectedVideoResolution = ref('720p')

const videoDurationOptions = [
  { id: '5s', label: '5s' },
  { id: '10s', label: '10s' }
]
const selectedVideoDuration = ref('5s')

const videoCost = computed(() => {
  return selectedVideoDuration.value === '5s' ? 10 : 20
})

// 图片上传状态
const uploadedImage = ref(null)
const uploadedStartFrame = ref(null)
const uploadedEndFrame = ref(null)

// 获取当前模式的占位符文本
const placeholderText = computed(() => {
  switch (selectedMode.value) {
    case 'image':
      return '请描述你想生成的图片'
    case 'video':
      return '输入文字，描述你想创作的画面内容、运动方式等。例如：一个3D形象的小男孩，在公园滑滑板。'
    default:
      return '说说今天想做点什么'
  }
})

const handleSubmit = () => {
  if (!prompt.value.trim()) return
  emit('send', prompt.value.trim())
  prompt.value = ''
  if (editorRef.value) {
    editorRef.value.innerText = ''
  }
  isExpanded.value = false
}

const handleInput = (e) => {
  prompt.value = e.target.innerText
}

const handleFocus = () => {
  isExpanded.value = true
}

const handleClickOutside = (e) => {
  if (!containerRef.value) return
  const isClickInside = containerRef.value.contains(e.target)
  if (!isClickInside && !prompt.value.trim()) {
    isExpanded.value = false
  }
}

const expandEditor = () => {
  isExpanded.value = true
  setTimeout(() => {
    if (editorRef.value) {
      editorRef.value.focus()
    }
  }, 100)
}

// 处理图片上传
const handleImageUpload = (type) => {
  // 这里可以触发文件选择对话框
  console.log('上传图片:', type)
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div class="content-generator" :class="{ collapsed: !isExpanded }" ref="containerRef">
    <div class="layout" @click="!isExpanded && expandEditor()">
      <!-- 内容区域 -->
      <div class="content">
        <!-- 图片生成模式 - 单图上传区 -->
        <div v-if="selectedMode === 'image'" class="upload-area image-upload" @click.stop="handleImageUpload('image')">
          <div class="upload-placeholder" v-if="!uploadedImage">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          </div>
          <img v-else :src="uploadedImage" class="uploaded-preview" />
        </div>

        <!-- 视频生成模式 - 首尾帧上传区 -->
        <div v-if="selectedMode === 'video'" class="upload-area video-frames">
          <div class="frame-upload start-frame" @click.stop="handleImageUpload('start')">
            <div class="upload-placeholder" v-if="!uploadedStartFrame">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
              <span class="frame-label">首帧</span>
            </div>
            <img v-else :src="uploadedStartFrame" class="uploaded-preview" />
          </div>
          <div class="frame-connector">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <div class="frame-upload end-frame" @click.stop="handleImageUpload('end')">
            <div class="upload-placeholder" v-if="!uploadedEndFrame">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
              <span class="frame-label">尾帧</span>
            </div>
            <img v-else :src="uploadedEndFrame" class="uploaded-preview" />
          </div>
        </div>

        <!-- 主内容 - 输入框 -->
        <div class="main-content">
          <div class="prompt-editor-container">
            <div class="prompt-editor">
              <div ref="editorRef" contenteditable="true" role="textbox" class="tiptap" tabindex="0" @input="handleInput" @focus="handleFocus" @keydown.enter.prevent="handleSubmit"><p :data-placeholder="placeholderText"></p></div>
            </div>
          </div>
        </div>
        
        <!-- 折叠状态的提交按钮 -->
        <div class="collapsed-submit-button-container" v-show="!isExpanded">
          <button class="submit-button collapsed-submit-button" :class="{ disabled: !prompt.trim() }" :disabled="!prompt.trim()" @click.stop="handleSubmit" type="button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12.002 3c.424 0 .806.177 1.079.46l5.98 5.98.103.114a1.5 1.5 0 0 1-2.225 2.006l-3.437-3.436V19.5l-.008.153a1.5 1.5 0 0 1-2.985 0l-.007-.153V8.122l-3.44 3.438a1.5 1.5 0 0 1-2.225-2.006l.103-.115 6-5.999.025-.025.059-.052.044-.037c.029-.023.06-.044.09-.065l.014-.01a1.43 1.43 0 0 1 .101-.062l.03-.017c.209-.11.447-.172.699-.172Z" fill="currentColor"/></svg>
          </button>
        </div>
      </div>
      
      <!-- 工具栏 - 展开时显示 -->
      <div class="toolbar" v-show="isExpanded">
        <div class="toolbar-settings">
          <div class="toolbar-settings-content">
            <!-- 模式选择器 -->
            <ModeSelector 
              v-model="selectedMode" 
              :options="modeOptions" 
            />
            <!-- 图片生成模式工具栏 -->
            <template v-if="selectedMode === 'image'">
              <!-- 模型选择器 -->
              <ImageModelSelector 
                v-model="selectedImageModel" 
                :options="imageModelOptions" 
              />
              <!-- 比例/分辨率选择器 -->
              <RatioSelector 
                v-model:ratio="selectedImageRatio"
                v-model:resolution="selectedImageResolution"
                v-model:width="imageWidth"
                v-model:height="imageHeight"
                v-model:locked="sizeLocked"
              />
            </template>

            <!-- 视频生成模式工具栏 -->
            <template v-if="selectedMode === 'video'">
              <button class="toolbar-button with-text with-icon" type="button">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                <span>{{ videoModelOptions.find(o => o.id === selectedVideoModel)?.label }}</span>
              </button>
              <button class="toolbar-button with-text with-icon" type="button">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="2" y="6" width="8" height="12" rx="1" stroke="currentColor" stroke-width="2"/><rect x="14" y="6" width="8" height="12" rx="1" stroke="currentColor" stroke-width="2"/></svg>
                <span>{{ videoFrameOptions.find(o => o.id === selectedVideoFrame)?.label }}</span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" class="dropdown-arrow"><path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </button>
              <button class="toolbar-button with-text with-icon" type="button">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/></svg>
                <span>{{ selectedVideoRatio }}</span>
              </button>
              <button class="toolbar-button with-text" type="button"><span>{{ videoResolutionOptions.find(o => o.id === selectedVideoResolution)?.label }}</span></button>
              <button class="toolbar-button with-text with-icon" type="button">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><path d="M12 6v6l4 2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                <span>{{ selectedVideoDuration }}</span>
              </button>
            </template>

            <!-- Agent 模式工具栏 -->
            <template v-if="selectedMode === 'agent'">
              <button class="toolbar-button icon-only" type="button">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M15.145 2.492a4.481 4.481 0 0 1 3.137 1.316c.805.8 1.323 1.91 1.329 3.133.006 1.237-.512 2.503-1.617 3.608l-6.24 6.24c-.611.611-1.358.884-2.101.839a2.85 2.85 0 0 1-1.826-.844 2.849 2.849 0 0 1-.842-1.824c-.046-.744.226-1.491.837-2.102L13.03 7.65a1 1 0 0 1 1.414 1.415l-5.21 5.207c-.224.225-.263.42-.254.566.01.17.097.366.261.53a.853.853 0 0 0 .533.263c.145.008.34-.031.564-.255l6.241-6.241c.773-.773 1.034-1.542 1.03-2.184a2.456 2.456 0 0 0-.739-1.725 2.482 2.482 0 0 0-1.734-.734c-.645-.002-1.412.258-2.177 1.022l-6.241 6.24c-1.163 1.164-1.571 2.38-1.54 3.458.032 1.095.52 2.136 1.303 2.916.782.78 1.826 1.266 2.925 1.298 1.079.03 2.294-.377 3.45-1.533l6.462-6.462a1 1 0 0 1 1.414 1.416l-6.462 6.46c-1.512 1.512-3.247 2.166-4.921 2.119-1.656-.047-3.172-.776-4.28-1.881-1.109-1.105-1.842-2.62-1.89-4.276-.048-1.675.608-3.411 2.125-4.928l6.241-6.242c1.1-1.099 2.364-1.612 3.599-1.607Z" fill="currentColor"/></svg>
              </button>
              <button class="toolbar-button with-text" type="button">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M18.047 4.1a1 1 0 1 0-2 0v2.8a1 1 0 1 0 2 0v-.447h3.103a1 1 0 1 0 0-2h-3.103V4.1Zm-4 2.353H2.85a1 1 0 0 1 0-2h11.197v2Zm-7 3.247a1 1 0 0 0-1 1v.4H2.85a1 1 0 1 0 0 2h3.197v.4a1 1 0 1 0 2 0v-2.8a1 1 0 0 0-1-1Zm14.103 3.4H10.047v-2H21.15a1 1 0 1 1 0 2Zm-10.103 3a1 1 0 0 0-1 1v2.8a1 1 0 1 0 2 0v-2.8a1 1 0 0 0-1-1ZM2.85 17.497h5.197v2H2.85a1 1 0 1 1 0-2Zm18.3 2h-9.103v-2h9.103a1 1 0 1 1 0 2Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"/></svg>
                <span>自动</span>
              </button>
              <button class="toolbar-button with-text switch-button" :class="{ checked: inspirationSearch }" @click.stop="inspirationSearch = !inspirationSearch" type="button">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M11.606 2.25a8.5 8.5 0 0 1 6.676 13.762l3.406 3.406a1 1 0 1 1-1.414 1.414l-3.406-3.406a8.464 8.464 0 0 1-6.666 1.706v-2.036a6.5 6.5 0 1 0-5.096-6.346c0 .084.004.167.007.25H3.112a8.5 8.5 0 0 1 8.494-8.75Z" fill="currentColor"/>
                  <path d="M7.772 12.57a.944.944 0 0 1 1.348-.002.98.98 0 0 1 .002 1.37l-3.999 4.064a.947.947 0 0 1-1.35 0l-2.295-2.339a.978.978 0 0 1 .002-1.369.944.944 0 0 1 1.348.003l1.621 1.65 3.323-3.378Z" fill="#00CAE0"/>
                </svg>
                <span>灵感搜索</span>
              </button>
              <button class="toolbar-button with-text switch-button" :class="{ checked: creativeDesign }" @click.stop="creativeDesign = !creativeDesign" type="button">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M13.402 20.598c.289 0 .53.239.453.516a1.904 1.904 0 0 1-3.724-.322.185.185 0 0 1 .184-.194h3.087ZM11.988 1.499a7.953 7.953 0 0 1 7.951 7.952 7.943 7.943 0 0 1-3.758 6.752 2.952 2.952 0 0 1-2.943 2.75h-2.237s-.87.003-.87-.953.87-.95.87-.95h2.237l.108-.006c.528-.054.94-.5.941-1.043v-.352a.95.95 0 0 1 .509-.841A6.048 6.048 0 0 0 12.3 3.41l-.312-.008A6.05 6.05 0 0 0 6.143 11s.257.749-.743 1c-.937.251-1.213-1-1.213-1a7.953 7.953 0 0 1 7.8-9.501Z" fill="currentColor"/>
                  <path d="M11.706 7.7a.316.316 0 0 1 .588 0l.158.381c.27.651.774 1.172 1.407 1.453l.449.2a.332.332 0 0 1 0 .602l-.475.21a2.725 2.725 0 0 0-1.387 1.406l-.154.354a.317.317 0 0 1-.584 0l-.154-.354A2.761 2.761 0 0 0 11 11.13l-.137-.13a2.682 2.682 0 0 0-.696-.453l-.475-.211a.332.332 0 0 1 0-.603l.449-.199a2.729 2.729 0 0 0 1.407-1.453l.158-.382Z" fill="currentColor"/>
                  <path fill="#00CAE0" d="M8.078 12.57a.944.944 0 0 1 1.347-.002.98.98 0 0 1 .002 1.37L5.43 18.001a.947.947 0 0 1-1.35 0l-2.296-2.339a.978.978 0 0 1 .003-1.369.944.944 0 0 1 1.347.003l1.621 1.65 3.324-3.378Z"/>
                </svg>
                <span>创意设计</span>
              </button>
            </template>
          </div>
        </div>
        
        <!-- 右侧操作区 -->
        <div class="toolbar-actions">
          <!-- 图片生成模式显示数量 -->
          <div v-if="selectedMode === 'image'" class="count-indicator">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2l2.4 7.4h7.6l-6 4.6 2.3 7-6.3-4.6-6.3 4.6 2.3-7-6-4.6h7.6z" fill="currentColor"/></svg>
            <span>{{ imageCount }} / 张</span>
          </div>
          <!-- 视频生成模式显示积分消耗 -->
          <div v-if="selectedMode === 'video'" class="count-indicator">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2l2.4 7.4h7.6l-6 4.6 2.3 7-6.3-4.6-6.3 4.6 2.3-7-6-4.6h7.6z" fill="currentColor"/></svg>
            <span>{{ videoCost }}</span>
          </div>
          <button class="submit-button" :class="{ disabled: !prompt.trim() }" :disabled="!prompt.trim()" @click.stop="handleSubmit" type="button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12.002 3c.424 0 .806.177 1.079.46l5.98 5.98.103.114a1.5 1.5 0 0 1-2.225 2.006l-3.437-3.436V19.5l-.008.153a1.5 1.5 0 0 1-2.985 0l-.007-.153V8.122l-3.44 3.438a1.5 1.5 0 0 1-2.225-2.006l.103-.115 6-5.999.025-.025.059-.052.044-.037c.029-.023.06-.044.09-.065l.014-.01a1.43 1.43 0 0 1 .101-.062l.03-.017c.209-.11.447-.172.699-.172Z" fill="currentColor"/></svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* CSS 变量 */
.content-generator {
  --content-generator-collapse-transition-duration: 0.35s;
  --content-generator-collapse-transition-timing-function: cubic-bezier(0.15, 0.75, 0.3, 1);
  --content-generator-max-width: 840px;
  --content-generator-min-width: 440px;
  
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000000;
  pointer-events: auto;
  box-sizing: border-box;
  width: 100%;
  max-width: clamp(
    var(--content-generator-min-width),
    100% - 376px,
    var(--content-generator-max-width)
  );
  min-width: var(--content-generator-min-width);
  transition: max-width var(--content-generator-collapse-transition-duration)
    var(--content-generator-collapse-transition-timing-function);
  will-change: max-width;
}

/* 响应式宽度 */
@media screen and (max-width: 1920px) {
  .content-generator:not(.collapsed) {
    --content-generator-max-width: 720px;
  }
}

@media screen and (max-width: 1280px) {
  .content-generator:not(.collapsed) {
    --content-generator-max-width: 680px;
  }
}

/* 折叠状态 */
.content-generator.collapsed {
  --content-generator-max-width: var(--content-generator-min-width);
}

.layout {
  -webkit-backdrop-filter: blur(80px);
  backdrop-filter: blur(80px);
  background: var(--component-input-bg, var(--canvas-float-block-default));
  border: 1px solid var(--component-input-stroke, var(--stroke-secondary));
  border-radius: 24px;
  display: flex;
  flex-direction: column;
  outline: 0.5px solid var(--stroke-tertiary);
  /* 移除 overflow: hidden，允许下拉菜单超出容器显示 */
  overflow: visible;
  width: 100%;
  z-index: 2;
  transition: border-radius var(--content-generator-collapse-transition-duration)
    var(--content-generator-collapse-transition-timing-function),
    box-shadow 0.2s ease;
}

.layout:hover {
  box-shadow: var(--shadow-input-hover, 0 4px 16px rgba(0, 0, 0, 0.12));
}

/* 折叠状态 - 保持与原版一致的圆角 */
.content-generator.collapsed .layout {
  border-radius: 24px;
  cursor: text;
  box-shadow: var(--shadow-generator-float-block, 0 8px 32px rgba(0, 0, 0, 0.16));
}

/* 内容区域 */
.content {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  gap: 12px;
}

.main-content {
  flex: 1;
  min-height: 24px;
}

.prompt-editor-container {
  width: 100%;
}

.prompt-editor {
  width: 100%;
}

.tiptap {
  width: 100%;
  min-height: 24px;
  max-height: 120px;
  overflow-y: auto;
  color: var(--text-primary);
  font-size: 14px;
  line-height: 24px;
  outline: none;
}

.tiptap p {
  margin: 0;
}

.tiptap p:empty::before {
  content: attr(data-placeholder);
  color: var(--text-placeholder);
  pointer-events: none;
}

/* 折叠状态的提交按钮容器 */
.collapsed-submit-button-container {
  flex-shrink: 0;
  display: flex;
  gap: 12px;
  transition: transform var(--content-generator-collapse-transition-duration)
    var(--content-generator-collapse-transition-timing-function);
}

/* 提交按钮 */
.submit-button {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--brand-main-default);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.1s;
}

.submit-button:hover:not(.disabled) {
  background: var(--brand-main-hover);
}

.submit-button:active:not(.disabled) {
  transform: scale(0.95);
}

.submit-button.disabled {
  background: var(--bg-block-primary-default);
  color: var(--text-disabled);
  cursor: not-allowed;
}

/* 折叠状态的提交按钮 */
.collapsed-submit-button {
  width: 28px;
  height: 28px;
  font-size: 16px;
}

/* 工具栏 - 与原版保持一致 */
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px 12px;
  border-top: none;
  gap: 12px;
  height: 36px;
  margin-top: 0;
  opacity: 1;
  transform: translateY(0);
  transition: margin-top var(--content-generator-collapse-transition-duration)
      var(--content-generator-collapse-transition-timing-function),
    opacity var(--content-generator-collapse-transition-duration)
      var(--content-generator-collapse-transition-timing-function),
    transform var(--content-generator-collapse-transition-duration)
      var(--content-generator-collapse-transition-timing-function);
  will-change: margin-top, opacity, transform;
  overflow: visible;
}

/* 工具栏折叠状态 - 与原版动画一致 */
.content-generator.collapsed .toolbar {
  margin-top: -48px;
  opacity: 0;
  transform: translateY(60px);
  pointer-events: none;
}

.toolbar-settings {
  flex: 1;
  /* 移除 overflow: hidden，确保下拉菜单不被裁剪 */
  overflow: visible;
}

.toolbar-settings-content {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 工具栏按钮 - 与原版保持一致 */
.toolbar-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px;
  border-radius: 8px;
  background: transparent;
  border: 1px solid var(--stroke-secondary, rgba(255, 255, 255, 0.08));
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 450;
  cursor: pointer;
  transition: background-color 0.2s, border-color 0.2s;
  white-space: nowrap;
}

.toolbar-button:hover {
  background: var(--bg-block-secondary-hover, rgba(255, 255, 255, 0.08));
}

.toolbar-button:active {
  background: var(--bg-block-secondary-pressed, rgba(255, 255, 255, 0.12));
}

.toolbar-button.icon-only {
  width: 36px;
  height: 36px;
  padding: 0;
}

.toolbar-button.with-text {
  padding: 8px 12px;
}

.toolbar-button.switch-button.checked {
  background: var(--bg-block-primary-default);
}

/* 工具栏操作区 */
.toolbar-actions {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 数量/积分指示器 */
.count-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--text-secondary);
  font-size: 13px;
}

.count-indicator svg {
  color: var(--brand-main-default);
}

/* 图片上传区域 */
.upload-area {
  flex-shrink: 0;
}

.upload-area.image-upload {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  background: var(--bg-block-primary-default, rgba(255, 255, 255, 0.06));
  border: 1px dashed var(--stroke-secondary, rgba(255, 255, 255, 0.12));
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s, border-color 0.2s;
}

.upload-area.image-upload:hover {
  background: var(--bg-block-primary-hover, rgba(255, 255, 255, 0.1));
  border-color: var(--brand-main-default);
}

/* 视频首尾帧上传区域 */
.upload-area.video-frames {
  display: flex;
  align-items: center;
  gap: 4px;
}

.frame-upload {
  width: 48px;
  height: 64px;
  border-radius: 8px;
  background: var(--bg-block-primary-default, rgba(255, 255, 255, 0.06));
  border: 1px dashed var(--stroke-secondary, rgba(255, 255, 255, 0.12));
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s, border-color 0.2s;
  gap: 4px;
}

.frame-upload:hover {
  background: var(--bg-block-primary-hover, rgba(255, 255, 255, 0.1));
  border-color: var(--brand-main-default);
}

.frame-connector {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary);
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  color: var(--text-tertiary);
}

.frame-label {
  font-size: 10px;
  color: var(--text-tertiary);
}

.uploaded-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: inherit;
}

/* 下拉箭头 */
.dropdown-arrow {
  margin-left: 2px;
  opacity: 0.6;
  transition: transform 0.2s ease;
}

.dropdown-arrow.rotated {
  transform: rotate(180deg);
}

/* 带图标的按钮 */
.toolbar-button.with-icon {
  gap: 6px;
}
</style>
