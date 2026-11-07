<template>
  <div class="admin-layout" :class="{ 'is-collapsed': isCollapsed, 'is-mobile-open': isMobileOpen }">
    <slot name="sidebar" />
    <button
      v-if="isMobile && isMobileOpen"
      class="admin-layout__mask"
      type="button"
      aria-label="关闭侧边栏"
      @click="emit('close-mobile-sidebar')"
    />
    <main class="admin-main" role="main">
      <slot name="header" />
      <section class="admin-layout__content">
        <slot />
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  isCollapsed: boolean
  isMobile: boolean
  isMobileOpen: boolean
}>()

const emit = defineEmits<{
  'close-mobile-sidebar': []
}>()
</script>
