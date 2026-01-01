<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  title: {
    type: String,
    default: '未命名项目'
  }
})

const emit = defineEmits(['update:title', 'toggle-panel'])

const isEditing = ref(false)
const editTitle = ref(props.title)

watch(() => props.title, (val) => {
  editTitle.value = val
})

const startEdit = () => {
  isEditing.value = true
}

const saveTitle = () => {
  isEditing.value = false
  if (editTitle.value.trim()) {
    emit('update:title', editTitle.value.trim())
  } else {
    editTitle.value = props.title
  }
}

const handleKeydown = (e) => {
  if (e.key === 'Enter') saveTitle()
  else if (e.key === 'Escape') {
    editTitle.value = props.title
    isEditing.value = false
  }
}
</script>

<template>
  <header class="header">
    <!-- 左侧 -->
    <div class="top-bar-left">
      <div class="top-bar-left-inner">
        <button class="back-button" type="button">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M18.104 14.462c-1.359 2.008-2.203 4.3-1.87 6.566a.723.723 0 0 1-.397.76.747.747 0 0 1-.852-.162c-1.603-1.683-3.903-2.463-6.301-2.643a26.536 26.536 0 0 0 5.107-1.877 26.004 26.004 0 0 0 4.316-2.647l-.003.003ZM6.339 2.258a.575.575 0 0 1 .732.202c3.953 5.991 8.172 7.646 13.622 6.642a.931.931 0 0 1 .997.496c.415.832-.438 1.344-.964 1.832-1.485 1.198-4.25 2.932-7.573 4.553-3.326 1.621-6.397 2.734-8.251 3.166-.402.063-.808.188-1.216.202-.81-.054-1.2-1.119-.583-1.669C7.235 14.016 8.323 9.77 6.047 2.96a.574.574 0 0 1 .292-.701Z" fill="currentColor"/>
          </svg>
        </button>
        
        <div class="title-container">
          <div v-if="!isEditing" class="title" @click="startEdit" :title="title">{{ title }}</div>
          <input
            v-else
            v-model="editTitle"
            class="title-input"
            @blur="saveTitle"
            @keydown="handleKeydown"
            autofocus
          />
        </div>
        
        <button class="back-button" type="button">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M5 6.3a1.2 1.2 0 0 0 0 2.4h14a1.2 1.2 0 1 0 0-2.4H5Zm0 9a1.2 1.2 0 0 0 0 2.4h8a1.2 1.2 0 1 0 0-2.4H5Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"/>
          </svg>
        </button>
      </div>
    </div>
    
    <!-- 右侧 -->
    <div class="top-bar-right">
      <div class="top-bar-right-inner">
        <!-- 积分显示 -->
        <div class="credit-display">
          <div class="credit-display-container">
            <div class="credit-amount-container">
              <svg width="12" height="12" viewBox="0 0 25 24" fill="none">
                <path fill="currentColor" d="M22.044 12.695a.77.77 0 0 0-.596-.734c-4.688-1.152-7.18-3.92-7.986-9.924l-.006-.033a.573.573 0 0 0-1.137 0l-.007.033c-.805 6.004-3.298 8.772-7.986 9.924a.77.77 0 0 0-.596.734v.033a.82.82 0 0 0 .625.796c3.3.859 6.851 2.872 7.9 6.022.086.26.332.443.613.454h.037a.67.67 0 0 0 .614-.454c1.048-3.15 4.598-5.163 7.9-6.021a.82.82 0 0 0 .625-.797z"/>
              </svg>
              <div class="credit-amount-text">48</div>
            </div>
            <div class="divider"></div>
            <div class="upgrade-text">1元会员</div>
          </div>
        </div>
        
        <!-- 分享按钮 -->
        <button class="share-button" type="button">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M10.537 4.875c0-1.62 1.92-2.475 3.124-1.391l7.493 6.744c.806.725.806 1.99 0 2.715l-7.493 6.743c-1.205 1.084-3.123.23-3.123-1.39v-2.04a8.023 8.023 0 0 0-5.349 2.633 1.833 1.833 0 0 1-1.971.505A1.794 1.794 0 0 1 2 17.69v-.101c0-5.242 3.644-9.63 8.537-10.773V4.875Zm2.28.467a.2.2 0 0 0-.334.148v1.96a1.17 1.17 0 0 1-.973 1.153 9.12 9.12 0 0 0-7.562 8.762 9.969 9.969 0 0 1 7.397-3.076 1.164 1.164 0 0 1 1.138 1.165v2.226a.2.2 0 0 0 .334.149l6.937-6.244-6.937-6.243Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"/>
          </svg>
        </button>
        
        <!-- 对话按钮 -->
        <div class="open-conversation">
          <button class="conversation-button" type="button" @click="emit('toggle-panel')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M17.5 3A4.5 4.5 0 0 1 22 7.5v7a4.5 4.5 0 0 1-4.5 4.5h-5.028a1 1 0 0 0-.542.16l-4.152 2.68A1 1 0 0 1 6.236 21v-2.009A4.5 4.5 0 0 1 2 14.5v-7A4.5 4.5 0 0 1 6.5 3h11Zm-11 2A2.5 2.5 0 0 0 4 7.5v7A2.5 2.5 0 0 0 6.5 17h.736a1 1 0 0 1 1 1v1.163l2.609-1.683a3 3 0 0 1 1.627-.48H17.5a2.5 2.5 0 0 0 2.5-2.5v-7A2.5 2.5 0 0 0 17.5 5h-11Z" fill="currentColor"/>
            </svg>
            <span>对话</span>
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.header {
  height: 60px;
  justify-content: space-between;
  left: 0;
  padding: 0 12px;
  pointer-events: none;
  right: 0;
  top: 0;
  z-index: 100;
  align-items: center;
  display: flex;
  position: absolute;
}

.top-bar-left {
  align-items: center;
  display: flex;
  position: absolute;
  -webkit-backdrop-filter: blur(var(--canvas-float-backdrop-blur));
  backdrop-filter: blur(var(--canvas-float-backdrop-blur));
  background: var(--canvas-bg-block-default);
  border-radius: 8px;
  height: 36px;
  left: 12px;
  pointer-events: auto;
}

.top-bar-left-inner {
  display: flex;
  align-items: center;
  padding: 0 4px;
  gap: 4px;
}

.back-button {
  align-items: center;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: var(--text-primary);
  cursor: pointer;
  display: flex;
  height: 28px;
  justify-content: center;
  padding: 6px;
  transition: background-color 0.2s;
  width: 28px;
}

.back-button:hover {
  background: var(--bg-block-primary-hover);
}

.title-container {
  max-width: 200px;
}

.title {
  color: var(--text-primary);
  cursor: pointer;
  font-size: 13px;
  font-weight: 400;
  line-height: 20px;
  overflow: hidden;
  padding: 0 8px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.title-input {
  background: var(--bg-block-primary-default);
  border: 1px solid var(--stroke-focus);
  border-radius: 4px;
  color: var(--text-primary);
  font-size: 13px;
  padding: 4px 8px;
  width: 180px;
}

.top-bar-right {
  align-items: center;
  display: flex;
  pointer-events: auto;
  position: absolute;
  right: 12px;
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.top-bar-right-inner {
  display: flex;
  align-items: center;
  gap: 8px;
}

.credit-display {
  -webkit-backdrop-filter: blur(var(--canvas-float-backdrop-blur));
  backdrop-filter: blur(var(--canvas-float-backdrop-blur));
  background: var(--canvas-bg-block-default);
  border-radius: 8px;
}

.credit-display-container {
  align-items: center;
  display: flex;
  padding: 8px 12px;
  gap: 8px;
}

.credit-amount-container {
  align-items: center;
  display: flex;
  gap: 4px;
  color: var(--text-primary);
}

.credit-amount-text {
  font-family: Montserrat, sans-serif;
  font-size: 13px;
  font-weight: 500;
}

.divider {
  background: var(--stroke-secondary);
  height: 12px;
  width: 1px;
}

.upgrade-text {
  color: var(--brand-main-default);
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
}

.share-button {
  -webkit-backdrop-filter: blur(var(--canvas-float-backdrop-blur));
  backdrop-filter: blur(var(--canvas-float-backdrop-blur));
  align-items: center;
  background: var(--canvas-bg-block-default);
  border: none;
  border-radius: 8px;
  color: var(--text-primary);
  cursor: pointer;
  display: flex;
  height: 36px;
  justify-content: center;
  padding: 0 12px;
  transition: background-color 0.2s;
}

.share-button:hover {
  background: var(--bg-block-primary-hover);
}

.conversation-button {
  -webkit-backdrop-filter: blur(var(--canvas-float-backdrop-blur));
  backdrop-filter: blur(var(--canvas-float-backdrop-blur));
  align-items: center;
  background: var(--canvas-bg-block-default);
  border: none;
  border-radius: 8px;
  color: var(--text-primary);
  cursor: pointer;
  display: flex;
  font-size: 13px;
  gap: 6px;
  height: 36px;
  padding: 0 12px;
  transition: background-color 0.2s;
}

.conversation-button:hover {
  background: var(--bg-block-primary-hover);
}
</style>
