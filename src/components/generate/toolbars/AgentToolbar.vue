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

// Agent 技能选项
interface AgentSkillOption {
  value: string
  label: string
  description: string
}

// 功能开关状态
const inspirationSearchEnabled = ref(true)
const creativeDesignEnabled = ref(true)

// 技能选择
const skillOptions: AgentSkillOption[] = [
  { value: 'general', label: '通用助手', description: '适合日常问答、创意发想和通用生成任务' },
  { value: 'story-short', label: '剧情短片', description: '帮你自动生成故事大纲、分镜脚本并产出短片' },
  { value: 'marketing-video', label: '营销视频', description: '一句话帮你生成营销推广视频' },
  { value: 'ecommerce-pack', label: '电商套图', description: '生成风格统一的商品全套视觉素材，适用于各大电商平台' },
  { value: 'poster-design', label: '海报设计', description: '生成更有创意的海报内容，擅长营销场景和节日热点' },
  { value: 'brand-design', label: '品牌设计', description: '根据公司名称、业务与客群，生成品牌 Logo 与视觉方案' }
]
const currentSkill = ref('general')
const isSkillSelectOpen = ref(false)
const skillTriggerRef = ref<HTMLElement | null>(null)

const currentSkillLabel = computed(() => {
  const skill = skillOptions.find(option => option.value === currentSkill.value)
  return skill?.label || '使用技能'
})

const visibleSkillOptions = computed(() => {
  if (currentSkill.value === 'general') {
    return skillOptions.filter(option => option.value !== 'general')
  }
  return skillOptions
})

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

// 统一关闭 Agent 工具栏内部所有浮层
const closeAllPopups = () => {
  isModelSelectOpen.value = false
  isSkillSelectOpen.value = false
  isPreferencePanelOpen.value = false
}

const toggleModelSelect = (e: Event) => {
  e.stopPropagation()
  const wasOpen = isModelSelectOpen.value
  isSkillSelectOpen.value = false
  isModelSelectOpen.value = !isModelSelectOpen.value
  if (isPreferencePanelOpen.value) {
    isPreferencePanelOpen.value = false
    emit('panelClose')
  }
  if (!wasOpen && isModelSelectOpen.value) {
    emit('panelOpen')
  } else if (wasOpen && !isModelSelectOpen.value) {
    emit('panelClose')
  }
}

const selectModel = (key: string) => {
  currentModel.value = key
  setAgentModel(key)
  isModelSelectOpen.value = false
  emit('panelClose')
}

const toggleSkillSelect = (e: Event) => {
  e.stopPropagation()
  const wasOpen = isSkillSelectOpen.value
  isModelSelectOpen.value = false
  if (isPreferencePanelOpen.value) {
    isPreferencePanelOpen.value = false
    emit('panelClose')
  }
  isSkillSelectOpen.value = !isSkillSelectOpen.value
  if (!wasOpen && isSkillSelectOpen.value) {
    emit('panelOpen')
  } else if (wasOpen && !isSkillSelectOpen.value) {
    emit('panelClose')
  }
}

const selectSkill = (key: string) => {
  currentSkill.value = key
  isSkillSelectOpen.value = false
  emit('panelClose')
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
  if (isPreferencePanelOpen.value || isModelSelectOpen.value || isSkillSelectOpen.value) {
    closeAllPopups()
    emit('panelClose')
  }
}

// 暴露方法和状态
defineExpose({
  isPreferencePanelOpen,
  closePanel,
  currentModel,
  currentModelLabel,
  currentSkill,
  currentSkillLabel
})

// 切换生成偏好面板
const togglePreferencePanel = (e: Event) => {
  e.stopPropagation()
  const wasOpen = isPreferencePanelOpen.value
  isModelSelectOpen.value = false
  isSkillSelectOpen.value = false
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

    <!-- 技能选择器 -->
    <span class="lv-badge skill-select-badge-nf8J3A">
      <div ref="skillTriggerRef"
           :class="['lv-select', 'lv-select-single', 'lv-select-size-default', 'toolbar-select-h345g7', 'select-joF5y7', 'skill-select-k92QxV', { 'compact-OC0Z0c': iconOnly, 'active-P7cL4x': isSkillSelectOpen }]"
           role="combobox"
           tabindex="0"
           :aria-expanded="isSkillSelectOpen"
           :title="iconOnly ? currentSkillLabel : undefined"
           @click.stop="toggleSkillSelect">
        <div class="lv-select-view">
          <span class="lv-select-view-selector">
            <span class="lv-select-view-value">
              <svg width="16" height="16" viewBox="0 0 24 24"
                   preserveAspectRatio="xMidYMid meet" fill="none"
                   role="presentation" xmlns="http://www.w3.org/2000/svg">
                <g>
                  <path data-follow-fill="currentColor"
                        d="m20.498 8.652-.09.091a3.377 3.377 0 0 1-4.754 0 3.336 3.336 0 0 1 0-4.74l.435-.432a5.367 5.367 0 0 0-.868-.071c-2.923 0-5.28 2.35-5.28 5.234 0 .754.161 1.469.449 2.114a1 1 0 0 1-.21 1.117l-6.284 6.238a1.335 1.335 0 0 0 0 1.9c.534.529 1.4.529 1.934 0l6.34-6.294.112-.096a1 1 0 0 1 .964-.123 5.302 5.302 0 0 0 1.975.379c2.922 0 5.279-2.35 5.279-5.235l-.002-.082Zm2.002.082c0 4.002-3.266 7.235-7.28 7.235a7.323 7.323 0 0 1-2.083-.302l-5.898 5.856a3.376 3.376 0 0 1-4.752 0 3.336 3.336 0 0 1 0-4.739l5.82-5.78a7.187 7.187 0 0 1-.366-2.27c0-4.002 3.266-7.234 7.28-7.234 1.135 0 2.213.26 3.174.723a1 1 0 0 1 .27 1.61l-1.601 1.59a1.335 1.335 0 0 0 0 1.9c.533.53 1.4.53 1.934 0l1.426-1.416.096-.084a1 1 0 0 1 1.548.452c.28.77.432 1.598.432 2.46Z"
                        fill="currentColor"></path>
                </g>
              </svg>
              <span v-if="!iconOnly">{{ currentSkillLabel }}</span>
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
    </span>

    <!-- 技能选择弹窗 -->
    <SelectPopup v-model:visible="isSkillSelectOpen" :trigger-ref="skillTriggerRef" :placement="placement" title="">
      <div class="skill-select-shell-P9dLm4">
        <div class="skill-select-title-T5mQ2s">选择技能</div>
        <ul class="lv-select-popup-inner skill-select-popup-J8Tukj">
        <li v-for="skill in visibleSkillOptions"
            :key="skill.value"
            :class="['lv-select-option', 'skill-option-vV8DvA', { 'skill-option-selected-U7rKf2': currentSkill === skill.value }]"
            @click.stop="selectSkill(skill.value)">
          <div class="select-option-label-Ct6NRy skill-option-label-Q4mT8x">
            <span class="skill-option-icon-L7pW3e" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 24 24"
                   preserveAspectRatio="xMidYMid meet" fill="none"
                   role="presentation" xmlns="http://www.w3.org/2000/svg">
                <g>
                  <path data-follow-fill="currentColor"
                        d="m20.498 8.652-.09.091a3.377 3.377 0 0 1-4.754 0 3.336 3.336 0 0 1 0-4.74l.435-.432a5.367 5.367 0 0 0-.868-.071c-2.923 0-5.28 2.35-5.28 5.234 0 .754.161 1.469.449 2.114a1 1 0 0 1-.21 1.117l-6.284 6.238a1.335 1.335 0 0 0 0 1.9c.534.529 1.4.529 1.934 0l6.34-6.294.112-.096a1 1 0 0 1 .964-.123 5.302 5.302 0 0 0 1.975.379c2.922 0 5.279-2.35 5.279-5.235l-.002-.082Zm2.002.082c0 4.002-3.266 7.235-7.28 7.235a7.323 7.323 0 0 1-2.083-.302l-5.898 5.856a3.376 3.376 0 0 1-4.752 0 3.336 3.336 0 0 1 0-4.739l5.82-5.78a7.187 7.187 0 0 1-.366-2.27c0-4.002 3.266-7.234 7.28-7.234 1.135 0 2.213.26 3.174.723a1 1 0 0 1 .27 1.61l-1.601 1.59a1.335 1.335 0 0 0 0 1.9c.533.53 1.4.53 1.934 0l1.426-1.416.096-.084a1 1 0 0 1 1.548.452c.28.77.432 1.598.432 2.46Z"
                        fill="currentColor"></path>
                </g>
              </svg>
            </span>
            <div class="select-option-label-content-tmGvFs skill-option-content-EZ4xS5">
              <span class="skill-option-title-r6mY8X">{{ skill.label }}</span>
              <span class="skill-option-description-t34hRc" :title="skill.description">{{ skill.description }}</span>
            </div>
          </div>
        </li>
        </ul>
      </div>
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

/* 技能弹窗内容 */
.skill-select-badge-nf8J3A {
  display: inline-flex;
}

.skill-select-k92QxV.lv-select.lv-select-single .lv-select-view {
  min-width: 118px;
  padding-left: 12px;
  padding-right: 10px;
}

.skill-select-k92QxV .lv-select-view-value {
  gap: 6px;
  color: rgba(255, 255, 255, 0.92);
}

.skill-select-k92QxV .lv-select-view-value > svg {
  flex: 0 0 auto;
}

.skill-select-k92QxV .lv-select-arrow-icon {
  color: rgba(255, 255, 255, 0.72);
}

.skill-select-k92QxV.active-P7cL4x .lv-select-view,
.skill-select-k92QxV:focus-visible .lv-select-view,
.skill-select-k92QxV:hover .lv-select-view {
  background: var(--bg-block-primary-hover);
}

.skill-select-k92QxV.active-P7cL4x .lv-select-arrow-icon svg {
  transform: rotate(180deg);
}

.lv-select-popup:has(.skill-select-shell-P9dLm4) {
  border-radius: 18px;
  border-color: rgba(255, 255, 255, 0.08);
  background: #1d1f24;
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.34);
  padding: 0;
}

.skill-select-popup-J8Tukj {
  min-width: 400px;
  max-height: 320px;
  padding: 0;
  overflow-y: auto;
}

.skill-select-shell-P9dLm4 {
  width: 400px;
  padding: 12px 10px 10px;
}

.skill-select-title-T5mQ2s {
  padding: 2px 8px 10px;
  color: rgba(255, 255, 255, 0.38);
  font-size: 12px;
  line-height: 18px;
}

.skill-option-vV8DvA {
  margin: 0;
  min-height: 36px;
  padding: 0;
  border-radius: 8px;
  background: transparent;
}

.skill-option-vV8DvA + .skill-option-vV8DvA {
  margin-top: 1px;
}

.skill-option-vV8DvA:hover {
  background: rgba(255, 255, 255, 0.045);
}

.skill-option-selected-U7rKf2 {
  background: transparent;
}

.skill-option-label-Q4mT8x {
  width: 100%;
  gap: 8px;
  padding: 7px 10px;
}

.skill-option-icon-L7pW3e {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  color: rgba(255, 255, 255, 0.9);
}

.skill-option-content-EZ4xS5 {
  display: flex;
  flex: 1;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.skill-option-title-r6mY8X {
  color: rgba(255, 255, 255, 0.92);
  font-size: 13px;
  font-weight: 500;
  line-height: 18px;
  flex: 0 0 60px;
  white-space: nowrap;
}

.skill-option-description-t34hRc {
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
  line-height: 16px;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
</style>
