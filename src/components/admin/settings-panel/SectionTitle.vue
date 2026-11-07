<template>
  <p class="admin-settings-section-title">
    <span class="admin-settings-section-title__inner">
      {{ title }}
      <SettingHelpTip v-if="tip" :content="tip" />
    </span>
  </p>
</template>

<script setup lang="ts">
import SettingHelpTip from './SettingHelpTip.vue'

defineProps<{
  title: string
  tip?: string
}>()
</script>
