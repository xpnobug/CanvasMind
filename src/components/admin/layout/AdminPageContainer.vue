<template>
  <section class="admin-page" :class="{ 'admin-page--compact': compact }">
    <div class="admin-page__container">
      <div
        v-if="showIntro"
        class="admin-page__intro"
        :class="{ 'admin-page__intro--sticky-actions': stickyActions, 'admin-page__intro--actions-only': showActionsOnly }"
      >
        <div v-if="showIntroText">
          <h3 class="admin-page__intro-title">{{ title }}</h3>
          <div v-if="description" class="admin-page__intro-text">{{ description }}</div>
        </div>
        <div v-if="$slots.actions" class="admin-page__actions">
          <slot name="actions" />
        </div>
      </div>

      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, useSlots } from 'vue'
import { useAdminLayoutContext } from './useAdminLayout'

const props = withDefaults(defineProps<{
  title?: string
  description?: string
  hideIntro?: boolean
  compact?: boolean
  stickyActions?: boolean
}>(), {
  title: '',
  description: '',
  hideIntro: false,
  compact: false,
  stickyActions: false,
})

const slots = useSlots()
const { suppressPageIntroText } = useAdminLayoutContext()

const showIntroText = computed(() => {
  if (props.hideIntro || suppressPageIntroText.value) {
    return false
  }

  return Boolean(props.title || props.description)
})

const showActionsOnly = computed(() => !showIntroText.value && Boolean(slots.actions))

const showIntro = computed(() => showIntroText.value || Boolean(slots.actions))
</script>

<style scoped>
.admin-page--compact {
  padding: 20px 18px;
}

.admin-page--compact :deep(.admin-page__container) {
  gap: 16px;
}

.admin-page__intro--sticky-actions {
  position: sticky;
  top: 0;
  z-index: 6;
  padding-bottom: 12px;
  background: color-mix(in srgb, var(--bg-body) 92%, transparent);
  backdrop-filter: blur(10px);
}

.admin-page__intro--actions-only {
  justify-content: flex-end;
}
</style>
