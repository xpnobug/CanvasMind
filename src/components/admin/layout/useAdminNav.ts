import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import {
  findAdminNavItemByPath,
  getAdminNavPaths,
  resolveAdminNavGroups,
  type AdminNavVisibilityContext,
} from './admin-nav'

/** 后台导航可见性：功能开关 + 权限码裁剪 */
export const useAdminNav = (context: AdminNavVisibilityContext = {}) => {
  const authStore = useAuthStore()

  const visibilityContext = computed<AdminNavVisibilityContext>(() => ({
    ...context,
    isFullAdmin: context.isFullAdmin ?? authStore.isAdmin.value,
    permissions: context.permissions ?? authStore.permissions.value,
  }))

  const navGroups = computed(() => resolveAdminNavGroups(visibilityContext.value))
  const navPaths = computed(() => getAdminNavPaths(navGroups.value))

  const matchNavItemByPath = (path: string) => findAdminNavItemByPath(path, navGroups.value)

  return {
    navGroups,
    navPaths,
    matchNavItemByPath,
  }
}
