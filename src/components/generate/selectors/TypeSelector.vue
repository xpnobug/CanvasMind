<script setup lang="ts">
import { ref, computed } from 'vue'
import SelectPopup from '../common/SelectPopup.vue'

// 创作类型枚举
export type CreationType = 'agent' | 'image' | 'video' | 'digital-human' | 'motion'

// 创作类型配置
const creationTypes = [
  { value: 'agent' as CreationType, label: 'Agent 模式', icon: 'agent' },
  { value: 'image' as CreationType, label: '图片生成', icon: 'image' },
  { value: 'video' as CreationType, label: '视频生成', icon: 'video' },
  { value: 'digital-human' as CreationType, label: '数字人', icon: 'digital-human' },
  { value: 'motion' as CreationType, label: '动作模仿', icon: 'motion' }
]

// Props 定义
interface Props {
  modelValue: CreationType
}

const props = defineProps<Props>()

// Emits 定义
const emit = defineEmits<{
  'update:modelValue': [value: CreationType]
  'open': []
  'close': []
}>()

// 下拉框是否展开
const isOpen = ref(false)

// 关闭下拉框方法（供外部调用）
const close = () => {
  if (isOpen.value) {
    isOpen.value = false
    emit('close')
  }
}

// 暴露方法和状态
defineExpose({
  isOpen,
  close
})

// 触发器元素引用
const triggerRef = ref<HTMLElement | null>(null)

// 获取当前类型配置
const currentTypeConfig = computed(() =>
  creationTypes.find(t => t.value === props.modelValue) || creationTypes[0]
)

// 切换下拉框
const toggleDropdown = (e: Event) => {
  e.stopPropagation()
  const wasOpen = isOpen.value
  isOpen.value = !isOpen.value
  // 打开时通知父组件
  if (!wasOpen && isOpen.value) {
    emit('open')
  } else if (wasOpen && !isOpen.value) {
    emit('close')
  }
}

// 选择类型
const selectType = (type: CreationType) => {
  emit('update:modelValue', type)
  isOpen.value = false
}
</script>

<template>
  <div ref="triggerRef" class="type-select-wrapper" @click.stop="toggleDropdown">
    <div :aria-expanded="isOpen"
         aria-haspopup="listbox"
         class="lv-select lv-select-single lv-select-size-default toolbar-select-h345g7 type-select-BRd1AA select-joF5y7"
         role="combobox"
         tabindex="0">
      <div class="lv-select-view">
        <span class="lv-select-view-selector">
          <input aria-hidden="true" autocomplete="off"
                 class="lv-select-view-input lv-select-hidden"
                 style="width:100%;pointer-events:none" tabindex="-1"
                 value="">
          <span class="lv-select-view-value">
            <span class="select-option-icon-LQHnJG">
              <!-- Agent 模式图标 -->
              <svg v-if="modelValue === 'agent'" width="1em" height="1em" viewBox="0 0 24 24"
                   preserveAspectRatio="xMidYMid meet" fill="none"
                   role="presentation" xmlns="http://www.w3.org/2000/svg">
                <g>
                  <path data-follow-fill="currentColor"
                        d="M11.805 5.786c1.25-.926 2.193-1.373 2.471-1.096.489.488-1.261 3.03-3.909 5.677-4.33 4.331-6.715 8.968-5.326 10.358.29.29.723.416 1.264.394.421.017.92-.07 1.48-.249-2.117.9-3.859 1.005-4.76.104-1.874-1.874.61-7.402 5.553-12.353l.022-.02c.03-.032.062-.063.093-.094l.065-.064.11-.108c.97-.95 1.96-1.804 2.937-2.549Zm5.55 11.57c1.532-1.531 3.2-2.347 3.725-1.822.525.525-.29 2.192-1.822 3.724-1.532 1.531-3.2 2.347-3.725 1.822-.524-.525.291-2.192 1.822-3.724ZM16.217 3.13c2.116-.9 3.858-1.005 4.759-.105 1.874 1.875-.612 7.402-5.554 12.353l-.022.021c-.03.032-.062.062-.093.093l-.064.065-.11.108c-.97.949-1.96 1.803-2.938 2.548-1.25.926-2.193 1.374-2.471 1.096-.489-.487 1.262-3.029 3.91-5.676 4.331-4.332 6.715-8.97 5.325-10.36-.29-.29-.722-.414-1.263-.392-.421-.017-.92.069-1.48.249ZM4.742 4.74C6.274 3.21 7.94 2.394 8.466 2.92c.525.525-.29 2.193-1.822 3.724C5.112 8.175 3.445 8.99 2.92 8.466c-.525-.525.29-2.193 1.822-3.725Z"
                        fill="currentColor"></path>
                </g>
              </svg>
              <!-- 图片生成图标 -->
              <svg v-else-if="modelValue === 'image'" width="1em" height="1em" viewBox="0 0 24 24"
                   preserveAspectRatio="xMidYMid meet" fill="none"
                   role="presentation" xmlns="http://www.w3.org/2000/svg">
                <g>
                  <path d="M16.393 2.607a5 5 0 0 1 5 5v4.265A6 6 0 0 0 19.6 11.6c-.07 0-.139.002-.207.004V7.607a3 3 0 0 0-3-3H7.607a3 3 0 0 0-3 3v7.728l3.559-3.69a3.161 3.161 0 0 1 4.357-.184l2.536 2.219a5.992 5.992 0 0 0-1.05 1.74l-2.804-2.454a1.161 1.161 0 0 0-1.6.067l-4.628 4.8a2.998 2.998 0 0 0 2.63 1.56h6.265c.23.738.601 1.414 1.08 2H7.606l-.256-.007a5 5 0 0 1-4.634-3.956l-.068-.064.044-.047a5.01 5.01 0 0 1-.079-.67l-.007-.257V7.607a5 5 0 0 1 5-5h8.786Zm-.704 4.23a1.556 1.556 0 1 1 0 3.112 1.556 1.556 0 0 1 0-3.112Z"
                        data-follow-fill="currentColor" fill="currentColor"></path>
                  <path d="M18.96 14.577a.727.727 0 0 1 1.34 0 4.577 4.577 0 0 0 2.395 2.413.737.737 0 0 1 0 1.352 4.577 4.577 0 0 0-2.395 2.413.727.727 0 0 1-1.34 0 4.578 4.578 0 0 0-2.395-2.413.738.738 0 0 1 0-1.352 4.577 4.577 0 0 0 2.394-2.413Z"
                        data-follow-fill="currentColor" fill="currentColor"></path>
                </g>
              </svg>
              <!-- 视频生成图标 -->
              <svg v-else-if="modelValue === 'video'" width="1em" height="1em" viewBox="0 0 24 24"
                   preserveAspectRatio="xMidYMid meet" fill="none"
                   role="presentation" xmlns="http://www.w3.org/2000/svg">
                <g>
                  <path data-follow-fill="currentColor"
                        d="M12.534 1.626c5.489.278 9.854 4.817 9.854 10.374l-.001.023a6.098 6.098 0 0 0-2.04-.836 8.388 8.388 0 1 0-6.613 9.02 6.184 6.184 0 0 0 1.41 1.693c-.992.314-2.048.488-3.144.488l-.535-.014c-5.311-.27-9.57-4.528-9.839-9.84L1.612 12C1.612 6.263 6.263 1.613 12 1.613l.534.013Zm6.425 12.95a.728.728 0 0 1 1.342 0 4.579 4.579 0 0 0 2.394 2.415.737.737 0 0 1 0 1.35 4.578 4.578 0 0 0-2.394 2.414.728.728 0 0 1-1.342 0 4.578 4.578 0 0 0-2.394-2.414.737.737 0 0 1 0-1.35 4.579 4.579 0 0 0 2.394-2.415Zm-8.325-6.06c.444-.047.986.266 2.07.891l1.19.688c1.082.625 1.623.938 1.805 1.346a1.37 1.37 0 0 1 0 1.118c-.181.408-.722.721-1.805 1.347l-1.19.687c-1.084.625-1.626.937-2.07.89a1.375 1.375 0 0 1-.969-.558c-.262-.361-.262-.987-.262-2.237v-1.375c0-1.25 0-1.876.262-2.238.23-.315.582-.518.969-.56Z"
                        fill="currentColor"></path>
                </g>
              </svg>
              <!-- 数字人图标 -->
              <svg v-else-if="modelValue === 'digital-human'" width="1em" height="1em" viewBox="0 0 24 24"
                   preserveAspectRatio="xMidYMid meet" fill="none"
                   role="presentation" xmlns="http://www.w3.org/2000/svg">
                <g>
                  <path data-follow-fill="currentColor"
                        d="M16.092 5.86c1.905.08 3.113 1.362 3.96 2.47.225.293.437.592.634.87.2.282.383.54.565.779.377.492.674.793.941.946a1 1 0 0 1 .408 1.294c-.684 1.448-1.687 3.317-3.349 4.82-1.69 1.528-4.017 2.639-7.25 2.639-6.143 0-9.079-3.976-10.386-6.944l-.24-.579a1 1 0 0 1 .271-1.114l.262-.249c.267-.272.553-.612.874-1.01.41-.509.878-1.115 1.363-1.665.937-1.059 2.233-2.26 3.939-2.26l.3.004c1.47.05 2.55.48 3.418 1.24l.053.037a.391.391 0 0 0 .189.054.295.295 0 0 0 .202-.064l.172-.143c.875-.693 1.96-1.129 3.487-1.129l.187.004Z"
                        fill="currentColor"></path>
                </g>
              </svg>
              <!-- 动作模仿图标 -->
              <svg v-else width="1em" height="1em" viewBox="0 0 24 24"
                   preserveAspectRatio="xMidYMid meet" fill="none"
                   role="presentation" xmlns="http://www.w3.org/2000/svg">
                <g>
                  <path data-follow-fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"
                        d="M11.45 5.698a1.371 1.371 0 1 1 0-2.742 1.371 1.371 0 0 1 0 2.742Zm0 1.837a3.208 3.208 0 1 1 0-6.416 3.208 3.208 0 0 1 0 6.416Z"
                        fill="currentColor"></path>
                </g>
              </svg>
            </span>
            {{ currentTypeConfig.label }}
          </span>
        </span>
        <div aria-hidden="true" class="lv-select-suffix">
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
      </div>
    </div>
  </div>

  <!-- 下拉弹窗 -->
  <SelectPopup v-model:visible="isOpen" :trigger-ref="triggerRef" title="创作类型">
    <ul class="lv-select-popup-inner">
      <li v-for="type in creationTypes"
          :key="type.value"
          :class="['lv-select-option', { 'lv-select-option-wrapper-selected': modelValue === type.value }]"
          @click.stop="selectType(type.value)">
        <div class="select-option-label-Ct6NRy">
          <div class="select-option-label-content-tmGvFs">
            <span class="select-option-icon-LQHnJG">
              <!-- Agent 模式图标 -->
              <svg v-if="type.value === 'agent'" width="1em" height="1em" viewBox="0 0 24 24"
                   preserveAspectRatio="xMidYMid meet" fill="none"
                   role="presentation" xmlns="http://www.w3.org/2000/svg">
                <g>
                  <path data-follow-fill="currentColor"
                        d="M11.805 5.786c1.25-.926 2.193-1.373 2.471-1.096.489.488-1.261 3.03-3.909 5.677-4.33 4.331-6.715 8.968-5.326 10.358.29.29.723.416 1.264.394.421.017.92-.07 1.48-.249-2.117.9-3.859 1.005-4.76.104-1.874-1.874.61-7.402 5.553-12.353l.022-.02c.03-.032.062-.063.093-.094l.065-.064.11-.108c.97-.95 1.96-1.804 2.937-2.549Zm5.55 11.57c1.532-1.531 3.2-2.347 3.725-1.822.525.525-.29 2.192-1.822 3.724-1.532 1.531-3.2 2.347-3.725 1.822-.524-.525.291-2.192 1.822-3.724ZM16.217 3.13c2.116-.9 3.858-1.005 4.759-.105 1.874 1.875-.612 7.402-5.554 12.353l-.022.021c-.03.032-.062.062-.093.093l-.064.065-.11.108c-.97.949-1.96 1.803-2.938 2.548-1.25.926-2.193 1.374-2.471 1.096-.489-.487 1.262-3.029 3.91-5.676 4.331-4.332 6.715-8.97 5.325-10.36-.29-.29-.722-.414-1.263-.392-.421-.017-.92.069-1.48.249ZM4.742 4.74C6.274 3.21 7.94 2.394 8.466 2.92c.525.525-.29 2.193-1.822 3.724C5.112 8.175 3.445 8.99 2.92 8.466c-.525-.525.29-2.193 1.822-3.725Z"
                        fill="currentColor"></path>
                </g>
              </svg>
              <!-- 图片生成图标 -->
              <svg v-else-if="type.value === 'image'" width="1em" height="1em" viewBox="0 0 24 24"
                   preserveAspectRatio="xMidYMid meet" fill="none"
                   role="presentation" xmlns="http://www.w3.org/2000/svg">
                <g>
                  <path d="M16.393 2.607a5 5 0 0 1 5 5v4.265A6 6 0 0 0 19.6 11.6c-.07 0-.139.002-.207.004V7.607a3 3 0 0 0-3-3H7.607a3 3 0 0 0-3 3v7.728l3.559-3.69a3.161 3.161 0 0 1 4.357-.184l2.536 2.219a5.992 5.992 0 0 0-1.05 1.74l-2.804-2.454a1.161 1.161 0 0 0-1.6.067l-4.628 4.8a2.998 2.998 0 0 0 2.63 1.56h6.265c.23.738.601 1.414 1.08 2H7.606l-.256-.007a5 5 0 0 1-4.634-3.956l-.068-.064.044-.047a5.01 5.01 0 0 1-.079-.67l-.007-.257V7.607a5 5 0 0 1 5-5h8.786Zm-.704 4.23a1.556 1.556 0 1 1 0 3.112 1.556 1.556 0 0 1 0-3.112Z"
                        data-follow-fill="currentColor" fill="currentColor"></path>
                  <path d="M18.96 14.577a.727.727 0 0 1 1.34 0 4.577 4.577 0 0 0 2.395 2.413.737.737 0 0 1 0 1.352 4.577 4.577 0 0 0-2.395 2.413.727.727 0 0 1-1.34 0 4.578 4.578 0 0 0-2.395-2.413.738.738 0 0 1 0-1.352 4.577 4.577 0 0 0 2.394-2.413Z"
                        data-follow-fill="currentColor" fill="currentColor"></path>
                </g>
              </svg>
              <!-- 视频生成图标 -->
              <svg v-else-if="type.value === 'video'" width="1em" height="1em" viewBox="0 0 24 24"
                   preserveAspectRatio="xMidYMid meet" fill="none"
                   role="presentation" xmlns="http://www.w3.org/2000/svg">
                <g>
                  <path data-follow-fill="currentColor"
                        d="M12.534 1.626c5.489.278 9.854 4.817 9.854 10.374l-.001.023a6.098 6.098 0 0 0-2.04-.836 8.388 8.388 0 1 0-6.613 9.02 6.184 6.184 0 0 0 1.41 1.693c-.992.314-2.048.488-3.144.488l-.535-.014c-5.311-.27-9.57-4.528-9.839-9.84L1.612 12C1.612 6.263 6.263 1.613 12 1.613l.534.013Zm6.425 12.95a.728.728 0 0 1 1.342 0 4.579 4.579 0 0 0 2.394 2.415.737.737 0 0 1 0 1.35 4.578 4.578 0 0 0-2.394 2.414.728.728 0 0 1-1.342 0 4.578 4.578 0 0 0-2.394-2.414.737.737 0 0 1 0-1.35 4.579 4.579 0 0 0 2.394-2.415Zm-8.325-6.06c.444-.047.986.266 2.07.891l1.19.688c1.082.625 1.623.938 1.805 1.346a1.37 1.37 0 0 1 0 1.118c-.181.408-.722.721-1.805 1.347l-1.19.687c-1.084.625-1.626.937-2.07.89a1.375 1.375 0 0 1-.969-.558c-.262-.361-.262-.987-.262-2.237v-1.375c0-1.25 0-1.876.262-2.238.23-.315.582-.518.969-.56Z"
                        fill="currentColor"></path>
                </g>
              </svg>
              <!-- 数字人图标 -->
              <svg v-else-if="type.value === 'digital-human'" width="1em" height="1em" viewBox="0 0 24 24"
                   preserveAspectRatio="xMidYMid meet" fill="none"
                   role="presentation" xmlns="http://www.w3.org/2000/svg">
                <g>
                  <path data-follow-fill="currentColor"
                        d="M16.092 5.86c1.905.08 3.113 1.362 3.96 2.47.225.293.437.592.634.87.2.282.383.54.565.779.377.492.674.793.941.946a1 1 0 0 1 .408 1.294c-.684 1.448-1.687 3.317-3.349 4.82-1.69 1.528-4.017 2.639-7.25 2.639-6.143 0-9.079-3.976-10.386-6.944l-.24-.579a1 1 0 0 1 .271-1.114l.262-.249c.267-.272.553-.612.874-1.01.41-.509.878-1.115 1.363-1.665.937-1.059 2.233-2.26 3.939-2.26l.3.004c1.47.05 2.55.48 3.418 1.24l.053.037a.391.391 0 0 0 .189.054.295.295 0 0 0 .202-.064l.172-.143c.875-.693 1.96-1.129 3.487-1.129l.187.004Z"
                        fill="currentColor"></path>
                </g>
              </svg>
              <!-- 动作模仿图标 -->
              <svg v-else width="1em" height="1em" viewBox="0 0 24 24"
                   preserveAspectRatio="xMidYMid meet" fill="none"
                   role="presentation" xmlns="http://www.w3.org/2000/svg">
                <g>
                  <path data-follow-fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"
                        d="M11.45 5.698a1.371 1.371 0 1 1 0-2.742 1.371 1.371 0 0 1 0 2.742Zm0 1.837a3.208 3.208 0 1 1 0-6.416 3.208 3.208 0 0 1 0 6.416Z"
                        fill="currentColor"></path>
                </g>
              </svg>
            </span>
            <span>{{ type.label }}</span>
          </div>
          <span v-if="modelValue === type.value" class="select-option-check-icon-uOxlr2">
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
</template>

<style>
/* 样式已在 generate.css 中定义 */
</style>
