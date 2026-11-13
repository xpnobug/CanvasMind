<template>
  <div class="admin-settings-pane">
    <div class="admin-settings-choice-grid admin-settings-choice-grid--3">
      <button
        v-for="item in options"
        :key="item.value"
        type="button"
        class="admin-settings-choice-card"
        :class="{ 'is-active': currentMode === item.value }"
        :aria-pressed="currentMode === item.value"
        @click="selectMode(item.value)"
      >
        <div class="admin-settings-choice-card__preview">
          <div class="admin-settings-theme-preview" :class="item.previewClass" />
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
import { useThemePreferenceStore } from '@/stores/theme-preference'

const appearanceStore = useAdminAppearanceSettingsStore()
const { draft } = appearanceStore

const options = [
  { value: 'light' as const, label: '浅色', description: '固定浅色壳层', previewClass: '' },
  { value: 'dark' as const, label: '深色', description: '固定深色壳层', previewClass: 'is-dark' },
  { value: 'system' as const, label: '跟随系统', description: '随 OS 明暗切换', previewClass: 'is-system' },
]

const currentMode = computed(() => draft.value.globalThemeSettings.modePolicy.defaultMode)
const themeStore = useThemePreferenceStore()

const selectMode = (mode: 'light' | 'dark' | 'system') => {
  draft.value.globalThemeSettings.modePolicy.defaultMode = mode
  if (mode === 'light' || mode === 'dark') {
    themeStore.setThemeMode(mode)
  }
}
</script>
