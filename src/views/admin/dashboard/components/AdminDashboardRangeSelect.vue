<template>
  <div
    ref="rootRef"
    class="admin-dashboard-range-select"
    :class="{ 'is-open': open }"
  >
    <button
      class="admin-dashboard-range-select__trigger"
      type="button"
      :aria-expanded="open"
      :aria-label="ariaLabel"
      @click="toggle"
    >
      <span class="admin-dashboard-range-select__value">{{ currentLabel }}</span>
      <svg
        class="admin-dashboard-range-select__chevron"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </button>

    <Teleport to="body">
      <div
        v-if="open"
        ref="panelRef"
        class="admin-dashboard-range-select__panel"
        :style="panelStyle"
        role="listbox"
        :aria-label="ariaLabel"
      >
        <button
          v-for="option in options"
          :key="option.value"
          class="admin-dashboard-range-select__option"
          :class="{ 'is-active': option.value === modelValue }"
          type="button"
          role="option"
          :aria-selected="option.value === modelValue"
          @click="select(option.value)"
        >
          <span class="admin-dashboard-range-select__check" aria-hidden="true">
            <svg
              v-if="option.value === modelValue"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </span>
          <span class="admin-dashboard-range-select__option-label">{{ option.label }}</span>
        </button>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

export interface DashboardRangeOption {
  value: number
  label: string
}

const props = withDefaults(defineProps<{
  modelValue: number
  options?: DashboardRangeOption[]
  ariaLabel?: string
}>(), {
  options: () => [
    { value: 7, label: '最近 7 天' },
    { value: 15, label: '最近 15 天' },
    { value: 30, label: '最近 30 天' },
  ],
  ariaLabel: '选择时间范围',
})

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const open = ref(false)
const rootRef = ref<HTMLElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)
const panelStyle = ref<Record<string, string>>({})

const currentLabel = computed(() => (
  props.options.find(item => item.value === props.modelValue)?.label
  || props.options[0]?.label
  || ''
))

const updatePosition = () => {
  if (!rootRef.value) {
    return
  }
  const rect = rootRef.value.getBoundingClientRect()
  const width = Math.max(rect.width, 132)
  panelStyle.value = {
    position: 'fixed',
    top: `${rect.bottom + 6}px`,
    left: `${Math.min(rect.left, window.innerWidth - width - 8)}px`,
    minWidth: `${width}px`,
    zIndex: '10050',
  }
}

const toggle = () => {
  open.value = !open.value
}

const select = (value: number) => {
  emit('update:modelValue', value)
  open.value = false
}

const onPointerDown = (event: MouseEvent) => {
  const target = event.target as Node | null
  if (!target) {
    return
  }
  if (rootRef.value?.contains(target) || panelRef.value?.contains(target)) {
    return
  }
  open.value = false
}

const onScroll = (event: Event) => {
  if (!open.value) {
    return
  }
  const target = event.target
  if (panelRef.value && target instanceof Node && panelRef.value.contains(target)) {
    return
  }
  open.value = false
}

watch(open, async (value) => {
  if (!value) {
    return
  }
  updatePosition()
  await nextTick()
  updatePosition()
})

onMounted(() => {
  document.addEventListener('mousedown', onPointerDown)
  document.addEventListener('scroll', onScroll, true)
  window.addEventListener('resize', updatePosition)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onPointerDown)
  document.removeEventListener('scroll', onScroll, true)
  window.removeEventListener('resize', updatePosition)
})
</script>
