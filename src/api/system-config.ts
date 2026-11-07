import { buildApiUrl } from './http'
import { readApiData } from './response'

export interface SystemSiteInfoConfig {
  siteName: string
  siteDescription: string
  siteLogoUrl: string
  siteIconUrl: string
  icpText: string
  icpLink: string
  copyrightText: string
}

export interface SystemPolicyConfig {
  agreementRequired: boolean
  agreementTextPrefix: string
  userAgreementTitle: string
  userAgreementUrl: string
  userAgreementContent: string
  privacyPolicyTitle: string
  privacyPolicyUrl: string
  privacyPolicyContent: string
  aiNoticeTitle: string
  aiNoticeUrl: string
  aiNoticeContent: string
}

export interface SystemLoginSettingsConfig {
  welcomeTitle: string
  welcomeSubtitle: string
}

export interface ConversationModeOptionConfig {
  value: string
  label: string
}

export interface ConversationBasicRulesConfig {
  defaultSessionTitle: string
  newSessionTitlePrefix: string
  sessionTitleMaxLength: number
  defaultSortMode: string
  allowDeleteDefaultSession: boolean
  allowAdminRename: boolean
  allowAdminDelete: boolean
}

export interface ConversationListDisplayConfig {
  defaultPageSize: number
  showUserInfo: boolean
  showCoverImage: boolean
  showLatestPrompt: boolean
  showStatusStats: boolean
  showSessionId: boolean
  showLastRecordTime: boolean
  enableUserMasking: boolean
}

export interface ConversationEntryDisplayConfig {
  hero: {
    enabled: boolean
    title: string
    subtitle: string
  }
  workbench: {
    titleEnabled: boolean
    generatorEnabled: boolean
    taskIndicatorEnabled: boolean
    bannerEnabled: boolean
    showSiteName: boolean
    prefixText: string
    suffixText: string
    showModeSelectorInTitle: boolean
    showSubmitButton: boolean
    /** 创作区顶背景（蓝晕/星点/可选背景图）显隐 */
    headerBackgroundEnabled: boolean
    /** 暗色主题整页背景图 URL */
    headerBackgroundImageUrl: string
    /** 亮色主题整页背景图 URL；空则亮色不回退暗色图 */
    headerBackgroundImageUrlLight: string
    headerBackgroundGlowColor: string
    headerBackgroundGlowColorLight: string
    headerBackgroundGlowOpacity: number
    headerBackgroundGlowOpacityLight: number
    headerBackgroundGlowEnabled: boolean
    headerBackgroundStarEnabled: boolean
    headerBackgroundStarColor: string
    headerBackgroundStarColorLight: string
  }
  input: {
    placeholder: string
    autoResize: boolean
    minRows: number
    maxWidth: number
  }
  mode: {
    enabled: boolean
    defaultMode: string
    options: ConversationModeOptionConfig[]
  }
  modelSelector: {
    enabled: boolean
    defaultModelKey: string
    allowedModelKeys: string[]
    allowSkillOverride: boolean
  }
  assistantSelector: {
    enabled: boolean
    defaultAssistantKey: string
    allowedAssistantKeys: string[]
  }
  actions: {
    auto: {
      visible: boolean
      defaultEnabled: boolean
    }
    inspiration: {
      visible: boolean
      defaultEnabled: boolean
    }
    creativeDesign: {
      visible: boolean
      defaultEnabled: boolean
    }
  }
}

export interface ConversationManagementPolicyConfig {
  allowBatchDelete: boolean
  allowExportSessions: boolean
  autoCleanupEnabled: boolean
  emptySessionRetentionDays: number
  completedSessionRetentionDays: number
  failedSessionRetentionDays: number
  deleteCascadeRecords: boolean
}

export interface ConversationSettingsConfig {
  basicRules: ConversationBasicRulesConfig
  listDisplay: ConversationListDisplayConfig
  entryDisplay: ConversationEntryDisplayConfig
  managementPolicy: ConversationManagementPolicyConfig
}

const DEFAULT_CREATION_MODE_OPTIONS: ConversationModeOptionConfig[] = [
  { value: 'agent', label: 'Agent 模式' },
  { value: 'image', label: '图片生成' },
  { value: 'video', label: '视频生成' },
  { value: 'digital-human', label: '数字人' },
  { value: 'motion', label: '动作模仿' },
]

const DEFAULT_ASSISTANT_ALLOWLIST = [
  'general',
  'story-short',
  'marketing-video',
  'ecommerce-pack',
  'poster-design',
  'brand-design',
]

export interface SystemGenerationProgressStageConfig {
  key: string
  label: string
  percent: number
  showPercent: boolean
  description: string
}

export interface SystemGenerationProgressSettingsConfig {
  enabled: boolean
  stages: SystemGenerationProgressStageConfig[]
}

export interface SystemThemeBackgroundConfig {
  page: string
  surface: string
  sideMenu: string
}

export interface SystemGlobalThemeSettingsConfig {
  modePolicy: {
    allowUserToggle: boolean
    defaultMode: 'dark' | 'light' | 'system'
    supportSystemMode: boolean
  }
  themes: {
    dark: {
      backgrounds: SystemThemeBackgroundConfig
    }
    light: {
      backgrounds: SystemThemeBackgroundConfig
    }
  }
  brandColors: {
    primary: string
    primaryHover: string
    primaryActive: string
    secondary: string
    accent: string
    success: string
    warning: string
    danger: string
  }
  gradients: {
    primaryGradient: string
    bannerGlow: string
  }
  surfaces: {
    contentMaxWidth: number
    cardRadius: number
  }
}

export interface SystemHomeSideMenuItemConfig {
  key: string
  title: string
  section: 'top' | 'center' | 'bottom'
  groupKey: string
  iconSource: 'default' | 'custom'
  iconType: 'system' | 'image'
  icon: string
  inactiveIconUrl: string
  activeIconUrl: string
  visible: boolean
  badgeText: string
  badgeTone: 'default' | 'primary' | 'success' | 'warning' | 'danger'
  actionType: 'route' | 'url' | 'dialog' | 'none'
  actionValue: string
  sortOrder: number
}

export interface SystemHomeSideMenuGroupConfig {
  key: string
  title: string
  section: 'center' | 'bottom'
  visible: boolean
  sortOrder: number
}

export interface SystemHomeSideMenuSettingsConfig {
  enabled: boolean
  layoutMode: 'side' | 'top'
  collapsedWidth: number
  drawerWidth: number
  drawerFloatLimitWidth: number
  showTopMenu: boolean
  showCenterMenu: boolean
  showBottomMenu: boolean
  groups: SystemHomeSideMenuGroupConfig[]
  items: SystemHomeSideMenuItemConfig[]
}

export interface SystemHomeLayoutHeaderConfig {
  showSiteDescription: boolean
  showTaskIndicator: boolean
  showBanner: boolean
}

/** 创作区顶背景默认值（对齐 Pro 壳层 SVG / CSS） */
export const DEFAULT_HEADER_BACKGROUND_GLOW_COLOR = '#008EE5'
export const DEFAULT_HEADER_BACKGROUND_GLOW_OPACITY = 0.28
export const DEFAULT_HEADER_BACKGROUND_GLOW_OPACITY_LIGHT = 0.12
export const DEFAULT_HEADER_BACKGROUND_STAR_COLOR = '#FFFFFF0A'
export const DEFAULT_HEADER_BACKGROUND_STAR_COLOR_LIGHT = '#00000008'

/** 钳制光晕透明度到 0–1 */
export const clampHeaderBackgroundOpacity = (value: unknown, fallback: number): number => {
  const raw = Number(value)
  if (!Number.isFinite(raw)) {
    return fallback
  }
  return Math.max(0, Math.min(1, Math.round(raw * 100) / 100))
}

/** 允许 #RGB / #RRGGBB / #RRGGBBAA；非法回退 */
export const normalizeCssHexColor = (value: unknown, fallback: string): string => {
  const raw = String(value ?? '').trim()
  const fallbackColor = String(fallback || '').trim() || '#000000'
  if (!raw) return fallbackColor
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(raw)) {
    return raw.toUpperCase()
  }
  return fallbackColor
}

const normalizeOpaqueHexColor = (value: unknown, fallback: string): string => {
  const normalized = normalizeCssHexColor(value, fallback)
  // 顶栏横幅色值用 6 位；带 alpha 时截断，避免渐变异常
  if (/^#[0-9A-F]{8}$/i.test(normalized)) {
    return `#${normalized.slice(1, 7)}`
  }
  if (/^#[0-9A-F]{3}$/i.test(normalized)) {
    const r = normalized[1]
    const g = normalized[2]
    const b = normalized[3]
    return `#${r}${r}${g}${g}${b}${b}`
  }
  return normalized
}

/** 首页顶部横幅配置（壳层；默认关闭，后端无字段时前端 normalize 兜底） */
export interface SystemHomeTopBannerConfig {
  enabled: boolean
  bannerId: string
  height: number
  tagMode: 'static' | 'countdown'
  tagText: string
  tagTextColor: string
  tagBackgroundColor: string
  countdownEndAt: string
  showTagIcon: boolean
  contentText: string
  contentTextColor: string
  ctaEnabled: boolean
  ctaText: string
  ctaTextColor: string
  ctaBorderColor: string
  ctaBackgroundColor: string
  actionType: 'route' | 'url' | 'dialog' | 'none'
  actionValue: string
  gradientStart: string
  gradientEnd: string
  backgroundImageUrl: string
  showClose: boolean
}

export interface SystemHomeBannerItemConfig {
  key: string
  title: string
  subtitle: string
  imageSource: 'default' | 'custom'
  presetKey: string
  imageUrl: string
  backgroundImageUrl: string
  mainImageUrl: string
  overlayImageUrl: string
  glowColor: string
  actionType: 'route' | 'url' | 'none'
  actionValue: string
  visible: boolean
  sortOrder: number
}

export interface SystemHomeLayoutSettingsConfig {
  header: SystemHomeLayoutHeaderConfig
  /** 顶栏横幅；公开包可能缺字段，读取时请走 normalizeHomeTopBannerSettings */
  topBanner: SystemHomeTopBannerConfig
  banner: {
    enabled: boolean
    items: SystemHomeBannerItemConfig[]
  }
}

/** 顶栏横幅默认关闭，保证壳层可渲染且无配置时不展示 */
export const createDefaultHomeTopBannerSettings = (): SystemHomeTopBannerConfig => ({
  enabled: false,
  bannerId: 'home-top-banner-default',
  height: 0,
  tagMode: 'static',
  tagText: '',
  tagTextColor: '#FFFFFF',
  tagBackgroundColor: '#F50095',
  countdownEndAt: '',
  showTagIcon: true,
  contentText: '',
  contentTextColor: '#000000',
  ctaEnabled: false,
  ctaText: '',
  ctaTextColor: '#000000',
  ctaBorderColor: '#000000',
  ctaBackgroundColor: '',
  actionType: 'none',
  actionValue: '',
  gradientStart: '#D5F5FF',
  gradientEnd: '#D5F5FF',
  backgroundImageUrl: '',
  showClose: true,
})

export const normalizeHomeTopBannerSettings = (
  value?: Partial<SystemHomeTopBannerConfig> | null,
): SystemHomeTopBannerConfig => {
  const defaults = createDefaultHomeTopBannerSettings()
  const next = value || {}
  const actionType = (
    next.actionType === 'route'
    || next.actionType === 'url'
    || next.actionType === 'dialog'
  ) ? next.actionType : 'none'

  return {
    enabled: next.enabled === true,
    bannerId: String(next.bannerId ?? defaults.bannerId).trim() || defaults.bannerId,
    height: Number.isFinite(Number(next.height))
      ? Math.max(0, Math.min(96, Number(next.height)))
      : defaults.height,
    tagMode: next.tagMode === 'countdown' ? 'countdown' : 'static',
    tagText: String(next.tagText ?? '').trim(),
    tagTextColor: normalizeOpaqueHexColor(next.tagTextColor, defaults.tagTextColor),
    tagBackgroundColor: normalizeOpaqueHexColor(next.tagBackgroundColor, defaults.tagBackgroundColor),
    countdownEndAt: String(next.countdownEndAt ?? '').trim(),
    showTagIcon: next.showTagIcon !== false,
    contentText: String(next.contentText ?? '').trim(),
    contentTextColor: normalizeOpaqueHexColor(next.contentTextColor, defaults.contentTextColor),
    ctaEnabled: next.ctaEnabled === true,
    ctaText: String(next.ctaText ?? '').trim(),
    ctaTextColor: normalizeOpaqueHexColor(next.ctaTextColor, defaults.ctaTextColor),
    ctaBorderColor: normalizeOpaqueHexColor(next.ctaBorderColor, defaults.ctaBorderColor),
    ctaBackgroundColor: String(next.ctaBackgroundColor ?? '').trim(),
    actionType,
    actionValue: String(next.actionValue ?? '').trim(),
    gradientStart: normalizeOpaqueHexColor(next.gradientStart, defaults.gradientStart),
    gradientEnd: normalizeOpaqueHexColor(next.gradientEnd, defaults.gradientEnd),
    backgroundImageUrl: String(next.backgroundImageUrl ?? '').trim(),
    showClose: next.showClose !== false,
  }
}

export interface SystemConfigPayload {
  siteInfo: SystemSiteInfoConfig
  policySettings: SystemPolicyConfig
  loginSettings: SystemLoginSettingsConfig
  generationProgressSettings: SystemGenerationProgressSettingsConfig
  conversationSettings: ConversationSettingsConfig
  globalThemeSettings: SystemGlobalThemeSettingsConfig
  homeSideMenuSettings: SystemHomeSideMenuSettingsConfig
  homeLayoutSettings: SystemHomeLayoutSettingsConfig
}

// 创建默认会话配置，供前后台配置页面与公共设置复用。
export const createDefaultConversationSettings = (): ConversationSettingsConfig => ({
  basicRules: {
    defaultSessionTitle: '新对话',
    newSessionTitlePrefix: '新对话',
    sessionTitleMaxLength: 120,
    defaultSortMode: 'lastRecordAt_desc',
    allowDeleteDefaultSession: false,
    allowAdminRename: true,
    allowAdminDelete: true,
  },
  listDisplay: {
    defaultPageSize: 12,
    showUserInfo: true,
    showCoverImage: true,
    showLatestPrompt: true,
    showStatusStats: true,
    showSessionId: true,
    showLastRecordTime: true,
    enableUserMasking: false,
  },
  entryDisplay: {
    hero: {
      enabled: true,
      title: '你好，想创作什么？',
      subtitle: '输入一句需求，快速开始图片、视频或智能创作',
    },
    workbench: {
      titleEnabled: true,
      generatorEnabled: true,
      taskIndicatorEnabled: true,
      bannerEnabled: true,
      showSiteName: true,
      prefixText: '开启你的',
      suffixText: '即刻造梦！',
      showModeSelectorInTitle: true,
      showSubmitButton: true,
      headerBackgroundEnabled: true,
      headerBackgroundImageUrl: '',
      headerBackgroundImageUrlLight: '',
      headerBackgroundGlowColor: DEFAULT_HEADER_BACKGROUND_GLOW_COLOR,
      headerBackgroundGlowColorLight: DEFAULT_HEADER_BACKGROUND_GLOW_COLOR,
      headerBackgroundGlowOpacity: DEFAULT_HEADER_BACKGROUND_GLOW_OPACITY,
      headerBackgroundGlowOpacityLight: DEFAULT_HEADER_BACKGROUND_GLOW_OPACITY_LIGHT,
      headerBackgroundGlowEnabled: true,
      headerBackgroundStarEnabled: true,
      headerBackgroundStarColor: DEFAULT_HEADER_BACKGROUND_STAR_COLOR,
      headerBackgroundStarColorLight: DEFAULT_HEADER_BACKGROUND_STAR_COLOR_LIGHT,
    },
    input: {
      placeholder: '说说今天想做点什么',
      autoResize: true,
      minRows: 4,
      maxWidth: 960,
    },
    mode: {
      enabled: true,
      defaultMode: 'agent',
      options: DEFAULT_CREATION_MODE_OPTIONS.map(option => ({ ...option })),
    },
    modelSelector: {
      enabled: true,
      defaultModelKey: '',
      allowedModelKeys: [],
      allowSkillOverride: true,
    },
    assistantSelector: {
      enabled: true,
      defaultAssistantKey: 'general',
      allowedAssistantKeys: [...DEFAULT_ASSISTANT_ALLOWLIST],
    },
    actions: {
      auto: {
        visible: true,
        defaultEnabled: true,
      },
      inspiration: {
        visible: true,
        defaultEnabled: false,
      },
      creativeDesign: {
        visible: true,
        defaultEnabled: false,
      },
    },
  },
  managementPolicy: {
    allowBatchDelete: true,
    allowExportSessions: false,
    autoCleanupEnabled: false,
    emptySessionRetentionDays: 30,
    completedSessionRetentionDays: 180,
    failedSessionRetentionDays: 365,
    deleteCascadeRecords: true,
  },
})

// 创建默认生成进度配置，供会话配置和系统设置复用。
export const createDefaultGenerationProgressSettings = (): SystemGenerationProgressSettingsConfig => ({
  enabled: true,
  stages: [
    { key: 'queued', label: '排队中', percent: 5, showPercent: true, description: '任务已创建，等待服务端执行' },
    { key: 'resolved_provider', label: '准备中', percent: 12, showPercent: true, description: '已解析厂商与模型配置' },
    { key: 'requesting_upstream', label: '生成中', percent: 35, showPercent: true, description: '已开始请求上游图片模型' },
    { key: 'receiving_upstream_result', label: '解析中', percent: 72, showPercent: true, description: '上游已返回结果，正在解析图片内容' },
    { key: 'syncing_record', label: '同步中', percent: 92, showPercent: true, description: '图片结果已解析，正在同步记录与资源信息' },
    { key: 'completed', label: '已完成', percent: 100, showPercent: false, description: '任务执行完成' },
    { key: 'failing', label: '收尾中', percent: 96, showPercent: true, description: '任务执行异常，正在写入失败状态' },
    { key: 'failed', label: '生成失败', percent: 100, showPercent: false, description: '任务执行失败' },
    { key: 'stopping', label: '停止中', percent: 98, showPercent: true, description: '任务已收到停止指令，正在收口状态' },
    { key: 'stopped', label: '已停止', percent: 100, showPercent: false, description: '任务已停止' },
  ],
})

/**
 * 默认品牌配色取用户导出 theme-config 主色 #55b8cc；
 * hover/active 加深，secondary/accent 保留区分色（导出稿整组刷成同色是误填）。
 * 默认深色壳，避免浅色预览字色被冲白。
 */
export const createDefaultGlobalThemeSettings = (): SystemGlobalThemeSettingsConfig => ({
  modePolicy: {
    allowUserToggle: true,
    defaultMode: 'dark',
    supportSystemMode: true,
  },
  themes: {
    dark: {
      backgrounds: {
        page: '#0f0f12',
        surface: '#0f0f12',
        sideMenu: '#0f0f12',
      },
    },
    light: {
      backgrounds: {
        page: '#f8f9fa',
        surface: '#ffffff',
        sideMenu: '#ffffff',
      },
    },
  },
  brandColors: {
    primary: '#55b8cc',
    primaryHover: '#3fa3b8',
    primaryActive: '#2f8ea3',
    secondary: '#00c2d6',
    accent: '#ff7a59',
    success: '#18b566',
    warning: '#ffb020',
    danger: '#f04438',
  },
  gradients: {
    primaryGradient: 'linear-gradient(135deg, #55b8cc 0%, #2fe3ff 100%)',
    bannerGlow: '#2FE3FF',
  },
  surfaces: {
    contentMaxWidth: 1440,
    cardRadius: 20,
  },
})

export const createDefaultHomeSideMenuSettings = (): SystemHomeSideMenuSettingsConfig => ({
  enabled: true,
  layoutMode: 'side',
  collapsedWidth: 76,
  drawerWidth: 440,
  drawerFloatLimitWidth: 1280,
  showTopMenu: true,
  showCenterMenu: true,
  showBottomMenu: true,
  groups: [
    {
      key: 'group-center-main',
      title: '主菜单',
      section: 'center',
      visible: true,
      sortOrder: 10,
    },
    {
      key: 'group-bottom-system',
      title: '底部功能',
      section: 'bottom',
      visible: true,
      sortOrder: 20,
    },
  ],
  items: [
    {
      key: 'logo',
      title: 'Logo',
      section: 'top',
      groupKey: '',
      iconSource: 'default',
      iconType: 'system',
      icon: 'logo',
      inactiveIconUrl: '',
      activeIconUrl: '',
      visible: true,
      badgeText: '',
      badgeTone: 'default',
      actionType: 'route',
      actionValue: '/',
      sortOrder: 10,
    },
    {
      key: 'home',
      title: '灵感',
      section: 'center',
      groupKey: 'group-center-main',
      iconSource: 'default',
      iconType: 'system',
      icon: 'home',
      inactiveIconUrl: '',
      activeIconUrl: '',
      visible: true,
      badgeText: '',
      badgeTone: 'default',
      actionType: 'route',
      actionValue: '/',
      sortOrder: 10,
    },
    {
      key: 'generate',
      title: '生成',
      section: 'center',
      groupKey: 'group-center-main',
      iconSource: 'default',
      iconType: 'system',
      icon: 'generate',
      inactiveIconUrl: '',
      activeIconUrl: '',
      visible: true,
      badgeText: '',
      badgeTone: 'primary',
      actionType: 'route',
      actionValue: '/generate',
      sortOrder: 20,
    },
    {
      key: 'asset',
      title: '资产',
      section: 'center',
      groupKey: 'group-center-main',
      iconSource: 'default',
      iconType: 'system',
      icon: 'asset',
      inactiveIconUrl: '',
      activeIconUrl: '',
      visible: true,
      badgeText: '',
      badgeTone: 'default',
      actionType: 'route',
      actionValue: '/asset',
      sortOrder: 30,
    },
    {
      key: 'canvas',
      title: '画布',
      section: 'center',
      groupKey: 'group-center-main',
      iconSource: 'default',
      iconType: 'system',
      icon: 'canvas',
      inactiveIconUrl: '',
      activeIconUrl: '',
      visible: true,
      badgeText: '',
      badgeTone: 'default',
      actionType: 'route',
      actionValue: '/canvas',
      sortOrder: 40,
    },
    {
      key: 'workflow',
      title: '工作流',
      section: 'center',
      groupKey: 'group-center-main',
      iconSource: 'default',
      iconType: 'system',
      icon: 'workflow',
      inactiveIconUrl: '',
      activeIconUrl: '',
      visible: true,
      badgeText: '',
      badgeTone: 'default',
      actionType: 'route',
      actionValue: '/agentic-assets-canvas',
      sortOrder: 50,
    },
    {
      key: 'account',
      title: '账号',
      section: 'center',
      groupKey: 'group-center-main',
      iconSource: 'default',
      iconType: 'system',
      icon: 'account',
      inactiveIconUrl: '',
      activeIconUrl: '',
      visible: true,
      badgeText: '',
      badgeTone: 'default',
      actionType: 'route',
      actionValue: '/account',
      sortOrder: 60,
    },
    {
      key: 'publish',
      title: '发布',
      section: 'center',
      groupKey: 'group-center-main',
      iconSource: 'default',
      iconType: 'system',
      icon: 'publish',
      inactiveIconUrl: '',
      activeIconUrl: '',
      visible: true,
      badgeText: '',
      badgeTone: 'default',
      actionType: 'route',
      actionValue: '/publish',
      sortOrder: 70,
    },
    {
      key: 'marketing',
      title: '福利',
      section: 'bottom',
      groupKey: 'group-bottom-system',
      iconSource: 'default',
      iconType: 'system',
      icon: 'marketing',
      inactiveIconUrl: '',
      activeIconUrl: '',
      visible: true,
      badgeText: '',
      badgeTone: 'default',
      actionType: 'dialog',
      actionValue: 'marketing',
      sortOrder: 10,
    },
    {
      key: 'account-entry',
      title: '登录',
      section: 'bottom',
      groupKey: 'group-bottom-system',
      iconSource: 'default',
      iconType: 'system',
      icon: 'account',
      inactiveIconUrl: '',
      activeIconUrl: '',
      visible: true,
      badgeText: '',
      badgeTone: 'default',
      actionType: 'dialog',
      actionValue: 'login',
      sortOrder: 20,
    },
    {
      key: 'notification',
      title: '通知',
      section: 'bottom',
      groupKey: 'group-bottom-system',
      iconSource: 'default',
      iconType: 'system',
      icon: 'notification',
      inactiveIconUrl: '',
      activeIconUrl: '',
      visible: true,
      badgeText: '',
      badgeTone: 'default',
      actionType: 'none',
      actionValue: '',
      sortOrder: 30,
    },
    {
      key: 'app-download',
      title: 'APP下载',
      section: 'bottom',
      groupKey: 'group-bottom-system',
      iconSource: 'default',
      iconType: 'system',
      icon: 'app-download',
      inactiveIconUrl: '',
      activeIconUrl: '',
      visible: true,
      badgeText: '',
      badgeTone: 'default',
      actionType: 'none',
      actionValue: '',
      sortOrder: 40,
    },
    {
      key: 'api-entry',
      title: 'API',
      section: 'bottom',
      groupKey: 'group-bottom-system',
      iconSource: 'default',
      iconType: 'system',
      icon: 'api-entry',
      inactiveIconUrl: '',
      activeIconUrl: '',
      visible: true,
      badgeText: '',
      badgeTone: 'default',
      actionType: 'none',
      actionValue: '',
      sortOrder: 50,
    },
    {
      key: 'settings',
      title: '设置',
      section: 'bottom',
      groupKey: 'group-bottom-system',
      iconSource: 'default',
      iconType: 'system',
      icon: 'settings',
      inactiveIconUrl: '',
      activeIconUrl: '',
      visible: true,
      badgeText: '',
      badgeTone: 'default',
      actionType: 'none',
      actionValue: '',
      sortOrder: 60,
    },
  ],
})

export const createDefaultHomeLayoutSettings = (): SystemHomeLayoutSettingsConfig => ({
  header: {
    showSiteDescription: true,
    showTaskIndicator: true,
    showBanner: true,
  },
  topBanner: createDefaultHomeTopBannerSettings(),
  banner: {
    enabled: true,
    items: [
      {
        key: 'motion',
        title: '动作模仿',
        subtitle: '响应更灵动',
        imageSource: 'default',
        presetKey: 'motion',
        imageUrl: '',
        backgroundImageUrl: '',
        mainImageUrl: '',
        overlayImageUrl: '',
        glowColor: '#2FE3FF',
        actionType: 'route',
        actionValue: '/generate?type=motion',
        visible: true,
        sortOrder: 10,
      },
      {
        key: 'image',
        title: '图片生成',
        subtitle: '智能美学提升',
        imageSource: 'default',
        presetKey: 'image',
        imageUrl: '',
        backgroundImageUrl: '',
        mainImageUrl: '',
        overlayImageUrl: '',
        glowColor: '#00B1CC',
        actionType: 'route',
        actionValue: '/generate?type=image',
        visible: true,
        sortOrder: 20,
      },
      {
        key: 'video',
        title: '视频生成',
        subtitle: '支持音画同出',
        imageSource: 'default',
        presetKey: 'video',
        imageUrl: '',
        backgroundImageUrl: '',
        mainImageUrl: '',
        overlayImageUrl: '',
        glowColor: '#2197FF',
        actionType: 'route',
        actionValue: '/generate?type=video',
        visible: true,
        sortOrder: 30,
      },
      {
        key: 'digital-human',
        title: '数字人',
        subtitle: '轻松生成数字分身',
        imageSource: 'default',
        presetKey: 'digital-human',
        imageUrl: '',
        backgroundImageUrl: '',
        mainImageUrl: '',
        overlayImageUrl: '',
        glowColor: '#9B6BFF',
        actionType: 'route',
        actionValue: '/generate?type=digital-human',
        visible: true,
        sortOrder: 40,
      },
      {
        key: 'agent',
        title: 'Agent 模式',
        subtitle: '多步骤智能创作',
        imageSource: 'default',
        presetKey: 'agent',
        imageUrl: '',
        backgroundImageUrl: '',
        mainImageUrl: '',
        overlayImageUrl: '',
        glowColor: '#FFD057',
        actionType: 'route',
        actionValue: '/generate?type=agent',
        visible: true,
        sortOrder: 50,
      },
    ],
  },
})

const SYSTEM_CONFIG_PUBLIC_API_PATH = '/api/system-config/public'
const SYSTEM_CONFIG_ADMIN_API_PATH = '/api/system-config/admin'
const SYSTEM_CONFIG_ADMIN_SITE_INFO_API_PATH = '/api/system-config/admin/site-info'
const SYSTEM_CONFIG_ADMIN_POLICIES_API_PATH = '/api/system-config/admin/policies'
const SYSTEM_CONFIG_ADMIN_LOGIN_API_PATH = '/api/system-config/admin/login'
const SYSTEM_CONFIG_ADMIN_THEME_API_PATH = '/api/system-config/admin/theme'
const SYSTEM_CONFIG_ADMIN_HOME_LAYOUT_API_PATH = '/api/system-config/admin/home-layout'
const SYSTEM_CONFIG_ADMIN_CONVERSATION_API_PATH = '/api/system-config/admin/conversation'
const SYSTEM_CONFIG_REDIS_HEALTH_API_PATH = '/api/system-config/admin/redis-health'
const SYSTEM_CONFIG_REDIS_OVERVIEW_API_PATH = '/api/system-config/admin/redis-overview'
const SYSTEM_CONFIG_REDIS_ACTIONS_API_PATH = '/api/system-config/admin/redis-actions'
const SYSTEM_CONFIG_REDIS_TASK_DETAIL_API_PATH = '/api/system-config/admin/redis-task-detail'
const SYSTEM_CONFIG_REDIS_SETTINGS_API_PATH = '/api/system-config/admin/redis-settings'

export interface RedisHealthConfig {
  enabled: boolean
  ok: boolean
  message: string
}

export interface RedisBusinessCacheHotKeyConfig {
  scope: string
  key: string
  score: number
}

export interface RedisBusinessCacheLargeValueConfig {
  scope: string
  key: string
  bytes: number
}

export interface RedisBusinessCacheWarningConfig {
  level: 'info' | 'warning'
  message: string
}

export interface RedisBusinessCacheModuleConfig {
  scope: string
  currentKeyCount: number
  sampleKeys: string[]
  hitCount: number
  missCount: number
  readCount: number
  writeCount: number
  invalidateCount: number
  hitRate: number
  lastHitAt: string
  lastMissAt: string
  lastWriteAt: string
  lastInvalidateAt: string
  lastValueBytes: number
  maxValueBytes: number
  averageValueBytes: number
  hotKeys: Array<{
    key: string
    score: number
  }>
  largeValues: Array<{
    key: string
    bytes: number
  }>
}

export interface RedisAdminOverviewConfig {
  enabled: boolean
  prefix: string
  env: string
  instanceId: string
  health: RedisHealthConfig
  riskHints: Array<{
    level: 'info' | 'warning' | 'danger'
    message: string
  }>
  caches: {
    providerCatalog: {
      key: string
      count: number
      ttlSeconds: number
      sampleKeys: string[]
    }
    providerDiscover: {
      pattern: string
      count: number
      sampleKeys: string[]
    }
    publicEnabledSkills: {
      key: string
      count: number
      ttlSeconds: number
      sampleKeys: string[]
    }
    runtimeSkills: {
      pattern: string
      count: number
      sampleKeys: string[]
    }
    workspaceRuntimeSkills: {
      pattern: string
      count: number
      sampleKeys: string[]
    }
  }
  tasks: {
    runtime: {
      pattern: string
      count: number
      sampleKeys: string[]
    }
    snapshot: {
      pattern: string
      count: number
      sampleKeys: string[]
    }
    abort: {
      pattern: string
      count: number
      sampleKeys: string[]
    }
    lock: {
      pattern: string
      count: number
      sampleKeys: string[]
    }
    idempotency: {
      pattern: string
      count: number
      sampleKeys: string[]
    }
    userConcurrency: {
      pattern: string
      count: number
      sampleKeys: string[]
    }
    skillConcurrency: {
      pattern: string
      count: number
      sampleKeys: string[]
    }
    providerConcurrency: {
      pattern: string
      count: number
      sampleKeys: string[]
    }
    submitRateLimit: {
      pattern: string
      count: number
      sampleKeys: string[]
    }
    providerDiscoverRateLimit: {
      pattern: string
      count: number
      sampleKeys: string[]
    }
    authVerificationRateLimit: {
      pattern: string
      count: number
      sampleKeys: string[]
    }
    authLoginRateLimit: {
      pattern: string
      count: number
      sampleKeys: string[]
    }
  }
  businessCaches: {
    modules: RedisBusinessCacheModuleConfig[]
    diagnostics: {
      hotKeys: RedisBusinessCacheHotKeyConfig[]
      largeValues: RedisBusinessCacheLargeValueConfig[]
      warnings: RedisBusinessCacheWarningConfig[]
    }
  }
}

export interface RedisTaskDetailConfig {
  recordId: string
  runtime: {
    recordId: string
    userId: string
    type: 'image' | 'agent'
    strategyKey: string
    status: 'queued' | 'running' | 'completed' | 'failed' | 'stopped'
    updatedAt: string
    providerId?: string
    modelKey?: string
    skillKey?: string
  } | null
  abort: {
    exists: boolean
    ttlSeconds: number
  }
  lock: {
    exists: boolean
    ttlMs: number
  }
  recentEvents: Array<{
    type: string
    stage: string
    message: string
    done: boolean
    stopped: boolean
    createdAt: string
  }>
  database: {
    id: string
    userId: string
    type: string
    status: string
    prompt: string
    modelKey: string
    skill: string
    error: string
    outputCount: number
    imageCount: number
    hasAgentRun: boolean
    agentRunStatus: string
    createdAt: string
    updatedAt: string
    finishedAt: string
  } | null
  snapshot: {
    id: string
    type: string
    prompt: string
    modelKey: string
    skill: string
    done: boolean
    stopped: boolean
    error: string
    imageCount: number
    outputCount: number
    hasAgentRun: boolean
    agentRunStatus: string
    updatedAt: string
  } | null
  governance: {
    queue: {
      enteredAt: string
      startedAt: string
      waitDurationMs: number
      reason: string
    } | null
    retry: {
      totalRetryCount: number
      burstRateRetryCount: number
      lastRetryAt: string
      lastRetryStage: string
      lastWaitDurationMs: number
      lastStatusCode: number
      lastErrorPreview: string
    } | null
    execution: {
      lockAcquiredAt: string
      lockLost: boolean
      completedAt: string
      lastErrorAt: string
      lastErrorMessage: string
    } | null
  }
}

export interface SystemRedisRuntimeSettingsConfig {
  taskSubmitRateLimit: number
  authVerificationRateLimit: number
  authLoginRateLimit: number
  providerModelDiscoverRateLimit: number
  taskUserConcurrencyLimit: number
  taskSkillConcurrencyLimit: number
  taskProviderConcurrencyLimit: number
}

const normalizeGlobalThemeSettings = (value?: SystemGlobalThemeSettingsConfig | null): SystemGlobalThemeSettingsConfig => {
  const defaults = createDefaultGlobalThemeSettings()
  const legacyBackgrounds = (value as any)?.backgrounds
  const nextThemes = (value as any)?.themes

  return {
    modePolicy: {
      ...defaults.modePolicy,
      ...(value?.modePolicy || {}),
    },
    themes: {
      dark: {
        backgrounds: {
          ...defaults.themes.dark.backgrounds,
          ...(legacyBackgrounds || {}),
          ...(nextThemes?.dark?.backgrounds || {}),
        },
      },
      light: {
        backgrounds: {
          ...defaults.themes.light.backgrounds,
          ...(nextThemes?.light?.backgrounds || {}),
        },
      },
    },
    brandColors: {
      ...defaults.brandColors,
      ...(value?.brandColors || {}),
    },
    gradients: {
      ...defaults.gradients,
      ...(value?.gradients || {}),
    },
    surfaces: {
      ...defaults.surfaces,
      ...(value?.surfaces || {}),
    },
  }
}

const normalizeHomeSideMenuSettings = (value?: SystemHomeSideMenuSettingsConfig | null): SystemHomeSideMenuSettingsConfig => {
  const defaults = createDefaultHomeSideMenuSettings()
  const incomingGroups = Array.isArray(value?.groups) ? value!.groups : []
  const incomingItems = Array.isArray(value?.items) ? value!.items : []

  const normalizedGroups = defaults.groups.map(defaultGroup => {
    const matchedGroup = incomingGroups.find(group => group.key === defaultGroup.key)
    return {
      ...defaultGroup,
      ...(matchedGroup || {}),
    }
  })

  const extraGroups = incomingGroups.filter(group => !normalizedGroups.some(defaultGroup => defaultGroup.key === group.key))

  const normalizedItems = defaults.items.map(defaultItem => {
    const matchedItem = incomingItems.find(item => item.key === defaultItem.key)
    const nextItem = {
      ...defaultItem,
      ...(matchedItem || {}),
    }

    // 工作流入口统一接入新的画布工作台页面，兼容旧配置里残留的 /workflow。
    if (nextItem.key === 'workflow' && nextItem.actionType === 'route') {
      nextItem.actionValue = '/agentic-assets-canvas'
    }

    return {
      ...nextItem,
    }
  })

  const extraItems = incomingItems.filter(item => !normalizedItems.some(defaultItem => defaultItem.key === item.key))

  return {
    ...defaults,
    ...(value || {}),
    layoutMode: value?.layoutMode === 'top' ? 'top' : 'side',
    groups: [...normalizedGroups, ...extraGroups].sort((left, right) => left.sortOrder - right.sortOrder),
    items: [...normalizedItems, ...extraItems].sort((left, right) => left.sortOrder - right.sortOrder),
  }
}

/** 与 Pro 对齐：公开/后台包统一补齐 topBanner，避免前台读到半残布局 */
export const normalizeHomeLayoutSettings = (
  value?: SystemHomeLayoutSettingsConfig | null,
): SystemHomeLayoutSettingsConfig => {
  const defaults = createDefaultHomeLayoutSettings()
  return {
    ...defaults,
    ...(value || {}),
    header: {
      ...defaults.header,
      ...(value?.header || {}),
    },
    topBanner: normalizeHomeTopBannerSettings(value?.topBanner),
    banner: {
      ...defaults.banner,
      ...(value?.banner || {}),
      items: Array.isArray(value?.banner?.items) && value.banner.items.length
        ? value.banner.items
        : defaults.banner.items.map(item => ({ ...item })),
    },
  }
}

const normalizeSystemConfigPayload = (payload: SystemConfigPayload): SystemConfigPayload => {
  return {
    ...payload,
    globalThemeSettings: normalizeGlobalThemeSettings(payload.globalThemeSettings),
    homeSideMenuSettings: normalizeHomeSideMenuSettings(payload.homeSideMenuSettings),
    homeLayoutSettings: normalizeHomeLayoutSettings(payload.homeLayoutSettings),
  }
}

// 获取前台可见系统设置。
export const getPublicSystemConfig = async (): Promise<SystemConfigPayload> => {
  const response = await fetch(buildApiUrl(SYSTEM_CONFIG_PUBLIC_API_PATH), {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
  })

  return normalizeSystemConfigPayload(await readApiData<SystemConfigPayload>(response))
}

// 获取后台系统设置。
export const getAdminSystemConfig = async (): Promise<SystemConfigPayload> => {
  const response = await fetch(buildApiUrl(SYSTEM_CONFIG_ADMIN_API_PATH), {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
  })

  return normalizeSystemConfigPayload(await readApiData<SystemConfigPayload>(response))
}

export const getRedisHealth = async (): Promise<RedisHealthConfig> => {
  const response = await fetch(buildApiUrl(SYSTEM_CONFIG_REDIS_HEALTH_API_PATH), {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
  })

  return readApiData<RedisHealthConfig>(response)
}

export const getRedisAdminOverview = async (): Promise<RedisAdminOverviewConfig> => {
  const response = await fetch(buildApiUrl(SYSTEM_CONFIG_REDIS_OVERVIEW_API_PATH), {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
  })

  return readApiData<RedisAdminOverviewConfig>(response)
}

export const clearRedisCacheScope = async (scope: 'provider-model-catalog' | 'skill-runtime' | 'task-runtime') => {
  const response = await fetch(buildApiUrl(SYSTEM_CONFIG_REDIS_ACTIONS_API_PATH), {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ scope }),
  })

  return readApiData<{ scope: string; deletedCount: number }>(response, {
    showSuccessMessage: true,
    showErrorMessage: true,
  })
}

export const getRedisTaskDetail = async (recordId: string): Promise<RedisTaskDetailConfig> => {
  const requestUrl = buildApiUrl(`${SYSTEM_CONFIG_REDIS_TASK_DETAIL_API_PATH}?recordId=${encodeURIComponent(recordId)}`)
  const response = await fetch(requestUrl, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
  })

  return readApiData<RedisTaskDetailConfig>(response, {
    showErrorMessage: true,
  })
}

export const getRedisRuntimeSettings = async (): Promise<SystemRedisRuntimeSettingsConfig> => {
  const response = await fetch(buildApiUrl(SYSTEM_CONFIG_REDIS_SETTINGS_API_PATH), {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
  })

  return readApiData<SystemRedisRuntimeSettingsConfig>(response, {
    showErrorMessage: true,
  })
}

export const saveRedisRuntimeSettings = async (payload: SystemRedisRuntimeSettingsConfig): Promise<SystemRedisRuntimeSettingsConfig> => {
  const response = await fetch(buildApiUrl(SYSTEM_CONFIG_REDIS_SETTINGS_API_PATH), {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  return readApiData<SystemRedisRuntimeSettingsConfig>(response, {
    showSuccessMessage: true,
    showErrorMessage: true,
  })
}

// 保存后台系统设置。
export const saveAdminSystemConfig = async (payload: SystemConfigPayload): Promise<SystemConfigPayload> => {
  const response = await fetch(buildApiUrl(SYSTEM_CONFIG_ADMIN_API_PATH), {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  return normalizeSystemConfigPayload(await readApiData<SystemConfigPayload>(response, {
    showSuccessMessage: true,
    showErrorMessage: true,
  }))
}

const saveAdminSystemConfigSection = async (
  path: string,
  payload: Partial<SystemConfigPayload>,
): Promise<SystemConfigPayload> => {
  const response = await fetch(buildApiUrl(path), {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  return normalizeSystemConfigPayload(await readApiData<SystemConfigPayload>(response, {
    showSuccessMessage: true,
    showErrorMessage: true,
  }))
}

export const saveAdminSiteInfoSettings = (payload: Pick<SystemConfigPayload, 'siteInfo'>): Promise<SystemConfigPayload> => {
  return saveAdminSystemConfigSection(SYSTEM_CONFIG_ADMIN_SITE_INFO_API_PATH, payload)
}

export const saveAdminPolicySettings = (payload: Pick<SystemConfigPayload, 'policySettings'>): Promise<SystemConfigPayload> => {
  return saveAdminSystemConfigSection(SYSTEM_CONFIG_ADMIN_POLICIES_API_PATH, payload)
}

export const saveAdminLoginSettings = (
  payload: Pick<SystemConfigPayload, 'loginSettings' | 'generationProgressSettings'>,
): Promise<SystemConfigPayload> => {
  return saveAdminSystemConfigSection(SYSTEM_CONFIG_ADMIN_LOGIN_API_PATH, payload)
}

export const saveAdminThemeSettings = (payload: Pick<SystemConfigPayload, 'globalThemeSettings'>): Promise<SystemConfigPayload> => {
  return saveAdminSystemConfigSection(SYSTEM_CONFIG_ADMIN_THEME_API_PATH, payload)
}

export const saveAdminHomeLayoutSettings = (
  payload: Pick<SystemConfigPayload, 'homeSideMenuSettings' | 'homeLayoutSettings'>,
): Promise<SystemConfigPayload> => {
  return saveAdminSystemConfigSection(SYSTEM_CONFIG_ADMIN_HOME_LAYOUT_API_PATH, payload)
}

export const saveAdminConversationSettings = (
  payload: Pick<SystemConfigPayload, 'conversationSettings' | 'generationProgressSettings'>,
): Promise<SystemConfigPayload> => {
  return saveAdminSystemConfigSection(SYSTEM_CONFIG_ADMIN_CONVERSATION_API_PATH, payload)
}
