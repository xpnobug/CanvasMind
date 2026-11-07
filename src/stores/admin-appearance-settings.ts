import { ElMessage } from 'element-plus'
import { ref, watch } from 'vue'
import {
  createDefaultConversationSettings,
  createDefaultGenerationProgressSettings,
  createDefaultGlobalThemeSettings,
  createDefaultHomeLayoutSettings,
  createDefaultHomeSideMenuSettings,
  getAdminSystemConfig,
  getPublicSystemConfig,
  normalizeHomeTopBannerSettings,
  saveAdminConversationSettings,
  saveAdminHomeLayoutSettings,
  saveAdminThemeSettings,
  type SystemConfigPayload,
} from '@/api/system-config'
import type { ThemeConfigTransferSource } from '@/views/admin/theme/theme-config-transfer'
import { useAuthStore } from '@/stores/auth'
import { useSystemSettingsStore } from '@/stores/system-settings'

const clonePayload = (value: SystemConfigPayload): SystemConfigPayload => JSON.parse(JSON.stringify(value))

const canManageSystemAppearanceSettings = () => {
  const authStore = useAuthStore()
  return authStore.isAdmin.value
}

const createDefaultDraft = (): SystemConfigPayload => ({
  siteInfo: {
    siteName: 'Canana',
    siteDescription: '',
    siteLogoUrl: '',
    siteIconUrl: '',
    icpText: '',
    icpLink: '',
    copyrightText: '',
  },
  policySettings: {
    agreementRequired: true,
    agreementTextPrefix: '已阅读并同意',
    userAgreementTitle: '用户服务协议',
    userAgreementUrl: '',
    userAgreementContent: '',
    privacyPolicyTitle: '隐私政策',
    privacyPolicyUrl: '',
    privacyPolicyContent: '',
    aiNoticeTitle: 'AI功能使用须知',
    aiNoticeUrl: '',
    aiNoticeContent: '',
  },
  loginSettings: {
    welcomeTitle: '欢迎登录',
    welcomeSubtitle: '',
  },
  generationProgressSettings: createDefaultGenerationProgressSettings(),
  conversationSettings: createDefaultConversationSettings(),
  globalThemeSettings: createDefaultGlobalThemeSettings(),
  homeSideMenuSettings: createDefaultHomeSideMenuSettings(),
  homeLayoutSettings: createDefaultHomeLayoutSettings(),
})

// 模块级单例，对齐公开版 auth / worktab 写法（不依赖 Pinia）
const drawerVisible = ref(false)
const loading = ref(false)
const saving = ref(false)
const loaded = ref(false)
const draft = ref<SystemConfigPayload>(createDefaultDraft())
let savedSnapshot = ''

const applyDraftToPublic = () => {
  const systemSettingsStore = useSystemSettingsStore()
  const current = systemSettingsStore.publicSystemSettings.value
  const clonedDraft = clonePayload(draft.value)
  systemSettingsStore.applyPublicSystemSettings({
    ...current,
    siteInfo: clonedDraft.siteInfo,
    conversationSettings: clonedDraft.conversationSettings,
    generationProgressSettings: clonedDraft.generationProgressSettings,
    globalThemeSettings: clonedDraft.globalThemeSettings,
    homeSideMenuSettings: clonedDraft.homeSideMenuSettings,
    homeLayoutSettings: clonedDraft.homeLayoutSettings,
  })
}

const syncSnapshot = () => {
  savedSnapshot = JSON.stringify({
    siteInfo: draft.value.siteInfo,
    conversationSettings: draft.value.conversationSettings,
    generationProgressSettings: draft.value.generationProgressSettings,
    globalThemeSettings: draft.value.globalThemeSettings,
    homeSideMenuSettings: draft.value.homeSideMenuSettings,
    homeLayoutSettings: draft.value.homeLayoutSettings,
  })
}

/** 公开包可能缺 topBanner：写入草稿前补默认，避免预览读 enabled 崩溃 */
const normalizeHomeLayoutForDraft = (layout?: SystemConfigPayload['homeLayoutSettings'] | null) => {
  const defaults = createDefaultHomeLayoutSettings()
  const next = layout || defaults
  return {
    ...defaults,
    ...next,
    header: {
      ...defaults.header,
      ...(next.header || {}),
    },
    topBanner: normalizeHomeTopBannerSettings(next.topBanner),
    banner: {
      ...defaults.banner,
      ...(next.banner || {}),
      items: Array.isArray(next.banner?.items) && next.banner.items.length
        ? next.banner.items
        : defaults.banner.items.map(item => ({ ...item })),
    },
  }
}

const assignDraftFromConfig = (config: SystemConfigPayload) => {
  const next = clonePayload(config)
  draft.value.siteInfo = next.siteInfo
  draft.value.conversationSettings = next.conversationSettings
  draft.value.generationProgressSettings = next.generationProgressSettings
    || createDefaultGenerationProgressSettings()
  draft.value.globalThemeSettings = next.globalThemeSettings
  draft.value.homeSideMenuSettings = next.homeSideMenuSettings
  draft.value.homeLayoutSettings = normalizeHomeLayoutForDraft(next.homeLayoutSettings)
  syncSnapshot()
}

// 仅注册一次：草稿变更时即时预览到前台主题运行时
watch(
  () => [
    draft.value.siteInfo,
    draft.value.conversationSettings,
    draft.value.generationProgressSettings,
    draft.value.globalThemeSettings,
    draft.value.homeSideMenuSettings,
    draft.value.homeLayoutSettings,
  ],
  () => {
    if (!loaded.value) {
      return
    }
    applyDraftToPublic()
  },
  { deep: true },
)

export const useAdminAppearanceSettingsStore = () => {
  const { applyPublicSystemSettings } = useSystemSettingsStore()

  const load = async (force = false) => {
    if (loaded.value && !force) {
      return draft.value
    }

    loading.value = true
    try {
      const result = canManageSystemAppearanceSettings()
        ? await getAdminSystemConfig()
        : await getPublicSystemConfig()
      if (result) {
        assignDraftFromConfig(result)
      }
      loaded.value = true
      applyDraftToPublic()
      return draft.value
    } finally {
      loading.value = false
    }
  }

  // 一次保存会并行写 theme / layout / conversation 三个分区；关掉分区 toast，只留 saveAndNotify 一条
  const silentSaveOptions = { showSuccessMessage: false } as const

  const save = async () => {
    if (!canManageSystemAppearanceSettings()) {
      throw new Error('当前账号没有系统设置权限')
    }

    saving.value = true
    try {
      const payload = clonePayload(draft.value)
      const [themeResult, layoutResult, conversationResult] = await Promise.all([
        saveAdminThemeSettings({ globalThemeSettings: payload.globalThemeSettings }, silentSaveOptions),
        saveAdminHomeLayoutSettings({
          homeSideMenuSettings: payload.homeSideMenuSettings,
          homeLayoutSettings: payload.homeLayoutSettings,
        }, silentSaveOptions),
        saveAdminConversationSettings({
          conversationSettings: payload.conversationSettings,
          generationProgressSettings: payload.generationProgressSettings,
        }, silentSaveOptions),
      ])
      assignDraftFromConfig({
        ...payload,
        conversationSettings: conversationResult.conversationSettings,
        globalThemeSettings: themeResult.globalThemeSettings,
        homeSideMenuSettings: layoutResult.homeSideMenuSettings,
        homeLayoutSettings: layoutResult.homeLayoutSettings,
        generationProgressSettings: conversationResult.generationProgressSettings,
      })
      applyPublicSystemSettings({
        ...layoutResult,
        siteInfo: payload.siteInfo,
        conversationSettings: conversationResult.conversationSettings,
        globalThemeSettings: themeResult.globalThemeSettings,
        generationProgressSettings: conversationResult.generationProgressSettings,
      })
      return layoutResult
    } finally {
      saving.value = false
    }
  }

  const saveAndNotify = async () => {
    try {
      await save()
      ElMessage.success('外观设置已保存')
    } catch {
      ElMessage.error('保存失败，请稍后重试')
    }
  }

  const resetDraft = () => {
    if (!savedSnapshot) {
      return
    }
    const parsed = JSON.parse(savedSnapshot)
    draft.value.siteInfo = parsed.siteInfo
    draft.value.conversationSettings = parsed.conversationSettings
    draft.value.generationProgressSettings = parsed.generationProgressSettings
      || createDefaultGenerationProgressSettings()
    draft.value.globalThemeSettings = parsed.globalThemeSettings
    draft.value.homeSideMenuSettings = parsed.homeSideMenuSettings
    draft.value.homeLayoutSettings = normalizeHomeLayoutForDraft(parsed.homeLayoutSettings)
    applyDraftToPublic()
  }

  const resetThemeDefaults = () => {
    draft.value.globalThemeSettings = createDefaultGlobalThemeSettings()
    applyDraftToPublic()
  }

  /** 主题页导入：覆盖外观相关分节并即时预览 */
  const applyThemeImportSections = (next: ThemeConfigTransferSource) => {
    draft.value.globalThemeSettings = next.globalThemeSettings
    draft.value.homeSideMenuSettings = next.homeSideMenuSettings
    draft.value.homeLayoutSettings = normalizeHomeLayoutForDraft(next.homeLayoutSettings)
    draft.value.conversationSettings = next.conversationSettings
    draft.value.generationProgressSettings = next.generationProgressSettings
    applyDraftToPublic()
  }

  /** 主题页首屏：确保草稿已含 topBanner，避免预览读 enabled 崩溃 */
  const ensureHomeLayoutNormalized = () => {
    draft.value.homeLayoutSettings = normalizeHomeLayoutForDraft(draft.value.homeLayoutSettings)
  }

  const openDrawer = async () => {
    drawerVisible.value = true
    await load()
  }

  const closeDrawer = () => {
    drawerVisible.value = false
  }

  return {
    drawerVisible,
    loading,
    saving,
    loaded,
    draft,
    load,
    save,
    saveAndNotify,
    resetDraft,
    resetThemeDefaults,
    applyThemeImportSections,
    ensureHomeLayoutNormalized,
    openDrawer,
    closeDrawer,
  }
}
