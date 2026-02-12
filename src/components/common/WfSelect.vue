<template>
  <div class="wf-select nodrag" :class="{ open }" ref="root" @mousedown.stop @pointerdown.stop>
    <div class="wf-select-trigger" @mousedown.prevent.stop="toggle">
      <span class="wf-select-value">{{ currentLabel }}</span>
      <svg class="wf-select-arrow" width="10" height="6" viewBox="0 0 10 6" fill="none">
        <path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
    <Teleport to="body">
      <div v-if="open" class="wf-select-dropdown" :style="dropdownStyle" ref="dropdown">
        <div
          v-for="opt in options"
          :key="opt.value"
          class="wf-select-option"
          :class="{ active: opt.value === modelValue }"
          @mousedown.prevent.stop="select(opt)"
        >
          {{ opt.label }}
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script>
// 模块级共享：所有 WfSelect 实例共用
const closeCallbacks = new Set()
const closeOthers = (current) => {
  closeCallbacks.forEach(fn => { if (fn !== current) fn() })
}
</script>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'

const props = defineProps({
  modelValue: [String, Number],
  options: { type: Array, default: () => [] }
})
const emit = defineEmits(['update:modelValue', 'change'])

const open = ref(false)
const root = ref(null)
const dropdown = ref(null)
const dropdownStyle = ref({})

const closeMe = () => { open.value = false }
closeCallbacks.add(closeMe)

const toggle = () => {
  if (!open.value) {
    closeOthers(closeMe)
    scrollIgnoreTimer = Date.now() + 100
  }
  open.value = !open.value
}

const currentLabel = computed(() => {
  const opt = props.options.find(o => o.value === props.modelValue)
  return opt?.label || props.modelValue || ''
})

const updatePosition = () => {
  if (!root.value) return
  const rect = root.value.getBoundingClientRect()
  dropdownStyle.value = {
    position: 'fixed',
    left: `${rect.left}px`,
    top: `${rect.bottom + 4}px`,
    width: `${rect.width}px`,
    zIndex: 10000
  }
}

let rafId = null
const startTracking = () => {
  const track = () => {
    if (!open.value) return
    updatePosition()
    rafId = requestAnimationFrame(track)
  }
  rafId = requestAnimationFrame(track)
}
const stopTracking = () => {
  if (rafId) { cancelAnimationFrame(rafId); rafId = null }
}

watch(open, async (val) => {
  if (val) {
    updatePosition()
    startTracking()
    await nextTick()
    if (dropdown.value) {
      const active = dropdown.value.querySelector('.active')
      if (active) active.scrollIntoView({ block: 'nearest' })
    }
  } else {
    stopTracking()
  }
})

const select = (opt) => {
  emit('update:modelValue', opt.value)
  emit('change', opt.value)
  open.value = false
}

let scrollIgnoreTimer = 0

const onClickOutside = (e) => {
  if (open.value && root.value && !root.value.contains(e.target) && dropdown.value && !dropdown.value.contains(e.target)) {
    open.value = false
  }
}

const onScroll = () => { if (open.value && Date.now() > scrollIgnoreTimer) open.value = false }

onMounted(() => {
  document.addEventListener('mousedown', onClickOutside)
  document.addEventListener('scroll', onScroll, true)
})
onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onClickOutside)
  document.removeEventListener('scroll', onScroll, true)
  stopTracking()
  closeCallbacks.delete(closeMe)
})
</script>

<style scoped>
.wf-select {
  position: relative;
  width: 100%;
}

.wf-select-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  box-sizing: border-box;
  background: var(--bg-block-secondary-default, rgba(204, 221, 255, 0.04));
  border: 0.5px solid var(--stroke-tertiary, rgba(204, 221, 255, 0.08));
  border-radius: 8px;
  padding: 6px 8px;
  color: var(--text-primary, #f5fbff);
  font-size: 12px;
  cursor: pointer;
  transition: border-color 0.2s;
}

.wf-select.open .wf-select-trigger {
  border-color: var(--brand-main-default, #00cae0);
}

.wf-select-value {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.wf-select-arrow {
  color: var(--text-secondary, rgba(224, 245, 255, 0.6));
  flex-shrink: 0;
  transition: transform 0.2s;
}

.wf-select.open .wf-select-arrow {
  transform: rotate(180deg);
}
</style>

<style>
/* 下拉面板全局样式（Teleport 到 body） */
.wf-select-dropdown {
  box-sizing: border-box;
  background: var(--canvas-float-block-default, rgba(32, 33, 39, 0.95));
  backdrop-filter: blur(32px);
  border: 0.5px solid var(--stroke-tertiary, rgba(204, 221, 255, 0.08));
  border-radius: 8px;
  padding: 4px;
  max-height: 200px;
  overflow-y: auto;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

.wf-select-option {
  padding: 6px 8px;
  font-size: 12px;
  color: var(--text-secondary, rgba(224, 245, 255, 0.6));
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.wf-select-option:hover {
  background: var(--bg-block-primary-hover, rgba(204, 221, 255, 0.12));
  color: var(--text-primary, #f5fbff);
}

.wf-select-option.active {
  color: var(--brand-main-default, #00cae0);
}
</style>
