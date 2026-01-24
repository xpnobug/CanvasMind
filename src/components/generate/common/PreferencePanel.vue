<script setup lang="ts">
// 生成偏好面板组件
// 包含生成偏好、选择比例、其他设置三个部分

import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import SelectPopup from './SelectPopup.vue'

// 组件属性
interface Props {
  visible: boolean
  triggerRef: HTMLElement | null
  autoMode?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  autoMode: true
})

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'update:autoMode': [value: boolean]
}>()

// 自动模式开关（双向绑定）
const localAutoMode = computed({
  get: () => props.autoMode,
  set: (val) => emit('update:autoMode', val)
})

// 生成偏好类型
const preferenceType = ref<'image' | 'video'>('image')

// 图片模式比例选项配置
const imageAspectRatioOptions = [
  { value: 'auto', label: '智能', icon: 'smart' },
  { value: '21:9', label: '21:9', icon: '21:9' },
  { value: '16:9', label: '16:9', icon: '16:9' },
  { value: '3:2', label: '3:2', icon: '3:2' },
  { value: '4:3', label: '4:3', icon: '4:3' },
  { value: '1:1', label: '1:1', icon: '1:1' },
  { value: '3:4', label: '3:4', icon: '3:4' },
  { value: '2:3', label: '2:3', icon: '2:3' },
  { value: '9:16', label: '9:16', icon: '9:16' }
]

// 视频模式比例选项配置（不包含3:2和2:3）
const videoAspectRatioOptions = [
  { value: 'auto', label: '智能', icon: 'smart' },
  { value: '21:9', label: '21:9', icon: '21:9' },
  { value: '16:9', label: '16:9', icon: '16:9' },
  { value: '4:3', label: '4:3', icon: '4:3' },
  { value: '1:1', label: '1:1', icon: '1:1' },
  { value: '3:4', label: '3:4', icon: '3:4' },
  { value: '9:16', label: '9:16', icon: '9:16' }
]

// 根据偏好类型获取比例选项
const aspectRatioOptions = computed(() => {
  return preferenceType.value === 'video' ? videoAspectRatioOptions : imageAspectRatioOptions
})

// 当前选中的比例
const currentAspectRatio = ref('auto')

// 图片模型选项
const imageModelOptions = [
  { value: '4.1', label: '图片 4.1' },
  { value: '4.0', label: '图片 4.0' },
  { value: '3.5', label: '图片 3.5' }
]

// 视频模型选项
const videoModelOptions = [
  { value: '3.0', label: '视频 3.0' },
  { value: '2.0', label: '视频 2.0' }
]

// 根据偏好类型获取模型选项
const modelOptions = computed(() => {
  return preferenceType.value === 'video' ? videoModelOptions : imageModelOptions
})

// 当前图片模型
const currentImageModel = ref('4.0')

// 当前视频模型
const currentVideoModel = ref('3.0')

// 当前模型（根据偏好类型）
const currentModel = computed({
  get: () => preferenceType.value === 'video' ? currentVideoModel.value : currentImageModel.value,
  set: (val) => {
    if (preferenceType.value === 'video') {
      currentVideoModel.value = val
    } else {
      currentImageModel.value = val
    }
  }
})

// 图片分辨率选项
const imageResolutionOptions = [
  { value: '2k', label: '高清 2K', icon: '2k' },
  { value: '4k', label: '超清 4K', icon: '4k' }
]

// 视频分辨率选项
const videoResolutionOptions = [
  { value: '720p', label: '720P', icon: 'hd' },
  { value: '1080p', label: '1080P', icon: 'hd' }
]

// 根据偏好类型获取分辨率选项
const resolutionOptions = computed(() => {
  return preferenceType.value === 'video' ? videoResolutionOptions : imageResolutionOptions
})

// 当前图片分辨率
const currentImageResolution = ref('2k')

// 当前视频分辨率
const currentVideoResolution = ref('720p')

// 当前分辨率（根据偏好类型）
const currentResolution = computed({
  get: () => preferenceType.value === 'video' ? currentVideoResolution.value : currentImageResolution.value,
  set: (val) => {
    if (preferenceType.value === 'video') {
      currentVideoResolution.value = val
    } else {
      currentImageResolution.value = val
    }
  }
})

// 模型选择弹窗
const isModelSelectOpen = ref(false)
const modelTriggerRef = ref<HTMLElement | null>(null)

// 分辨率选择弹窗
const isResolutionSelectOpen = ref(false)
const resolutionTriggerRef = ref<HTMLElement | null>(null)

// 面板位置
const panelStyle = ref<{
  top?: string
  left?: string
  transformOrigin?: string
}>({})

// 计算面板位置
const calculatePosition = () => {
  if (!props.triggerRef) return

  const triggerRect = props.triggerRef.getBoundingClientRect()
  const panelWidth = 484

  // 计算左对齐位置
  let left = triggerRect.left

  // 确保不超出屏幕右边界
  if (left + panelWidth > window.innerWidth - 20) {
    left = window.innerWidth - panelWidth - 20
  }

  // 计算顶部位置（在触发器上方）
  const top = triggerRect.top - 8

  panelStyle.value = {
    top: `${top}px`,
    left: `${left}px`,
    transformOrigin: '15px 100% 0px'
  }
}

// 关闭所有子弹窗
const closeAllSubPopups = () => {
  isModelSelectOpen.value = false
  isResolutionSelectOpen.value = false
}

// 切换模型选择
const toggleModelSelect = (e: Event) => {
  e.stopPropagation()
  const wasOpen = isModelSelectOpen.value
  closeAllSubPopups()
  isModelSelectOpen.value = !wasOpen
}

// 切换分辨率选择
const toggleResolutionSelect = (e: Event) => {
  e.stopPropagation()
  const wasOpen = isResolutionSelectOpen.value
  closeAllSubPopups()
  isResolutionSelectOpen.value = !wasOpen
}

// 选择模型
const selectModel = (value: string) => {
  currentModel.value = value
  isModelSelectOpen.value = false
}

// 选择分辨率
const selectResolution = (value: string) => {
  currentResolution.value = value
  isResolutionSelectOpen.value = false
}

// 获取当前模型标签
const currentModelLabel = computed(() => {
  return modelOptions.value.find(m => m.value === currentModel.value)?.label ||
    (preferenceType.value === 'video' ? '视频 3.0' : '图片 4.0')
})

// 获取当前分辨率标签
const currentResolutionLabel = computed(() => {
  return resolutionOptions.value.find(r => r.value === currentResolution.value)?.label ||
    (preferenceType.value === 'video' ? '720P' : '高清 2K')
})

// 是否禁用（自动模式下禁用手动选择）
const isDisabled = computed(() => localAutoMode.value)

// 点击外部关闭
const handleClickOutside = (e: MouseEvent) => {
  if (!props.visible) return

  const target = e.target as HTMLElement

  // 检查是否点击在面板内部
  const panel = document.querySelector('.preference-panel-popover')
  if (panel?.contains(target)) return

  // 检查是否点击在触发器上
  if (props.triggerRef?.contains(target)) return

  emit('update:visible', false)
}

// 监听 visible 变化
watch(() => props.visible, (newVal) => {
  if (newVal) {
    calculatePosition()
    closeAllSubPopups()
  }
})

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  window.addEventListener('resize', calculatePosition)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('resize', calculatePosition)
})
</script>

<template>
  <Teleport to="body">
    <div v-if="visible"
         class="lv-trigger lv-popover lv-trigger-position-bl popover-hjZ_EM preference-panel-popover"
         :style="{ ...panelStyle, opacity: 1, position: 'absolute', maxWidth: 'unset', display: 'initial', pointerEvents: 'auto', zIndex: 10000 }"
         @click.stop>
      <div class="lv-popover-content lv-popover-content-top" role="tooltip">
        <div class="lv-popover-content-inner">
          <div class="lv-popover-inner">
            <div class="lv-popover-inner-content">
              <div class="fields-Ohpia1 agentic-settings-panel-PW6SXt">
                <!-- 生成偏好 -->
                <div class="field-lS55rI">
                  <div class="title-RK9CLE primary-qeUHsW">
                    生成偏好
                    <div class="extra-XsPrhm">
                      <div class="container-acAd2k">
                        自动
                        <button role="switch"
                                :aria-checked="localAutoMode"
                                :class="['lv-switch', 'lv-switch-small', 'lv-switch-type-circle', 'switch-xgMSH6', { 'lv-switch-checked': localAutoMode }]"
                                type="button"
                                @click="localAutoMode = !localAutoMode">
                          <div class="lv-switch-dot"></div>
                        </button>
                      </div>
                    </div>
                  </div>
                  <div :class="['lv-radio-group', 'lv-radio-size-small', 'lv-radio-mode-outline', 'radio-group-nSistg', 'radio-group-A7r8m8', { 'radio-group-disabled-azzH2v': isDisabled }]"
                       role="radiogroup">
                    <label class="lv-radio" :class="{ 'lv-radio-checked': preferenceType === 'image' }">
                      <input type="radio" value="image" class="sf-hidden" v-model="preferenceType" :disabled="isDisabled">
                      <div :class="['radio-yGzTi5', { 'checked-KVSAoI': preferenceType === 'image' }]">图片</div>
                    </label>
                    <label class="lv-radio" :class="{ 'lv-radio-checked': preferenceType === 'video' }">
                      <input type="radio" value="video" class="sf-hidden" v-model="preferenceType" :disabled="isDisabled">
                      <div :class="['radio-yGzTi5', { 'checked-KVSAoI': preferenceType === 'video' }]">视频</div>
                    </label>
                  </div>
                </div>

                <!-- 选择比例 -->
                <div class="field-lS55rI">
                  <div class="title-RK9CLE secondary-IGs0cX">选择比例</div>
                  <div :class="['lv-radio-group', 'lv-radio-size-small', 'lv-radio-mode-outline', 'radio-group-nSistg', 'radio-group-csT79P', { 'aspect-ratio-radio-group-disabled-d5D3ro': isDisabled }]"
                       role="radiogroup">
                    <label v-for="option in aspectRatioOptions"
                           :key="option.value"
                           class="lv-radio"
                           :class="{ 'lv-radio-checked': currentAspectRatio === option.value }">
                      <input type="radio"
                             :value="option.value"
                             class="sf-hidden"
                             v-model="currentAspectRatio"
                             :disabled="isDisabled">
                      <div :class="['radio-yGzTi5', { 'checked-KVSAoI': currentAspectRatio === option.value }]">
                        <div class="radio-content-qJGArn">
                          <!-- 智能图标 -->
                          <svg v-if="option.value === 'auto'" width="16" height="16" viewBox="0 0 24 24"
                               preserveAspectRatio="xMidYMid meet" fill="none" role="presentation"
                               xmlns="http://www.w3.org/2000/svg">
                            <g>
                              <path data-follow-fill="currentColor"
                                    d="M17.25 4.75a2 2 0 0 1 2 2v10.5a2 2 0 0 1-2 2H6.75a2 2 0 0 1-2-2V6.75a2 2 0 0 1 2-2h10.5Zm0-2a4 4 0 0 1 4 4v10.5a4 4 0 0 1-4 4H6.75a4 4 0 0 1-4-4V6.75a4 4 0 0 1 4-4h10.5ZM17 8a1 1 0 0 0-1-1h-3a1 1 0 1 0 0 2h2v2a1 1 0 1 0 2 0V8Zm-6 9a1 1 0 1 0 0-2H9v-2a1 1 0 1 0-2 0v3a1 1 0 0 0 1 1h3Z"
                                    clip-rule="evenodd" fill-rule="evenodd" fill="currentColor"></path>
                            </g>
                          </svg>
                          <!-- 21:9 图标 -->
                          <svg v-else-if="option.value === '21:9'" width="16" height="16" viewBox="0 0 24 24"
                               preserveAspectRatio="xMidYMid meet" fill="none" role="presentation"
                               xmlns="http://www.w3.org/2000/svg">
                            <g>
                              <path data-follow-fill="currentColor"
                                    d="M.956 10.095a3.4 3.4 0 0 1 3.4-3.4h15.288a3.4 3.4 0 0 1 3.4 3.4v3.81a3.4 3.4 0 0 1-3.4 3.4H4.356a3.4 3.4 0 0 1-3.4-3.4v-3.81Zm3.4-1.4a1.4 1.4 0 0 0-1.4 1.4v3.81a1.4 1.4 0 0 0 1.4 1.4h15.288a1.4 1.4 0 0 0 1.4-1.4v-3.81a1.4 1.4 0 0 0-1.4-1.4H4.356Z"
                                    clip-rule="evenodd" fill-rule="evenodd" opacity=".9" fill="currentColor"></path>
                            </g>
                          </svg>
                          <!-- 16:9 图标 -->
                          <svg v-else-if="option.value === '16:9'" width="16" height="16" viewBox="0 0 24 24"
                               preserveAspectRatio="xMidYMid meet" fill="none" role="presentation"
                               xmlns="http://www.w3.org/2000/svg">
                            <g>
                              <path data-follow-fill="currentColor"
                                    d="M1.924 9.706a4 4 0 0 1 4-4h12.15a4 4 0 0 1 4 4v4.588a4 4 0 0 1-4 4H5.924a4 4 0 0 1-4-4V9.706Zm4-2a2 2 0 0 0-2 2v4.588a2 2 0 0 0 2 2h12.15a2 2 0 0 0 2-2V9.706a2 2 0 0 0-2-2H5.924Z"
                                    clip-rule="evenodd" fill-rule="evenodd" fill="currentColor"></path>
                            </g>
                          </svg>
                          <!-- 3:2 图标 -->
                          <svg v-else-if="option.value === '3:2'" width="16" height="16" viewBox="0 0 25 24"
                               preserveAspectRatio="xMidYMid meet" fill="none" role="presentation"
                               xmlns="http://www.w3.org/2000/svg">
                            <g>
                              <path data-follow-fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"
                                    d="M2.85 9.45a4.5 4.5 0 0 1 4.5-4.5H18.5a4.5 4.5 0 0 1 4.5 4.5v5.1a4.5 4.5 0 0 1-4.5 4.5H7.35a4.5 4.5 0 0 1-4.5-4.5v-5.1Zm4.5-2.5a2.5 2.5 0 0 0-2.5 2.5v5.1a2.5 2.5 0 0 0 2.5 2.5H18.5a2.5 2.5 0 0 0 2.5-2.5v-5.1a2.5 2.5 0 0 0-2.5-2.5H7.35Z"
                                    fill="currentColor"></path>
                            </g>
                          </svg>
                          <!-- 4:3 图标 -->
                          <svg v-else-if="option.value === '4:3'" width="16" height="16" viewBox="0 0 24 24"
                               preserveAspectRatio="xMidYMid meet" fill="none" role="presentation"
                               xmlns="http://www.w3.org/2000/svg">
                            <g>
                              <path data-follow-fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"
                                    d="M1.922 8.693a4.5 4.5 0 0 1 4.5-4.5h11.15a4.5 4.5 0 0 1 4.5 4.5v6.613a4.5 4.5 0 0 1-4.5 4.5H6.422a4.5 4.5 0 0 1-4.5-4.5V8.693Zm4.5-2.5a2.5 2.5 0 0 0-2.5 2.5v6.613a2.5 2.5 0 0 0 2.5 2.5h11.15a2.5 2.5 0 0 0 2.5-2.5V8.693a2.5 2.5 0 0 0-2.5-2.5H6.422Z"
                                    fill="currentColor"></path>
                            </g>
                          </svg>
                          <!-- 1:1 图标 -->
                          <svg v-else-if="option.value === '1:1'" width="16" height="16" viewBox="0 0 24 24"
                               preserveAspectRatio="xMidYMid meet" fill="none" role="presentation"
                               xmlns="http://www.w3.org/2000/svg">
                            <g>
                              <path data-follow-fill="currentColor"
                                    d="M19.25 17.25V6.75a2 2 0 0 0-2-2H6.75a2 2 0 0 0-2 2v10.5a2 2 0 0 0 2 2h10.5a2 2 0 0 0 2-2Zm2-10.5a4 4 0 0 0-4-4H6.75a4 4 0 0 0-4 4v10.5a4 4 0 0 0 4 4h10.5a4 4 0 0 0 4-4V6.75Z"
                                    clip-rule="evenodd" fill-rule="evenodd" fill="currentColor"></path>
                            </g>
                          </svg>
                          <!-- 3:4 图标 -->
                          <svg v-else-if="option.value === '3:4'" width="16" height="16" viewBox="0 0 25 24"
                               preserveAspectRatio="xMidYMid meet" fill="none" role="presentation"
                               xmlns="http://www.w3.org/2000/svg">
                            <g>
                              <path data-follow-fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"
                                    d="M5.144 6.425a4.5 4.5 0 0 1 4.5-4.5h6.612a4.5 4.5 0 0 1 4.5 4.5v11.15a4.5 4.5 0 0 1-4.5 4.5H9.644a4.5 4.5 0 0 1-4.5-4.5V6.425Zm4.5-2.5a2.5 2.5 0 0 0-2.5 2.5v11.15a2.5 2.5 0 0 0 2.5 2.5h6.612a2.5 2.5 0 0 0 2.5-2.5V6.425a2.5 2.5 0 0 0-2.5-2.5H9.644Z"
                                    fill="currentColor"></path>
                            </g>
                          </svg>
                          <!-- 2:3 图标 -->
                          <svg v-else-if="option.value === '2:3'" width="16" height="16" viewBox="0 0 25 24"
                               preserveAspectRatio="xMidYMid meet" fill="none" role="presentation"
                               xmlns="http://www.w3.org/2000/svg">
                            <g>
                              <path data-follow-fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"
                                    d="M5.244 5.925a4 4 0 0 1 4-4h6.1a4 4 0 0 1 4 4v12.15a4 4 0 0 1-4 4h-6.1a4 4 0 0 1-4-4V5.925Zm4-2a2 2 0 0 0-2 2v12.15a2 2 0 0 0 2 2h6.1a2 2 0 0 0 2-2V5.925a2 2 0 0 0-2-2h-6.1Z"
                                    fill="currentColor"></path>
                            </g>
                          </svg>
                          <!-- 9:16 图标 -->
                          <svg v-else-if="option.value === '9:16'" width="16" height="16" viewBox="0 0 24 24"
                               preserveAspectRatio="xMidYMid meet" fill="none" role="presentation"
                               xmlns="http://www.w3.org/2000/svg">
                            <g>
                              <path data-follow-fill="currentColor"
                                    d="M5.707 5.325a3.4 3.4 0 0 1 3.4-3.4h5.787a3.4 3.4 0 0 1 3.4 3.4v13.35a3.4 3.4 0 0 1-3.4 3.4H9.107a3.4 3.4 0 0 1-3.4-3.4V5.325Zm3.4-1.4a1.4 1.4 0 0 0-1.4 1.4v13.35a1.4 1.4 0 0 0 1.4 1.4h5.787a1.4 1.4 0 0 0 1.4-1.4V5.325a1.4 1.4 0 0 0-1.4-1.4H9.107Z"
                                    clip-rule="evenodd" fill-rule="evenodd" fill="currentColor"></path>
                            </g>
                          </svg>
                          <span class="label-l6Zq3t">{{ option.label }}</span>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                <!-- 其他设置 -->
                <div class="field-lS55rI">
                  <div class="title-RK9CLE secondary-IGs0cX">其他设置</div>
                  <div class="other-settings-k8Nb2R">
                    <!-- 模型选择按钮 -->
                    <button ref="modelTriggerRef"
                            tabindex="0"
                            :class="['lv-btn', 'lv-btn-secondary', 'lv-btn-size-default', 'lv-btn-shape-square', 'button-lc3WzE', 'trigger-button-HdTM8H', 'model-select-mx2Aeo', { 'trigger-button-disabled-cJzDE3': isDisabled }]"
                            type="button"
                            @click.stop="toggleModelSelect">
                      <svg width="16" height="16" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet"
                           fill="none" role="presentation" xmlns="http://www.w3.org/2000/svg">
                        <g>
                          <path data-follow-fill="currentColor"
                                d="M13.25 2.682a2.5 2.5 0 0 0-2.5 0L4.556 6.258a2.5 2.5 0 0 0-1.25 2.165v7.153a2.5 2.5 0 0 0 1.25 2.165l6.194 3.576a2.5 2.5 0 0 0 2.5 0l6.194-3.576a2.5 2.5 0 0 0 1.25-2.165V8.423a2.5 2.5 0 0 0-1.25-2.165L13.25 2.682Zm-1.6 1.559a.7.7 0 0 1 .7 0L17.995 7.5 12 10.96 6.005 7.5l5.645-3.26Zm1.25 8.279v6.92l5.644-3.258a.7.7 0 0 0 .35-.606V9.059l-5.994 3.46ZM5.106 9.059l5.994 3.46v6.922l-5.644-3.259a.7.7 0 0 1-.35-.606V9.059Z"
                                clip-rule="evenodd" fill-rule="evenodd" fill="currentColor"></path>
                        </g>
                      </svg>
                      <span>{{ currentModelLabel }}</span>
                      <svg width="12" height="12" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet"
                           fill="none" role="presentation" xmlns="http://www.w3.org/2000/svg"
                           :class="['arrow-icon-T9MGzD', { 'rotated': isModelSelectOpen }]">
                        <g>
                          <path data-follow-fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"
                                d="M21.01 7.982A1.2 1.2 0 0 1 21 9.679l-8.156 8.06a1.2 1.2 0 0 1-1.688 0L3 9.68a1.2 1.2 0 0 1 1.687-1.707L12 15.199l7.313-7.227a1.2 1.2 0 0 1 1.697.01Z"
                                fill="currentColor"></path>
                        </g>
                      </svg>
                    </button>

                    <!-- 模型选择弹窗 -->
                    <SelectPopup v-model:visible="isModelSelectOpen" :trigger-ref="modelTriggerRef" title="模型版本">
                      <ul class="lv-select-popup-inner">
                        <li v-for="model in modelOptions"
                            :key="model.value"
                            :class="['lv-select-option', { 'lv-select-option-wrapper-selected': currentModel === model.value }]"
                            @click.stop="selectModel(model.value)">
                          <div class="select-option-label-Ct6NRy">
                            <div class="select-option-label-content-tmGvFs">
                              <span>{{ model.label }}</span>
                            </div>
                            <span v-if="currentModel === model.value" class="select-option-check-icon-uOxlr2">
                              <svg width="1em" height="1em" viewBox="0 0 24 24"
                                   preserveAspectRatio="xMidYMid meet" fill="none"
                                   role="presentation" xmlns="http://www.w3.org/2000/svg">
                                <g>
                                  <path data-follow-fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"
                                        d="M20.774 6.289a1 1 0 0 1 .1 1.41l-9.666 11a1 1 0 0 1-1.447.063l-5.334-5a1 1 0 0 1 1.368-1.458l4.572 4.286 9.002-10.2a1 1 0 0 1 1.405-.101Z"
                                        fill="currentColor"></path>
                                </g>
                              </svg>
                            </span>
                          </div>
                        </li>
                      </ul>
                    </SelectPopup>

                    <!-- 分辨率选择 -->
                    <div ref="resolutionTriggerRef"
                         role="combobox"
                         aria-haspopup="listbox"
                         aria-autocomplete="list"
                         :aria-expanded="isResolutionSelectOpen"
                         tabindex="0"
                         :class="['lv-select', 'lv-select-single', 'lv-select-size-default', 'resolution-select-BKucmm', 'select-joF5y7', { 'resolution-select-disabled-EoEwFj': isDisabled }]"
                         @click.stop="toggleResolutionSelect">
                      <div class="lv-select-view">
                        <span class="lv-select-view-selector">
                          <span class="lv-select-view-value">
                            <span class="select-option-icon-LQHnJG">
                              <!-- 图片模式：2K 图标 -->
                              <svg v-if="preferenceType === 'image'" width="1em" height="1em" viewBox="0 0 24 24"
                                   preserveAspectRatio="xMidYMid meet" fill="none" role="presentation"
                                   xmlns="http://www.w3.org/2000/svg">
                                <g>
                                  <path data-follow-fill="currentColor"
                                        d="M17.611 3A4.89 4.89 0 0 1 22.5 7.889v7.222A4.89 4.89 0 0 1 17.611 20H6.39a4.889 4.889 0 0 1-4.882-4.638l-.007-.25V7.888A4.887 4.887 0 0 1 6.389 3H17.61ZM6.39 5A2.889 2.889 0 0 0 3.5 7.889v7.222l.015.295A2.89 2.89 0 0 0 6.389 18H17.61a2.889 2.889 0 0 0 2.889-2.889V7.89A2.889 2.889 0 0 0 17.611 5H6.39Zm3.893 3.027c.315.001.579.112.792.333.214.222.322.497.322.825v1.735c0 .327-.106.601-.32.823a1.059 1.059 0 0 1-.794.333H8.055v1.366h2.84a.5.5 0 0 1 .5.5v.527a.5.5 0 0 1-.5.5h-4.01a.5.5 0 0 1-.5-.5v-2.393c0-.327.107-.601.32-.823.213-.222.478-.333.793-.333h2.228V9.598H6.885a.5.5 0 0 1-.5-.5v-.57a.5.5 0 0 1 .5-.5h3.397Zm3.585 0a.5.5 0 0 1 .5.5v2.104l1.859-2.484a.3.3 0 0 1 .24-.12h1.212a.3.3 0 0 1 .243.476l-2.162 2.995 2.162 2.995a.3.3 0 0 1-.243.476h-1.212a.3.3 0 0 1-.24-.12l-1.859-2.483v2.103a.5.5 0 0 1-.5.5h-.67a.5.5 0 0 1-.5-.5V8.527a.5.5 0 0 1 .5-.5h.67Z"
                                        fill="currentColor"></path>
                                </g>
                              </svg>
                              <!-- 视频模式：HD 图标 -->
                              <svg v-else width="1em" height="1em" viewBox="0 0 24 24"
                                   preserveAspectRatio="xMidYMid meet" fill="none" role="presentation"
                                   xmlns="http://www.w3.org/2000/svg">
                                <g>
                                  <path data-follow-fill="currentColor"
                                        d="M17.611 3.5A4.89 4.89 0 0 1 22.5 8.389v7.222a4.89 4.89 0 0 1-4.889 4.889H6.39a4.889 4.889 0 0 1-4.882-4.638l-.007-.25V8.388A4.89 4.89 0 0 1 6.39 3.499h11.22ZM6.39 5.5A2.889 2.889 0 0 0 3.5 8.389v7.222l.015.295A2.89 2.89 0 0 0 6.389 18.5H17.61a2.889 2.889 0 0 0 2.889-2.889V8.39a2.889 2.889 0 0 0-2.888-2.89H6.39Zm.89 3.713a.5.5 0 0 1 .5.5v1.595h2.149V9.713a.5.5 0 0 1 .5-.5h.577a.5.5 0 0 1 .5.5v4.574a.5.5 0 0 1-.5.5h-.577a.5.5 0 0 1-.5-.5v-1.674h-2.15v1.674a.5.5 0 0 1-.5.5h-.577a.5.5 0 0 1-.5-.5V9.713a.5.5 0 0 1 .5-.5h.577Zm7.974 0c.616 0 1.157.114 1.624.343.467.228.832.549 1.092.963.265.414.397.908.397 1.481 0 .568-.132 1.062-.397 1.481a2.6 2.6 0 0 1-1.092.963c-.467.228-1.008.343-1.624.343h-2.136a.5.5 0 0 1-.5-.5V9.713a.5.5 0 0 1 .5-.5h2.136Zm-1.059 4.316h.995c.319 0 .595-.059.829-.175.238-.123.424-.298.557-.526a1.65 1.65 0 0 0 .198-.828c0-.324-.065-.6-.198-.828a1.283 1.283 0 0 0-.557-.518 1.765 1.765 0 0 0-.829-.183h-.995v3.058Z"
                                        fill="currentColor"></path>
                                </g>
                              </svg>
                            </span>
                            <div class="commercial-content-vye33D">{{ currentResolutionLabel }}</div>
                          </span>
                        </span>
                        <div aria-hidden="true" class="lv-select-suffix">
                          <div class="lv-select-arrow-icon">
                            <svg width="1em" height="1em" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet"
                                 fill="none" role="presentation" xmlns="http://www.w3.org/2000/svg">
                              <g>
                                <path data-follow-fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"
                                      d="M21.01 7.982A1.2 1.2 0 0 1 21 9.679l-8.156 8.06a1.2 1.2 0 0 1-1.688 0L3 9.68a1.2 1.2 0 0 1 1.687-1.707L12 15.199l7.313-7.227a1.2 1.2 0 0 1 1.697.01Z"
                                      fill="currentColor"></path>
                              </g>
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- 分辨率选择弹窗 -->
                    <SelectPopup v-model:visible="isResolutionSelectOpen" :trigger-ref="resolutionTriggerRef" title="分辨率">
                      <ul class="lv-select-popup-inner">
                        <li v-for="resolution in resolutionOptions"
                            :key="resolution.value"
                            :class="['lv-select-option', { 'lv-select-option-wrapper-selected': currentResolution === resolution.value }]"
                            @click.stop="selectResolution(resolution.value)">
                          <div class="select-option-label-Ct6NRy">
                            <div class="select-option-label-content-tmGvFs">
                              <span>{{ resolution.label }}</span>
                            </div>
                            <span v-if="currentResolution === resolution.value" class="select-option-check-icon-uOxlr2">
                              <svg width="1em" height="1em" viewBox="0 0 24 24"
                                   preserveAspectRatio="xMidYMid meet" fill="none"
                                   role="presentation" xmlns="http://www.w3.org/2000/svg">
                                <g>
                                  <path data-follow-fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"
                                        d="M20.774 6.289a1 1 0 0 1 .1 1.41l-9.666 11a1 1 0 0 1-1.447.063l-5.334-5a1 1 0 0 1 1.368-1.458l4.572 4.286 9.002-10.2a1 1 0 0 1 1.405-.101Z"
                                        fill="currentColor"></path>
                                </g>
                              </svg>
                            </span>
                          </div>
                        </li>
                      </ul>
                    </SelectPopup>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
/* 箭头图标旋转 */
.arrow-icon-T9MGzD {
  transition: transform 0.1s linear;
  will-change: transform;
}

.arrow-icon-T9MGzD.rotated {
  transform: rotate(180deg);
}
</style>
