<template>
  <div class="admin-list-frame">
    <div v-if="$slots.before" class="admin-list-frame__before">
      <slot name="before" />
    </div>

    <div v-if="$slots.toolbar" class="admin-list-frame__toolbar">
      <slot name="toolbar" />
    </div>

    <div v-if="$slots.meta" class="admin-list-frame__meta">
      <slot name="meta" />
    </div>

    <div class="admin-list-frame__body">
      <slot />
    </div>

    <div
      v-if="$slots.pagination"
      class="admin-list-frame__pagination admin-list-pagination"
    >
      <slot name="pagination" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'AdminListFrame' })
</script>
