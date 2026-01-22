<template>
  <button 
    class="lv-btn lv-btn-secondary lv-btn-size-default lv-btn-shape-square button-lc3WzE toolbar-button-FhFnQ_ switch-button-GPRaGT" 
    :class="{ 'checked-SqLqYu': checked }"
    type="button"
  >
    <slot name="icon"></slot>
    <span>{{ label }}</span>
  </button>
</template>

<script setup>
defineProps({
  label: {
    type: String,
    required: true
  },
  checked: {
    type: Boolean,
    default: false
  },
  icon: {
    type: String,
    default: ''
  }
})
</script>
