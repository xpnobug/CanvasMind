<template>
  <div class="admin-settings-color-field">
    <label class="admin-settings-color-field__label">{{ label }}</label>
    <div class="admin-settings-color-field__inputs">
      <input
        v-model.trim="modelValue"
        class="admin-settings-color-field__text"
        type="text"
        :placeholder="placeholder"
      >
      <input
        v-model="modelValue"
        class="admin-settings-color-field__picker"
        type="color"
      >
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label: string
  placeholder?: string
}>()

const modelValue = defineModel<string>({ required: true })
</script>
