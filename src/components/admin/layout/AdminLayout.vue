<template>
  <AdminShell
    :is-collapsed="isDesktopCollapsed"
    :is-mobile="isMobile"
    :is-mobile-open="mobileSidebarOpen"
    @close-mobile-sidebar="closeMobileSidebar"
  >
    <template #sidebar>
      <AdminSidebar />
    </template>
    <template #header>
      <AdminHeaderBar
        :breadcrumb-items="breadcrumbItems"
        :refresh-disabled="refreshDisabled"
      />
    </template>
    <AdminPageContent />
    <AdminSettingsPanel />
  </AdminShell>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import AdminShell from './AdminShell.vue'
import AdminHeaderBar from './AdminHeaderBar.vue'
import AdminPageContent from './AdminPageContent.vue'
import AdminSidebar from './AdminSidebar.vue'
import AdminSettingsPanel from '@/components/admin/settings-panel/index.vue'
import { useAdminAppearanceSettingsStore } from '@/stores/admin-appearance-settings'
import { useAuthStore } from '@/stores/auth'
import { useAdminWorktabStore } from '@/stores/admin-worktab'
// 先保留公开版页面样式，再叠 Pro 壳层样式覆盖顶栏/工作标签布局
import '@/components/admin/admin.css'
import '@/components/admin/styles/admin-shell-base.css'
import 'remixicon/fonts/remixicon.css'
import '@/components/admin/styles/admin-primitives.css'
import '@/components/admin/styles/admin-shell-responsive.css'
import { createAdminLayoutContext, provideAdminLayoutContext } from './useAdminLayout'
import { getAdminNavItemIcon } from './admin-nav'
import { useAdminBreadcrumb } from './useAdminBreadcrumb'
import { useAdminNav } from './useAdminNav'

const route = useRoute()
const layoutContext = createAdminLayoutContext()

provideAdminLayoutContext({
  sidebarCollapsed: layoutContext.sidebarCollapsed,
  mobileSidebarOpen: layoutContext.mobileSidebarOpen,
  isMobile: layoutContext.isMobile,
  contentRefreshTick: layoutContext.contentRefreshTick,
  suppressPageIntroText: layoutContext.suppressPageIntroText,
  toggleSidebar: layoutContext.toggleSidebar,
  toggleMobileSidebar: layoutContext.toggleMobileSidebar,
  closeMobileSidebar: layoutContext.closeMobileSidebar,
  refreshPage: layoutContext.refreshPage,
})

const { items: breadcrumbItems, pageTitle } = useAdminBreadcrumb()
const { matchNavItemByPath } = useAdminNav()
const worktabStore = useAdminWorktabStore()
const authStore = useAuthStore()
const appearanceStore = useAdminAppearanceSettingsStore()

watch(
  () => [route.path, pageTitle.value] as const,
  () => {
    const navItem = matchNavItemByPath(route.path)
    const icon = navItem ? getAdminNavItemIcon(navItem) : undefined
    worktabStore.openFromRoute(route, pageTitle.value, icon)
  },
  { immediate: true },
)

watch(
  () => [authStore.sessionInitialized.value, authStore.isAdmin.value] as const,
  () => {
    if (!authStore.sessionInitialized.value) {
      return
    }
    worktabStore.syncWorktabsWithAccess()
  },
  { immediate: true },
)

const refreshDisabled = computed(() => route.meta.allowAdminRefresh === false)
const isDesktopCollapsed = computed(() => !layoutContext.isMobile.value && layoutContext.sidebarCollapsed.value)
const isMobile = computed(() => layoutContext.isMobile.value)
const mobileSidebarOpen = computed(() => layoutContext.mobileSidebarOpen.value)
const closeMobileSidebar = layoutContext.closeMobileSidebar

const handleResize = () => {
  layoutContext.syncViewportState()
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key !== 'Escape') {
    return
  }
  if (!layoutContext.isMobile.value || !layoutContext.mobileSidebarOpen.value) {
    return
  }
  layoutContext.closeMobileSidebar()
}

onMounted(() => {
  handleResize()
  window.addEventListener('resize', handleResize)
  window.addEventListener('keydown', handleKeydown)
  if (authStore.isAdmin.value) {
    void appearanceStore.load()
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('keydown', handleKeydown)
})
</script>
