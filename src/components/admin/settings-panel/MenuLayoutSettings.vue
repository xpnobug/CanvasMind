<template>
  <div>
    <SectionTitle
      title="菜单布局"
      tip="选择首页侧栏或顶部导航布局，保存后前台菜单结构随之切换。"
    />
    <div class="admin-settings-thumb-grid">
      <div
        v-for="item in options"
        :key="item.value"
        class="admin-settings-thumb-item"
        style="width: calc(50% - 12px)"
        @click="selectLayout(item.value)"
      >
        <div class="admin-settings-thumb-box" :class="{ 'is-active': layoutMode === item.value }">
          <div :class="item.previewClass" />
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

const appearanceStore = useAdminAppearanceSettingsStore()
const { draft } = appearanceStore

const options = [
  { value: 'side', label: '左侧菜单', previewClass: 'admin-settings-menu-preview-side' },
  { value: 'top', label: '顶部菜单', previewClass: 'admin-settings-menu-preview-top' },
] as const

const layoutMode = computed(() => draft.value.homeSideMenuSettings.layoutMode)

const selectLayout = (mode: 'side' | 'top') => {
  draft.value.homeSideMenuSettings.layoutMode = mode
}
</script>
