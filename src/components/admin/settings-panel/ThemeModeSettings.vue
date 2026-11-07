<template>
  <div>
    <SectionTitle
      title="主题风格"
      :tip="THEME_MODE_TIP"
    />
    <div class="admin-settings-thumb-grid">
      <div
        v-for="item in options"
        :key="item.value"
        class="admin-settings-thumb-item"
        @click="selectMode(item.value)"
      >
        <div class="admin-settings-thumb-box" :class="{ 'is-active': currentMode === item.value }">
          <div class="admin-settings-theme-preview" :class="item.previewClass" />
        </div>
        <p class="admin-settings-thumb-label">{{ item.label }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import SectionTitle from './SectionTitle.vue'
import { useAdminAppearanceSettingsStore } from '@/stores/admin-appearance-settings'
import { useThemePreferenceStore } from '@/stores/theme-preference'

const THEME_MODE_TIP = [
  '配色唯一入口：品牌色、背景、圆角均在此修改并保存。',
  '「主题配置」页仅用于预览首页 Banner 与侧栏菜单布局。',
  '设置新用户默认明暗模式；用户仍可在前台自行切换（若允许）。',
].join('\n')

const appearanceStore = useAdminAppearanceSettingsStore()
const { draft } = appearanceStore

const options = [
  { value: 'light', label: '浅色', previewClass: '' },
  { value: 'dark', label: '深色', previewClass: 'is-dark' },
  { value: 'system', label: '系统', previewClass: 'is-system' },
] as const

const currentMode = computed(() => draft.value.globalThemeSettings.modePolicy.defaultMode)
const themeStore = useThemePreferenceStore()

const selectMode = (mode: 'light' | 'dark' | 'system') => {
  draft.value.globalThemeSettings.modePolicy.defaultMode = mode
  if (mode === 'light' || mode === 'dark') {
    themeStore.setThemeMode(mode)
  }
}
</script>
