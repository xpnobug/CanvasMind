<template>
  <SettingDrawer v-model="drawerVisible" @close="appearanceStore.closeDrawer">
    <div class="admin-settings-panel__header">
      <button
        type="button"
        class="admin-settings-panel__close"
        aria-label="关闭设置"
        @click="appearanceStore.closeDrawer"
      >
        ✕
      </button>
    </div>

    <div v-if="loading" class="admin-settings-panel__loading">加载中...</div>

    <template v-else>
      <ThemeModeSettings />
      <BackgroundSettings />
      <MenuLayoutSettings />
      <BrandColorSettings />
      <BoxStyleSettings />
      <!-- 公开版尚无 uiMotionSettings，页面过渡暂不展示 -->
      <SettingFooter />
    </template>
  </SettingDrawer>
</template>

<script setup lang="ts">
import SettingDrawer from './SettingDrawer.vue'
import ThemeModeSettings from './ThemeModeSettings.vue'
import BackgroundSettings from './BackgroundSettings.vue'
import MenuLayoutSettings from './MenuLayoutSettings.vue'
import BrandColorSettings from './BrandColorSettings.vue'
import BoxStyleSettings from './BoxStyleSettings.vue'
import SettingFooter from './SettingFooter.vue'
import { useAdminAppearanceSettingsStore } from '@/stores/admin-appearance-settings'
import './admin-settings-panel.css'

defineOptions({ name: 'AdminSettingsPanel' })

const appearanceStore = useAdminAppearanceSettingsStore()
const { drawerVisible, loading } = appearanceStore
</script>

<style scoped>
.admin-settings-panel__loading {
  padding: 24px 0;
  text-align: center;
  font-size: 13px;
  color: var(--text-secondary, #64748b);
}
</style>
