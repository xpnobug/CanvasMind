<template>
  <div
    v-if="isOpen"
    class="admin-dialog-mask"
    :class="[{ 'admin-dialog-mask--inner': inner }, maskClass]"
    @mousedown.self="handleMaskPointerDown"
    @click.self="handleMaskClick"
  >
    <div
      class="admin-dialog"
      :class="resolvedPanelClass"
      role="dialog"
      aria-modal="true"
      @mousedown="maskPointerDownOnSelf = false"
      @click.stop
    >
      <div v-if="hasHeader" class="admin-dialog__header">
        <slot name="header">
          <div>
            <h3 v-if="title" class="admin-dialog__title">{{ title }}</h3>
            <div v-if="description" class="admin-dialog__desc">{{ description }}</div>
          </div>
          <div v-if="$slots['header-actions'] || showClose" class="admin-dialog__header-actions">
            <slot name="header-actions" />
            <button
              v-if="showClose"
              class="admin-dialog__close"
              type="button"
              :disabled="closeDisabled"
              aria-label="关闭"
              @click="handleClose"
            >
              ×
            </button>
          </div>
        </slot>
      </div>
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, useSlots } from 'vue'

export type AdminDialogSize = 'default' | 'provider-form' | 'manager' | 'model-manager' | 'model-form' | 'model-discover'

const props = withDefaults(defineProps<{
  visible?: boolean
  modelValue?: boolean
  title?: string
  description?: string
  size?: AdminDialogSize
  panelClass?: string | string[] | Record<string, boolean>
  maskClass?: string | string[] | Record<string, boolean>
  inner?: boolean
  showClose?: boolean
  closeOnMask?: boolean
  closeDisabled?: boolean
}>(), {
  visible: undefined,
  modelValue: undefined,
  title: '',
  description: '',
  size: 'default',
  panelClass: '',
  maskClass: '',
  inner: false,
  showClose: true,
  closeOnMask: true,
  closeDisabled: false,
})

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'update:modelValue': [value: boolean]
  close: []
}>()

const slots = useSlots()
/** 仅当按下与抬起都在遮罩上时才关闭，避免拖选文案滑出弹层误关 */
const maskPointerDownOnSelf = ref(false)

const isOpen = computed(() => props.modelValue ?? props.visible ?? false)
const hasHeader = computed(() => Boolean(
  props.title
  || props.description
  || slots.header
  || slots['header-actions']
  || props.showClose,
))

const sizeClassMap: Record<AdminDialogSize, string> = {
  default: '',
  'provider-form': 'admin-dialog--provider-form',
  manager: 'admin-dialog--manager',
  'model-manager': 'admin-dialog--model-manager',
  'model-form': 'admin-dialog--model-form',
  'model-discover': 'admin-dialog--model-discover',
}

const resolvedPanelClass = computed(() => [sizeClassMap[props.size], props.panelClass])

const setOpen = (value: boolean) => {
  emit('update:modelValue', value)
  emit('update:visible', value)
}

const handleClose = () => {
  if (props.closeDisabled) {
    return
  }
  setOpen(false)
  emit('close')
}

const handleMaskPointerDown = () => {
  maskPointerDownOnSelf.value = true
}

const handleMaskClick = () => {
  const startedOnMask = maskPointerDownOnSelf.value
  maskPointerDownOnSelf.value = false
  if (!startedOnMask || !props.closeOnMask || props.closeDisabled) {
    return
  }
  handleClose()
}
</script>
