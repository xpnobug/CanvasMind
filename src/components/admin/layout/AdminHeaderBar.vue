<template>
  <header class="admin-header-bar">
    <div class="admin-header-bar__toolbar admin-header-bar__toolbar--bordered">
      <div class="admin-header-bar__left">
        <button
          class="admin-header__menu"
          type="button"
          :aria-label="isMobile ? '打开侧边栏' : '折叠侧边栏'"
          :aria-expanded="isMobile ? mobileSidebarOpen : undefined"
          aria-controls="admin-sidebar"
          @click="toggleSidebar"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <AdminIconButton
          class="admin-header-bar__refresh"
          title="刷新当前页"
          aria-label="刷新当前页"
          :disabled="refreshDisabled"
          @click="refreshPage"
        >
          <el-icon><Refresh /></el-icon>
        </AdminIconButton>

        <AdminBreadcrumb class="admin-header-bar__breadcrumb" :items="breadcrumbItems" />
      </div>

      <div class="admin-header-bar__right">
        <button
          class="admin-header-search-trigger"
          type="button"
          @click="searchVisible = true"
        >
          <el-icon class="admin-header-search-trigger__icon"><Search /></el-icon>
          <span class="admin-header-search-trigger__label">搜索</span>
          <span class="admin-header-search-trigger__kbd">
            <span v-if="isMac">⌘</span>
            <span v-else>Ctrl</span>
            <span>K</span>
          </span>
        </button>

        <AdminIconButton
          v-if="themeToggleVisible"
          :title="isDark ? '切换到浅色模式' : '切换到深色模式'"
          :aria-label="isDark ? '切换到浅色模式' : '切换到深色模式'"
          @click="toggleTheme"
        >
          <ThemeModeIcon :mode="isDark ? 'light' : 'dark'" size="md" />
        </AdminIconButton>

        <AdminIconButton
          v-if="canManageAppearanceSettings"
          title="外观设置"
          aria-label="打开外观设置"
          @click="openAppearanceSettings"
        >
          <el-icon><Setting /></el-icon>
        </AdminIconButton>

        <AdminUserMenu />
      </div>
    </div>

    <AdminWorkTabBar />
    <AdminNavSearch v-model:visible="searchVisible" />
  </header>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { Refresh, Search, Setting } from '@element-plus/icons-vue'
import ThemeModeIcon from '@/components/common/ThemeModeIcon.vue'
import { useAdminAppearanceSettingsStore } from '@/stores/admin-appearance-settings'
import { useAuthStore } from '@/stores/auth'
import AdminBreadcrumb from './AdminBreadcrumb.vue'
import AdminIconButton from './AdminIconButton.vue'
import AdminNavSearch from './AdminNavSearch.vue'
import AdminUserMenu from './AdminUserMenu.vue'
import AdminWorkTabBar from './AdminWorkTabBar.vue'
import { useAdminLayoutContext } from './useAdminLayout'
import { useThemePreferenceStore } from '@/stores/theme-preference'
import type { AdminBreadcrumbItem } from './useAdminBreadcrumb'

defineProps<{
  breadcrumbItems: AdminBreadcrumbItem[]
  refreshDisabled?: boolean
}>()

const { toggleSidebar, refreshPage, isMobile, mobileSidebarOpen } = useAdminLayoutContext()
const themeStore = useThemePreferenceStore()
const authStore = useAuthStore()
const appearanceStore = useAdminAppearanceSettingsStore()
const canManageAppearanceSettings = computed(() => authStore.isAdmin.value)
const searchVisible = ref(false)
const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform)

const isDark = computed(() => themeStore.currentTheme.value === 'dark')
const themeToggleVisible = computed(() => themeStore.allowUserToggle.value)

const toggleTheme = () => {
  themeStore.setThemeMode(isDark.value ? 'light' : 'dark')
}

const openAppearanceSettings = () => {
  void appearanceStore.openDrawer()
}

const handleGlobalKeydown = (event: KeyboardEvent) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault()
    searchVisible.value = true
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleGlobalKeydown)
})
</script>
