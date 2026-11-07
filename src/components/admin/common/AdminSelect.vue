<template>
  <div
    class="admin-select nodrag"
    :class="{ 'is-open': open, 'is-rich': rich, 'is-sm': size === 'sm' }"
    ref="root"
    @mousedown.stop
    @pointerdown.stop
  >
    <div class="admin-select__trigger" @mousedown.prevent.stop="toggle">
      <div v-if="rich" class="admin-select__value-wrap">
        <span class="admin-select__value">{{ currentLabel }}</span>
        <span v-if="currentDescription" class="admin-select__value-desc">{{ currentDescription }}</span>
      </div>
      <span v-else class="admin-select__value">{{ currentLabel }}</span>
      <svg class="admin-select__arrow" width="10" height="6" viewBox="0 0 10 6" fill="none">
        <path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
    <Teleport to="body">
      <div
        v-if="open"
        class="admin-select__dropdown"
        :class="{ 'is-rich': rich, 'is-sm': size === 'sm' }"
        :style="dropdownStyle"
        ref="dropdown"
        @wheel.stop="onDropdownWheel"
      >
        <div
          v-for="opt in options"
          :key="opt.value"
          class="admin-select__option"
          :class="{ 'is-active': opt.value === modelValue, 'is-rich': rich && opt.description }"
          @mousedown.prevent.stop="select(opt)"
        >
          <span class="admin-select__check" aria-hidden="true">
            <svg v-if="opt.value === modelValue" width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 7.2L5.8 10L11 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </span>
          <span class="admin-select__option-main">
            <span class="admin-select__option-label">{{ opt.label }}</span>
            <span v-if="rich && opt.description" class="admin-select__option-desc">{{ opt.description }}</span>
          </span>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script>
// 模块级共享：所有 AdminSelect 实例共用，点击任意一个时关闭其他
const closeCallbacks = new Set()
const closeOthers = (current) => {
  closeCallbacks.forEach(fn => { if (fn !== current) fn() })
}
</script>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'

const props = defineProps({
  modelValue: [String, Number],
  options: { type: Array, default: () => [] },
  /** 双行选项：label + description */
  rich: { type: Boolean, default: false },
  /** 下拉最小宽度（px），rich 模式常用 */
  dropdownMinWidth: { type: Number, default: 0 },
  /** sm：紧凑高度，对齐能力配置等表单控件 */
  size: { type: String, default: 'default' },
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

const currentDescription = computed(() => {
  const opt = props.options.find(o => o.value === props.modelValue)
  return opt?.description || ''
})

const updatePosition = () => {
  if (!root.value) return
  const rect = root.value.getBoundingClientRect()
  const minWidth = Math.max(rect.width, Number(props.dropdownMinWidth) || 0)
  // 须高于 AdminDialog（mask 50000 / inner 50100~50200），否则 Teleport 到 body 后会被弹层挡住
  dropdownStyle.value = {
    position: 'fixed',
    left: `${rect.left}px`,
    top: `${rect.bottom + 4}px`,
    width: `${minWidth}px`,
    zIndex: 51000,
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
      const active = dropdown.value.querySelector('.is-active')
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

/** 下拉内部滚动不关面板（scroll 在 capture 阶段会先经过 document） */
const onScroll = (e) => {
  if (!open.value || Date.now() <= scrollIgnoreTimer) return
  const target = e.target
  if (dropdown.value && target instanceof Node && dropdown.value.contains(target)) {
    return
  }
  open.value = false
}

/** 滚轮在下拉内时阻止冒泡，避免滚到顶/底后继续带动页面滚动 */
const onDropdownWheel = (e) => {
  const panel = dropdown.value
  if (!panel) return

  e.stopPropagation()

  const goingUp = e.deltaY < 0
  const goingDown = e.deltaY > 0
  const atTop = panel.scrollTop <= 0
  const atBottom = panel.scrollTop + panel.clientHeight >= panel.scrollHeight - 1

  if ((goingUp && atTop) || (goingDown && atBottom)) {
    e.preventDefault()
  }
}

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
/* 触发器：匹配 .admin-input 样式 */
.admin-select {
  position: relative;
  width: 100%;
}

.admin-select__trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-height: 44px;
  box-sizing: border-box;
  padding: 0 14px;
  border: 1px solid var(--line-divider, #00000014);
  border-radius: var(--admin-radius-control);
  background: var(--bg-surface);
  color: var(--text-primary);
  font-size: 14px;
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
}

.admin-select.is-open .admin-select__trigger {
  border-color: var(--brand-main-default);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--brand-main-default) 16%, transparent);
}

.admin-select.is-sm .admin-select__trigger {
  min-height: 32px;
  padding: 0 10px;
  border-radius: var(--admin-radius-control);
  font-size: 12px;
}

.admin-select.is-sm.is-rich .admin-select__trigger {
  min-height: 40px;
  padding-top: 4px;
  padding-bottom: 4px;
}

.admin-select.is-sm.is-open .admin-select__trigger {
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--brand-main-default) 16%, transparent);
}

.admin-select__value {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.admin-select.is-rich .admin-select__trigger {
  min-height: 52px;
  padding-top: 8px;
  padding-bottom: 8px;
}

.admin-select__value-wrap {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}

.admin-select__value-desc {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  color: var(--text-tertiary);
  line-height: 1.3;
}

.admin-select__arrow {
  color: var(--text-tertiary);
  flex-shrink: 0;
  margin-left: 8px;
  transition: transform 0.2s;
}

.admin-select.is-open .admin-select__arrow {
  transform: rotate(180deg);
}

/* 暗色主题适配 */
html[data-theme='dark'] .admin-select__trigger {
  border-color: rgba(224, 245, 255, 0.18);
  background: var(--bg-block-secondary-default);
}

html[data-theme='dark'] .admin-select__trigger:hover {
  border-color: rgba(224, 245, 255, 0.24);
}
</style>

<style>
/* 下拉面板全局样式（Teleport 到 body） */
.admin-select__dropdown {
  box-sizing: border-box;
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid var(--line-divider, #00000014);
  border-radius: var(--admin-radius-control);
  background: var(--bg-surface);
  box-shadow: 0 8px 30px rgba(15, 15, 18, 0.12);
  padding: 4px;
}

.admin-select__dropdown.is-sm {
  border-radius: var(--admin-radius-control);
  padding: 4px;
}

.admin-select__option {
  box-sizing: border-box;
  width: 100%;
  min-height: 36px;
  display: grid;
  grid-template-columns: 16px minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  margin: 0;
  padding: 6px 10px;
  border-radius: var(--admin-radius-control);
  font-size: 14px;
  color: var(--text-primary);
  cursor: pointer;
  transition: background-color 0.15s;
}

.admin-select__dropdown.is-sm .admin-select__option {
  min-height: 32px;
  padding: 4px 8px;
  font-size: 12px;
  border-radius: var(--admin-radius-panel);
}

.admin-select__check {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  color: var(--brand-main-default);
}

.admin-select__option-main {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.admin-select__option:hover {
  background: var(--bg-block-secondary-default);
}

.admin-select__option.is-active {
  background: color-mix(in srgb, var(--brand-main-default) 14%, transparent);
  color: var(--text-primary);
  font-weight: 500;
}

.admin-select__dropdown.is-rich {
  max-height: 420px;
  padding: 6px;
}

.admin-select__option.is-rich {
  align-items: start;
  min-height: auto;
  padding: 10px;
}

.admin-select__option-label {
  line-height: 1.35;
}

.admin-select__option.is-rich .admin-select__option-label {
  font-weight: 600;
}

.admin-select__option.is-rich.is-active .admin-select__option-label {
  color: var(--brand-main-default);
}

.admin-select__option-desc {
  font-size: 12px;
  line-height: 1.45;
  color: var(--text-tertiary);
  font-weight: 400;
  white-space: normal;
}

.admin-select__option.is-rich.is-active .admin-select__option-desc {
  color: color-mix(in srgb, var(--brand-main-default) 72%, var(--text-tertiary));
}

/* 暗色主题 dropdown */
html[data-theme='dark'] .admin-select__dropdown {
  border-color: rgba(224, 245, 255, 0.18);
  background: rgba(32, 33, 39, 0.98);
  backdrop-filter: blur(20px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
}

html[data-theme='dark'] .admin-select__option.is-active {
  background: color-mix(in srgb, var(--brand-main-default) 18%, transparent);
}

/* 亮色主题也增强背景不透明度 */
html[data-theme='light'] .admin-select__dropdown {
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
}
</style>
