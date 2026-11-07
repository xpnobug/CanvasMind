import { readJsonBody, sendJson } from '../ai-gateway/shared'

export interface SystemSiteInfoPayload {
  siteName?: string
  siteDescription?: string
  siteLogoUrl?: string
  siteIconUrl?: string
  icpText?: string
  icpLink?: string
  copyrightText?: string
}

export interface SystemPolicyPayload {
  agreementRequired?: boolean
  agreementTextPrefix?: string
  userAgreementTitle?: string
  userAgreementUrl?: string
  userAgreementContent?: string
  privacyPolicyTitle?: string
  privacyPolicyUrl?: string
  privacyPolicyContent?: string
  aiNoticeTitle?: string
  aiNoticeUrl?: string
  aiNoticeContent?: string
}

export interface SystemLoginSettingsPayload {
  welcomeTitle?: string
  welcomeSubtitle?: string
  generationProgressSettings?: SystemGenerationProgressSettingsPayload
}

export interface SystemConversationModeOptionPayload {
  value?: string
  label?: string
}

export interface SystemConversationBasicRulesPayload {
  defaultSessionTitle?: string
  newSessionTitlePrefix?: string
  sessionTitleMaxLength?: number
  defaultSortMode?: string
  allowDeleteDefaultSession?: boolean
  allowAdminRename?: boolean
  allowAdminDelete?: boolean
}

export interface SystemConversationListDisplayPayload {
  defaultPageSize?: number
  showUserInfo?: boolean
  showCoverImage?: boolean
  showLatestPrompt?: boolean
  showStatusStats?: boolean
  showSessionId?: boolean
  showLastRecordTime?: boolean
  enableUserMasking?: boolean
}

export interface SystemConversationEntryHeroPayload {
  enabled?: boolean
  title?: string
  subtitle?: string
}

export interface SystemConversationEntryWorkbenchPayload {
  titleEnabled?: boolean
  generatorEnabled?: boolean
  taskIndicatorEnabled?: boolean
  bannerEnabled?: boolean
  showSiteName?: boolean
  prefixText?: string
  suffixText?: string
  showModeSelectorInTitle?: boolean
  showSubmitButton?: boolean
  headerBackgroundEnabled?: boolean
  headerBackgroundImageUrl?: string
  headerBackgroundImageUrlLight?: string
  headerBackgroundGlowColor?: string
  headerBackgroundGlowColorLight?: string
  headerBackgroundGlowOpacity?: number
  headerBackgroundGlowOpacityLight?: number
  headerBackgroundGlowEnabled?: boolean
  headerBackgroundStarEnabled?: boolean
  headerBackgroundStarColor?: string
  headerBackgroundStarColorLight?: string
}

export interface SystemConversationEntryInputPayload {
  placeholder?: string
  autoResize?: boolean
  minRows?: number
  maxWidth?: number
}

export interface SystemConversationEntryModePayload {
  enabled?: boolean
  defaultMode?: string
  options?: SystemConversationModeOptionPayload[]
}

export interface SystemConversationEntryModelSelectorPayload {
  enabled?: boolean
  defaultModelKey?: string
  allowedModelKeys?: string[]
  allowSkillOverride?: boolean
}

export interface SystemConversationEntryAssistantSelectorPayload {
  enabled?: boolean
  defaultAssistantKey?: string
  allowedAssistantKeys?: string[]
}

export interface SystemConversationEntryActionItemPayload {
  visible?: boolean
  defaultEnabled?: boolean
}

export interface SystemConversationEntryActionsPayload {
  auto?: SystemConversationEntryActionItemPayload
  inspiration?: SystemConversationEntryActionItemPayload
  creativeDesign?: SystemConversationEntryActionItemPayload
}

export interface SystemConversationEntryDisplayPayload {
  hero?: SystemConversationEntryHeroPayload
  workbench?: SystemConversationEntryWorkbenchPayload
  input?: SystemConversationEntryInputPayload
  mode?: SystemConversationEntryModePayload
  modelSelector?: SystemConversationEntryModelSelectorPayload
  assistantSelector?: SystemConversationEntryAssistantSelectorPayload
  actions?: SystemConversationEntryActionsPayload
}

export interface SystemConversationManagementPolicyPayload {
  allowBatchDelete?: boolean
  allowExportSessions?: boolean
  autoCleanupEnabled?: boolean
  emptySessionRetentionDays?: number
  completedSessionRetentionDays?: number
  failedSessionRetentionDays?: number
  deleteCascadeRecords?: boolean
}

export interface SystemConversationSettingsPayload {
  basicRules?: SystemConversationBasicRulesPayload
  listDisplay?: SystemConversationListDisplayPayload
  entryDisplay?: SystemConversationEntryDisplayPayload
  managementPolicy?: SystemConversationManagementPolicyPayload
}

export interface SystemThemeModePolicyPayload {
  allowUserToggle?: boolean
  defaultMode?: 'dark' | 'light' | 'system' | string
  supportSystemMode?: boolean
}

export interface SystemThemeBackgroundsPayload {
  page?: string
  surface?: string
  sideMenu?: string
}

export interface SystemThemeVariantPayload {
  backgrounds?: SystemThemeBackgroundsPayload
}

export interface SystemThemeBrandColorsPayload {
  primary?: string
  primaryHover?: string
  primaryActive?: string
  secondary?: string
  accent?: string
  success?: string
  warning?: string
  danger?: string
}

export interface SystemThemeGradientsPayload {
  primaryGradient?: string
  bannerGlow?: string
}

export interface SystemThemeSurfacesPayload {
  contentMaxWidth?: number
  cardRadius?: number
}

export interface SystemGlobalThemeSettingsPayload {
  modePolicy?: SystemThemeModePolicyPayload
  themes?: {
    dark?: SystemThemeVariantPayload
    light?: SystemThemeVariantPayload
  }
  backgrounds?: SystemThemeBackgroundsPayload
  brandColors?: SystemThemeBrandColorsPayload
  gradients?: SystemThemeGradientsPayload
  surfaces?: SystemThemeSurfacesPayload
}

export interface SystemHomeSideMenuItemPayload {
  key?: string
  title?: string
  section?: 'top' | 'center' | 'bottom' | string
  iconSource?: 'default' | 'custom' | string
  iconType?: 'system' | 'image' | string
  icon?: string
  inactiveIconUrl?: string
  activeIconUrl?: string
  visible?: boolean
  badgeText?: string
  badgeTone?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | string
  actionType?: 'route' | 'url' | 'dialog' | 'none' | string
  actionValue?: string
  sortOrder?: number
}

export interface SystemHomeSideMenuSettingsPayload {
  enabled?: boolean
  layoutMode?: 'side' | 'top' | string
  collapsedWidth?: number
  drawerWidth?: number
  drawerFloatLimitWidth?: number
  showTopMenu?: boolean
  showCenterMenu?: boolean
  showBottomMenu?: boolean
  items?: SystemHomeSideMenuItemPayload[]
}

export interface SystemHomeLayoutHeaderPayload {
  showSiteDescription?: boolean
  showTaskIndicator?: boolean
  showBanner?: boolean
}

/** 首页顶通横幅（壳层；默认关闭） */
export interface SystemHomeTopBannerPayload {
  enabled?: boolean
  bannerId?: string
  height?: number
  tagMode?: 'static' | 'countdown' | string
  tagText?: string
  tagTextColor?: string
  tagBackgroundColor?: string
  countdownEndAt?: string
  showTagIcon?: boolean
  contentText?: string
  contentTextColor?: string
  ctaEnabled?: boolean
  ctaText?: string
  ctaTextColor?: string
  ctaBorderColor?: string
  ctaBackgroundColor?: string
  actionType?: 'route' | 'url' | 'dialog' | 'none' | string
  actionValue?: string
  gradientStart?: string
  gradientEnd?: string
  backgroundImageUrl?: string
  showClose?: boolean
}

export interface SystemHomeBannerItemPayload {
  key?: string
  title?: string
  subtitle?: string
  imageSource?: 'default' | 'custom' | string
  presetKey?: string
  imageUrl?: string
  backgroundImageUrl?: string
  mainImageUrl?: string
  overlayImageUrl?: string
  glowColor?: string
  actionType?: 'route' | 'url' | 'none' | string
  actionValue?: string
  visible?: boolean
  sortOrder?: number
}

export interface SystemHomeBannerSettingsPayload {
  enabled?: boolean
  items?: SystemHomeBannerItemPayload[]
}

export interface SystemHomeLayoutSettingsPayload {
  header?: SystemHomeLayoutHeaderPayload
  topBanner?: SystemHomeTopBannerPayload
  banner?: SystemHomeBannerSettingsPayload
}

export interface SystemGenerationProgressStagePayload {
  key?: string
  label?: string
  percent?: number
  showPercent?: boolean
  description?: string
}

export interface SystemGenerationProgressSettingsPayload {
  enabled?: boolean
  stages?: SystemGenerationProgressStagePayload[]
}

export interface SystemRedisRuntimeSettingsPayload {
  taskSubmitRateLimit?: number
  authVerificationRateLimit?: number
  authLoginRateLimit?: number
  providerModelDiscoverRateLimit?: number
  taskUserConcurrencyLimit?: number
  taskSkillConcurrencyLimit?: number
  taskProviderConcurrencyLimit?: number
}

export interface SystemConfigPayload {
  siteInfo?: SystemSiteInfoPayload
  policySettings?: SystemPolicyPayload
  loginSettings?: SystemLoginSettingsPayload
  generationProgressSettings?: SystemGenerationProgressSettingsPayload
  conversationSettings?: SystemConversationSettingsPayload
  globalThemeSettings?: SystemGlobalThemeSettingsPayload
  homeSideMenuSettings?: SystemHomeSideMenuSettingsPayload
  homeLayoutSettings?: SystemHomeLayoutSettingsPayload
  redisRuntimeSettings?: SystemRedisRuntimeSettingsPayload
}

// 读取系统设置请求体。
export const readSystemConfigBody = async (req: any) => {
  const payload = await readJsonBody(req)
  return payload as SystemConfigPayload
}

// 返回统一的系统设置错误。
export const sendSystemConfigError = (res: any, statusCode: number, message: string) => {
  sendJson(res, statusCode, {
    message,
    error: {
      type: 'system_config_error',
      message,
    },
  })
}
