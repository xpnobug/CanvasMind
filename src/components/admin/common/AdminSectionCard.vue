<template>
  <div class="admin-card" :class="[cardClass, { 'admin-section-card--compact': compact }]">
    <div v-if="hasHeader" class="admin-card__header">
      <div>
        <h4 v-if="title" class="admin-card__title">{{ title }}</h4>
        <div v-if="description" class="admin-card__desc">{{ description }}</div>
      </div>
      <div v-if="$slots.actions" class="admin-card__actions">
        <slot name="actions" />
      </div>
    </div>
    <div class="admin-card__content">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, useSlots } from 'vue'

const props = withDefaults(defineProps<{
  title?: string
  description?: string
  cardClass?: string | string[] | Record<string, boolean>
  compact?: boolean
}>(), {
  title: '',
  description: '',
  cardClass: '',
  compact: false,
})

const slots = useSlots()
const hasHeader = computed(() => Boolean(props.title || props.description || slots.actions))
</script>
