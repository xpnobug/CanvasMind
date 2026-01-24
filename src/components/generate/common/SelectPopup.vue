<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue'

// Props 定义
interface Props {
  visible: boolean
  triggerRef: HTMLElement | null
  title?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: ''
})

// Emits 定义
const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

// 弹窗位置
const popupPosition = ref({ top: 0, left: 0 })

// 弹窗元素引用
const popupRef = ref<HTMLElement | null>(null)

// 计算弹窗位置
const updatePopupPosition = () => {
  if (props.triggerRef) {
    const rect = props.triggerRef.getBoundingClientRect()
    // 弹窗显示在触发器上方，水平居中对齐
    popupPosition.value = {
      top: rect.top - 8,
      left: rect.left + rect.width / 2
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
         class="lv-select-popup"
         tabindex="-1"
         :style="{
           position: 'fixed',
           top: popupPosition.top + 'px',
           left: popupPosition.left + 'px',
           transform: 'translateX(-50%) translateY(-100%)'
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
