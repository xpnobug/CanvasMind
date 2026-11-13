<template>
  <div ref="rootRef" class="admin-faceted-filter" :class="{ 'is-open': open, 'is-disabled': disabled }">
    <button
      class="admin-faceted-filter__trigger"
      type="button"
      :disabled="disabled"
      @click="toggle"
    >
      <el-icon class="admin-faceted-filter__icon" :size="14"><CirclePlus /></el-icon>
      <span class="admin-faceted-filter__title">{{ title }}</span>
      <template v-if="selectedOption">
        <span class="admin-faceted-filter__sep" aria-hidden="true" />
        <span class="admin-faceted-filter__badge">{{ selectedOption.label }}</span>
      </template>
    </button>

    <Teleport to="body">
      <div
        v-if="open"
        ref="panelRef"
        class="admin-faceted-filter__panel"
        role="listbox"
        :aria-label="title"
        :style="panelStyle"
        @click.stop
      >
        <div class="admin-faceted-filter__search-wrap">
          <input
            ref="searchRef"
            v-model.trim="query"
            class="admin-faceted-filter__search"
            type="text"
            :placeholder="title"
            @keydown.esc.stop="close"
          >
        </div>
        <div class="admin-faceted-filter__list">
          <button
            v-for="option in filteredOptions"
            :key="option.value"
            class="admin-faceted-filter__option"
            :class="{ 'is-selected': modelValue === option.value && isSelected }"
            type="button"
            role="option"
            :aria-selected="modelValue === option.value && isSelected"
            @click="select(option.value)"
          >
            <span class="admin-faceted-filter__check" aria-hidden="true">
              <el-icon v-if="modelValue === option.value && isSelected" :size="12"><Check /></el-icon>
            </span>
            <span>{{ option.label }}</span>
          </button>
          <div v-if="!filteredOptions.length" class="admin-faceted-filter__empty">未找到结果</div>
        </div>
        <button
          v-if="isSelected"
          class="admin-faceted-filter__clear"
          type="button"
          @click="clear"
        >
          清除筛选
        </button>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Check, CirclePlus } from '@element-plus/icons-vue'

export interface AdminFacetedFilterOption {
  label: string
  value: string
}

const props = withDefaults(defineProps<{
  title: string
  options: AdminFacetedFilterOption[]
  modelValue?: string
  /** 未选中时的值（如 ALL / all / ''），清除与再次点击已选项时回写 */
  emptyValue?: string
  disabled?: boolean
}>(), {
  modelValue: '',
  emptyValue: '',
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  change: [value: string]
}>()

const open = ref(false)
const query = ref('')
const rootRef = ref<HTMLElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)
const searchRef = ref<HTMLInputElement | null>(null)
const panelStyle = ref<Record<string, string>>({})

const isSelected = computed(() => props.modelValue !== props.emptyValue)

const selectedOption = computed(() => {
  if (!isSelected.value) return null
  return props.options.find((item) => item.value === props.modelValue) || null
})

const filteredOptions = computed(() => {
  const keyword = query.value.toLowerCase()
  if (!keyword) return props.options
  return props.options.filter((item) => item.label.toLowerCase().includes(keyword))
})

const updatePanelPosition = () => {
  const trigger = rootRef.value
  if (!trigger) return
  const rect = trigger.getBoundingClientRect()
  const width = 200
  const left = Math.min(rect.left, window.innerWidth - width - 8)
  panelStyle.value = {
    position: 'fixed',
    top: `${Math.round(rect.bottom + 6)}px`,
    left: `${Math.round(Math.max(8, left))}px`,
    width: `${width}px`,
  }
}

const close = () => {
  open.value = false
  query.value = ''
}

const toggle = () => {
  if (props.disabled) return
  open.value = !open.value
}

const select = (value: string) => {
  const next = props.modelValue === value ? props.emptyValue : value
  emit('update:modelValue', next)
  emit('change', next)
  close()
}

const clear = () => {
  emit('update:modelValue', props.emptyValue)
  emit('change', props.emptyValue)
  close()
}

const handlePointerDown = (event: PointerEvent) => {
  if (!open.value) return
  const target = event.target as Node
  if (rootRef.value?.contains(target) || panelRef.value?.contains(target)) {
    return
  }
  close()
}

watch(open, async (isOpen) => {
  if (!isOpen) return
  updatePanelPosition()
  await nextTick()
  updatePanelPosition()
  searchRef.value?.focus()
})

onMounted(() => {
  document.addEventListener('pointerdown', handlePointerDown)
  window.addEventListener('resize', updatePanelPosition)
  window.addEventListener('scroll', updatePanelPosition, true)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handlePointerDown)
  window.removeEventListener('resize', updatePanelPosition)
  window.removeEventListener('scroll', updatePanelPosition, true)
})
</script>

<style scoped>
.admin-faceted-filter {
  position: relative;
  display: inline-flex;
  vertical-align: middle;
}

.admin-faceted-filter.is-disabled {
  opacity: 0.55;
  pointer-events: none;
}

.admin-faceted-filter__trigger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  min-height: 32px;
  padding: 0 10px;
  border: 1px dashed var(--line-divider, #00000014);
  border-radius: var(--admin-radius-control);
  background: var(--bg-surface);
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 500;
  line-height: 1;
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(15, 15, 18, 0.04);
  transition: border-color 0.15s ease, color 0.15s ease, background 0.15s ease;
}

.admin-faceted-filter__trigger:hover {
  background: var(--bg-block-secondary-default);
}

.admin-faceted-filter.is-open .admin-faceted-filter__trigger {
  background: var(--bg-block-secondary-default);
}

.admin-faceted-filter__icon {
  color: var(--text-secondary);
}

.admin-faceted-filter__title {
  white-space: nowrap;
}

.admin-faceted-filter__sep {
  width: 1px;
  height: 14px;
  margin: 0 2px;
  background: var(--line-divider, #00000014);
  flex-shrink: 0;
}

.admin-faceted-filter__badge {
  display: inline-flex;
  align-items: center;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 1px 6px;
  border-radius: var(--admin-radius-control);
  background: var(--bg-block-secondary-default);
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 400;
}
</style>

<style>
/* Teleport 到 body，需非 scoped */
.admin-faceted-filter__panel {
  z-index: 2000;
  padding: 0;
  overflow: hidden;
  border: 1px solid var(--line-divider, #00000014);
  border-radius: var(--admin-radius-control);
  background: var(--bg-surface);
  box-shadow: 0 12px 32px rgba(15, 15, 18, 0.16);
  box-sizing: border-box;
}

.admin-faceted-filter__search-wrap {
  padding: 8px 8px 4px;
}

.admin-faceted-filter__search {
  box-sizing: border-box;
  width: 100%;
  height: 32px;
  min-height: 32px;
  padding: 0 10px;
  border: 1px solid var(--line-divider, #00000014);
  border-radius: var(--admin-radius-control);
  background: var(--bg-surface);
  color: var(--text-primary);
  font-size: 13px;
  outline: none;
}

.admin-faceted-filter__search:focus {
  border-color: var(--brand-main-default);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--brand-main-default) 16%, transparent);
}

.admin-faceted-filter__list {
  max-height: 220px;
  padding: 4px;
  overflow: auto;
}

.admin-faceted-filter__option {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-height: 32px;
  padding: 0 8px;
  border: 0;
  border-radius: var(--admin-radius-panel);
  background: transparent;
  color: var(--text-primary);
  font-size: 13px;
  text-align: left;
  cursor: pointer;
}

.admin-faceted-filter__option:hover {
  background: color-mix(in srgb, var(--brand-main-default) 8%, var(--bg-surface));
}

.admin-faceted-filter__check {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border: 1px solid var(--line-divider, #00000014);
  border-radius: var(--admin-radius-control);
  color: var(--bg-surface);
  flex-shrink: 0;
}

.admin-faceted-filter__option.is-selected .admin-faceted-filter__check {
  border-color: var(--brand-main-default);
  background: var(--brand-main-default);
}

.admin-faceted-filter__empty {
  padding: 16px 8px;
  color: var(--text-tertiary);
  font-size: 12px;
  text-align: center;
}

.admin-faceted-filter__clear {
  width: 100%;
  padding: 10px;
  border: 0;
  border-top: 1px solid var(--line-divider, #00000014);
  background: transparent;
  color: var(--text-secondary);
  font-size: 13px;
  text-align: center;
  cursor: pointer;
}

.admin-faceted-filter__clear:hover {
  color: var(--text-primary);
  background: color-mix(in srgb, var(--bg-block-secondary-default) 60%, transparent);
}
</style>
