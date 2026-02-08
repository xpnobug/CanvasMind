<script setup>
/**
 * API 设置与模型配置弹窗
 */
import { ref, watch } from 'vue'
import { getBaseUrl, setBaseUrl, getApiKey, getEndpoint, setEndpoint } from '../api/request'
import { IMAGE_MODELS, VIDEO_MODELS, CHAT_MODELS } from '../config/models'

const props = defineProps({ visible: Boolean })
const emit = defineEmits(['update:visible'])

// API 设置
const apiBaseUrl = ref(getBaseUrl())
const apiKey = ref(getApiKey())
const chatEndpoint = ref(getEndpoint('chat'))
const imageEndpoint = ref(getEndpoint('image'))
const videoEndpoint = ref(getEndpoint('video'))

// 自定义模型（从 localStorage 读取）
const customImageModels = ref(JSON.parse(localStorage.getItem('wf-custom-image-models') || '[]'))
const customVideoModels = ref(JSON.parse(localStorage.getItem('wf-custom-video-models') || '[]'))
const customChatModels = ref(JSON.parse(localStorage.getItem('wf-custom-chat-models') || '[]'))

// 当前 tab
const activeTab = ref('api')

// 新增模型表单
const newModel = ref({ label: '', key: '', category: 'image' })

const close = () => emit('update:visible', false)

const saveApiSettings = () => {
  setBaseUrl(apiBaseUrl.value)
  localStorage.setItem('workflow-api-key', apiKey.value)
  setEndpoint('chat', chatEndpoint.value)
  setEndpoint('image', imageEndpoint.value)
  setEndpoint('video', videoEndpoint.value)
}

const addModel = () => {
  if (!newModel.value.label || !newModel.value.key) return
  const item = { label: newModel.value.label, key: newModel.value.key }
  if (newModel.value.category === 'image') {
    customImageModels.value.push(item)
    localStorage.setItem('wf-custom-image-models', JSON.stringify(customImageModels.value))
  } else if (newModel.value.category === 'video') {
    customVideoModels.value.push(item)
    localStorage.setItem('wf-custom-video-models', JSON.stringify(customVideoModels.value))
  } else {
    customChatModels.value.push(item)
    localStorage.setItem('wf-custom-chat-models', JSON.stringify(customChatModels.value))
  }
  newModel.value = { label: '', key: '', category: newModel.value.category }
}

const removeModel = (category, index) => {
  if (category === 'image') {
    customImageModels.value.splice(index, 1)
    localStorage.setItem('wf-custom-image-models', JSON.stringify(customImageModels.value))
  } else if (category === 'video') {
    customVideoModels.value.splice(index, 1)
    localStorage.setItem('wf-custom-video-models', JSON.stringify(customVideoModels.value))
  } else {
    customChatModels.value.splice(index, 1)
    localStorage.setItem('wf-custom-chat-models', JSON.stringify(customChatModels.value))
  }
}

const save = () => {
  saveApiSettings()
  close()
}

watch(() => props.visible, (v) => {
  if (v) {
    apiBaseUrl.value = getBaseUrl()
    apiKey.value = getApiKey()
    chatEndpoint.value = getEndpoint('chat')
    imageEndpoint.value = getEndpoint('image')
    videoEndpoint.value = getEndpoint('video')
  }
})
</script>

<template>
  <Transition name="wf-panel">
    <div v-if="visible" class="wf-settings-overlay" @click.self="close">
      <div class="wf-settings-panel">
        <!-- 头部 -->
        <div class="wf-settings-header">
          <span class="wf-settings-title">设置</span>
          <button class="wf-btn wf-btn-sm" @click="close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          </button>
        </div>

        <!-- Tab 切换 -->
        <div class="wf-settings-tabs">
          <button :class="['wf-settings-tab', { active: activeTab === 'api' }]" @click="activeTab = 'api'">API 配置</button>
          <button :class="['wf-settings-tab', { active: activeTab === 'models' }]" @click="activeTab = 'models'">模型管理</button>
        </div>

        <!-- API 配置 -->
        <div v-if="activeTab === 'api'" class="wf-settings-body">
          <div class="wf-settings-field">
            <label class="wf-node-label">API 地址</label>
            <input v-model="apiBaseUrl" placeholder="https://api.openai.com/v1" @mousedown.stop class="wf-settings-input" />
          </div>
          <div class="wf-settings-field">
            <label class="wf-node-label">API 密钥</label>
            <input v-model="apiKey" type="password" placeholder="sk-..." @mousedown.stop class="wf-settings-input" />
          </div>
          <div class="wf-settings-divider"></div>
          <div class="wf-settings-field">
            <label class="wf-node-label">对话接口路径</label>
            <input v-model="chatEndpoint" placeholder="/chat/completions" @mousedown.stop class="wf-settings-input" />
          </div>
          <div class="wf-settings-field">
            <label class="wf-node-label">图片生成接口路径</label>
            <input v-model="imageEndpoint" placeholder="/images/generations" @mousedown.stop class="wf-settings-input" />
          </div>
          <div class="wf-settings-field">
            <label class="wf-node-label">视频生成接口路径</label>
            <input v-model="videoEndpoint" placeholder="/videos" @mousedown.stop class="wf-settings-input" />
          </div>
        </div>

        <!-- 模型管理 -->
        <div v-if="activeTab === 'models'" class="wf-settings-body">
          <!-- 内置模型列表 -->
          <div class="wf-settings-field">
            <label class="wf-node-label">图片模型</label>
            <div class="wf-model-list">
              <span v-for="m in IMAGE_MODELS" :key="m.key" class="wf-model-tag builtin">{{ m.label }}</span>
              <span v-for="(m, i) in customImageModels" :key="m.key" class="wf-model-tag custom">
                {{ m.label }}
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" @click="removeModel('image', i)" style="cursor: pointer; margin-left: 4px;"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
              </span>
            </div>
          </div>

          <div class="wf-settings-field">
            <label class="wf-node-label">视频模型</label>
            <div class="wf-model-list">
              <span v-for="m in VIDEO_MODELS" :key="m.key" class="wf-model-tag builtin">{{ m.label }}</span>
              <span v-for="(m, i) in customVideoModels" :key="m.key" class="wf-model-tag custom">
                {{ m.label }}
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" @click="removeModel('video', i)" style="cursor: pointer; margin-left: 4px;"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
              </span>
            </div>
          </div>

          <div class="wf-settings-field">
            <label class="wf-node-label">对话模型</label>
            <div class="wf-model-list">
              <span v-for="m in CHAT_MODELS" :key="m.key" class="wf-model-tag builtin">{{ m.label }}</span>
              <span v-for="(m, i) in customChatModels" :key="m.key" class="wf-model-tag custom">
                {{ m.label }}
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" @click="removeModel('chat', i)" style="cursor: pointer; margin-left: 4px;"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
              </span>
            </div>
          </div>

          <!-- 添加自定义模型 -->
          <div class="wf-settings-divider"></div>
          <label class="wf-node-label">添加自定义模型</label>
          <div class="wf-add-model-form">
            <select v-model="newModel.category" @mousedown.stop class="wf-settings-input" style="width: auto; flex: 0 0 auto;">
              <option value="image">图片</option>
              <option value="video">视频</option>
              <option value="chat">对话</option>
            </select>
            <input v-model="newModel.label" placeholder="显示名称" @mousedown.stop class="wf-settings-input" style="flex: 1;" />
            <input v-model="newModel.key" placeholder="模型 ID" @mousedown.stop class="wf-settings-input" style="flex: 1;" />
            <button class="wf-btn wf-btn-sm" @click="addModel" style="height: 32px; padding: 0 12px; background: var(--brand-main-default, #00cae0); color: #000; border-radius: 6px; font-size: 12px;">添加</button>
          </div>
        </div>

        <!-- 底部按钮 -->
        <div class="wf-settings-footer">
          <button class="wf-node-generate-btn" @click="save">保存设置</button>
        </div>
      </div>
    </div>
  </Transition>
</template>
