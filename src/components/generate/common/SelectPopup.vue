<script setup lang="ts">
// 选择弹窗组件
// 支持上下弹出方向设置，可自动根据页面空间计算最佳弹出方向

import { ref, watch, nextTick, onMounted, onUnmounted, computed } from 'vue'

// 弹出方向类型
type Placement = 'top' | 'bottom' | 'auto'

// Props 定义
interface Props {
  visible: boolean
  triggerRef: HTMLElement | null
  title?: string
  // 弹出方向：top-向上, bottom-向下, auto-自动计算
  placement?: Placement
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  placement: 'auto'
})

// Emits 定义
const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

// 弹窗位置
const popupPosition = ref({ top: 0, left: 0 })

// 弹窗元素引用
const popupRef = ref<HTMLElement | null>(null)

// 实际弹出方向（用于样式控制）
const actualPlacement = ref<'top' | 'bottom'>('top')

// 预估弹窗高度（用于自动计算方向）
const ESTIMATED_POPUP_HEIGHT = 200

// 计算最佳弹出方向
const calculateBestPlacement = (): 'top' | 'bottom' => {
  if (!props.triggerRef) return 'top'

  const rect = props.triggerRef.getBoundingClientRect()

  // 计算上下可用空间
  const spaceAbove = rect.top
  const spaceBelow = window.innerHeight - rect.bottom

  // 如果指定了方向（非 auto），检查是否有足够空间
  if (props.placement !== 'auto') {
    const preferredPlacement = props.placement

    // 检查指定方向是否有足够空间
    if (preferredPlacement === 'bottom' && spaceBelow >= ESTIMATED_POPUP_HEIGHT) {
      return 'bottom'
    }
    if (preferredPlacement === 'top' && spaceAbove >= ESTIMATED_POPUP_HEIGHT) {
      return 'top'
    }

    // 指定方向空间不足，自动切换到有空间的方向
    if (spaceBelow >= ESTIMATED_POPUP_HEIGHT) {
      return 'bottom'
    }
    if (spaceAbove >= ESTIMATED_POPUP_HEIGHT) {
      return 'top'
    }

    // 两边都不够，选择空间更大的方向
    return spaceBelow > spaceAbove ? 'bottom' : 'top'
  }

  // auto 模式：优先向上弹出
  if (spaceAbove < ESTIMATED_POPUP_HEIGHT && spaceBelow >= ESTIMATED_POPUP_HEIGHT) {
    return 'bottom'
  }

  // 如果两边空间都不足，选择空间更大的方向
  if (spaceAbove < ESTIMATED_POPUP_HEIGHT && spaceBelow < ESTIMATED_POPUP_HEIGHT) {
    return spaceBelow > spaceAbove ? 'bottom' : 'top'
  }

  return 'top'
}

// 计算弹窗位置
const updatePopupPosition = () => {
  if (props.triggerRef) {
    const rect = props.triggerRef.getBoundingClientRect()

    // 计算最佳弹出方向
    actualPlacement.value = calculateBestPlacement()

    // 根据弹出方向计算位置
    if (actualPlacement.value === 'bottom') {
      // 向下弹出：弹窗显示在触发器下方
      popupPosition.value = {
        top: rect.bottom + 8,
        left: rect.left + rect.width / 2
      }
    } else {
      // 向上弹出：弹窗显示在触发器上方
      popupPosition.value = {
        top: rect.top - 8,
        left: rect.left + rect.width / 2
      }
    }
  }
}

// 监听弹窗显示状态，更新位置
watch(() => props.visible, (newVal) => {
  if (newVal) {
    nextTick(() => {
      updatePopupPosition()
    })
  }
})

// 点击外部关闭弹窗
const handleClickOutside = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (props.visible) {
    const popup = popupRef.value
    const trigger = props.triggerRef
    if (popup && !popup.contains(target) && trigger && !trigger.contains(target)) {
      emit('update:visible', false)
    }
  }
}

// 挂载时添加全局事件监听
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  window.addEventListener('resize', updatePopupPosition)
  window.addEventListener('scroll', updatePopupPosition, true)
})

// 卸载时移除事件监听
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('resize', updatePopupPosition)
  window.removeEventListener('scroll', updatePopupPosition, true)
})
</script>

<template>
  <Teleport to="body">
    <div v-if="visible"
         ref="popupRef"
         :class="['lv-select-popup', `placement-${actualPlacement}`]"
         tabindex="-1"
         :style="{
           position: 'fixed',
           top: popupPosition.top + 'px',
           left: popupPosition.left + 'px',
           transform: actualPlacement === 'bottom' ? 'translateX(-50%)' : 'translateX(-50%) translateY(-100%)',
           zIndex: 10001
         }">
      <!-- 标题 -->
      <div v-if="title" class="title-RK9CLE dropdown-title-V9bKQe secondary-IGs0cX">{{ title }}</div>
      <!-- 内容插槽 -->
      <slot></slot>
    </div>
  </Teleport>
</template>

<style>
/* 样式已在 generate.css 中定义 */
</style>
