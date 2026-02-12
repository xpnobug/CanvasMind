<script setup lang="ts">
// Agent 模式工具栏组件
// 包含自动（生成偏好）、灵感搜索、创意设计三个功能按钮
// 支持弹出方向设置和纯图标模式

import { ref, computed } from 'vue'
import PreferencePanel from '../common/PreferencePanel.vue'
import SelectPopup from '../common/SelectPopup.vue'
import { getAllChatModels } from '@/config/models'
import { getAgentModel, setAgentModel } from '@/api/agent'

// 弹出方向类型
type Placement = 'top' | 'bottom' | 'auto'

// Props 定义
interface Props {
  // 弹出方向：top-向上, bottom-向下, auto-自动计算
  placement?: Placement
  // 是否只显示图标（侧边栏模式）
  iconOnly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  placement: 'auto',
  iconOnly: false
})

// 定义事件
const emit = defineEmits<{
  'panelOpen': []
  'panelClose': []
}>()

// 功能开关状态
const inspirationSearchEnabled = ref(true)
const creativeDesignEnabled = ref(true)

// 模型选择
const chatModels = computed(() =>
  getAllChatModels().map((m: any) => ({ value: m.key, label: m.label }))
)
const currentModel = ref(getAgentModel())
const isModelSelectOpen = ref(false)
const modelTriggerRef = ref<HTMLElement | null>(null)

const currentModelLabel = computed(() => {
  const m = chatModels.value.find(v => v.value === currentModel.value)
  return m?.label || currentModel.value
})

const toggleModelSelect = (e: Event) => {
  e.stopPropagation()
  isModelSelectOpen.value = !isModelSelectOpen.value
  if (isPreferencePanelOpen.value) closePanel()
}

const selectModel = (key: string) => {
  currentModel.value = key
  setAgentModel(key)
  isModelSelectOpen.value = false
}

// 生成偏好面板状态
const isPreferencePanelOpen = ref(false)
const preferenceTriggerRef = ref<HTMLElement | null>(null)

// 自动模式状态
const autoMode = ref(true)

// 按钮文字（根据 autoMode 显示不同文字）
const preferenceButtonText = computed(() => autoMode.value ? '自动' : '自定义')

// 关闭面板方法（供外部调用）
const closePanel = () => {
  if (isPreferencePanelOpen.value) {
    isPreferencePanelOpen.value = false
    emit('panelClose')
  }
}

// 暴露方法和状态
defineExpose({
  isPreferencePanelOpen,
  closePanel,
  currentModel,
  currentModelLabel
})

// 切换生成偏好面板
const togglePreferencePanel = (e: Event) => {
  e.stopPropagation()
  const wasOpen = isPreferencePanelOpen.value
  isPreferencePanelOpen.value = !isPreferencePanelOpen.value
  // 打开时通知父组件
  if (!wasOpen && isPreferencePanelOpen.value) {
    emit('panelOpen')
  } else if (wasOpen && !isPreferencePanelOpen.value) {
    emit('panelClose')
  }
}

// 切换灵感搜索
const toggleInspirationSearch = () => {
  inspirationSearchEnabled.value = !inspirationSearchEnabled.value
}

// 切换创意设计
const toggleCreativeDesign = () => {
  creativeDesignEnabled.value = !creativeDesignEnabled.value
}
</script>

<template>
  <div class="agent-toolbar">
    <!-- 模型选择 -->
    <div ref="modelTriggerRef"
         :class="['lv-select', 'lv-select-single', 'lv-select-size-default', 'toolbar-select-h345g7', 'select-joF5y7', { 'compact-OC0Z0c': iconOnly }]"
         role="combobox"
         tabindex="0"
         :aria-expanded="isModelSelectOpen"
         :title="iconOnly ? currentModelLabel : undefined"
         @click.stop="toggleModelSelect">
      <div class="lv-select-view">
        <span class="lv-select-view-selector">
          <span class="lv-select-view-value">
            <svg fill="none" height="16" preserveAspectRatio="xMidYMid meet"
                 role="presentation" viewBox="0 0 24 24" width="16"
                 xmlns="http://www.w3.org/2000/svg">
              <g>
                <path clip-rule="evenodd"
                      d="M13.25 2.682a2.5 2.5 0 0 0-2.5 0L4.556 6.258a2.5 2.5 0 0 0-1.25 2.165v7.153a2.5 2.5 0 0 0 1.25 2.165l6.194 3.576a2.5 2.5 0 0 0 2.5 0l6.194-3.576a2.5 2.5 0 0 0 1.25-2.165V8.423a2.5 2.5 0 0 0-1.25-2.165L13.25 2.682Zm-1.6 1.559a.7.7 0 0 1 .7 0L17.995 7.5 12 10.96 6.005 7.5l5.645-3.26Zm1.25 8.279v6.92l5.644-3.258a.7.7 0 0 0 .35-.606V9.059l-5.994 3.46ZM5.106 9.059l5.994 3.46v6.922l-5.644-3.259a.7.7 0 0 1-.35-.606V9.059Z"
                      data-follow-fill="currentColor" fill="currentColor"
                      fill-rule="evenodd"></path>
              </g>
            </svg>
            <span v-if="!iconOnly">{{ currentModelLabel }}</span>
          </span>
        </span>
        <div v-if="!iconOnly" aria-hidden="true" class="lv-select-suffix">
          <div class="lv-select-arrow-icon">
            <svg width="1em" height="1em" viewBox="0 0 24 24"
                 preserveAspectRatio="xMidYMid meet" fill="none"
                 role="presentation" xmlns="http://www.w3.org/2000/svg">
              <g>
                <path data-follow-fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"
                      d="M21.01 7.982A1.2 1.2 0 0 1 21 9.679l-8.156 8.06a1.2 1.2 0 0 1-1.688 0L3 9.68a1.2 1.2 0 0 1 1.687-1.707L12 15.199l7.313-7.227a1.2 1.2 0 0 1 1.697.01Z"
                      fill="currentColor"></path>
              </g>
            </svg>
          </div>
        </div>
        <div v-else aria-hidden="true" class="lv-select-suffix sf-hidden"></div>
      </div>
    </div>

    <!-- 模型选择弹窗 -->
    <SelectPopup v-model:visible="isModelSelectOpen" :trigger-ref="modelTriggerRef" :placement="placement" title="对话模型">
      <ul class="lv-select-popup-inner">
        <li v-for="m in chatModels"
            :key="m.value"
            :class="['lv-select-option', { 'lv-select-option-wrapper-selected': currentModel === m.value }]"
            @click.stop="selectModel(m.value)">
          <div class="select-option-label-Ct6NRy">
            <div class="select-option-label-content-tmGvFs">
              <span>{{ m.label }}</span>
            </div>
            <span v-if="currentModel === m.value" class="select-option-check-icon-uOxlr2">
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

    <!-- 自动按钮（打开生成偏好面板） -->
    <button ref="preferenceTriggerRef"
            :class="['lv-btn', 'lv-btn-secondary', 'lv-btn-size-default', 'lv-btn-shape-square', 'button-lc3WzE', 'toolbar-button-FhFnQ_', { 'lv-btn-icon-only': iconOnly, 'active-Rs99sz active-mrQmUS': isPreferencePanelOpen }]"
            type="button"
            :title="iconOnly ? preferenceButtonText : undefined"
            @click="togglePreferencePanel">
      <svg width="1em" height="1em" viewBox="0 0 24 24"
           preserveAspectRatio="xMidYMid meet" fill="none"
           role="presentation" xmlns="http://www.w3.org/2000/svg">
        <g>
          <path data-follow-fill="currentColor"
                d="M18.047 4.1a1 1 0 1 0-2 0v2.8a1 1 0 1 0 2 0v-.447h3.103a1 1 0 1 0 0-2h-3.103V4.1Zm-4 2.353H2.85a1 1 0 0 1 0-2h11.197v2Zm-7 3.247a1 1 0 0 0-1 1v.4H2.85a1 1 0 1 0 0 2h3.197v.4a1 1 0 1 0 2 0v-2.8a1 1 0 0 0-1-1Zm14.103 3.4H10.047v-2H21.15a1 1 0 1 1 0 2Zm-10.103 3a1 1 0 0 0-1 1v2.8a1 1 0 1 0 2 0v-2.8a1 1 0 0 0-1-1ZM2.85 17.497h5.197v2H2.85a1 1 0 1 1 0-2Zm18.3 2h-9.103v-2h9.103a1 1 0 1 1 0 2Z"
                clip-rule="evenodd" fill-rule="evenodd"
                fill="currentColor"></path>
        </g>
      </svg>
      <span v-if="!iconOnly">{{ preferenceButtonText }}</span>
    </button>

    <!-- 生成偏好面板 -->
    <PreferencePanel v-model:visible="isPreferencePanelOpen" v-model:autoMode="autoMode" :trigger-ref="preferenceTriggerRef" :placement="placement" />

    <!-- 灵感搜索按钮 -->
    <button :class="['lv-btn', 'lv-btn-secondary', 'lv-btn-size-default', 'lv-btn-shape-square', 'button-lc3WzE', 'toolbar-button-FhFnQ_', 'switch-button-GPRaGT', { 'lv-btn-icon-only': iconOnly, 'checked-SqLqYu': inspirationSearchEnabled }]"
            type="button"
            :title="iconOnly ? '灵感搜索' : undefined"
            @click="toggleInspirationSearch">
      <svg width="1em" height="1em" viewBox="0 0 24 24"
           preserveAspectRatio="xMidYMid meet" fill="none"
           role="presentation" xmlns="http://www.w3.org/2000/svg">
        <g>
          <path data-follow-fill="currentColor"
                d="M11.606 2.25a8.5 8.5 0 0 1 6.676 13.762l3.406 3.406a1 1 0 1 1-1.414 1.414l-3.406-3.406a8.464 8.464 0 0 1-6.666 1.706v-2.036a6.5 6.5 0 1 0-5.096-6.346c0 .084.004.167.007.25H3.112a8.5 8.5 0 0 1 8.494-8.75Z"
                fill="currentColor"></path>
          <path d="M7.772 12.57a.944.944 0 0 1 1.348-.002.98.98 0 0 1 .002 1.37l-3.999 4.064a.947.947 0 0 1-1.35 0l-2.295-2.339a.978.978 0 0 1 .002-1.369.944.944 0 0 1 1.348.003l1.621 1.65 3.323-3.378Z"
                fill="#00CAE0"></path>
        </g>
      </svg>
      <span v-if="!iconOnly">灵感搜索</span>
    </button>

    <!-- 创意设计按钮 -->
    <button :class="['lv-btn', 'lv-btn-secondary', 'lv-btn-size-default', 'lv-btn-shape-square', 'button-lc3WzE', 'toolbar-button-FhFnQ_', 'switch-button-GPRaGT', { 'lv-btn-icon-only': iconOnly, 'checked-SqLqYu': creativeDesignEnabled }]"
            type="button"
            :title="iconOnly ? '创意设计' : undefined"
            @click="toggleCreativeDesign">
      <svg width="1em" height="1em" viewBox="0 0 24 24"
           preserveAspectRatio="xMidYMid meet" fill="none"
           role="presentation" xmlns="http://www.w3.org/2000/svg">
        <g>
          <path data-follow-fill="currentColor"
                d="M13.402 20.598c.289 0 .53.239.453.516a1.904 1.904 0 0 1-3.724-.322.185.185 0 0 1 .184-.194h3.087ZM11.988 1.499a7.953 7.953 0 0 1 7.951 7.952 7.943 7.943 0 0 1-3.758 6.752 2.952 2.952 0 0 1-2.943 2.75h-2.237s-.87.003-.87-.953.87-.95.87-.95h2.237l.108-.006c.528-.054.94-.5.941-1.043v-.352a.95.95 0 0 1 .509-.841A6.048 6.048 0 0 0 12.3 3.41l-.312-.008A6.05 6.05 0 0 0 6.143 11s.257.749-.743 1c-.937.251-1.213-1-1.213-1a7.953 7.953 0 0 1 7.8-9.501Z"
                fill="currentColor"></path>
          <path data-follow-fill="currentColor"
                d="M11.706 7.7a.316.316 0 0 1 .588 0l.158.381c.27.651.774 1.172 1.407 1.453l.449.2a.332.332 0 0 1 0 .602l-.475.21a2.725 2.725 0 0 0-1.387 1.406l-.154.354a.317.317 0 0 1-.584 0l-.154-.354A2.761 2.761 0 0 0 11 11.13l-.137-.13a2.682 2.682 0 0 0-.696-.453l-.475-.211a.332.332 0 0 1 0-.603l.449-.199a2.729 2.729 0 0 0 1.407-1.453l.158-.382Z"
                fill="currentColor"></path>
          <path fill="#00CAE0"
                d="M8.078 12.57a.944.944 0 0 1 1.347-.002.98.98 0 0 1 .002 1.37L5.43 18.001a.947.947 0 0 1-1.35 0l-2.296-2.339a.978.978 0 0 1 .003-1.369.944.944 0 0 1 1.347.003l1.621 1.65 3.324-3.378Z"></path>
        </g>
      </svg>
      <span v-if="!iconOnly">创意设计</span>
    </button>
  </div>
</template>

<style>
/* 样式已在 generate.css 中定义 */
.agent-toolbar {
  display: contents;
}

/* 自动按钮选中状态 */
.toolbar-button-FhFnQ_.active-Rs99sz.lv-btn.lv-btn-secondary.lv-btn-size-default:not(.lv-btn-disabled):not(.lv-btn-loading) {
  background: var(--bg-block-secondary-hover);
  border-color: var(--brand-main-default);
}
</style>
