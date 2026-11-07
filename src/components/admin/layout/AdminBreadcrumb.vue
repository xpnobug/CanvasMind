<template>
  <nav class="admin-breadcrumb" aria-label="面包屑">
    <ol class="admin-breadcrumb__list">
      <li
        v-for="(item, index) in items"
        :key="`${item.label}-${index}`"
        class="admin-breadcrumb__item"
      >
        <span v-if="index > 0" class="admin-breadcrumb__sep" aria-hidden="true">/</span>
        <RouterLink
          v-if="item.to && index < items.length - 1"
          class="admin-breadcrumb__link"
          :to="item.to"
        >
          {{ item.label }}
        </RouterLink>
        <span
          v-else
          class="admin-breadcrumb__text"
          :class="{ 'is-current': index === items.length - 1 }"
        >
          {{ item.label }}
        </span>
      </li>
    </ol>
  </nav>
</template>

<script setup lang="ts">
import type { AdminBreadcrumbItem } from './useAdminBreadcrumb'

defineProps<{
  items: AdminBreadcrumbItem[]
}>()
</script>
