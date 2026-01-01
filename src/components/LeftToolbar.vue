<script setup>
import { ref } from 'vue'

const tools = [
  { id: 'select', icon: 'select', label: '选择移动工具', shortcut: 'V', hasMore: true },
  { id: 'image', icon: 'image', label: '图片生成', hasMore: true },
  { id: 'video', icon: 'video', label: '视频生成', hasMore: true },
  { id: 'text', icon: 'text', label: '文字工具', hasMore: false },
  { id: 'element', icon: 'element', label: '画板工具', hasMore: false },
]

const activeTool = ref('select')
const hoveredTool = ref(null)

const selectTool = (toolId) => {
  activeTool.value = toolId
}
</script>

<template>
  <nav class="left-toolbar">
    <div class="left-toolbar-container">
      <div
        v-for="tool in tools"
        :key="tool.id"
        class="toolbar-button"
        :class="{ active: activeTool === tool.id }"
        @click="selectTool(tool.id)"
        @mouseenter="hoveredTool = tool.id"
        @mouseleave="hoveredTool = null"
      >
        <div class="icon-wrapper">
          <!-- 选择工具 -->
          <svg v-if="tool.icon === 'select'" width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="m5.492 4.97 2.521 13.867 3.34-5.195a2.32 2.32 0 0 1 1.665-1.049l5.191-.649L5.492 4.971Zm-2.345.083c-.326-1.79 1.57-3.156 3.165-2.282l13.45 7.377c1.839 1.007 1.31 3.78-.77 4.04l-5.685.71-3.561 5.538c-1.06 1.65-3.594 1.148-3.945-.782l-2.654-14.6Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"/>
          </svg>
          
          <!-- 图片工具 -->
          <svg v-else-if="tool.icon === 'image'" width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M16.326 2.75a4.924 4.924 0 0 1 4.924 4.924v3.44a6.114 6.114 0 0 0-1.97-.387V7.674a2.954 2.954 0 0 0-2.954-2.954H7.674A2.954 2.954 0 0 0 4.72 7.674v8.652c0 .055 0 .109.004.162l3.508-3.508a2.955 2.955 0 0 1 4.03-.138l1.375 1.197a6.096 6.096 0 0 0-.638 2.057l-2.03-1.77a.986.986 0 0 0-1.344.047l-4.041 4.041a2.946 2.946 0 0 0 2.09.866h5.772c.32.744.782 1.412 1.353 1.97H7.674a4.924 4.924 0 0 1-4.924-4.924V7.674A4.924 4.924 0 0 1 7.674 2.75h8.652Zm2.762 10.36a1 1 0 0 1 1 1v1.75h1.75a1 1 0 1 1 0 2h-1.75v1.75a1 1 0 0 1-2 0v-1.75h-1.75a1 1 0 0 1 0-2h1.75v-1.75a1 1 0 0 1 1-1ZM15.61 6.87a1.533 1.533 0 1 1 0 3.064 1.533 1.533 0 0 1 0-3.065Z" fill="currentColor"/>
          </svg>
          
          <!-- 视频工具 -->
          <svg v-else-if="tool.icon === 'video'" width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M19.398 13.11a1 1 0 0 1 1 1v1.75h1.75a1 1 0 1 1 0 2h-1.75v1.75a1 1 0 0 1-2 0v-1.75h-1.75a1 1 0 0 1 0-2h1.75v-1.75a1 1 0 0 1 1-1ZM17.611 3.5A4.89 4.89 0 0 1 22.5 8.389v3.366a6.105 6.105 0 0 0-2-.868V8.389A2.889 2.889 0 0 0 17.611 5.5H6.39A2.889 2.889 0 0 0 3.5 8.389v7.222l.015.295A2.89 2.89 0 0 0 6.389 18.5h6.788c.202.73.534 1.406.972 2H6.39a4.889 4.889 0 0 1-4.882-4.638l-.007-.25V8.388A4.89 4.89 0 0 1 6.39 3.499h11.22Zm-6.857 5.697c.32-.036.712.183 1.495.621l1.28.717c.815.456 1.222.684 1.358.985a1 1 0 0 1 0 .823.64.64 0 0 1-.064.107 6.22 6.22 0 0 0-.21.216c-.225.18-.575.376-1.084.661l-1.28.717c-.783.438-1.175.657-1.495.621a1.002 1.002 0 0 1-.698-.41c-.189-.261-.189-.71-.189-1.607v-1.434c0-.897 0-1.346.189-1.608a1 1 0 0 1 .698-.409Z" fill="currentColor"/>
          </svg>
          
          <!-- 文字工具 -->
          <svg v-else-if="tool.icon === 'text'" width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M19.092 13.102a1 1 0 0 1 1 1v1.75h1.75a1 1 0 0 1 0 2h-1.75v1.75a1 1 0 1 1-2 0v-1.75h-1.75a1 1 0 1 1 0-2h1.75v-1.75a1 1 0 0 1 1-1Zm.543-8.606a1 1 0 0 1 .897.995v2.467a1 1 0 0 1-2 0V6.491h-5.401v11.986h1.368l.103.004a1 1 0 0 1 0 1.99l-.103.006H9.502a1.001 1.001 0 0 1 0-2h1.629V6.49h-5.4v1.467a1 1 0 0 1-2 0V5.491l.004-.102c.052-.504.478-.899.995-.899h14.802l.103.006Z" fill="currentColor"/>
          </svg>
          
          <!-- 元素工具 -->
          <svg v-else-if="tool.icon === 'element'" width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M6.938 3.125a1 1 0 0 1 1 1v1.813h8.125V4.125a1 1 0 1 1 2 0v1.813h1.812a1 1 0 1 1 0 2h-1.813v2.937a1 1 0 1 1-2 0V7.937H7.938v8.125h2.938a1 1 0 1 1 0 2H7.937v1.813a1 1 0 1 1-2 0v-1.813H4.125a1 1 0 1 1 0-2h1.813V7.938H4.125a1 1 0 0 1 0-2h1.813V4.125a1 1 0 0 1 1-1Zm10.518 17.363.208-.477a3.68 3.68 0 0 1 1.871-1.898l.641-.285a.447.447 0 0 0 0-.812l-.605-.27a3.682 3.682 0 0 1-1.898-1.961l-.213-.515a.427.427 0 0 0-.794 0l-.214.515a3.682 3.682 0 0 1-1.898 1.962l-.605.269a.447.447 0 0 0 0 .812l.64.285a3.675 3.675 0 0 1 1.872 1.898l.208.477c.152.35.635.35.787 0Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"/>
          </svg>
          
          <!-- 更多指示器 -->
          <svg v-if="tool.hasMore" class="more-indicator" width="10" height="10" viewBox="0 0 25 25" fill="none">
            <path d="m15.72 9.028-7.388-.013C7.044 9.012 6.352 10.529 7.2 11.5l3.687 4.228a1.5 1.5 0 0 0 2.258.004l3.701-4.215c.85-.969.165-2.488-1.124-2.49Z" fill="var(--text-placeholder)"/>
          </svg>
        </div>
        
        <!-- Tooltip -->
        <Transition name="tooltip">
          <div v-if="hoveredTool === tool.id" class="simple-tooltip">
            <div class="simple-tooltip-content">
              <span class="simple-tooltip-content-inner">
                {{ tool.label }}
                <span v-if="tool.shortcut" class="shortcut-key">{{ tool.shortcut }}</span>
              </span>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.left-toolbar {
  position: fixed;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 1000;
  pointer-events: none;
}

.left-toolbar > * {
  pointer-events: auto;
}

.left-toolbar-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 4px;
  width: 36px;
  min-height: auto;
  background: var(--canvas-float-block-default);
  backdrop-filter: blur(var(--canvas-float-backdrop-blur));
  border-radius: 12px;
  box-shadow: var(--shadow-generator-float-block);
  outline: 0.5px solid var(--stroke-tertiary);
  z-index: 901;
}

.toolbar-button {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: var(--text-primary);
  cursor: pointer;
  font-size: 10px;
  line-height: 1.2;
  outline: none;
  transition: all 0.2s ease;
  user-select: none;
}

.toolbar-button:hover {
  background: var(--bg-block-primary-hover);
}

.toolbar-button:active {
  background: var(--bg-block-primary-pressed);
}

.toolbar-button.active {
  background: var(--bg-block-primary-default);
}

.toolbar-button.active:hover {
  background: var(--bg-block-primary-hover);
}

.icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  width: 36px;
  height: 36px;
  padding: 10px;
  box-sizing: border-box;
  background: transparent;
  border-radius: 8px;
  color: var(--text-primary);
  transition: all 0.2s ease;
}

.more-indicator {
  position: absolute;
  right: 0;
  bottom: 4px;
  width: 10px;
  height: 10px;
  transform: rotate(270deg);
  pointer-events: none;
}

/* Tooltip 样式 */
.simple-tooltip {
  position: absolute;
  left: calc(100% + 8px);
  top: 50%;
  transform: translateY(-50%);
  z-index: 1002;
  pointer-events: none;
}

.simple-tooltip-content {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  padding: 10px 16px;
  background: var(--component-tooltips, #22252a);
  border-radius: 8px;
}

.simple-tooltip-content-inner {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--onmedia-text-primary, #f5fbff);
  font-size: 12px;
  font-weight: 400;
  line-height: 20px;
  white-space: nowrap;
}

.shortcut-key {
  color: var(--text-secondary);
}

/* Tooltip 动画 */
.tooltip-enter-active {
  animation: tooltip-fadein-right 0.3s cubic-bezier(0.34, 0.69, 0.1, 1) forwards;
}

.tooltip-leave-active {
  animation: tooltip-fadein-right 0.1s cubic-bezier(0.3, 1.3, 0.3, 1) reverse forwards;
}

@keyframes tooltip-fadein-right {
  0% {
    opacity: 0;
    transform: translateY(-50%) translateX(-8px) scale(0.9);
  }
  100% {
    opacity: 1;
    transform: translateY(-50%) translateX(0) scale(1);
  }
}
</style>
