<template>
  <div class="admin-settings-subsection__head">
    <span class="admin-settings-subsection__title">{{ title }}</span>
    <SettingHelpTip v-if="tip" :content="tip" />
  </div>
</template>

<script setup lang="ts">
import SettingHelpTip from './SettingHelpTip.vue'

defineProps<{
  title: string
  tip?: string
}>()
</script>
