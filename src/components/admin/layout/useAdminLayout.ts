import { computed, inject, provide, ref, watch, type InjectionKey, type Ref } from 'vue'

interface AdminLayoutContextValue {
  sidebarCollapsed: Ref<boolean>
  mobileSidebarOpen: Ref<boolean>
  isMobile: Ref<boolean>
  /** 递增后仅重挂载当前内容页（不卸壳层） */
  contentRefreshTick: Ref<number>
  /** 顶栏 + 标签页已展示标题时，隐藏页内重复标题区 */
  suppressPageIntroText: Ref<boolean>
  toggleSidebar: () => void
  toggleMobileSidebar: () => void
  closeMobileSidebar: () => void
  refreshPage: () => void
}

const ADMIN_SIDEBAR_STORAGE_KEY = 'canana-admin-sidebar-collapsed'
const AdminLayoutContextKey: InjectionKey<AdminLayoutContextValue> = Symbol('admin-layout-context')

const readStoredSidebarCollapsed = () => {
  if (typeof window === 'undefined') {
    return false
  }

  return window.localStorage.getItem(ADMIN_SIDEBAR_STORAGE_KEY) === '1'
}

const detectIsMobile = () => {
  if (typeof window === 'undefined') {
    return false
  }

  return window.innerWidth <= 960
}

// 创建后台布局上下文，统一管理折叠态和移动端抽屉态。
export const createAdminLayoutContext = () => {
  const sidebarCollapsed = ref(readStoredSidebarCollapsed())
  const mobileSidebarOpen = ref(false)
  const isMobile = ref(detectIsMobile())
  const contentRefreshTick = ref(0)
  const suppressPageIntroText = ref(true)

  const toggleSidebar = () => {
    if (isMobile.value) {
      mobileSidebarOpen.value = !mobileSidebarOpen.value
      return
    }

    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  const toggleMobileSidebar = () => {
    mobileSidebarOpen.value = !mobileSidebarOpen.value
  }

  const closeMobileSidebar = () => {
    mobileSidebarOpen.value = false
  }

  const refreshPage = () => {
    contentRefreshTick.value += 1
  }

  const syncViewportState = () => {
    isMobile.value = detectIsMobile()
    if (!isMobile.value) {
      mobileSidebarOpen.value = false
    }
  }

  watch(sidebarCollapsed, (value) => {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(ADMIN_SIDEBAR_STORAGE_KEY, value ? '1' : '0')
  })

  return {
    sidebarCollapsed,
    mobileSidebarOpen,
    isMobile,
    contentRefreshTick,
    suppressPageIntroText,
    toggleSidebar,
    toggleMobileSidebar,
    closeMobileSidebar,
    refreshPage,
    syncViewportState,
  }
}

export const provideAdminLayoutContext = (value: AdminLayoutContextValue) => {
  provide(AdminLayoutContextKey, value)
}

export const useAdminLayoutContext = () => {
  const context = inject(AdminLayoutContextKey, null)
  const fallbackSidebarCollapsed = ref(false)
  const fallbackMobileSidebarOpen = ref(false)
  const fallbackIsMobile = ref(false)
  const fallbackContentRefreshTick = ref(0)

  if (!context) {
    return {
      sidebarCollapsed: fallbackSidebarCollapsed,
      mobileSidebarOpen: fallbackMobileSidebarOpen,
      isMobile: fallbackIsMobile,
      contentRefreshTick: fallbackContentRefreshTick,
      toggleSidebar: () => {},
      toggleMobileSidebar: () => {},
      closeMobileSidebar: () => {},
      refreshPage: () => {
        fallbackContentRefreshTick.value += 1
      },
      suppressPageIntroText: ref(true),
      isDesktopCollapsed: computed(() => false),
    }
  }

  return {
    ...context,
    isDesktopCollapsed: computed(() => !context.isMobile.value && context.sidebarCollapsed.value),
  }
}
