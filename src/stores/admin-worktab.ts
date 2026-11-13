import { computed, ref } from 'vue'
import type { RouteLocationNormalized } from 'vue-router'
import {
  ADMIN_DASHBOARD_PATH,
  canAccessAdminDashboard,
  findAdminNavItemByPath,
  getAdminNavItemIcon,
} from '@/components/admin/layout/admin-nav'
import { useAuthStore } from '@/stores/auth'

export interface AdminWorkTab {
  path: string
  title: string
  /** Remix Icon 类名 */
  icon?: string
  /** 与路由 name / 页面组件 name 一致，供 KeepAlive exclude */
  name?: string
  keepAlive?: boolean
  fixedTab?: boolean
}

const STORAGE_KEY = 'canana-admin-worktab-v2'

const resolveWorktabCacheName = (route: RouteLocationNormalized) => {
  const routeName = typeof route.name === 'string' ? route.name : ''
  if (routeName === 'AdminLayout') {
    return 'AdminSystem'
  }
  return routeName
}

const readStoredTabs = (): AdminWorkTab[] => {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY) || window.localStorage.getItem('canana-admin-worktab-v1')
    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw) as AdminWorkTab[]
    return Array.isArray(parsed)
      ? parsed
        .filter((tab) => tab?.path && tab?.title)
        .map((tab) => ({
          ...tab,
          icon: String(tab.icon || '').startsWith('ri-') ? tab.icon : undefined,
        }))
      : []
  } catch {
    return []
  }
}

const persistTabs = (tabs: AdminWorkTab[]) => {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tabs))
}

const createDashboardTab = (): AdminWorkTab => {
  const navItem = findAdminNavItemByPath(ADMIN_DASHBOARD_PATH)
  return {
    path: ADMIN_DASHBOARD_PATH,
    title: '数据看板',
    icon: navItem ? getAdminNavItemIcon(navItem) : 'ri-dashboard-line',
    name: 'AdminDashboard',
    keepAlive: true,
    fixedTab: true,
  }
}

// 模块级单例（不依赖 Pinia）
const opened = ref<AdminWorkTab[]>(readStoredTabs())
const keepAliveExclude = ref<string[]>([])

export const useAdminWorktabStore = () => {
  const hasMultipleTabs = computed(() => opened.value.length > 1)

  const resolveCanAccessDashboard = () => {
    const authStore = useAuthStore()
    return canAccessAdminDashboard({
      isFullAdmin: authStore.isAdmin.value,
      permissions: authStore.permissions.value,
    })
  }

  const fallbackTabsAfterCloseAll = () => (
    resolveCanAccessDashboard() ? [createDashboardTab()] : []
  )

  const ensureDashboardTab = () => {
    if (!resolveCanAccessDashboard() || opened.value.some((tab) => tab.path === ADMIN_DASHBOARD_PATH)) {
      return
    }

    opened.value = [createDashboardTab(), ...opened.value]
    persistTabs(opened.value)
  }

  const syncWorktabsWithAccess = () => {
    const canDashboard = resolveCanAccessDashboard()
    if (canDashboard) {
      ensureDashboardTab()
      return
    }

    if (!opened.value.some((tab) => tab.path === ADMIN_DASHBOARD_PATH)) {
      return
    }

    opened.value = opened.value.filter((tab) => tab.path !== ADMIN_DASHBOARD_PATH)
    persistTabs(opened.value)
  }

  const addKeepAliveExclude = (tab: AdminWorkTab) => {
    const name = String(tab.name || '').trim()
    if (!name || tab.keepAlive === false) {
      return
    }

    if (!keepAliveExclude.value.includes(name)) {
      keepAliveExclude.value.push(name)
    }
  }

  const removeKeepAliveExclude = (name: string) => {
    const normalized = String(name || '').trim()
    if (!normalized) {
      return
    }

    keepAliveExclude.value = keepAliveExclude.value.filter((item) => item !== normalized)
  }

  const markTabsClosedForCache = (tabs: AdminWorkTab[]) => {
    tabs.forEach((tab) => addKeepAliveExclude(tab))
  }

  const isTabClosable = (tab: AdminWorkTab) => !tab.fixedTab

  const openFromRoute = (
    route: RouteLocationNormalized,
    title: string,
    icon?: string,
  ) => {
    if (!route.path.startsWith('/admin') || route.path.startsWith('/admin-forbidden')) {
      return
    }

    if (route.meta.hideAdminTab) {
      return
    }

    if (route.path === ADMIN_DASHBOARD_PATH && !resolveCanAccessDashboard()) {
      return
    }

    const routeName = resolveWorktabCacheName(route)
    const keepAlive = route.meta.keepAlive !== false
    const normalizedIcon = String(icon || '').trim() || undefined

    if (routeName && keepAlive) {
      removeKeepAliveExclude(routeName)
    }

    const normalizedTitle = String(title || '').trim() || '未命名页面'
    const existingIndex = opened.value.findIndex((tab) => tab.path === route.path)

    if (existingIndex >= 0) {
      opened.value[existingIndex] = {
        ...opened.value[existingIndex],
        title: normalizedTitle,
        icon: normalizedIcon || opened.value[existingIndex].icon,
        name: routeName || opened.value[existingIndex].name,
        keepAlive,
      }
      persistTabs(opened.value)
      return
    }

    const nextTab: AdminWorkTab = {
      path: route.path,
      title: normalizedTitle,
      icon: normalizedIcon,
      name: routeName || undefined,
      keepAlive,
      fixedTab: (route.path === ADMIN_DASHBOARD_PATH && resolveCanAccessDashboard())
        || route.meta.fixedTab === true,
    }

    const fixedTabs = opened.value.filter((tab) => tab.fixedTab && tab.path !== route.path)
    const normalTabs = opened.value.filter((tab) => !tab.fixedTab)
    opened.value = [...fixedTabs, ...normalTabs, nextTab]
    persistTabs(opened.value)
  }

  const markTabClosedForCache = (path: string) => {
    const target = opened.value.find((tab) => tab.path === path)
    if (target) {
      addKeepAliveExclude(target)
    }
  }

  const closeTab = (path: string, activePath: string) => {
    const target = opened.value.find((tab) => tab.path === path)
    if (!target || target.fixedTab) {
      return null
    }

    const closingIndex = opened.value.findIndex((tab) => tab.path === path)
    if (closingIndex < 0) {
      return null
    }

    markTabClosedForCache(path)

    const isActive = activePath === path
    const nextTabs = opened.value.filter((tab) => tab.path !== path)
    opened.value = nextTabs.length ? nextTabs : fallbackTabsAfterCloseAll()
    persistTabs(opened.value)

    if (!isActive) {
      return null
    }

    const fallback = opened.value[Math.min(closingIndex, opened.value.length - 1)] || opened.value[0]
    return fallback?.path || null
  }

  const closeLeftTabs = (path: string, activePath: string) => {
    const targetIndex = opened.value.findIndex((tab) => tab.path === path)
    if (targetIndex <= 0) {
      return null
    }

    const leftTabs = opened.value.slice(0, targetIndex).filter(isTabClosable)
    if (!leftTabs.length) {
      return null
    }

    markTabsClosedForCache(leftTabs)
    opened.value = opened.value.filter((tab, index) => index >= targetIndex || !isTabClosable(tab))
    persistTabs(opened.value)

    if (!opened.value.some((tab) => tab.path === activePath)) {
      return path
    }

    return null
  }

  const closeRightTabs = (path: string, activePath: string) => {
    const targetIndex = opened.value.findIndex((tab) => tab.path === path)
    if (targetIndex < 0 || targetIndex >= opened.value.length - 1) {
      return null
    }

    const rightTabs = opened.value.slice(targetIndex + 1).filter(isTabClosable)
    if (!rightTabs.length) {
      return null
    }

    markTabsClosedForCache(rightTabs)
    opened.value = opened.value.filter((tab, index) => index <= targetIndex || !isTabClosable(tab))
    persistTabs(opened.value)

    if (!opened.value.some((tab) => tab.path === activePath)) {
      return path
    }

    return null
  }

  const closeOtherTabs = (path: string, activePath: string) => {
    const closable = opened.value.filter((tab) => tab.path !== path && isTabClosable(tab))
    if (!closable.length) {
      return null
    }

    markTabsClosedForCache(closable)

    const keep = opened.value.filter((tab) => tab.fixedTab || tab.path === path)
    opened.value = keep.length ? keep : fallbackTabsAfterCloseAll()
    persistTabs(opened.value)

    if (!opened.value.some((tab) => tab.path === activePath)) {
      return path
    }

    return null
  }

  const closeAllTabs = (activePath: string) => {
    const closable = opened.value.filter(isTabClosable)
    if (!closable.length) {
      return null
    }

    markTabsClosedForCache(closable)

    opened.value = opened.value.filter((tab) => !isTabClosable(tab))
    if (!opened.value.length) {
      opened.value = fallbackTabsAfterCloseAll()
    }
    persistTabs(opened.value)

    const fallback = opened.value[0]
    if (fallback?.path && activePath !== fallback.path) {
      return fallback.path
    }

    return null
  }

  const toggleFixedTab = (path: string) => {
    const targetIndex = opened.value.findIndex((tab) => tab.path === path)
    if (targetIndex < 0) {
      return
    }

    const tab = { ...opened.value[targetIndex], fixedTab: !opened.value[targetIndex].fixedTab }
    opened.value.splice(targetIndex, 1)

    if (tab.fixedTab) {
      const firstNormalIndex = opened.value.findIndex((item) => !item.fixedTab)
      const insertIndex = firstNormalIndex === -1 ? opened.value.length : firstNormalIndex
      opened.value.splice(insertIndex, 0, tab)
    } else {
      opened.value.push(tab)
    }

    persistTabs(opened.value)
  }

  return {
    opened,
    keepAliveExclude,
    hasMultipleTabs,
    syncWorktabsWithAccess,
    openFromRoute,
    closeTab,
    closeLeftTabs,
    closeRightTabs,
    closeOtherTabs,
    closeAllTabs,
    toggleFixedTab,
  }
}
