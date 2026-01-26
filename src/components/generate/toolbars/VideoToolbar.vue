<script setup lang="ts">
// 视频生成工具栏组件
// 包含模型版本选择、功能选择、尺寸选择、时长选择
// 支持弹出方向设置

import { ref } from 'vue'
import SelectPopup from '../common/SelectPopup.vue'

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

// 模型版本配置
const modelVersions = [
  { value: '3.0-fast', label: '视频 3.0 Fast' },
  { value: '3.0', label: '视频 3.0' },
  { value: '2.1', label: '视频 2.1' }
]

// 功能配置
const featureOptions = [
  { value: 'first-last-frame', label: '首尾帧', icon: 'frame' },
  { value: 'text-to-video', label: '文生视频', icon: 'text' },
  { value: 'image-to-video', label: '图生视频', icon: 'image' }
]

// 尺寸配置
const sizeOptions = [
  { value: '16:9', label: '16:9', quality: '720P' },
  { value: '9:16', label: '9:16', quality: '720P' },
  { value: '1:1', label: '1:1', quality: '720P' }
]

// 时长配置
const durationOptions = [
  { value: '5s', label: '5s' },
  { value: '10s', label: '10s' }
]

// 当前选中状态
const currentModelVersion = ref('3.0-fast')
const currentFeature = ref('first-last-frame')
const currentSize = ref('16:9')
const currentDuration = ref('5s')

// 弹窗状态
const isModelSelectOpen = ref(false)
const isFeatureSelectOpen = ref(false)
const isSizeSelectOpen = ref(false)
const isDurationSelectOpen = ref(false)

// 触发器引用
const modelTriggerRef = ref<HTMLElement | null>(null)
const featureTriggerRef = ref<HTMLElement | null>(null)
const sizeTriggerRef = ref<HTMLElement | null>(null)
const durationTriggerRef = ref<HTMLElement | null>(null)

// 关闭所有弹窗
const closeAllPopups = () => {
  isModelSelectOpen.value = false
  isFeatureSelectOpen.value = false
  isSizeSelectOpen.value = false
  isDurationSelectOpen.value = false
}

// 切换模型选择弹窗
const toggleModelSelect = (e: Event) => {
  e.stopPropagation()
  const wasOpen = isModelSelectOpen.value
  closeAllPopups()
  isModelSelectOpen.value = !wasOpen
}

// 切换功能选择弹窗
const toggleFeatureSelect = (e: Event) => {
  e.stopPropagation()
  const wasOpen = isFeatureSelectOpen.value
  closeAllPopups()
  isFeatureSelectOpen.value = !wasOpen
}

// 切换尺寸选择弹窗
const toggleSizeSelect = (e: Event) => {
  e.stopPropagation()
  const wasOpen = isSizeSelectOpen.value
  closeAllPopups()
  isSizeSelectOpen.value = !wasOpen
}

// 切换时长选择弹窗
const toggleDurationSelect = (e: Event) => {
  e.stopPropagation()
  const wasOpen = isDurationSelectOpen.value
  closeAllPopups()
  isDurationSelectOpen.value = !wasOpen
}

// 选择模型版本
const selectModelVersion = (version: string) => {
  currentModelVersion.value = version
  isModelSelectOpen.value = false
}

// 选择功能
const selectFeature = (feature: string) => {
  currentFeature.value = feature
  isFeatureSelectOpen.value = false
}

// 选择尺寸
const selectSize = (size: string) => {
  currentSize.value = size
  isSizeSelectOpen.value = false
}

// 选择时长
const selectDuration = (duration: string) => {
  currentDuration.value = duration
  isDurationSelectOpen.value = false
}

// 获取当前配置
const getCurrentModelLabel = () => {
  return modelVersions.find(m => m.value === currentModelVersion.value)?.label || '视频 3.0 Fast'
}

const getCurrentFeatureLabel = () => {
  return featureOptions.find(f => f.value === currentFeature.value)?.label || '首尾帧'
}

const getCurrentSizeConfig = () => {
  return sizeOptions.find(s => s.value === currentSize.value) || sizeOptions[0]
}
</script>

<template>
  <div class="video-toolbar">
    <!-- 模型版本选择 -->
    <div ref="modelTriggerRef"
         :class="['lv-select', 'lv-select-single', 'lv-select-size-default', 'toolbar-select-h345g7', 'select-joF5y7', { 'compact-OC0Z0c': iconOnly }]"
         role="combobox"
         tabindex="0"
         :aria-expanded="isModelSelectOpen"
         :title="iconOnly ? getCurrentModelLabel() : undefined"
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
            <span v-if="!iconOnly">{{ getCurrentModelLabel() }}</span>
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

    <!-- 模型版本选择弹窗 -->
    <SelectPopup v-model:visible="isModelSelectOpen" :trigger-ref="modelTriggerRef" :placement="placement" title="模型版本">
      <ul class="lv-select-popup-inner">
        <li v-for="version in modelVersions"
            :key="version.value"
            :class="['lv-select-option', { 'lv-select-option-wrapper-selected': currentModelVersion === version.value }]"
            @click.stop="selectModelVersion(version.value)">
          <div class="select-option-label-Ct6NRy">
            <div class="select-option-label-content-tmGvFs">
              <span>{{ version.label }}</span>
            </div>
            <span v-if="currentModelVersion === version.value" class="select-option-check-icon-uOxlr2">
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

    <!-- 功能选择 -->
    <div ref="featureTriggerRef"
         :class="['lv-select', 'lv-select-single', 'lv-select-size-default', 'toolbar-select-h345g7', 'select-joF5y7', { 'compact-OC0Z0c': iconOnly }]"
         role="combobox"
         tabindex="0"
         :aria-expanded="isFeatureSelectOpen"
         :title="iconOnly ? getCurrentFeatureLabel() : undefined"
         @click.stop="toggleFeatureSelect">
      <div class="lv-select-view">
        <span class="lv-select-view-selector">
          <span class="lv-select-view-value">
            <span class="select-option-icon-LQHnJG">
              <svg width="1em" height="1em" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet"
                   fill="none" role="presentation" xmlns="http://www.w3.org/2000/svg">
                <g>
                  <path data-follow-fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"
                        d="M3 3a1 1 0 1 1 2 0v.01h8.66V3h3.519A3.82 3.82 0 0 1 21 6.821V17.18A3.82 3.82 0 0 1 17.179 21H13.66v-.01H5V21a1 1 0 1 1-2 0V3Zm16 14.22a1.982 1.982 0 0 1-1.972 1.79H15.66v-3.33H19v1.54ZM17.22 5c.941.091 1.69.84 1.78 1.78v1.56h-3.34V5h1.56Zm-3.56-.01v14.02H5V4.99h8.66ZM19 10.34h-3.34v3.34H19v-3.34Z"
                        fill="currentColor"></path>
                </g>
              </svg>
            </span>
            <span v-if="!iconOnly">{{ getCurrentFeatureLabel() }}</span>
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

    <!-- 功能选择弹窗 -->
    <SelectPopup v-model:visible="isFeatureSelectOpen" :trigger-ref="featureTriggerRef" :placement="placement" title="功能">
      <ul class="lv-select-popup-inner">
        <li v-for="feature in featureOptions"
            :key="feature.value"
            :class="['lv-select-option', { 'lv-select-option-wrapper-selected': currentFeature === feature.value }]"
            @click.stop="selectFeature(feature.value)">
          <div class="select-option-label-Ct6NRy">
            <div class="select-option-label-content-tmGvFs">
              <span>{{ feature.label }}</span>
            </div>
            <span v-if="currentFeature === feature.value" class="select-option-check-icon-uOxlr2">
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

    <!-- 尺寸选择 -->
    <button ref="sizeTriggerRef"
            :class="['lv-btn', 'lv-btn-secondary', 'lv-btn-size-default', 'lv-btn-shape-square', 'button-lc3WzE', 'toolbar-button-FhFnQ_', { 'lv-btn-icon-only': iconOnly }]"
            type="button"
            :title="iconOnly ? getCurrentSizeConfig().value + ' ' + getCurrentSizeConfig().quality : undefined"
            @click.stop="toggleSizeSelect">
      <svg fill="none" height="1em" preserveAspectRatio="xMidYMid meet"
           role="presentation" viewBox="0 0 24 24"
           width="1em" xmlns="http://www.w3.org/2000/svg">
        <g>
          <path data-follow-fill="currentColor"
                d="M1.924 9.706a4 4 0 0 1 4-4h12.15a4 4 0 0 1 4 4v4.588a4 4 0 0 1-4 4H5.924a4 4 0 0 1-4-4V9.706Zm4-2a2 2 0 0 0-2 2v4.588a2 2 0 0 0 2 2h12.15a2 2 0 0 0 2-2V9.706a2 2 0 0 0-2-2H5.924Z"
                clip-rule="evenodd" fill-rule="evenodd" fill="currentColor"></path>
        </g>
      </svg>
      <span v-if="!iconOnly" class="button-text-gwJnq9">{{ getCurrentSizeConfig().value }}<span class="divider-ObM8Ek"></span><span class="commercial-content-QAReHq">{{ getCurrentSizeConfig().quality }}</span></span>
    </button>

    <!-- 尺寸选择弹窗 -->
    <SelectPopup v-model:visible="isSizeSelectOpen" :trigger-ref="sizeTriggerRef" :placement="placement" title="视频尺寸">
      <ul class="lv-select-popup-inner">
        <li v-for="size in sizeOptions"
            :key="size.value"
            :class="['lv-select-option', { 'lv-select-option-wrapper-selected': currentSize === size.value }]"
            @click.stop="selectSize(size.value)">
          <div class="select-option-label-Ct6NRy">
            <div class="select-option-label-content-tmGvFs">
              <span>{{ size.label }}</span>
              <span class="commercial-content-QAReHq">{{ size.quality }}</span>
            </div>
            <span v-if="currentSize === size.value" class="select-option-check-icon-uOxlr2">
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

    <!-- 时长选择 -->
    <div ref="durationTriggerRef"
         :class="['lv-select', 'lv-select-single', 'lv-select-size-default', 'toolbar-select-h345g7', 'select-joF5y7', { 'compact-OC0Z0c': iconOnly }]"
         role="combobox"
         tabindex="0"
         :aria-expanded="isDurationSelectOpen"
         :title="iconOnly ? currentDuration : undefined"
         @click.stop="toggleDurationSelect">
      <div class="lv-select-view">
        <span class="lv-select-view-selector">
          <span class="lv-select-view-value">
            <span class="select-option-icon-LQHnJG">
              <svg width="1em" height="1em" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet"
                   fill="none" role="presentation" xmlns="http://www.w3.org/2000/svg"
                   style="transform: rotate(30deg);">
                <g>
                  <path data-follow-fill="currentColor"
                        d="M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2Zm0 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm0 3a1 1 0 0 1 1 1v4a1 1 0 0 1-2 0V8a1 1 0 0 1 1-1Z"
                        fill="currentColor"></path>
                </g>
              </svg>
            </span>
            <span v-if="!iconOnly">{{ currentDuration }}</span>
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

    <!-- 时长选择弹窗 -->
    <SelectPopup v-model:visible="isDurationSelectOpen" :trigger-ref="durationTriggerRef" :placement="placement" title="视频时长">
      <ul class="lv-select-popup-inner">
        <li v-for="duration in durationOptions"
            :key="duration.value"
            :class="['lv-select-option', { 'lv-select-option-wrapper-selected': currentDuration === duration.value }]"
            @click.stop="selectDuration(duration.value)">
          <div class="select-option-label-Ct6NRy">
            <div class="select-option-label-content-tmGvFs">
              <span>{{ duration.label }}</span>
            </div>
            <span v-if="currentDuration === duration.value" class="select-option-check-icon-uOxlr2">
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
</template>

<style>
/* 样式已在 generate.css 中定义 */
.video-toolbar {
  display: contents;
}
</style>
