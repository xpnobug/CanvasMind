<template>
  <div class="admin-settings-pane admin-settings-pane--theme-colors">
    <BrandColorSettings />
    <BackgroundSettings />
  </div>
</template>

<script setup lang="ts">
import BrandColorSettings from './BrandColorSettings.vue'
import BackgroundSettings from './BackgroundSettings.vue'
</script>
