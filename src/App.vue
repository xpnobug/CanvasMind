<script setup>
import { ref } from 'vue'
import Header from './components/Header.vue'
import LeftToolbar from './components/LeftToolbar.vue'
import InfiniteCanvas from './components/InfiniteCanvas.vue'
import BottomToolbar from './components/BottomToolbar.vue'
import PromptEditor from './components/PromptEditor.vue'
import RightPanel from './components/RightPanel.vue'

const zoom = ref(10)
const projectTitle = ref('生成二次元手办多风格图片')
const rightPanelOpen = ref(false)
const selectedImage = ref(null)
const canvasRef = ref(null)
const canvasCreated = ref(false)

const handleZoomChange = (newZoom) => {
  zoom.value = Math.max(1, Math.min(200, newZoom))
}

const toggleRightPanel = () => {
  rightPanelOpen.value = !rightPanelOpen.value
}

const handleSelectionChange = (image) => {
  selectedImage.value = image
}

// 处理中间底部发送的消息
const pendingMessage = ref('')
const handlePromptSend = (message) => {
  pendingMessage.value = message
  rightPanelOpen.value = true
  // 创建画布并生成图片
  if (!canvasCreated.value) {
    canvasCreated.value = true
    // 等待画布渲染后再生成
    setTimeout(() => {
      canvasRef.value?.generateImages()
    }, 100)
  } else {
    canvasRef.value?.generateImages()
  }
}
</script>

<template>
  <div class="image-editor-container">
    <div class="workbench" :class="{ 'right-panel-open': rightPanelOpen }" :style="{ '--right-panel-width': rightPanelOpen ? '440px' : '0px' }">
      <div class="workbench-main-content">
        <div class="workbench-content">
          <!-- 顶部栏 -->
          <Header 
            :title="projectTitle"
            @update:title="projectTitle = $event"
            @toggle-panel="toggleRightPanel"
          />
          
          <!-- 主内容区 -->
          <main class="main-content">
            <!-- 顶部工具栏 - 选中图片时显示 -->
            <div class="toolbar top-toolbar" :class="{ visible: selectedImage }">
              <div class="top-toolbar-content" v-if="selectedImage">
                <button class="top-tool-btn">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2Zm-1 15v-4H7l5-7v4h4l-5 7Z" fill="currentColor"/></svg>
                  <span>局部重绘</span>
                </button>
                <button class="top-tool-btn has-dropdown">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2Zm0 16H5V5h14v14Zm-7-2h2v-4h4v-2h-4V7h-2v4H8v2h4v4Z" fill="currentColor"/></svg>
                  <span>超清</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" class="dropdown-icon"><path d="M7 10l5 5 5-5H7Z" fill="currentColor"/></svg>
                </button>
                <button class="top-tool-btn">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4Zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4Z" fill="currentColor"/></svg>
                  <span>抠图</span>
                </button>
                <button class="top-tool-btn">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 3H9v2h6V3Zm-4 13h2V8h-2v8Zm8.03-6.61 1.42-1.42c-.43-.51-.9-.99-1.41-1.41l-1.42 1.42A8.962 8.962 0 0 0 12 5a9 9 0 0 0-9 9 9 9 0 0 0 9 9 9 9 0 0 0 9-9c0-2.12-.74-4.07-1.97-5.61ZM12 21c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7Z" fill="currentColor"/></svg>
                  <span>扩图</span>
                </button>
                <button class="top-tool-btn">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M18 4v1h-2V4c0-.55-.45-1-1-1H9c-.55 0-1 .45-1 1v1H6V4c0-.55-.45-1-1-1s-1 .45-1 1v16c0 .55.45 1 1 1s1-.45 1-1v-1h2v1c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-1h2v1c0 .55.45 1 1 1s1-.45 1-1V4c0-.55-.45-1-1-1s-1 .45-1 1ZM8 17H6v-2h2v2Zm0-4H6v-2h2v2Zm0-4H6V7h2v2Zm10 8h-2v-2h2v2Zm0-4h-2v-2h2v2Zm0-4h-2V7h2v2Z" fill="currentColor"/></svg>
                  <span>生成视频</span>
                </button>
                <button class="top-tool-btn">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58ZM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6Z" fill="currentColor"/></svg>
                  <span>消除笔</span>
                </button>
                <button class="top-tool-btn">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 17v2h6v-2H3ZM3 5v2h10V5H3Zm10 16v-2h8v-2h-8v-2h-2v6h2ZM7 9v2H3v2h4v2h2V9H7Zm14 4v-2H11v2h10Zm-6-4h2V7h4V5h-4V3h-2v6Z" fill="currentColor"/></svg>
                  <span>画面微调</span>
                </button>
                <button class="top-tool-btn">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M2.5 4v3h5v12h3V7h5V4h-13Zm19 5h-9v3h3v7h3v-7h3V9Z" fill="currentColor"/></svg>
                  <span>文字重绘</span>
                </button>
              </div>
            </div>
            
            <!-- 画布容器 -->
            <div class="canvas-container">
              <!-- 空状态 -->
              <div v-if="!canvasCreated" class="empty-state">
                <div class="empty-icon">
                  <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                    <rect x="8" y="12" width="48" height="40" rx="4" fill="rgba(0, 202, 224, 0.1)" stroke="rgba(0, 202, 224, 0.3)" stroke-width="2"/>
                    <rect x="14" y="18" width="16" height="20" rx="2" fill="rgba(0, 202, 224, 0.2)"/>
                    <rect x="34" y="18" width="16" height="12" rx="2" fill="rgba(0, 202, 224, 0.15)"/>
                    <rect x="34" y="34" width="16" height="8" rx="2" fill="rgba(0, 202, 224, 0.15)"/>
                    <path d="M14 44L22 36L30 42" stroke="rgba(0, 202, 224, 0.4)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
                <p class="empty-text">使用已有素材开启创作</p>
                <div class="empty-actions">
                  <button class="empty-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M11 14.586V6a1 1 0 1 1 2 0v8.586l2.293-2.293a1 1 0 0 1 1.414 1.414l-4 4a1 1 0 0 1-1.414 0l-4-4a1 1 0 1 1 1.414-1.414L11 14.586Z" fill="currentColor"/>
                      <path d="M5 18a1 1 0 1 0 0 2h14a1 1 0 1 0 0-2H5Z" fill="currentColor"/>
                    </svg>
                    <span>本地上传</span>
                  </button>
                  <button class="empty-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2Zm0 16H5V5h14v14Zm-5-7 3 4H7l3-4 2.25 3 2.75-3Z" fill="currentColor"/>
                    </svg>
                    <span>选择资产</span>
                  </button>
                </div>
              </div>
              <!-- 画布 -->
              <InfiniteCanvas v-else ref="canvasRef" :zoom="zoom" @zoom-change="handleZoomChange" @selection-change="handleSelectionChange" />
            </div>
            
            <div class="toolbar bottom-toolbar"></div>
          </main>
        </div>
        
        <!-- 左侧工具栏 -->
        <LeftToolbar />
        
        <!-- 底部左侧控件 -->
        <BottomToolbar 
          :zoom="zoom"
          @zoom-change="handleZoomChange"
        />
        
        <!-- 提示词编辑器 - 右侧面板关闭时显示 -->
        <PromptEditor v-show="!rightPanelOpen" @send="handlePromptSend" />
      </div>
      
      <!-- 右侧面板 -->
      <RightPanel 
        :title="projectTitle" 
        :visible="rightPanelOpen"
        :initial-message="pendingMessage"
        @close="rightPanelOpen = false"
        @message-received="pendingMessage = ''"
      />
    </div>
  </div>
</template>

<style scoped>
.image-editor-container {
  width: 100%;
  height: 100%;
  background-color: var(--canvas-bg);
}

.workbench {
  display: flex;
  height: 100%;
  overflow: hidden;
  position: relative;
  width: 100%;
}

.workbench-main-content {
  transition: width 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  width: calc(100% - var(--right-panel-width));
  will-change: width;
  position: relative;
}

.workbench-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.main-content {
  background-color: var(--canvas-bg);
  display: flex;
  flex: 1 1;
  flex-direction: column;
  overflow-y: auto;
  position: relative;
}

.canvas-container {
  flex: 1 1;
  height: 100%;
  overflow: hidden;
  position: relative;
  width: 100%;
  z-index: 1;
}

.toolbar {
  align-items: center;
  display: flex;
  justify-content: center;
  pointer-events: none;
  position: absolute;
  z-index: 100000;
}

.top-toolbar {
  height: 60px;
  left: 0;
  right: 0;
  top: 0;
  opacity: 0;
  transition: opacity 0.2s;
}

.top-toolbar.visible {
  opacity: 1;
  pointer-events: auto;
}

.top-toolbar-content {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  background: var(--canvas-float-block-default);
  backdrop-filter: blur(var(--canvas-float-backdrop-blur));
  border: 0.5px solid var(--stroke-tertiary);
  border-radius: 10px;
  box-shadow: var(--shadow-generator-float-block);
}

.top-tool-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.top-tool-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.top-tool-btn.has-dropdown {
  gap: 4px;
}

.top-tool-btn .dropdown-icon {
  margin-left: 2px;
}

.bottom-toolbar {
  bottom: 0;
  left: 0;
  right: 0;
}

/* 空状态 */
.empty-state {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.empty-icon {
  opacity: 0.8;
}

.empty-text {
  color: var(--text-secondary);
  font-size: 14px;
  margin: 0;
}

.empty-actions {
  display: flex;
  gap: 12px;
  margin-top: 4px;
}

.empty-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: var(--btn-secondary-bg, rgba(255, 255, 255, 0.06));
  border: 1px solid var(--btn-secondary-border, rgba(255, 255, 255, 0.1));
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.empty-btn:hover {
  background: var(--btn-secondary-hover, rgba(255, 255, 255, 0.1));
}

.empty-btn svg {
  opacity: 0.8;
}
</style>
