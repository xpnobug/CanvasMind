<template>
  <div class="admin-settings-pane">
    <div class="admin-settings-choice-grid admin-settings-choice-grid--2">
      <button
        v-for="item in options"
        :key="item.value"
        type="button"
        class="admin-settings-choice-card"
        :class="{ 'is-active': layoutMode === item.value }"
        :aria-pressed="layoutMode === item.value"
        @click="selectLayout(item.value)"
      >
        <div class="admin-settings-choice-card__preview admin-settings-choice-card__preview--tall">
          <div :class="item.previewClass" />
        </div>
        <div class="admin-settings-choice-card__meta">
          <span class="admin-settings-choice-card__label">{{ item.label }}</span>
          <span class="admin-settings-choice-card__desc">{{ item.description }}</span>
        </div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAdminAppearanceSettingsStore } from '@/stores/admin-appearance-settings'

const appearanceStore = useAdminAppearanceSettingsStore()
const { draft } = appearanceStore

const options = [
  {
    value: 'side' as const,
    label: '左侧菜单',
    description: '侧栏导航，适合桌面工作台',
    previewClass: 'admin-settings-menu-preview-side',
  },
  {
    value: 'top' as const,
    label: '顶部菜单',
    description: '顶栏导航，内容区更宽',
    previewClass: 'admin-settings-menu-preview-top',
  },
]

const layoutMode = computed(() => draft.value.homeSideMenuSettings.layoutMode)

const selectLayout = (mode: 'side' | 'top') => {
  draft.value.homeSideMenuSettings.layoutMode = mode
}
</script>
