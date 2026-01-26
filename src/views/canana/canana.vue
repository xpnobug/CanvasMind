<script setup>
import { ref } from 'vue'
import Header from '@components/canana/Header.vue'
import LeftToolbar from '@components/canana/LeftToolbar.vue'
import InfiniteCanvas from '@components/canana/InfiniteCanvas.vue'
import BottomToolbar from '@components/canana/BottomToolbar.vue'
import ContentGenerator from '@/components/generate/ContentGenerator.vue'
import RightPanel from '@components/canana/RightPanel.vue'
import CanvasEmptyState from '@components/canana/CanvasEmptyState.vue'

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

// 处理本地上传
const handleUpload = () => {
  // TODO: 实现上传逻辑
  console.log('本地上传')
}

// 处理选择资产
const handleSelectAsset = () => {
  // TODO: 实现选择资产逻辑
  console.log('选择资产')
}

// 处理中间底部发送的消息
const pendingMessage = ref('')
const handlePromptSend = (message, type) => {
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
  <div class="image-editor-container-QrfPhz">
    <div class="workbench-A4zK0t" :class="{ 'right-panel-open-JXfTGq': rightPanelOpen }" :style="{ '--right-panel-width': '440px' }">
      <div class="workbench-main-content-ykueXe">
        <div class="workbench-content-m9A7DE">
          <!-- 顶部栏 -->
          <Header
              :title="projectTitle"
              @update:title="projectTitle = $event"
              @toggle-panel="toggleRightPanel"
          />

          <!-- 主内容区 -->
          <main class="main-content-G8f_tC">
            <!-- 顶部工具栏 - 选中图片时显示 -->
            <div class="toolbar-zDoGgL top-toolbar-V6aN6e" :class="{ visible: selectedImage }">
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
            <div class="canvas-container-ciI9cJ">
              <!-- 空状态 - 使用可复用组件 -->
              <CanvasEmptyState
                v-if="!canvasCreated"
                @upload="handleUpload"
                @select-asset="handleSelectAsset"
              />
              <!-- 画布 -->
              <InfiniteCanvas v-else ref="canvasRef" :zoom="zoom" @zoom-change="handleZoomChange" @selection-change="handleSelectionChange" />
            </div>

            <div class="toolbar-zDoGgL bottom-toolbar-PE8gbm"></div>
          </main>
        </div>

        <!-- 左侧工具栏 -->
        <nav class="toolbar-zDoGgL left-toolbar-R3x3z9">
          <LeftToolbar />
        </nav>

        <!-- 底部左侧控件 -->
        <div class="bottom-left-widget-jcEzp3">
          <BottomToolbar
              :zoom="zoom"
              @zoom-change="handleZoomChange"
          />
        </div>

        <!-- 内容生成器 - 右侧面板关闭时显示 -->
        <ContentGenerator
          v-show="!rightPanelOpen"
          class="canvas-content-generator"
          :collapsible="true"
          :default-expanded="false"
          popup-placement="top"
          @send="handlePromptSend"
        />
      </div>

      <!-- 调整大小手柄 - 仅在右侧面板打开时可见 -->
      <div v-show="rightPanelOpen" class="resize-handle-AIPywp"></div>

      <!-- 右侧面板 -->
      <aside class="right-panel-gZhdnT">
        <RightPanel
            :title="projectTitle"
            :visible="rightPanelOpen"
            :initial-message="pendingMessage"
            @close="rightPanelOpen = false"
            @message-received="pendingMessage = ''"
        />
      </aside>
    </div>
  </div>
</template>

<style>
/* 导入全局画布样式（非 scoped，以便正确应用到所有元素） */
@import './styles/index.css';
@import './styles/empty-state.css';
@import './styles/canvas.css';
@import './styles/sidebar-empty-state.css';
</style>
