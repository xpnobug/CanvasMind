<template>
  <button
    class="admin-icon-button"
    type="button"
    :title="title"
    :aria-label="ariaLabel || title"
    :disabled="disabled"
    @click="emit('click', $event)"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  title?: string
  ariaLabel?: string
  disabled?: boolean
}>(), {
  title: '',
  ariaLabel: '',
  disabled: false,
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()
</script>
