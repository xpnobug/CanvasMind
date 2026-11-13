<template>
  <div class="admin-dashboard-trend-action" :class="rootClass">
    <svg
      v-if="isUp"
      class="admin-dashboard-trend-action__icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
    <svg
      v-else
      class="admin-dashboard-trend-action__icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <polyline points="22 17 13.5 8.5 8.5 13.5 2 7" />
      <polyline points="16 17 22 17 22 11" />
    </svg>
    <div class="admin-dashboard-trend-action__copy">
      <span>{{ prefix }}{{ directionLabel }}</span>
      <span class="admin-dashboard-trend-action__value">{{ absText }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  deltaPercent?: number | null
  prefix?: string
  positiveTone?: 'success' | 'info'
}>(), {
  deltaPercent: null,
  prefix: '同比昨天',
  positiveTone: 'success',
})

const isUp = computed(() => (props.deltaPercent ?? 0) >= 0)

const directionLabel = computed(() => {
  if (props.deltaPercent === null || props.deltaPercent === undefined) {
    return ''
  }
  return isUp.value ? '增长' : '下降'
})

const absText = computed(() => {
  if (props.deltaPercent === null || props.deltaPercent === undefined) {
    return '—'
  }
  return `${Math.abs(props.deltaPercent).toFixed(1)}%`
})

const rootClass = computed(() => {
  if (props.deltaPercent === null || props.deltaPercent === undefined) {
    return 'is-neutral'
  }
  if (isUp.value) {
    return props.positiveTone === 'info' ? 'is-info' : 'is-up'
  }
  return 'is-down'
})
</script>
