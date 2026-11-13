<template>
  <SettingDrawer v-model="drawerVisible" @close="appearanceStore.closeDrawer">
    <div class="admin-settings-shell">
      <header class="admin-settings-shell__top">
        <div class="admin-settings-shell__title-block">
          <h2 class="admin-settings-shell__title">外观设置</h2>
          <p class="admin-settings-shell__subtitle">
            {{ activeSection?.description }}
          </p>
        </div>
        <button
          type="button"
          class="admin-settings-panel__close"
          aria-label="关闭设置"
          @click="appearanceStore.closeDrawer"
        >
          ✕
        </button>
      </header>

      <div v-if="loading" class="admin-settings-panel__loading">加载中...</div>

      <template v-else>
        <div class="admin-settings-shell__main">
          <nav
            class="admin-settings-shell__nav"
            aria-label="外观设置分类"
          >
            <button
              v-for="section in sections"
              :key="section.id"
              type="button"
              class="admin-settings-shell__nav-item"
              :class="{ 'is-active': activeSectionId === section.id }"
              :aria-current="activeSectionId === section.id ? 'page' : undefined"
              @click="activeSectionId = section.id"
            >
              {{ section.label }}
            </button>
          </nav>

          <div class="admin-settings-shell__content">
            <div class="admin-settings-shell__pane">
              <ThemeModeSettings v-if="activeSectionId === 'mode'" />
              <SiteThemeColorSettings v-else-if="activeSectionId === 'colors'" />
              <UserThemePresetPolicySettings v-else-if="activeSectionId === 'presets'" />
              <MenuLayoutSettings v-else-if="activeSectionId === 'menu'" />
              <BoxStyleSettings v-else-if="activeSectionId === 'surface'" />
              <PageTransitionSettings v-else-if="activeSectionId === 'motion'" />
            </div>
          </div>
        </div>

        <SettingFooter />
      </template>
    </div>
  </SettingDrawer>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import SettingDrawer from './SettingDrawer.vue'
import ThemeModeSettings from './ThemeModeSettings.vue'
import SiteThemeColorSettings from './SiteThemeColorSettings.vue'
import UserThemePresetPolicySettings from './UserThemePresetPolicySettings.vue'
import MenuLayoutSettings from './MenuLayoutSettings.vue'
import BoxStyleSettings from './BoxStyleSettings.vue'
import PageTransitionSettings from './PageTransitionSettings.vue'
import SettingFooter from './SettingFooter.vue'
import { useAdminAppearanceSettingsStore } from '@/stores/admin-appearance-settings'
import './admin-settings-panel.css'

defineOptions({ name: 'AdminSettingsPanel' })

type AppearanceSectionId =
  | 'mode'
  | 'colors'
  | 'presets'
  | 'menu'
  | 'surface'
  | 'motion'

type AppearanceSection = {
  id: AppearanceSectionId
  label: string
  description: string
}

/** 一块功能一屏：左侧导航切换，避免竖向堆叠过长 */
const sections: AppearanceSection[] = [
  { id: 'mode', label: '主题模式', description: '默认明暗与系统跟随策略' },
  { id: 'colors', label: '站点配色', description: '品牌色、语义色与深浅背景体系' },
  { id: 'presets', label: '用户预设', description: '管理前台用户可选的内置预设与导入能力' },
  { id: 'menu', label: '菜单布局', description: '侧栏展开形态与展示策略' },
  { id: 'surface', label: '圆角与表面', description: '卡片圆角等表面参数' },
  { id: 'motion', label: '页面动画', description: '路由过渡与动效偏好' },
]

const appearanceStore = useAdminAppearanceSettingsStore()
const { drawerVisible, loading } = appearanceStore

const activeSectionId = ref<AppearanceSectionId>('mode')

const activeSection = computed(() => (
  sections.find(item => item.id === activeSectionId.value) || sections[0]
))

// 每次打开抽屉回到第一项，降低「上次停在很深分类」的迷失感
watch(drawerVisible, (open) => {
  if (open) {
    activeSectionId.value = 'mode'
  }
})
</script>

<style scoped>
.admin-settings-panel__loading {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 0;
  text-align: center;
  font-size: 13px;
  color: var(--text-secondary, #64748b);
}
</style>
