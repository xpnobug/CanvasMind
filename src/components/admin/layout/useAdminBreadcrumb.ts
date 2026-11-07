import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAdminNav } from './useAdminNav'

export interface AdminBreadcrumbItem {
  label: string
  to?: string
}

const readMetaBreadcrumbs = (value: unknown): AdminBreadcrumbItem[] | null => {
  if (!Array.isArray(value) || !value.length) {
    return null
  }

  return value
    .map((entry) => {
      if (!entry || typeof entry !== 'object') {
        return null
      }

      const label = String((entry as AdminBreadcrumbItem).label || '').trim()
      if (!label) {
        return null
      }

      const to = String((entry as AdminBreadcrumbItem).to || '').trim()
      return to ? { label, to } : { label }
    })
    .filter((entry): entry is AdminBreadcrumbItem => Boolean(entry))
}

export const useAdminBreadcrumb = () => {
  const route = useRoute()
  const { matchNavItemByPath, navGroups } = useAdminNav()

  const items = computed((): AdminBreadcrumbItem[] => {
    const custom = readMetaBreadcrumbs(route.meta.adminBreadcrumbs)
    if (custom?.length) {
      return custom
    }

    const navItem = matchNavItemByPath(route.path)
    if (!navItem) {
      const fallbackTitle = String(route.meta.adminPageTitle || '').trim()
      return [{ label: fallbackTitle || '管理台' }]
    }

    let groupTitle = ''
    for (const group of navGroups.value) {
      if (group.items.some((item) => item.path === navItem.path)) {
        groupTitle = group.title
        break
      }
    }

    const trail: AdminBreadcrumbItem[] = []
    if (groupTitle) {
      trail.push({ label: groupTitle })
    }

    const isExactNavPath = route.path === navItem.path
    if (isExactNavPath) {
      trail.push({ label: navItem.label })
      return trail
    }

    trail.push({ label: navItem.label, to: navItem.path })

    const pageTitle = String(route.meta.adminPageTitle || '').trim()
    trail.push({ label: pageTitle || '当前页' })

    return trail
  })

  const pageTitle = computed(() => {
    const customTitle = String(route.meta.adminPageTitle || '').trim()
    if (customTitle) {
      return customTitle
    }

    const lastItem = items.value[items.value.length - 1]
    if (lastItem?.label) {
      return lastItem.label
    }

    return matchNavItemByPath(route.path)?.label || '管理台'
  })

  const pageDescription = computed(() => {
    return matchNavItemByPath(route.path)?.description || '统一管理当前项目的配置、资源与生成记录。'
  })

  return {
    items,
    pageTitle,
    pageDescription,
  }
}
