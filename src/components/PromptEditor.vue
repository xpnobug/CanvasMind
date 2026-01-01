<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const emit = defineEmits(['send'])

const prompt = ref('')
const isExpanded = ref(false)
const inspirationSearch = ref(true)
const creativeDesign = ref(true)
const editorRef = ref(null)
const containerRef = ref(null)

const handleSubmit = () => {
  if (!prompt.value.trim()) return
  // 发送消息到父组件
  emit('send', prompt.value.trim())
  // 清空输入
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

// 点击容器外部时收起（仅当输入框为空时）
const handleClickOutside = (e) => {
  if (!containerRef.value) return
  const isClickInside = containerRef.value.contains(e.target)
  if (!isClickInside && !prompt.value.trim()) {
    isExpanded.value = false
  }
}

// 点击展开
const expandEditor = () => {
  isExpanded.value = true
  setTimeout(() => {
    if (editorRef.value) {
      editorRef.value.focus()
    }
  }, 100)
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
        <!-- 主内容 - 输入框 -->
        <div class="main-content">
          <div class="prompt-editor-container">
            <div class="prompt-editor">
              <div 
                ref="editorRef"
                contenteditable="true" 
                role="textbox"
                class="tiptap"
                tabindex="0"
                @input="handleInput"
                @focus="handleFocus"
                @keydown.enter.prevent="handleSubmit"
              ><p data-placeholder="说说今天想做点什么"></p></div>
            </div>
          </div>
        </div>
        
        <!-- 折叠状态的提交按钮 -->
        <div class="collapsed-submit-button-container" v-show="!isExpanded">
          <button 
            class="submit-button collapsed-submit-button"
            :class="{ disabled: !prompt.trim() }"
            :disabled="!prompt.trim()"
            @click.stop="handleSubmit"
            type="button"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12.002 3c.424 0 .806.177 1.079.46l5.98 5.98.103.114a1.5 1.5 0 0 1-2.225 2.006l-3.437-3.436V19.5l-.008.153a1.5 1.5 0 0 1-2.985 0l-.007-.153V8.122l-3.44 3.438a1.5 1.5 0 0 1-2.225-2.006l.103-.115 6-5.999.025-.025.059-.052.044-.037c.029-.023.06-.044.09-.065l.014-.01a1.43 1.43 0 0 1 .101-.062l.03-.017c.209-.11.447-.172.699-.172Z" fill="currentColor"/>
            </svg>
          </button>
        </div>
      </div>
      
      <!-- 工具栏 - 展开时显示 -->
      <div class="toolbar" v-show="isExpanded">
        <div class="toolbar-settings">
          <div class="toolbar-settings-content">
            <!-- Agent 模式选择器 -->
            <div class="type-select">
              <div class="select-trigger">
                <span class="select-option-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M11.805 5.786c1.25-.926 2.193-1.373 2.471-1.096.489.488-1.261 3.03-3.909 5.677-4.33 4.331-6.715 8.968-5.326 10.358.29.29.723.416 1.264.394.421.017.92-.07 1.48-.249-2.117.9-3.859 1.005-4.76.104-1.874-1.874.61-7.402 5.553-12.353l.022-.02c.03-.032.062-.063.093-.094l.065-.064.11-.108c.97-.95 1.96-1.804 2.937-2.549Zm5.55 11.57c1.532-1.531 3.2-2.347 3.725-1.822.525.525-.29 2.192-1.822 3.724-1.532 1.531-3.2 2.347-3.725 1.822-.524-.525.291-2.192 1.822-3.724ZM16.217 3.13c2.116-.9 3.858-1.005 4.759-.105 1.874 1.875-.612 7.402-5.554 12.353l-.022.021c-.03.032-.062.062-.093.093l-.064.065-.11.108c-.97.949-1.96 1.803-2.938 2.548-1.25.926-2.193 1.374-2.471 1.096-.489-.487 1.262-3.029 3.91-5.676 4.331-4.332 6.715-8.97 5.325-10.36-.29-.29-.722-.414-1.263-.392-.421-.017-.92.069-1.48.249ZM4.742 4.74C6.274 3.21 7.94 2.394 8.466 2.92c.525.525-.29 2.193-1.822 3.724C5.112 8.175 3.445 8.99 2.92 8.466c-.525-.525.29-2.193 1.822-3.725Z" fill="currentColor"/>
                  </svg>
                </span>
                <span class="select-value">Agent 模式</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" class="select-arrow">
                  <path d="M21.01 7.982A1.2 1.2 0 0 1 21 9.679l-8.156 8.06a1.2 1.2 0 0 1-1.688 0L3 9.68a1.2 1.2 0 0 1 1.687-1.707L12 15.199l7.313-7.227a1.2 1.2 0 0 1 1.697.01Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"/>
                </svg>
              </div>
            </div>
            
            <!-- 附件按钮 -->
            <button class="toolbar-button icon-only" type="button" @click.stop>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M15.145 2.492a4.481 4.481 0 0 1 3.137 1.316c.805.8 1.323 1.91 1.329 3.133.006 1.237-.512 2.503-1.617 3.608l-6.24 6.24c-.611.611-1.358.884-2.101.839a2.85 2.85 0 0 1-1.826-.844 2.849 2.849 0 0 1-.842-1.824c-.046-.744.226-1.491.837-2.102L13.03 7.65a1 1 0 0 1 1.414 1.415l-5.21 5.207c-.224.225-.263.42-.254.566.01.17.097.366.261.53a.853.853 0 0 0 .533.263c.145.008.34-.031.564-.255l6.241-6.241c.773-.773 1.034-1.542 1.03-2.184a2.456 2.456 0 0 0-.739-1.725 2.482 2.482 0 0 0-1.734-.734c-.645-.002-1.412.258-2.177 1.022l-6.241 6.24c-1.163 1.164-1.571 2.38-1.54 3.458.032 1.095.52 2.136 1.303 2.916.782.78 1.826 1.266 2.925 1.298 1.079.03 2.294-.377 3.45-1.533l6.462-6.462a1 1 0 0 1 1.414 1.416l-6.462 6.46c-1.512 1.512-3.247 2.166-4.921 2.119-1.656-.047-3.172-.776-4.28-1.881-1.109-1.105-1.842-2.62-1.89-4.276-.048-1.675.608-3.411 2.125-4.928l6.241-6.242c1.1-1.099 2.364-1.612 3.599-1.607Z" fill="currentColor"/>
              </svg>
            </button>
            
            <!-- 自动按钮 -->
            <button class="toolbar-button with-text" type="button" @click.stop>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M18.047 4.1a1 1 0 1 0-2 0v2.8a1 1 0 1 0 2 0v-.447h3.103a1 1 0 1 0 0-2h-3.103V4.1Zm-4 2.353H2.85a1 1 0 0 1 0-2h11.197v2Zm-7 3.247a1 1 0 0 0-1 1v.4H2.85a1 1 0 1 0 0 2h3.197v.4a1 1 0 1 0 2 0v-2.8a1 1 0 0 0-1-1Zm14.103 3.4H10.047v-2H21.15a1 1 0 1 1 0 2Zm-10.103 3a1 1 0 0 0-1 1v2.8a1 1 0 1 0 2 0v-2.8a1 1 0 0 0-1-1ZM2.85 17.497h5.197v2H2.85a1 1 0 1 1 0-2Zm18.3 2h-9.103v-2h9.103a1 1 0 1 1 0 2Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"/>
              </svg>
              <span>自动</span>
            </button>
            
            <!-- 灵感搜索按钮 -->
            <button 
              class="toolbar-button with-text switch-button" 
              :class="{ checked: inspirationSearch }"
              @click.stop="inspirationSearch = !inspirationSearch"
              type="button"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M11.606 2.25a8.5 8.5 0 0 1 6.676 13.762l3.406 3.406a1 1 0 1 1-1.414 1.414l-3.406-3.406a8.464 8.464 0 0 1-6.666 1.706v-2.036a6.5 6.5 0 1 0-5.096-6.346c0 .084.004.167.007.25H3.112a8.5 8.5 0 0 1 8.494-8.75Z" fill="currentColor"/>
                <path d="M7.772 12.57a.944.944 0 0 1 1.348-.002.98.98 0 0 1 .002 1.37l-3.999 4.064a.947.947 0 0 1-1.35 0l-2.295-2.339a.978.978 0 0 1 .002-1.369.944.944 0 0 1 1.348.003l1.621 1.65 3.323-3.378Z" fill="#00CAE0"/>
              </svg>
              <span>灵感搜索</span>
            </button>
            
            <!-- 创意设计按钮 -->
            <button 
              class="toolbar-button with-text switch-button" 
              :class="{ checked: creativeDesign }"
              @click.stop="creativeDesign = !creativeDesign"
              type="button"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M13.402 20.598c.289 0 .53.239.453.516a1.904 1.904 0 0 1-3.724-.322.185.185 0 0 1 .184-.194h3.087ZM11.988 1.499a7.953 7.953 0 0 1 7.951 7.952 7.943 7.943 0 0 1-3.758 6.752 2.952 2.952 0 0 1-2.943 2.75h-2.237s-.87.003-.87-.953.87-.95.87-.95h2.237l.108-.006c.528-.054.94-.5.941-1.043v-.352a.95.95 0 0 1 .509-.841A6.048 6.048 0 0 0 12.3 3.41l-.312-.008A6.05 6.05 0 0 0 6.143 11s.257.749-.743 1c-.937.251-1.213-1-1.213-1a7.953 7.953 0 0 1 7.8-9.501Z" fill="currentColor"/>
                <path d="M11.706 7.7a.316.316 0 0 1 .588 0l.158.381c.27.651.774 1.172 1.407 1.453l.449.2a.332.332 0 0 1 0 .602l-.475.21a2.725 2.725 0 0 0-1.387 1.406l-.154.354a.317.317 0 0 1-.584 0l-.154-.354A2.761 2.761 0 0 0 11 11.13l-.137-.13a2.682 2.682 0 0 0-.696-.453l-.475-.211a.332.332 0 0 1 0-.603l.449-.199a2.729 2.729 0 0 0 1.407-1.453l.158-.382Z" fill="currentColor"/>
                <path fill="#00CAE0" d="M8.078 12.57a.944.944 0 0 1 1.347-.002.98.98 0 0 1 .002 1.37L5.43 18.001a.947.947 0 0 1-1.35 0l-2.296-2.339a.978.978 0 0 1 .003-1.369.944.944 0 0 1 1.347.003l1.621 1.65 3.324-3.378Z"/>
              </svg>
              <span>创意设计</span>
            </button>
          </div>
        </div>
        
        <!-- 展开状态的提交按钮 -->
        <div class="toolbar-actions">
          <button 
            class="submit-button"
            :class="{ disabled: !prompt.trim() }"
            :disabled="!prompt.trim()"
            @click.stop="handleSubmit"
            type="button"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12.002 3c.424 0 .806.177 1.079.46l5.98 5.98.103.114a1.5 1.5 0 0 1-2.225 2.006l-3.437-3.436V19.5l-.008.153a1.5 1.5 0 0 1-2.985 0l-.007-.153V8.122l-3.44 3.438a1.5 1.5 0 0 1-2.225-2.006l.103-.115 6-5.999.025-.025.059-.052.044-.037c.029-.023.06-.044.09-.065l.014-.01a1.43 1.43 0 0 1 .101-.062l.03-.017c.209-.11.447-.172.699-.172Z" fill="currentColor"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.content-generator {
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000000;
  pointer-events: auto;
  box-sizing: border-box;
  /* 展开状态宽度 */
  width: 100%;
  max-width: 680px;
  padding: 0 12px;
  transition: max-width 0.35s cubic-bezier(0.15, 0.75, 0.3, 1);
}

/* 折叠状态 - 更窄的胶囊 */
.content-generator.collapsed {
  max-width: 480px;
}

.layout {
  -webkit-backdrop-filter: blur(var(--canvas-float-backdrop-blur));
  backdrop-filter: blur(var(--canvas-float-backdrop-blur));
  background: var(--canvas-float-block-default);
  border: 0.5px solid var(--stroke-tertiary);
  border-radius: 16px;
  box-shadow: var(--shadow-generator-float-block);
  overflow: hidden;
  transition: border-radius 0.35s cubic-bezier(0.15, 0.75, 0.3, 1);
}

/* 折叠状态 - 胶囊形状 */
.content-generator.collapsed .layout {
  border-radius: 28px;
  cursor: text;
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
  transition: background-color 0.2s;
}

.submit-button:hover:not(.disabled) {
  background: var(--brand-main-hover);
}

.submit-button.disabled {
  background: var(--bg-block-primary-default);
  color: var(--text-disabled);
  cursor: not-allowed;
}

/* 工具栏 */
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-top: 1px solid var(--stroke-tertiary);
  gap: 8px;
}

.toolbar-settings {
  flex: 1;
  overflow: hidden;
}

.toolbar-settings-content {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 模式选择器 */
.type-select {
  flex-shrink: 0;
}

.select-trigger {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 10px;
  border-radius: 8px;
  background: var(--bg-block-primary-default);
  border: none;
  color: var(--text-primary);
  font-size: 13px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.select-trigger:hover {
  background: var(--bg-block-primary-hover);
}

.select-option-icon {
  display: flex;
  align-items: center;
  color: var(--brand-main-default);
}

.select-value {
  font-weight: 400;
  white-space: nowrap;
}

.select-arrow {
  color: var(--text-tertiary);
  margin-left: 2px;
}

/* 工具栏按钮 */
.toolbar-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px;
  border-radius: 8px;
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-size: 13px;
  cursor: pointer;
  transition: background-color 0.2s;
  white-space: nowrap;
}

.toolbar-button:hover {
  background: var(--bg-block-primary-hover);
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
}
</style>
