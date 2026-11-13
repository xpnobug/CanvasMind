import { computed } from 'vue'
import { useSystemSettingsStore } from '@/stores/system-settings'
import { useThemePreferenceStore } from '@/stores/theme-preference'
import { normalizeHomeTopBannerSettings } from '@/api/system-config'

/**
 * 统一封装首页头部 / 顶栏横幅 / Banner / 创作区背景布局配置。
 * 顶栏横幅默认关闭：后端无字段时 normalize 兜底，保证壳层可挂载。
 */
export const useHomeLayoutConfig = () => {
  const { publicSystemSettings } = useSystemSettingsStore()
  const themeStore = useThemePreferenceStore()

  const homeLayoutSettings = computed(() => publicSystemSettings.value.homeLayoutSettings)
  const headerSettings = computed(() => homeLayoutSettings.value.header)
  const topBannerSettings = computed(() => normalizeHomeTopBannerSettings(homeLayoutSettings.value.topBanner))
  const bannerSettings = computed(() => homeLayoutSettings.value.banner)

  const bannerItems = computed(() => {
    return [...(bannerSettings.value.items || [])]
      .filter(item => item.visible)
      .sort((left, right) => left.sortOrder - right.sortOrder)
  })

  const bannerGridStyle = computed(() => {
    const itemCount = bannerItems.value.length
    if (itemCount <= 1) {
      return {
        '--banner-grid': '1fr',
      }
    }

    return {
      '--banner-grid': `1.53fr repeat(${Math.max(0, itemCount - 1)}, 1fr)`,
    }
  })

  /** 开启且有主文案才上屏（编辑态请填主文案） */
  const showTopBanner = computed(() => {
    return topBannerSettings.value.enabled === true
      && !!String(topBannerSettings.value.contentText || '').trim()
  })

  /** 创作区 / 首页主内容背景（workbench.headerBackground*） */
  const workbenchSettings = computed(() =>
    publicSystemSettings.value.conversationSettings?.entryDisplay?.workbench,
  )
  const headerBackgroundEnabled = computed(() => workbenchSettings.value?.headerBackgroundEnabled !== false)
  /** 按当前主题取整页背景图；亮色空则不回退暗色图，避免深色素材压白底 */
  const headerBackgroundImageUrl = computed(() => {
    const workbench = workbenchSettings.value
    if (!workbench) return ''
    if (themeStore.currentTheme.value === 'light') {
      return String(workbench.headerBackgroundImageUrlLight || '').trim()
    }
    return String(workbench.headerBackgroundImageUrl || '').trim()
  })

  return {
    homeLayoutSettings,
    headerSettings,
    topBannerSettings,
    bannerSettings,
    bannerItems,
    bannerGridStyle,
    showTopBanner,
    workbenchSettings,
    headerBackgroundEnabled,
    headerBackgroundImageUrl,
  }
}
