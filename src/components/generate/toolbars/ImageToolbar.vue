<script setup lang="ts">
// 图片生成工具栏组件
// 包含模型版本选择、尺寸选择、文字工具按钮
// 支持弹出方向设置

import { ref, computed, watch, onMounted } from 'vue'
import SelectPopup from '../common/SelectPopup.vue'
import { getAllImageModels, getDefaultImageModelKey, loadPublicModelCatalog, type ImageModel } from '@/config/models'

// 弹出方向类型
type Placement = 'top' | 'bottom' | 'auto'

const IMAGE_TOOLBAR_STORAGE_KEY = 'canana:generator:image-toolbar'

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

// 模型版本配置（内置 + 自定义）
const modelVersions = computed(() =>
  getAllImageModels().map((m: any) => ({ value: m.key, label: m.label }))
)

// 尺寸配置
const sizeOptions = [
  { value: '1:1', label: '1:1', quality: '高清 2K' },
  { value: '4:3', label: '4:3', quality: '高清 2K' },
  { value: '3:4', label: '3:4', quality: '高清 2K' },
  { value: '16:9', label: '16:9', quality: '高清 2K' },
  { value: '9:16', label: '9:16', quality: '高清 2K' }
]

const readStoredImageToolbarState = () => {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    return JSON.parse(window.localStorage.getItem(IMAGE_TOOLBAR_STORAGE_KEY) || 'null')
  } catch {
    return null
  }
}

const storedToolbarState = readStoredImageToolbarState()
const validImageModelValues = modelVersions.value.map(item => item.value)
const validImageSizeValues = sizeOptions.map(item => item.value)

const IMAGE_COUNT_MIN = 1
// 当模型未配置 maxImagesPerRequest 时使用的最保守上限：1。
// 各上游真实上限由 capabilityJson.maxImagesPerRequest 提供，管理员后台可配置。
const IMAGE_COUNT_FALLBACK_MAX = 1
const IMAGE_COUNT_DEFAULT = 1

// 当前选中的模型版本
const currentModelVersion = ref(
  validImageModelValues.includes(storedToolbarState?.model) ? storedToolbarState.model : getDefaultImageModelKey(),
)

// 当前选中的尺寸
const currentSize = ref(
  validImageSizeValues.includes(storedToolbarState?.size) ? storedToolbarState.size : '1:1',
)

// 当前生成数量：用户每次打开都从 1 开始，不记忆历史值
const currentCount = ref<number>(IMAGE_COUNT_DEFAULT)

// 当前模型允许的单次最大出图张数（由后台 capabilityJson.maxImagesPerRequest 配置，未配置时落到保守值 1）
const currentImageMax = computed(() => {
  const all = getAllImageModels() as ImageModel[]
  const model = all.find(item => item.key === currentModelVersion.value)
  const value = Number(model?.maxImagesPerRequest)
  return Number.isFinite(value) && value >= IMAGE_COUNT_MIN ? Math.floor(value) : IMAGE_COUNT_FALLBACK_MAX
})

const clampCount = (value: number) => {
  if (!Number.isFinite(value)) return IMAGE_COUNT_DEFAULT
  return Math.min(currentImageMax.value, Math.max(IMAGE_COUNT_MIN, Math.floor(value)))
}

const decreaseCount = (e: Event) => {
  e.stopPropagation()
  currentCount.value = clampCount(currentCount.value - 1)
}

const increaseCount = (e: Event) => {
  e.stopPropagation()
  currentCount.value = clampCount(currentCount.value + 1)
}

const handleCountInput = (e: Event) => {
  const value = Number((e.target as HTMLInputElement).value)
  currentCount.value = clampCount(value)
}

// 弹窗状态
const isModelSelectOpen = ref(false)
const isSizeSelectOpen = ref(false)

// 触发器引用
const modelTriggerRef = ref<HTMLElement | null>(null)
const sizeTriggerRef = ref<HTMLElement | null>(null)

// 切换模型选择弹窗
const toggleModelSelect = (e: Event) => {
  e.stopPropagation()
  isModelSelectOpen.value = !isModelSelectOpen.value
  isSizeSelectOpen.value = false
}

// 切换尺寸选择弹窗
const toggleSizeSelect = (e: Event) => {
  e.stopPropagation()
  isSizeSelectOpen.value = !isSizeSelectOpen.value
  isModelSelectOpen.value = false
}

// 选择模型版本
const selectModelVersion = (version: string) => {
  currentModelVersion.value = version
  isModelSelectOpen.value = false
}

// 选择尺寸
const selectSize = (size: string) => {
  currentSize.value = size
  isSizeSelectOpen.value = false
}

// 当前模型显示名称
const currentModelLabel = computed(() => {
  const m = modelVersions.value.find(v => v.value === currentModelVersion.value)
  return m?.label || currentModelVersion.value
})

// 获取当前尺寸配置
const currentSizeConfig = () => {
  return sizeOptions.find(s => s.value === currentSize.value) || sizeOptions[0]
}

watch(
  modelVersions,
  (options) => {
    const values = options.map(item => item.value)
    if (!values.length) return
    if (!values.includes(currentModelVersion.value)) {
      currentModelVersion.value = getDefaultImageModelKey() || values[0]
    }
  },
  { immediate: true },
)

// 切换模型时，若新模型的最大张数小于当前 count，自动夹紧，避免用户提交超限被上游 422。
watch(currentImageMax, (max) => {
  if (currentCount.value > max) {
    currentCount.value = max
  }
})

onMounted(() => {
  void loadPublicModelCatalog()
})

watch(
  [currentModelVersion, currentSize],
  ([model, size]) => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(IMAGE_TOOLBAR_STORAGE_KEY, JSON.stringify({ model, size }))
  },
  { immediate: true },
)

defineExpose({
  currentModelVersion,
  currentModelLabel,
  currentSize,
  currentSizeConfig,
  currentCount,
})
</script>

<template>
  <div class="image-toolbar">
    <!-- 模型版本选择 -->
    <div ref="modelTriggerRef"
         :class="['lv-select', 'lv-select-single', 'lv-select-size-default', 'toolbar-select', 'select-joF5y7', 'select-NNOj5P', { 'compact': iconOnly }]"
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

    <!-- 模型版本选择弹窗 -->
    <SelectPopup v-model:visible="isModelSelectOpen" :trigger-ref="modelTriggerRef" :placement="placement" title="模型版本">
      <ul class="lv-select-popup-inner">
        <li v-for="version in modelVersions"
            :key="version.value"
            :class="['lv-select-option', { 'lv-select-option-wrapper-selected': currentModelVersion === version.value }]"
            @click.stop="selectModelVersion(version.value)">
          <div class="select-option-label">
            <div class="select-option-label-content">
              <span>{{ version.label }}</span>
            </div>
            <span v-if="currentModelVersion === version.value" class="select-option-check-icon">
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

    <!-- 尺寸选择按钮 -->
    <button ref="sizeTriggerRef"
            :class="['lv-btn', 'lv-btn-secondary', 'lv-btn-size-default', 'lv-btn-shape-square', 'button-lc3WzE', 'toolbar-button-FhFnQ_', 'toolbar-button-pEFNv9', { 'lv-btn-icon-only': iconOnly }]"
            type="button"
            :title="iconOnly ? currentSizeConfig().value + ' ' + currentSizeConfig().quality : undefined"
            @click.stop="toggleSizeSelect">
      <svg fill="none" height="1em" preserveAspectRatio="xMidYMid meet"
           role="presentation" viewBox="0 0 24 24"
           width="1em" xmlns="http://www.w3.org/2000/svg">
        <g>
          <path clip-rule="evenodd"
                d="M19.25 17.25V6.75a2 2 0 0 0-2-2H6.75a2 2 0 0 0-2 2v10.5a2 2 0 0 0 2 2h10.5a2 2 0 0 0 2-2Zm2-10.5a4 4 0 0 0-4-4H6.75a4 4 0 0 0-4 4v10.5a4 4 0 0 0 4 4h10.5a4 4 0 0 0 4-4V6.75Z"
                data-follow-fill="currentColor" fill="currentColor"
                fill-rule="evenodd"></path>
        </g>
      </svg>
      <span v-if="!iconOnly" class="button-text-lDBpQJ">{{ currentSizeConfig().value }}<span class="divider-KQsVxi"></span><span class="commercial-content-PR23Ed">{{ currentSizeConfig().quality }}</span></span>
    </button>

    <!-- 尺寸选择弹窗 -->
    <SelectPopup v-model:visible="isSizeSelectOpen" :trigger-ref="sizeTriggerRef" :placement="placement" title="图片尺寸">
      <ul class="lv-select-popup-inner">
        <li v-for="size in sizeOptions"
            :key="size.value"
            :class="['lv-select-option', { 'lv-select-option-wrapper-selected': currentSize === size.value }]"
            @click.stop="selectSize(size.value)">
          <div class="select-option-label">
            <div class="select-option-label-content">
              <span>{{ size.label }}</span>
              <span class="commercial-content-PR23Ed">{{ size.quality }}</span>
            </div>
            <span v-if="currentSize === size.value" class="select-option-check-icon">
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

    <!-- 生成数量步进器 -->
    <div
      class="image-count-stepper"
      :class="{ 'compact': iconOnly }"
      :title="iconOnly ? `生成数量：${currentCount} 张` : '生成数量'"
      @click.stop
    >
      <button
        type="button"
        class="image-count-step-btn"
        :disabled="currentCount <= 1"
        aria-label="减少生成数量"
        @click="decreaseCount"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M5 12h14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
        </svg>
      </button>
      <input
        v-if="!iconOnly"
        type="number"
        class="image-count-value"
        :min="1"
        :max="currentImageMax"
        :step="1"
        :value="currentCount"
        @input="handleCountInput"
        @click.stop
      />
      <span v-else class="image-count-value image-count-value-readonly">{{ currentCount }}</span>
      <button
        type="button"
        class="image-count-step-btn"
        :disabled="currentCount >= currentImageMax"
        aria-label="增加生成数量"
        @click="increaseCount"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
        </svg>
      </button>
    </div>

    <!-- 文字工具按钮 -->
<!--
    <button class="lv-btn lv-btn-secondary lv-btn-size-default lv-btn-shape-square lv-btn-icon-only button-lc3WzE toolbar-button-FhFnQ_ toolbar-button-pEFNv9"
            type="button">
      <svg fill="none" height="1em" preserveAspectRatio="xMidYMid meet"
           role="presentation" viewBox="0 0 24 24"
           width="1em" xmlns="http://www.w3.org/2000/svg">
        <g>
          <path clip-rule="evenodd"
                d="M11.26 6.362H5.604v1.595a.871.871 0 1 1-1.743 0V5.491c0-.482.39-.872.871-.872h14.801c.482 0 .872.39.872.872v2.466a.871.871 0 0 1-1.743 0V6.362h-5.658v13.113c0 .481-.39.872-.871.872h-2.63a.871.871 0 0 1 0-1.743h1.757V6.362Zm5.058 11.202c-.776-.05-1.39-.708-1.39-1.513 0-.836.664-1.515 1.483-1.515.655 0 1.211.434 1.408 1.035.151.42.234.873.234 1.345a3.911 3.911 0 0 1-1.844 3.337c-.504.31-1.069-.123-1.069-.715 0-.351.214-.66.481-.888.324-.277.572-.652.697-1.086Zm2.557-1.512c0 .804.614 1.462 1.39 1.512a2.245 2.245 0 0 1-.697 1.086c-.267.229-.48.537-.48.889 0 .591.565 1.025 1.068.714A3.911 3.911 0 0 0 22 16.916c0-.47-.081-.92-.23-1.337a1.488 1.488 0 0 0-1.411-1.043c-.82 0-1.484.679-1.484 1.516Z"
                data-follow-fill="currentColor" fill="currentColor"
                fill-rule="evenodd"></path>
        </g>
      </svg>
    </button>
-->
  </div>
</template>

<style>
/* 样式已在 generate.css 中定义 */
.image-toolbar {
  display: contents;
}

/* 生成数量步进器 */
.image-count-stepper {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  height: 32px;
  padding: 0 4px;
  border-radius: 8px;
  background: var(--bg-block-secondary-default, rgba(204, 221, 255, 0.04));
  border: 0.5px solid var(--stroke-tertiary, rgba(255, 255, 255, 0.12));
}

.image-count-stepper.compact {
  height: 28px;
  gap: 0;
  padding: 0 2px;
}

.image-count-step-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  padding: 0;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--text-primary, #e0f5ff);
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.image-count-step-btn:hover:not(:disabled) {
  background: var(--bg-block-primary-hover, rgba(204, 221, 255, 0.12));
}

.image-count-step-btn:active:not(:disabled) {
  background: var(--bg-block-primary-pressed, rgba(204, 221, 255, 0.16));
}

.image-count-step-btn:disabled {
  color: var(--text-disabled, rgba(224, 245, 255, 0.3));
  cursor: not-allowed;
}

.image-count-value {
  width: 28px;
  height: 22px;
  text-align: center;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary, #e0f5ff);
  background: transparent;
  border: none;
  outline: none;
  padding: 0;
  -moz-appearance: textfield;
}

.image-count-value::-webkit-outer-spin-button,
.image-count-value::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.image-count-value-readonly {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  user-select: none;
}
</style>
