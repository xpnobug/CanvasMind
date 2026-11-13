<template>
  <div class="admin-dashboard-data-card" :class="cardClass">
    <div class="admin-dashboard-data-card__header">
      <div class="admin-dashboard-data-card__heading">
        <h4 class="admin-dashboard-data-card__title">{{ title }}</h4>
        <p v-if="description" class="admin-dashboard-data-card__desc">
          <svg
            class="admin-dashboard-data-card__info"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
          <span>{{ description }}</span>
        </p>
      </div>
      <div v-if="$slots.action" class="admin-dashboard-data-card__action">
        <slot name="action" />
      </div>
    </div>
    <div class="admin-dashboard-data-card__content" :class="contentClass">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  title: string
  description?: string
  cardClass?: string
  contentClass?: string
}>(), {
  description: '',
  cardClass: '',
  contentClass: '',
})
</script>
