<template>
  <aside
    id="admin-sidebar"
    class="admin-sidebar"
    :class="{ 'is-collapsed': isDesktopCollapsed, 'is-mobile-open': mobileSidebarOpen }"
    aria-label="后台主导航"
  >
    <div class="admin-sidebar__brand">
      <div class="admin-sidebar__brand-row">
        <span v-if="isDesktopCollapsed" class="admin-sidebar__collapsed-mark" aria-hidden="true">
          <i class="ri-admin-line" />
        </span>
        <h1 v-if="!isDesktopCollapsed" class="admin-sidebar__title">{{ adminBrandTitle }}</h1>
      </div>
      <div v-if="!isDesktopCollapsed" class="admin-sidebar__subtitle">管理台</div>
    </div>

    <nav
      ref="navRef"
      class="admin-sidebar__nav"
      aria-label="后台功能菜单"
      @scroll="rememberNavScroll"
    >
      <div v-for="group in navGroups" :key="group.title">
        <div v-if="!isDesktopCollapsed" class="admin-sidebar__group-title">{{ group.title }}</div>
        <RouterLink
          v-for="item in group.items"
          :key="item.path"
          :to="item.path"
          class="admin-sidebar__link"
          :class="{ 'is-active': isActive(item.path) }"
          :title="item.description || item.label"
          @click="handleNavLinkClick"
        >
          <span class="admin-sidebar__link-mark" aria-hidden="true">
            <i v-if="getAdminNavItemIcon(item)" :class="getAdminNavItemIcon(item)" />
            <template v-else>{{ getShortLabel(item.label) }}</template>
          </span>
          <span v-if="!isDesktopCollapsed" class="admin-sidebar__link-text">{{ item.label }}</span>
        </RouterLink>
      </div>
    </nav>

    <div v-if="!isDesktopCollapsed" class="admin-sidebar__footer">
      当前阶段优先完成配置与数据页，后续再补权限与统计增强。
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useSystemSettingsStore } from '@/stores/system-settings'
import { getAdminNavItemIcon } from './admin-nav'
import { useAdminNav } from './useAdminNav'
import { useAdminLayoutContext } from './useAdminLayout'

const route = useRoute()
const navRef = ref<HTMLElement | null>(null)
const savedNavScrollTop = ref(0)
const systemSettingsStore = useSystemSettingsStore()
const { closeMobileSidebar, isDesktopCollapsed, mobileSidebarOpen } = useAdminLayoutContext()
const { navGroups, navPaths } = useAdminNav()

const siteName = computed(() => {
  const name = String(systemSettingsStore.publicSystemSettings.value.siteInfo.siteName || '').trim()
  return name || 'Canana'
})
const adminBrandTitle = computed(() => `${siteName.value} 管理台`)

const rememberNavScroll = () => {
  savedNavScrollTop.value = navRef.value?.scrollTop ?? 0
}

const restoreNavScroll = () => {
  const top = savedNavScrollTop.value
  if (!navRef.value || top <= 0) {
    return
  }

  navRef.value.scrollTop = top
}

/** 路由切换后恢复侧栏滚动，避免点击底部菜单项后列表跳回顶部 */
const scheduleRestoreNavScroll = () => {
  nextTick(() => {
    requestAnimationFrame(() => {
      restoreNavScroll()
      requestAnimationFrame(restoreNavScroll)
    })
  })
}

const handleNavLinkClick = () => {
  rememberNavScroll()
  closeMobileSidebar()
}

watch(
  () => route.path,
  () => {
    scheduleRestoreNavScroll()
  },
)

const getActivePath = () => {
  const currentPath = String(route.path || '').trim()
  return navPaths.value.find((path) => currentPath === path || currentPath.startsWith(`${path}/`)) || ''
}

const isActive = (path: string) => getActivePath() === path

const getShortLabel = (label: string) => {
  const normalizedLabel = String(label || '').trim()
  return normalizedLabel.slice(0, 1) || '•'
}
</script>
