<script setup>
/**
 * 通用 API 设置弹窗
 * 包含 API 配置 + 模型管理，可在任意页面引入使用
 */
import { ref, watch } from 'vue'
import { getBaseUrl, setBaseUrl, getApiKey, getEndpoint, setEndpoint } from '@/api/request'
import { IMAGE_MODELS, VIDEO_MODELS, CHAT_MODELS } from '@/config/models'
import { getAgentModel, setAgentModel } from '@/api/agent'

const props = defineProps({ visible: Boolean })
const emit = defineEmits(['update:visible'])

// API 设置
const apiBaseUrl = ref(getBaseUrl())
const apiKey = ref(getApiKey())
const chatEndpoint = ref(getEndpoint('chat'))
const imageEndpoint = ref(getEndpoint('image'))
const videoEndpoint = ref(getEndpoint('video'))
const selectedModel = ref(getAgentModel())

// Tab 切换
const activeTab = ref('api')

// 自定义模型
const customImageModels = ref(JSON.parse(localStorage.getItem('wf-custom-image-models') || '[]'))
const customVideoModels = ref(JSON.parse(localStorage.getItem('wf-custom-video-models') || '[]'))
const customChatModels = ref(JSON.parse(localStorage.getItem('wf-custom-chat-models') || '[]'))

// 新增模型表单
const newModel = ref({ label: '', key: '', category: 'chat' })

const close = () => emit('update:visible', false)

const addModel = () => {
  if (!newModel.value.label || !newModel.value.key) return
  const item = { label: newModel.value.label, key: newModel.value.key }
  const map = { image: customImageModels, video: customVideoModels, chat: customChatModels }
  const storageKey = { image: 'wf-custom-image-models', video: 'wf-custom-video-models', chat: 'wf-custom-chat-models' }
  map[newModel.value.category].value.push(item)
  localStorage.setItem(storageKey[newModel.value.category], JSON.stringify(map[newModel.value.category].value))
  newModel.value = { label: '', key: '', category: newModel.value.category }
}

const removeModel = (category, index) => {
  const map = { image: customImageModels, video: customVideoModels, chat: customChatModels }
  const storageKey = { image: 'wf-custom-image-models', video: 'wf-custom-video-models', chat: 'wf-custom-chat-models' }
  map[category].value.splice(index, 1)
  localStorage.setItem(storageKey[category], JSON.stringify(map[category].value))
}

const save = () => {
  setBaseUrl(apiBaseUrl.value)
  localStorage.setItem('workflow-api-key', apiKey.value)
  setEndpoint('chat', chatEndpoint.value)
  setEndpoint('image', imageEndpoint.value)
  setEndpoint('video', videoEndpoint.value)
  setAgentModel(selectedModel.value)
  close()
}

// 获取所有对话模型（内置 + 自定义）
const allChatModels = () => [...CHAT_MODELS, ...customChatModels.value]

watch(() => props.visible, (v) => {
  if (v) {
    apiBaseUrl.value = getBaseUrl()
    apiKey.value = getApiKey()
    chatEndpoint.value = getEndpoint('chat')
    imageEndpoint.value = getEndpoint('image')
    videoEndpoint.value = getEndpoint('video')
    selectedModel.value = getAgentModel()
    customImageModels.value = JSON.parse(localStorage.getItem('wf-custom-image-models') || '[]')
    customVideoModels.value = JSON.parse(localStorage.getItem('wf-custom-video-models') || '[]')
    customChatModels.value = JSON.parse(localStorage.getItem('wf-custom-chat-models') || '[]')
  }
})
</script>

<template>
  <Transition name="fade">
    <div v-if="visible" class="api-settings-overlay" @click.self="close">
      <div class="api-settings-panel">
        <div class="api-settings-header">
          <span>设置</span>
          <button class="api-settings-close" @click="close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>

        <!-- Tab 切换 -->
        <div class="api-settings-tabs">
          <button :class="['api-settings-tab', { active: activeTab === 'api' }]" @click="activeTab = 'api'">API 配置</button>
          <button :class="['api-settings-tab', { active: activeTab === 'models' }]" @click="activeTab = 'models'">模型管理</button>
        </div>

        <!-- API 配置 -->
        <div v-if="activeTab === 'api'" class="api-settings-body">
          <div class="api-settings-field">
            <label>API 地址</label>
            <input v-model="apiBaseUrl" placeholder="https://api.openai.com/v1" />
          </div>
          <div class="api-settings-field">
            <label>API 密钥</label>
            <input v-model="apiKey" type="password" placeholder="sk-..." />
          </div>
          <div class="api-settings-divider"></div>
          <div class="api-settings-field">
            <label>对话接口路径</label>
            <input v-model="chatEndpoint" placeholder="/chat/completions" />
          </div>
          <div class="api-settings-field">
            <label>图片生成接口路径</label>
            <input v-model="imageEndpoint" placeholder="/images/generations" />
          </div>
          <div class="api-settings-field">
            <label>视频生成接口路径</label>
            <input v-model="videoEndpoint" placeholder="/videos" />
          </div>
          <div class="api-settings-divider"></div>
          <div class="api-settings-field">
            <label>默认对话模型</label>
            <select v-model="selectedModel">
              <option v-for="m in allChatModels()" :key="m.key" :value="m.key">{{ m.label }}</option>
            </select>
          </div>
        </div>

        <!-- 模型管理 -->
        <div v-if="activeTab === 'models'" class="api-settings-body">
          <div class="api-settings-field">
            <label>图片模型</label>
            <div class="api-model-list">
              <span v-for="m in IMAGE_MODELS" :key="m.key" class="api-model-tag builtin">{{ m.label }}</span>
              <span v-for="(m, i) in customImageModels" :key="m.key" class="api-model-tag custom">
                {{ m.label }}
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" @click="removeModel('image', i)" style="cursor:pointer;margin-left:4px"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
              </span>
            </div>
          </div>
          <div class="api-settings-field">
            <label>视频模型</label>
            <div class="api-model-list">
              <span v-for="m in VIDEO_MODELS" :key="m.key" class="api-model-tag builtin">{{ m.label }}</span>
              <span v-for="(m, i) in customVideoModels" :key="m.key" class="api-model-tag custom">
                {{ m.label }}
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" @click="removeModel('video', i)" style="cursor:pointer;margin-left:4px"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
              </span>
            </div>
          </div>
          <div class="api-settings-field">
            <label>对话模型</label>
            <div class="api-model-list">
              <span v-for="m in CHAT_MODELS" :key="m.key" class="api-model-tag builtin">{{ m.label }}</span>
              <span v-for="(m, i) in customChatModels" :key="m.key" class="api-model-tag custom">
                {{ m.label }}
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" @click="removeModel('chat', i)" style="cursor:pointer;margin-left:4px"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
              </span>
            </div>
          </div>
          <div class="api-settings-divider"></div>
          <label class="api-settings-add-label">添加自定义模型</label>
          <div class="api-settings-add-row">
            <select v-model="newModel.category" class="api-settings-add-select">
              <option value="image">图片</option>
              <option value="video">视频</option>
              <option value="chat">对话</option>
            </select>
            <input v-model="newModel.label" placeholder="显示名称" class="api-settings-add-input" />
            <input v-model="newModel.key" placeholder="模型 ID" class="api-settings-add-input" />
          </div>
          <button class="api-settings-add-btn" @click="addModel">添加模型</button>
        </div>

        <div class="api-settings-footer">
          <button class="api-settings-save" @click="save">保存设置</button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.api-settings-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.api-settings-panel {
  background: var(--bg-body, #1a1a2e);
  border: 1px solid var(--stroke-secondary, rgba(255, 255, 255, 0.08));
  border-radius: 12px;
  width: 480px;
  max-height: 80vh;
  overflow-y: auto;
}

.api-settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--stroke-secondary, rgba(255, 255, 255, 0.08));
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.api-settings-close {
  background: none;
  border: none;
  color: var(--text-tertiary);
  cursor: pointer;
  padding: 4px;
  display: flex;
  border-radius: 4px;
}

.api-settings-close:hover {
  background: var(--bg-block-secondary-hover, rgba(255, 255, 255, 0.08));
}

.api-settings-tabs {
  display: flex;
  gap: 0;
  border-bottom: 1px solid var(--stroke-secondary, rgba(255, 255, 255, 0.08));
  padding: 0 20px;
}

.api-settings-tab {
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--text-tertiary);
  cursor: pointer;
  font-size: 13px;
  padding: 10px 12px;
  transition: color 0.2s, border-color 0.2s;
}

.api-settings-tab.active {
  color: var(--brand-main-default, #00bcd4);
  border-bottom-color: var(--brand-main-default, #00bcd4);
}

.api-settings-tab:hover {
  color: var(--text-primary);
}

.api-settings-body {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.api-settings-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.api-settings-field label,
.api-settings-add-label {
  font-size: 13px;
  color: var(--text-secondary);
}

.api-settings-field input,
.api-settings-field select {
  background: var(--bg-block-primary-default, rgba(255, 255, 255, 0.06));
  border: 1px solid var(--stroke-secondary, rgba(255, 255, 255, 0.08));
  border-radius: 8px;
  padding: 8px 12px;
  color: var(--text-primary);
  font-size: 13px;
  outline: none;
}

.api-settings-field input:focus,
.api-settings-field select:focus {
  border-color: var(--brand-main-default, #00bcd4);
}

.api-settings-divider {
  height: 1px;
  background: var(--stroke-secondary, rgba(255, 255, 255, 0.08));
}

/* 模型标签 */
.api-model-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.api-model-tag {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 6px;
  font-size: 12px;
}

.api-model-tag.builtin {
  background: var(--bg-block-primary-default, rgba(255, 255, 255, 0.06));
  color: var(--text-secondary);
}

.api-model-tag.custom {
  background: color-mix(in srgb, var(--brand-main-default, #00bcd4) 15%, transparent);
  color: var(--brand-main-default, #00bcd4);
}

/* 添加模型 */
.api-settings-add-row {
  display: flex;
  gap: 6px;
}

.api-settings-add-select,
.api-settings-add-input {
  background: var(--bg-block-primary-default, rgba(255, 255, 255, 0.06));
  border: 1px solid var(--stroke-secondary, rgba(255, 255, 255, 0.08));
  border-radius: 8px;
  padding: 6px 10px;
  color: var(--text-primary);
  font-size: 12px;
  outline: none;
}

.api-settings-add-select {
  flex: 0 0 auto;
  cursor: pointer;
}

.api-settings-add-input {
  flex: 1;
}

.api-settings-add-btn {
  background: var(--bg-block-primary-default, rgba(255, 255, 255, 0.06));
  border: 1px dashed var(--stroke-secondary, rgba(255, 255, 255, 0.15));
  border-radius: 8px;
  padding: 6px;
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
}

.api-settings-add-btn:hover {
  border-color: var(--brand-main-default, #00bcd4);
  color: var(--brand-main-default, #00bcd4);
}

.api-settings-footer {
  padding: 12px 20px 16px;
  display: flex;
  justify-content: flex-end;
}

.api-settings-save {
  background: var(--brand-main-default, #00bcd4);
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 8px 24px;
  font-size: 14px;
  cursor: pointer;
}

.api-settings-save:hover {
  opacity: 0.9;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
