<template>
  <section class="admin-page">
    <div class="admin-page__container">
      <div v-if="!shouldHideIntro" class="admin-page__intro">
        <div>
          <h3 class="admin-page__intro-title">{{ title }}</h3>
          <div class="admin-page__intro-text">{{ description }}</div>
        </div>
        <div v-if="$slots.actions" class="admin-page__actions">
          <slot name="actions" />
        </div>
      </div>
      <!-- 顶栏已展示标题时，仍保留操作区挂载点，避免页面动作丢失 -->
      <div v-else-if="$slots.actions" class="admin-page__actions admin-page__actions--standalone">
        <slot name="actions" />
      </div>

      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAdminLayoutContext } from './useAdminLayout'

const props = withDefaults(defineProps<{
  title?: string
  description?: string
  hideIntro?: boolean
}>(), {
  title: '',
  description: '',
  hideIntro: false,
})

const { suppressPageIntroText } = useAdminLayoutContext()

const shouldHideIntro = computed(() => props.hideIntro || suppressPageIntroText.value)
</script>
