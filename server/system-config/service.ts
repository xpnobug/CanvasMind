import crypto from 'node:crypto'
import prisma from '../db/prisma'
import { REDIS_CONFIG } from '../redis/config'
import { invalidateRedisCaches } from '../redis/cache-manager'
import { getOrSetJsonCache } from '../redis/json-cache'
import { redisKeys } from '../redis/keys'
import type {
  SystemConfigPayload,
  SystemConversationModeOptionPayload,
  SystemConversationSettingsPayload,
  SystemRedisRuntimeSettingsPayload,
} from './shared'

const SYSTEM_CONFIG_CODES = {
  siteInfo: 'SITE_INFO',
  policySettings: 'POLICY_SETTINGS',
  loginSettings: 'LOGIN_SETTINGS',
  generationProgressSettings: 'GENERATION_PROGRESS_SETTINGS',
  conversationSettings: 'CONVERSATION_SETTINGS',
  globalThemeSettings: 'GLOBAL_THEME_SETTINGS',
  homeSideMenuSettings: 'HOME_SIDE_MENU_SETTINGS',
  homeLayoutSettings: 'HOME_LAYOUT_SETTINGS',
  redisRuntimeSettings: 'REDIS_RUNTIME_SETTINGS',
} as const

const SYSTEM_CONFIG_NAMES = {
  [SYSTEM_CONFIG_CODES.siteInfo]: '站点信息',
  [SYSTEM_CONFIG_CODES.policySettings]: '政策协议',
  [SYSTEM_CONFIG_CODES.loginSettings]: '登录设置',
  [SYSTEM_CONFIG_CODES.generationProgressSettings]: '生成进度设置',
  [SYSTEM_CONFIG_CODES.conversationSettings]: '会话设置',
  [SYSTEM_CONFIG_CODES.globalThemeSettings]: '全局主题',
  [SYSTEM_CONFIG_CODES.homeSideMenuSettings]: '首页左侧菜单',
  [SYSTEM_CONFIG_CODES.homeLayoutSettings]: '首页布局配置',
  [SYSTEM_CONFIG_CODES.redisRuntimeSettings]: 'Redis 运行参数',
} as const

const ADMIN_SYSTEM_CONFIG_CACHE_KEY = redisKeys.cache('system-config', 'admin')
const PUBLIC_SYSTEM_CONFIG_CACHE_KEY = redisKeys.cache('system-config', 'public')
const REDIS_RUNTIME_SETTINGS_CACHE_KEY = redisKeys.cache('system-config', 'redis-runtime-settings')

const DEFAULT_CREATION_MODE_OPTIONS = [
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

const DEFAULT_HOME_SIDE_MENU_ITEMS = [
  { key: 'logo', title: 'Logo', section: 'top', iconSource: 'default', iconType: 'system', icon: 'logo', inactiveIconUrl: '', activeIconUrl: '', visible: true, badgeText: '', badgeTone: 'default', actionType: 'route', actionValue: '/', sortOrder: 10 },
  { key: 'home', title: '灵感', section: 'center', iconSource: 'default', iconType: 'system', icon: 'home', inactiveIconUrl: '', activeIconUrl: '', visible: true, badgeText: '', badgeTone: 'default', actionType: 'route', actionValue: '/', sortOrder: 10 },
  { key: 'generate', title: '生成', section: 'center', iconSource: 'default', iconType: 'system', icon: 'generate', inactiveIconUrl: '', activeIconUrl: '', visible: true, badgeText: '', badgeTone: 'primary', actionType: 'route', actionValue: '/generate', sortOrder: 20 },
  { key: 'asset', title: '资产', section: 'center', iconSource: 'default', iconType: 'system', icon: 'asset', inactiveIconUrl: '', activeIconUrl: '', visible: true, badgeText: '', badgeTone: 'default', actionType: 'route', actionValue: '/asset', sortOrder: 30 },
  { key: 'workflow', title: '工作流', section: 'center', iconSource: 'default', iconType: 'system', icon: 'workflow', inactiveIconUrl: '', activeIconUrl: '', visible: true, badgeText: '', badgeTone: 'default', actionType: 'route', actionValue: '/workflow', sortOrder: 40 },
  { key: 'account', title: '账号', section: 'center', iconSource: 'default', iconType: 'system', icon: 'account', inactiveIconUrl: '', activeIconUrl: '', visible: true, badgeText: '', badgeTone: 'default', actionType: 'route', actionValue: '/account', sortOrder: 50 },
  { key: 'publish', title: '发布', section: 'center', iconSource: 'default', iconType: 'system', icon: 'publish', inactiveIconUrl: '', activeIconUrl: '', visible: true, badgeText: '', badgeTone: 'default', actionType: 'route', actionValue: '/publish', sortOrder: 60 },
  { key: 'marketing', title: '福利', section: 'bottom', iconSource: 'default', iconType: 'system', icon: 'marketing', inactiveIconUrl: '', activeIconUrl: '', visible: true, badgeText: '', badgeTone: 'default', actionType: 'dialog', actionValue: 'marketing', sortOrder: 10 },
  { key: 'account-entry', title: '登录', section: 'bottom', iconSource: 'default', iconType: 'system', icon: 'account', inactiveIconUrl: '', activeIconUrl: '', visible: true, badgeText: '', badgeTone: 'default', actionType: 'dialog', actionValue: 'login', sortOrder: 20 },
  { key: 'notification', title: '通知', section: 'bottom', iconSource: 'default', iconType: 'system', icon: 'notification', inactiveIconUrl: '', activeIconUrl: '', visible: true, badgeText: '', badgeTone: 'default', actionType: 'none', actionValue: '', sortOrder: 30 },
  { key: 'app-download', title: 'APP下载', section: 'bottom', iconSource: 'default', iconType: 'system', icon: 'app-download', inactiveIconUrl: '', activeIconUrl: '', visible: true, badgeText: '', badgeTone: 'default', actionType: 'none', actionValue: '', sortOrder: 40 },
  { key: 'api-entry', title: 'API', section: 'bottom', iconSource: 'default', iconType: 'system', icon: 'api-entry', inactiveIconUrl: '', activeIconUrl: '', visible: true, badgeText: '', badgeTone: 'default', actionType: 'none', actionValue: '', sortOrder: 50 },
  { key: 'settings', title: '设置', section: 'bottom', iconSource: 'default', iconType: 'system', icon: 'settings', inactiveIconUrl: '', activeIconUrl: '', visible: true, badgeText: '', badgeTone: 'default', actionType: 'none', actionValue: '', sortOrder: 60 },
] as const

const DEFAULT_HOME_BANNER_ITEMS = [
  { key: 'motion', title: '动作模仿', subtitle: '响应更灵动', imageSource: 'default', presetKey: 'motion', imageUrl: '', backgroundImageUrl: '', mainImageUrl: '', overlayImageUrl: '', glowColor: '#2FE3FF', actionType: 'route', actionValue: '/generate?type=motion', visible: true, sortOrder: 10 },
  { key: 'image', title: '图片生成', subtitle: '智能美学提升', imageSource: 'default', presetKey: 'image', imageUrl: '', backgroundImageUrl: '', mainImageUrl: '', overlayImageUrl: '', glowColor: '#00B1CC', actionType: 'route', actionValue: '/generate?type=image', visible: true, sortOrder: 20 },
  { key: 'video', title: '视频生成', subtitle: '支持音画同出', imageSource: 'default', presetKey: 'video', imageUrl: '', backgroundImageUrl: '', mainImageUrl: '', overlayImageUrl: '', glowColor: '#2197FF', actionType: 'route', actionValue: '/generate?type=video', visible: true, sortOrder: 30 },
  { key: 'digital-human', title: '数字人', subtitle: '轻松生成数字分身', imageSource: 'default', presetKey: 'digital-human', imageUrl: '', backgroundImageUrl: '', mainImageUrl: '', overlayImageUrl: '', glowColor: '#9B6BFF', actionType: 'route', actionValue: '/generate?type=digital-human', visible: true, sortOrder: 40 },
  { key: 'agent', title: 'Agent 模式', subtitle: '多步骤智能创作', imageSource: 'default', presetKey: 'agent', imageUrl: '', backgroundImageUrl: '', mainImageUrl: '', overlayImageUrl: '', glowColor: '#FFD057', actionType: 'route', actionValue: '/generate?type=agent', visible: true, sortOrder: 50 },
] as const

/** 顶通横幅默认关闭；旧库无字段时 normalize 用此兜底，避免读写丢字段 */
const DEFAULT_HOME_TOP_BANNER = {
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
}

const createDefaultSystemConfig = () => ({
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
  generationProgressSettings: {
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
  },
  conversationSettings: {
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
        headerBackgroundGlowColor: '#008EE5',
        headerBackgroundGlowColorLight: '#008EE5',
        headerBackgroundGlowOpacity: 0.28,
        headerBackgroundGlowOpacityLight: 0.12,
        headerBackgroundGlowEnabled: true,
        headerBackgroundStarEnabled: true,
        headerBackgroundStarColor: '#FFFFFF0A',
        headerBackgroundStarColorLight: '#00000008',
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
  },
  // 默认品牌配色：主色 #55b8cc（导出稿），默认深色壳
  globalThemeSettings: {
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
  },
  homeSideMenuSettings: {
    enabled: true,
    layoutMode: 'side',
    collapsedWidth: 76,
    drawerWidth: 440,
    drawerFloatLimitWidth: 1280,
    showTopMenu: true,
    showCenterMenu: true,
    showBottomMenu: true,
    items: DEFAULT_HOME_SIDE_MENU_ITEMS.map(item => ({ ...item })),
  },
  homeLayoutSettings: {
    header: {
      showSiteDescription: true,
      showTaskIndicator: true,
      showBanner: true,
    },
    topBanner: { ...DEFAULT_HOME_TOP_BANNER },
    banner: {
      enabled: true,
      items: DEFAULT_HOME_BANNER_ITEMS.map(item => ({ ...item })),
    },
  },
  redisRuntimeSettings: {
    taskSubmitRateLimit: REDIS_CONFIG.taskSubmitRateLimit,
    authVerificationRateLimit: REDIS_CONFIG.authVerificationRateLimit,
    authLoginRateLimit: REDIS_CONFIG.authLoginRateLimit,
    providerModelDiscoverRateLimit: Math.max(REDIS_CONFIG.taskSubmitRateLimit, 3),
    taskUserConcurrencyLimit: REDIS_CONFIG.taskUserConcurrencyLimit,
    taskSkillConcurrencyLimit: REDIS_CONFIG.taskSkillConcurrencyLimit,
    taskProviderConcurrencyLimit: REDIS_CONFIG.taskProviderConcurrencyLimit,
  },
})

const normalizeRedisRuntimeSettings = (value?: SystemRedisRuntimeSettingsPayload | null) => {
  const defaults = createDefaultSystemConfig().redisRuntimeSettings
  return {
    taskSubmitRateLimit: Number.isFinite(Number(value?.taskSubmitRateLimit))
      ? Math.max(1, Math.min(200, Number(value?.taskSubmitRateLimit)))
      : defaults.taskSubmitRateLimit,
    authVerificationRateLimit: Number.isFinite(Number(value?.authVerificationRateLimit))
      ? Math.max(1, Math.min(200, Number(value?.authVerificationRateLimit)))
      : defaults.authVerificationRateLimit,
    authLoginRateLimit: Number.isFinite(Number(value?.authLoginRateLimit))
      ? Math.max(1, Math.min(200, Number(value?.authLoginRateLimit)))
      : defaults.authLoginRateLimit,
    providerModelDiscoverRateLimit: Number.isFinite(Number(value?.providerModelDiscoverRateLimit))
      ? Math.max(1, Math.min(200, Number(value?.providerModelDiscoverRateLimit)))
      : defaults.providerModelDiscoverRateLimit,
    taskUserConcurrencyLimit: Number.isFinite(Number(value?.taskUserConcurrencyLimit))
      ? Math.max(1, Math.min(200, Number(value?.taskUserConcurrencyLimit)))
      : defaults.taskUserConcurrencyLimit,
    taskSkillConcurrencyLimit: Number.isFinite(Number(value?.taskSkillConcurrencyLimit))
      ? Math.max(1, Math.min(200, Number(value?.taskSkillConcurrencyLimit)))
      : defaults.taskSkillConcurrencyLimit,
    taskProviderConcurrencyLimit: Number.isFinite(Number(value?.taskProviderConcurrencyLimit))
      ? Math.max(1, Math.min(500, Number(value?.taskProviderConcurrencyLimit)))
      : defaults.taskProviderConcurrencyLimit,
  }
}

const normalizeConversationModeOptions = (value: unknown, fallback: SystemConversationModeOptionPayload[]) => {
  if (!Array.isArray(value)) {
    return fallback.map(option => ({ ...option }))
  }

  const options = value
    .map((item) => ({
      value: String((item as any)?.value || '').trim(),
      label: String((item as any)?.label || '').trim(),
    }))
    .filter(item => item.value && item.label)

  return options.length ? options : fallback.map(option => ({ ...option }))
}

const normalizeStringList = (value: unknown, fallback: string[]) => {
  if (!Array.isArray(value)) {
    return [...fallback]
  }

  const items = value
    .map(item => String(item || '').trim())
    .filter(Boolean)

  return items.length ? Array.from(new Set(items)) : [...fallback]
}

const normalizeHexColor = (value: unknown, fallback: string) => {
  const normalized = String(value || '').trim()
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(normalized)) {
    return normalized
  }
  return fallback
}

const normalizeSideMenuItems = (value: unknown, fallback: Array<Record<string, any>>) => {
  if (!Array.isArray(value)) {
    return fallback.map(item => ({ ...item }))
  }

  const normalized = value
    .map((item, index) => {
      const nextItem = readPlainObject(item)
      const key = String(nextItem.key || '').trim()
      if (!key) {
        return null
      }

      const matchedFallback = fallback.find(fallbackItem => fallbackItem.key === key)
      const defaultItem = matchedFallback || fallback[Math.max(0, Math.min(index, fallback.length - 1))]

      return {
        key,
        title: String(nextItem.title || defaultItem?.title || key).trim(),
        section: String(nextItem.section || defaultItem?.section || 'center').trim(),
        iconSource: String(
          nextItem.iconSource
          || (nextItem.iconType === 'image' ? 'custom' : '')
          || defaultItem?.iconSource
          || 'default',
        ).trim(),
        iconType: String(
          nextItem.iconType
          || (nextItem.iconSource === 'custom' ? 'image' : '')
          || defaultItem?.iconType
          || 'system',
        ).trim(),
        icon: String(nextItem.icon || defaultItem?.icon || key).trim(),
        inactiveIconUrl: String(nextItem.inactiveIconUrl || defaultItem?.inactiveIconUrl || '').trim(),
        activeIconUrl: String(nextItem.activeIconUrl || defaultItem?.activeIconUrl || '').trim(),
        visible: nextItem.visible !== false,
        badgeText: String(nextItem.badgeText || '').trim(),
        badgeTone: String(nextItem.badgeTone || defaultItem?.badgeTone || 'default').trim(),
        actionType: String(nextItem.actionType || defaultItem?.actionType || 'none').trim(),
        actionValue: String(nextItem.actionValue || defaultItem?.actionValue || '').trim(),
        sortOrder: Number.isFinite(Number(nextItem.sortOrder))
          ? Math.max(0, Math.min(9999, Number(nextItem.sortOrder)))
          : Number(defaultItem?.sortOrder || (index + 1) * 10),
      }
    })
    .filter(Boolean)

  return normalized.length ? normalized : fallback.map(item => ({ ...item }))
}

const normalizeHomeBannerItems = (value: unknown, fallback: Array<Record<string, any>>) => {
  if (!Array.isArray(value)) {
    return fallback.map(item => ({ ...item }))
  }

  const normalized = value
    .map((item, index) => {
      const nextItem = readPlainObject(item)
      const key = String(nextItem.key || '').trim()
      if (!key) {
        return null
      }

      const matchedFallback = fallback.find(fallbackItem => fallbackItem.key === key)
      const defaultItem = matchedFallback || fallback[Math.max(0, Math.min(index, fallback.length - 1))]

      return {
        key,
        title: String(nextItem.title || defaultItem?.title || key).trim(),
        subtitle: String(nextItem.subtitle || defaultItem?.subtitle || '').trim(),
        imageSource: (
          nextItem.imageSource === 'custom'
            ? 'custom'
            : nextItem.imageSource === 'default'
              ? 'default'
              : String(defaultItem?.imageSource || 'default')
        ) as 'default' | 'custom',
        presetKey: String(nextItem.presetKey || defaultItem?.presetKey || key).trim(),
        imageUrl: String(nextItem.imageUrl || defaultItem?.imageUrl || '').trim(),
        backgroundImageUrl: String(nextItem.backgroundImageUrl || defaultItem?.backgroundImageUrl || '').trim(),
        mainImageUrl: String(nextItem.mainImageUrl || defaultItem?.mainImageUrl || '').trim(),
        overlayImageUrl: String(nextItem.overlayImageUrl || defaultItem?.overlayImageUrl || '').trim(),
        glowColor: normalizeHexColor(nextItem.glowColor, String(defaultItem?.glowColor || '#2FE3FF')),
        actionType: String(nextItem.actionType || defaultItem?.actionType || 'none').trim(),
        actionValue: String(nextItem.actionValue || defaultItem?.actionValue || '').trim(),
        visible: nextItem.visible !== false,
        sortOrder: Number.isFinite(Number(nextItem.sortOrder))
          ? Math.max(0, Math.min(9999, Number(nextItem.sortOrder)))
          : Number(defaultItem?.sortOrder || (index + 1) * 10),
      }
    })
    .filter(Boolean)

  return normalized.length ? normalized : fallback.map(item => ({ ...item }))
}

/** 顶通横幅：显式字段合并，避免旧配置缺字段或保存时被整段丢掉 */
const normalizeHomeTopBannerSettings = (value: unknown, fallback: Record<string, any>) => {
  const nextValue = readPlainObject(value)
  const actionType = String(nextValue.actionType || fallback.actionType || 'none').trim()
  const resolveStringField = (field: string, defaultValue = '') => {
    if (Object.prototype.hasOwnProperty.call(nextValue, field)) {
      return String(nextValue[field] ?? '').trim()
    }
    return String(fallback[field] ?? defaultValue).trim()
  }

  return {
    enabled: nextValue.enabled === true,
    bannerId: resolveStringField('bannerId', 'home-top-banner-default') || 'home-top-banner-default',
    height: Number.isFinite(Number(nextValue.height))
      ? Math.max(0, Math.min(96, Number(nextValue.height)))
      : Number(fallback.height || 0),
    tagMode: String(nextValue.tagMode || fallback.tagMode || 'static').trim() === 'countdown' ? 'countdown' : 'static',
    tagText: resolveStringField('tagText'),
    tagTextColor: normalizeHexColor(nextValue.tagTextColor, String(fallback.tagTextColor || '#FFFFFF')),
    tagBackgroundColor: normalizeHexColor(nextValue.tagBackgroundColor, String(fallback.tagBackgroundColor || '#F50095')),
    countdownEndAt: resolveStringField('countdownEndAt'),
    showTagIcon: nextValue.showTagIcon !== false,
    contentText: resolveStringField('contentText'),
    contentTextColor: normalizeHexColor(nextValue.contentTextColor, String(fallback.contentTextColor || '#000000')),
    ctaEnabled: nextValue.ctaEnabled === true,
    ctaText: resolveStringField('ctaText'),
    ctaTextColor: normalizeHexColor(nextValue.ctaTextColor, String(fallback.ctaTextColor || '#000000')),
    ctaBorderColor: normalizeHexColor(nextValue.ctaBorderColor, String(fallback.ctaBorderColor || '#000000')),
    ctaBackgroundColor: resolveStringField('ctaBackgroundColor'),
    actionType: actionType === 'route' || actionType === 'url' || actionType === 'dialog' ? actionType : 'none',
    actionValue: resolveStringField('actionValue'),
    gradientStart: normalizeHexColor(nextValue.gradientStart, String(fallback.gradientStart || '#D5F5FF')),
    gradientEnd: normalizeHexColor(nextValue.gradientEnd, String(fallback.gradientEnd || '#D5F5FF')),
    backgroundImageUrl: resolveStringField('backgroundImageUrl'),
    showClose: nextValue.showClose !== false,
  }
}

export const createDefaultConversationSettings = () => createDefaultSystemConfig().conversationSettings
export const getDefaultGenerationProgressSettings = () => createDefaultSystemConfig().generationProgressSettings

export const normalizeConversationSettings = (input?: SystemConversationSettingsPayload | null) => {
  const defaults = createDefaultConversationSettings()
  const basicRules = readPlainObject(input?.basicRules)
  const listDisplay = readPlainObject(input?.listDisplay)
  const entryDisplay = readPlainObject(input?.entryDisplay)
  const hero = readPlainObject(entryDisplay.hero)
  const workbench = readPlainObject(entryDisplay.workbench)
  const inputSettings = readPlainObject(entryDisplay.input)
  const mode = readPlainObject(entryDisplay.mode)
  const modelSelector = readPlainObject(entryDisplay.modelSelector)
  const assistantSelector = readPlainObject(entryDisplay.assistantSelector)
  const actions = readPlainObject(entryDisplay.actions)
  const actionAuto = readPlainObject(actions.auto)
  const actionInspiration = readPlainObject(actions.inspiration)
  const actionCreativeDesign = readPlainObject(actions.creativeDesign)
  const managementPolicy = readPlainObject(input?.managementPolicy)

  return {
    basicRules: {
      defaultSessionTitle: String(basicRules.defaultSessionTitle || defaults.basicRules.defaultSessionTitle).trim(),
      newSessionTitlePrefix: String(basicRules.newSessionTitlePrefix || defaults.basicRules.newSessionTitlePrefix).trim(),
      sessionTitleMaxLength: Number.isFinite(Number(basicRules.sessionTitleMaxLength))
        ? Math.max(1, Math.min(200, Number(basicRules.sessionTitleMaxLength)))
        : defaults.basicRules.sessionTitleMaxLength,
      defaultSortMode: String(basicRules.defaultSortMode || defaults.basicRules.defaultSortMode).trim() || defaults.basicRules.defaultSortMode,
      allowDeleteDefaultSession: basicRules.allowDeleteDefaultSession === true,
      allowAdminRename: basicRules.allowAdminRename !== false,
      allowAdminDelete: basicRules.allowAdminDelete !== false,
    },
    listDisplay: {
      defaultPageSize: Number.isFinite(Number(listDisplay.defaultPageSize))
        ? Math.max(1, Math.min(100, Number(listDisplay.defaultPageSize)))
        : defaults.listDisplay.defaultPageSize,
      showUserInfo: listDisplay.showUserInfo !== false,
      showCoverImage: listDisplay.showCoverImage !== false,
      showLatestPrompt: listDisplay.showLatestPrompt !== false,
      showStatusStats: listDisplay.showStatusStats !== false,
      showSessionId: listDisplay.showSessionId !== false,
      showLastRecordTime: listDisplay.showLastRecordTime !== false,
      enableUserMasking: listDisplay.enableUserMasking === true,
    },
    entryDisplay: {
      hero: {
        enabled: hero.enabled !== false,
        title: String(hero.title || defaults.entryDisplay.hero.title).trim(),
        subtitle: String(hero.subtitle || '').trim(),
      },
      workbench: {
        titleEnabled: workbench.titleEnabled !== false,
        generatorEnabled: workbench.generatorEnabled !== false,
        taskIndicatorEnabled: workbench.taskIndicatorEnabled !== false,
        bannerEnabled: workbench.bannerEnabled !== false,
        showSiteName: workbench.showSiteName !== false,
        prefixText: String(workbench.prefixText || defaults.entryDisplay.workbench.prefixText).trim(),
        suffixText: String(workbench.suffixText || defaults.entryDisplay.workbench.suffixText).trim(),
        showModeSelectorInTitle: workbench.showModeSelectorInTitle !== false,
        showSubmitButton: workbench.showSubmitButton !== false,
        headerBackgroundEnabled: workbench.headerBackgroundEnabled !== false,
        headerBackgroundImageUrl: String(workbench.headerBackgroundImageUrl || '').trim(),
        headerBackgroundImageUrlLight: String(workbench.headerBackgroundImageUrlLight || '').trim(),
        headerBackgroundGlowColor: normalizeHexColor(
          workbench.headerBackgroundGlowColor,
          defaults.entryDisplay.workbench.headerBackgroundGlowColor,
        ),
        headerBackgroundGlowColorLight: normalizeHexColor(
          workbench.headerBackgroundGlowColorLight,
          defaults.entryDisplay.workbench.headerBackgroundGlowColorLight,
        ),
        headerBackgroundGlowOpacity: Number.isFinite(Number(workbench.headerBackgroundGlowOpacity))
          ? Math.max(0, Math.min(1, Number(workbench.headerBackgroundGlowOpacity)))
          : defaults.entryDisplay.workbench.headerBackgroundGlowOpacity,
        headerBackgroundGlowOpacityLight: Number.isFinite(Number(workbench.headerBackgroundGlowOpacityLight))
          ? Math.max(0, Math.min(1, Number(workbench.headerBackgroundGlowOpacityLight)))
          : defaults.entryDisplay.workbench.headerBackgroundGlowOpacityLight,
        headerBackgroundGlowEnabled: workbench.headerBackgroundGlowEnabled !== false,
        headerBackgroundStarEnabled: workbench.headerBackgroundStarEnabled !== false,
        headerBackgroundStarColor: normalizeHexColor(
          workbench.headerBackgroundStarColor,
          defaults.entryDisplay.workbench.headerBackgroundStarColor,
        ),
        headerBackgroundStarColorLight: normalizeHexColor(
          workbench.headerBackgroundStarColorLight,
          defaults.entryDisplay.workbench.headerBackgroundStarColorLight,
        ),
      },
      input: {
        placeholder: String(inputSettings.placeholder || defaults.entryDisplay.input.placeholder).trim(),
        autoResize: inputSettings.autoResize !== false,
        minRows: Number.isFinite(Number(inputSettings.minRows))
          ? Math.max(1, Math.min(12, Number(inputSettings.minRows)))
          : defaults.entryDisplay.input.minRows,
        maxWidth: Number.isFinite(Number(inputSettings.maxWidth))
          ? Math.max(320, Math.min(1600, Number(inputSettings.maxWidth)))
          : defaults.entryDisplay.input.maxWidth,
      },
      mode: {
        enabled: mode.enabled !== false,
        defaultMode: String(mode.defaultMode || defaults.entryDisplay.mode.defaultMode).trim(),
        options: normalizeConversationModeOptions(mode.options, defaults.entryDisplay.mode.options),
      },
      modelSelector: {
        enabled: modelSelector.enabled !== false,
        defaultModelKey: String(modelSelector.defaultModelKey || '').trim(),
        allowedModelKeys: normalizeStringList(modelSelector.allowedModelKeys, defaults.entryDisplay.modelSelector.allowedModelKeys),
        allowSkillOverride: modelSelector.allowSkillOverride !== false,
      },
      assistantSelector: {
        enabled: assistantSelector.enabled !== false,
        defaultAssistantKey: String(assistantSelector.defaultAssistantKey || defaults.entryDisplay.assistantSelector.defaultAssistantKey).trim(),
        allowedAssistantKeys: normalizeStringList(assistantSelector.allowedAssistantKeys, defaults.entryDisplay.assistantSelector.allowedAssistantKeys),
      },
      actions: {
        auto: {
          visible: actionAuto.visible !== false,
          defaultEnabled: actionAuto.defaultEnabled !== false,
        },
        inspiration: {
          visible: actionInspiration.visible !== false,
          defaultEnabled: actionInspiration.defaultEnabled === true,
        },
        creativeDesign: {
          visible: actionCreativeDesign.visible !== false,
          defaultEnabled: actionCreativeDesign.defaultEnabled === true,
        },
      },
    },
    managementPolicy: {
      allowBatchDelete: managementPolicy.allowBatchDelete !== false,
      allowExportSessions: managementPolicy.allowExportSessions === true,
      autoCleanupEnabled: managementPolicy.autoCleanupEnabled === true,
      emptySessionRetentionDays: Number.isFinite(Number(managementPolicy.emptySessionRetentionDays))
        ? Math.max(1, Math.min(3650, Number(managementPolicy.emptySessionRetentionDays)))
        : defaults.managementPolicy.emptySessionRetentionDays,
      completedSessionRetentionDays: Number.isFinite(Number(managementPolicy.completedSessionRetentionDays))
        ? Math.max(1, Math.min(3650, Number(managementPolicy.completedSessionRetentionDays)))
        : defaults.managementPolicy.completedSessionRetentionDays,
      failedSessionRetentionDays: Number.isFinite(Number(managementPolicy.failedSessionRetentionDays))
        ? Math.max(1, Math.min(3650, Number(managementPolicy.failedSessionRetentionDays)))
        : defaults.managementPolicy.failedSessionRetentionDays,
      deleteCascadeRecords: managementPolicy.deleteCascadeRecords !== false,
    },
  }
}

const readPlainObject = (value: unknown) => {
  if (!value) {
    return {}
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return parsed && typeof parsed === 'object' ? parsed as Record<string, any> : {}
    } catch {
      return {}
    }
  }

  return value && typeof value === 'object' ? value as Record<string, any> : {}
}

const normalizeSystemConfig = (input?: SystemConfigPayload | null) => {
  const defaults = createDefaultSystemConfig()
  const siteInfo = readPlainObject(input?.siteInfo)
  const policySettings = readPlainObject(input?.policySettings)
  const loginSettings = readPlainObject(input?.loginSettings)
  const generationProgressSettings = readPlainObject(input?.generationProgressSettings || loginSettings.generationProgressSettings)
  const conversationSettings = normalizeConversationSettings(input?.conversationSettings || loginSettings.conversationSettings)
  const globalThemeSettings = readPlainObject(input?.globalThemeSettings)
  const globalThemeModePolicy = readPlainObject(globalThemeSettings.modePolicy)
  const globalThemeThemes = readPlainObject(globalThemeSettings.themes)
  const globalThemeDark = readPlainObject(globalThemeThemes.dark)
  const globalThemeLight = readPlainObject(globalThemeThemes.light)
  const globalThemeDarkBackgrounds = readPlainObject(globalThemeDark.backgrounds)
  const globalThemeLightBackgrounds = readPlainObject(globalThemeLight.backgrounds)
  const globalThemeBackgrounds = readPlainObject(globalThemeSettings.backgrounds)
  const globalThemeBrandColors = readPlainObject(globalThemeSettings.brandColors)
  const globalThemeGradients = readPlainObject(globalThemeSettings.gradients)
  const globalThemeSurfaces = readPlainObject(globalThemeSettings.surfaces)
  const homeSideMenuSettings = readPlainObject(input?.homeSideMenuSettings)
  const homeLayoutSettings = readPlainObject(input?.homeLayoutSettings)
  const homeLayoutHeaderSettings = readPlainObject(homeLayoutSettings.header)
  const homeLayoutTopBannerSettings = readPlainObject(homeLayoutSettings.topBanner)
  const homeLayoutBannerSettings = readPlainObject(homeLayoutSettings.banner)
  const defaultStageMap = new Map(
    defaults.generationProgressSettings.stages.map(item => [item.key, item]),
  )
  const normalizedStages = defaults.generationProgressSettings.stages.map((defaultStage) => {
    const matchedStage = Array.isArray(generationProgressSettings.stages)
      ? generationProgressSettings.stages.find((item: any) => String(item?.key || '').trim() === defaultStage.key)
      : null

    return {
      key: defaultStage.key,
      label: String(matchedStage?.label || defaultStage.label).trim(),
      percent: Number.isFinite(Number(matchedStage?.percent))
        ? Math.max(0, Math.min(100, Number(matchedStage?.percent)))
        : defaultStage.percent,
      showPercent: matchedStage?.showPercent !== false ? defaultStage.showPercent !== false || matchedStage?.showPercent === true : false,
      description: String(matchedStage?.description || defaultStage.description).trim(),
    }
  })

  return {
    siteInfo: {
      siteName: String(siteInfo.siteName || defaults.siteInfo.siteName).trim(),
      siteDescription: String(siteInfo.siteDescription || '').trim(),
      siteLogoUrl: String(siteInfo.siteLogoUrl || '').trim(),
      siteIconUrl: String(siteInfo.siteIconUrl || '').trim(),
      icpText: String(siteInfo.icpText || '').trim(),
      icpLink: String(siteInfo.icpLink || '').trim(),
      copyrightText: String(siteInfo.copyrightText || '').trim(),
    },
    policySettings: {
      agreementRequired: policySettings.agreementRequired !== false,
      agreementTextPrefix: String(policySettings.agreementTextPrefix || defaults.policySettings.agreementTextPrefix).trim(),
      userAgreementTitle: String(policySettings.userAgreementTitle || defaults.policySettings.userAgreementTitle).trim(),
      userAgreementUrl: String(policySettings.userAgreementUrl || '').trim(),
      userAgreementContent: String(policySettings.userAgreementContent || '').trim(),
      privacyPolicyTitle: String(policySettings.privacyPolicyTitle || defaults.policySettings.privacyPolicyTitle).trim(),
      privacyPolicyUrl: String(policySettings.privacyPolicyUrl || '').trim(),
      privacyPolicyContent: String(policySettings.privacyPolicyContent || '').trim(),
      aiNoticeTitle: String(policySettings.aiNoticeTitle || defaults.policySettings.aiNoticeTitle).trim(),
      aiNoticeUrl: String(policySettings.aiNoticeUrl || '').trim(),
      aiNoticeContent: String(policySettings.aiNoticeContent || '').trim(),
    },
    loginSettings: {
      welcomeTitle: String(loginSettings.welcomeTitle || defaults.loginSettings.welcomeTitle).trim(),
      welcomeSubtitle: String(loginSettings.welcomeSubtitle || '').trim(),
    },
    generationProgressSettings: {
      enabled: generationProgressSettings.enabled !== false,
      stages: normalizedStages.filter(item => defaultStageMap.has(item.key)),
    },
    conversationSettings,
    globalThemeSettings: {
      modePolicy: {
        allowUserToggle: globalThemeModePolicy.allowUserToggle !== false,
        defaultMode: globalThemeModePolicy.defaultMode === 'light' || globalThemeModePolicy.defaultMode === 'system'
          ? globalThemeModePolicy.defaultMode
          : 'dark',
        supportSystemMode: globalThemeModePolicy.supportSystemMode !== false,
      },
      themes: {
        dark: {
          backgrounds: {
            page: normalizeHexColor(
              globalThemeDarkBackgrounds.page || globalThemeBackgrounds.page,
              defaults.globalThemeSettings.themes.dark.backgrounds.page,
            ),
            surface: normalizeHexColor(
              globalThemeDarkBackgrounds.surface || globalThemeBackgrounds.surface,
              defaults.globalThemeSettings.themes.dark.backgrounds.surface,
            ),
            sideMenu: normalizeHexColor(
              globalThemeDarkBackgrounds.sideMenu || globalThemeBackgrounds.sideMenu,
              defaults.globalThemeSettings.themes.dark.backgrounds.sideMenu,
            ),
          },
        },
        light: {
          backgrounds: {
            page: normalizeHexColor(
              globalThemeLightBackgrounds.page,
              defaults.globalThemeSettings.themes.light.backgrounds.page,
            ),
            surface: normalizeHexColor(
              globalThemeLightBackgrounds.surface,
              defaults.globalThemeSettings.themes.light.backgrounds.surface,
            ),
            sideMenu: normalizeHexColor(
              globalThemeLightBackgrounds.sideMenu,
              defaults.globalThemeSettings.themes.light.backgrounds.sideMenu,
            ),
          },
        },
      },
      brandColors: {
        primary: normalizeHexColor(globalThemeBrandColors.primary, defaults.globalThemeSettings.brandColors.primary),
        primaryHover: normalizeHexColor(globalThemeBrandColors.primaryHover, defaults.globalThemeSettings.brandColors.primaryHover),
        primaryActive: normalizeHexColor(globalThemeBrandColors.primaryActive, defaults.globalThemeSettings.brandColors.primaryActive),
        secondary: normalizeHexColor(globalThemeBrandColors.secondary, defaults.globalThemeSettings.brandColors.secondary),
        accent: normalizeHexColor(globalThemeBrandColors.accent, defaults.globalThemeSettings.brandColors.accent),
        success: normalizeHexColor(globalThemeBrandColors.success, defaults.globalThemeSettings.brandColors.success),
        warning: normalizeHexColor(globalThemeBrandColors.warning, defaults.globalThemeSettings.brandColors.warning),
        danger: normalizeHexColor(globalThemeBrandColors.danger, defaults.globalThemeSettings.brandColors.danger),
      },
      gradients: {
        primaryGradient: String(globalThemeGradients.primaryGradient || defaults.globalThemeSettings.gradients.primaryGradient).trim(),
        bannerGlow: normalizeHexColor(globalThemeGradients.bannerGlow, defaults.globalThemeSettings.gradients.bannerGlow),
      },
      surfaces: {
        contentMaxWidth: Number.isFinite(Number(globalThemeSurfaces.contentMaxWidth))
          ? Math.max(960, Math.min(1920, Number(globalThemeSurfaces.contentMaxWidth)))
          : defaults.globalThemeSettings.surfaces.contentMaxWidth,
        cardRadius: Number.isFinite(Number(globalThemeSurfaces.cardRadius))
          ? Math.max(0, Math.min(48, Number(globalThemeSurfaces.cardRadius)))
          : defaults.globalThemeSettings.surfaces.cardRadius,
      },
    },
    homeSideMenuSettings: {
      enabled: homeSideMenuSettings.enabled !== false,
      layoutMode: String(homeSideMenuSettings.layoutMode || '').trim() === 'top' ? 'top' : 'side',
      collapsedWidth: Number.isFinite(Number(homeSideMenuSettings.collapsedWidth))
        ? Math.max(48, Math.min(180, Number(homeSideMenuSettings.collapsedWidth)))
        : defaults.homeSideMenuSettings.collapsedWidth,
      drawerWidth: Number.isFinite(Number(homeSideMenuSettings.drawerWidth))
        ? Math.max(280, Math.min(960, Number(homeSideMenuSettings.drawerWidth)))
        : defaults.homeSideMenuSettings.drawerWidth,
      drawerFloatLimitWidth: Number.isFinite(Number(homeSideMenuSettings.drawerFloatLimitWidth))
        ? Math.max(960, Math.min(2560, Number(homeSideMenuSettings.drawerFloatLimitWidth)))
        : defaults.homeSideMenuSettings.drawerFloatLimitWidth,
      showTopMenu: homeSideMenuSettings.showTopMenu !== false,
      showCenterMenu: homeSideMenuSettings.showCenterMenu !== false,
      showBottomMenu: homeSideMenuSettings.showBottomMenu !== false,
      items: normalizeSideMenuItems(homeSideMenuSettings.items, defaults.homeSideMenuSettings.items),
    },
    homeLayoutSettings: {
      header: {
        showSiteDescription: homeLayoutHeaderSettings.showSiteDescription !== false,
        showTaskIndicator: homeLayoutHeaderSettings.showTaskIndicator !== false,
        showBanner: homeLayoutHeaderSettings.showBanner !== false,
      },
      topBanner: normalizeHomeTopBannerSettings(
        homeLayoutTopBannerSettings,
        defaults.homeLayoutSettings.topBanner,
      ),
      banner: {
        enabled: homeLayoutBannerSettings.enabled !== false,
        items: normalizeHomeBannerItems(homeLayoutBannerSettings.items, defaults.homeLayoutSettings.banner.items),
      },
    },
    redisRuntimeSettings: normalizeRedisRuntimeSettings(input?.redisRuntimeSettings),
  }
}

const listSystemConfigRows = async () => {
  const rows = await prisma.$queryRawUnsafe<any[]>(
    'SELECT * FROM system_settings',
  )

  return Array.isArray(rows) ? rows : []
}

const buildSystemConfigRowMap = (rows: any[]) => {
  return rows.reduce<Map<string, any>>((map, row) => {
    const code = String(row?.code || '').trim()
    if (code) {
      map.set(code, row)
    }
    return map
  }, new Map())
}

type RawExecutor = {
  $queryRawUnsafe: <T = unknown>(query: string, ...values: any[]) => Promise<T>
  $executeRawUnsafe: (query: string, ...values: any[]) => Promise<number>
}

const upsertSystemConfigItem = async (executor: RawExecutor, code: string, config: unknown) => {
  const rows = await executor.$queryRawUnsafe<any[]>(
    'SELECT id FROM system_settings WHERE code = ? LIMIT 1',
    code,
  )
  const existingRow = Array.isArray(rows) && rows[0] ? rows[0] : null
  const rowId = existingRow?.id ? String(existingRow.id) : crypto.randomUUID()
  const name = SYSTEM_CONFIG_NAMES[code as keyof typeof SYSTEM_CONFIG_NAMES] || code

  await executor.$executeRawUnsafe(
    `INSERT INTO system_settings (
      id,
      code,
      name,
      config_json,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, NOW(), NOW())
    ON DUPLICATE KEY UPDATE
      name = VALUES(name),
      config_json = VALUES(config_json),
      updated_at = NOW()`,
    rowId,
    code,
    name,
    JSON.stringify(config ?? null),
  )
}

export const invalidateSystemConfigCaches = async () => {
  await invalidateRedisCaches([
    ADMIN_SYSTEM_CONFIG_CACHE_KEY,
    PUBLIC_SYSTEM_CONFIG_CACHE_KEY,
    REDIS_RUNTIME_SETTINGS_CACHE_KEY,
  ])
}

const readAdminSystemConfigFromDatabase = async () => {
  const rows = await listSystemConfigRows()
  if (!rows.length) {
    return createDefaultSystemConfig()
  }

  const rowMap = buildSystemConfigRowMap(rows)
  return normalizeSystemConfig({
    siteInfo: readPlainObject(rowMap.get(SYSTEM_CONFIG_CODES.siteInfo)?.config_json),
    policySettings: readPlainObject(rowMap.get(SYSTEM_CONFIG_CODES.policySettings)?.config_json),
    loginSettings: readPlainObject(rowMap.get(SYSTEM_CONFIG_CODES.loginSettings)?.config_json),
    generationProgressSettings: readPlainObject(rowMap.get(SYSTEM_CONFIG_CODES.generationProgressSettings)?.config_json),
    conversationSettings: readPlainObject(rowMap.get(SYSTEM_CONFIG_CODES.conversationSettings)?.config_json),
    globalThemeSettings: readPlainObject(rowMap.get(SYSTEM_CONFIG_CODES.globalThemeSettings)?.config_json),
    homeSideMenuSettings: readPlainObject(rowMap.get(SYSTEM_CONFIG_CODES.homeSideMenuSettings)?.config_json),
    homeLayoutSettings: readPlainObject(rowMap.get(SYSTEM_CONFIG_CODES.homeLayoutSettings)?.config_json),
    redisRuntimeSettings: readPlainObject(rowMap.get(SYSTEM_CONFIG_CODES.redisRuntimeSettings)?.config_json),
  })
}

// 读取后台系统设置。
export const getAdminSystemConfig = async () => {
  return getOrSetJsonCache({
    key: ADMIN_SYSTEM_CONFIG_CACHE_KEY,
    ttlSeconds: 600,
    factory: readAdminSystemConfigFromDatabase,
  })
}

// 读取前台可见系统设置。
export const getPublicSystemConfig = async () => {
  return getOrSetJsonCache({
    key: PUBLIC_SYSTEM_CONFIG_CACHE_KEY,
    ttlSeconds: 600,
    factory: async () => getAdminSystemConfig(),
  })
}

// 保存后台系统设置。
export const saveAdminSystemConfig = async (payload: SystemConfigPayload) => {
  const normalized = normalizeSystemConfig(payload)

  await prisma.$transaction(async (tx) => {
    await upsertSystemConfigItem(tx, SYSTEM_CONFIG_CODES.siteInfo, normalized.siteInfo)
    await upsertSystemConfigItem(tx, SYSTEM_CONFIG_CODES.policySettings, normalized.policySettings)
    await upsertSystemConfigItem(tx, SYSTEM_CONFIG_CODES.loginSettings, normalized.loginSettings)
    await upsertSystemConfigItem(tx, SYSTEM_CONFIG_CODES.generationProgressSettings, normalized.generationProgressSettings)
    await upsertSystemConfigItem(tx, SYSTEM_CONFIG_CODES.conversationSettings, normalized.conversationSettings)
    await upsertSystemConfigItem(tx, SYSTEM_CONFIG_CODES.globalThemeSettings, normalized.globalThemeSettings)
    await upsertSystemConfigItem(tx, SYSTEM_CONFIG_CODES.homeSideMenuSettings, normalized.homeSideMenuSettings)
    await upsertSystemConfigItem(tx, SYSTEM_CONFIG_CODES.homeLayoutSettings, normalized.homeLayoutSettings)
    await upsertSystemConfigItem(tx, SYSTEM_CONFIG_CODES.redisRuntimeSettings, normalized.redisRuntimeSettings)
  })

  await invalidateSystemConfigCaches()
  return normalized
}

type SystemConfigSectionKey = keyof Pick<
  SystemConfigPayload,
  | 'siteInfo'
  | 'policySettings'
  | 'loginSettings'
  | 'generationProgressSettings'
  | 'conversationSettings'
  | 'globalThemeSettings'
  | 'homeSideMenuSettings'
  | 'homeLayoutSettings'
>

const upsertSystemConfigSection = async (
  executor: RawExecutor,
  normalized: ReturnType<typeof normalizeSystemConfig>,
  section: SystemConfigSectionKey,
) => {
  if (section === 'siteInfo') {
    await upsertSystemConfigItem(executor, SYSTEM_CONFIG_CODES.siteInfo, normalized.siteInfo)
    return
  }
  if (section === 'policySettings') {
    await upsertSystemConfigItem(executor, SYSTEM_CONFIG_CODES.policySettings, normalized.policySettings)
    return
  }
  if (section === 'loginSettings') {
    await upsertSystemConfigItem(executor, SYSTEM_CONFIG_CODES.loginSettings, normalized.loginSettings)
    return
  }
  if (section === 'generationProgressSettings') {
    await upsertSystemConfigItem(executor, SYSTEM_CONFIG_CODES.generationProgressSettings, normalized.generationProgressSettings)
    return
  }
  if (section === 'conversationSettings') {
    await upsertSystemConfigItem(executor, SYSTEM_CONFIG_CODES.conversationSettings, normalized.conversationSettings)
    return
  }
  if (section === 'globalThemeSettings') {
    await upsertSystemConfigItem(executor, SYSTEM_CONFIG_CODES.globalThemeSettings, normalized.globalThemeSettings)
    return
  }
  if (section === 'homeSideMenuSettings') {
    await upsertSystemConfigItem(executor, SYSTEM_CONFIG_CODES.homeSideMenuSettings, normalized.homeSideMenuSettings)
    return
  }
  if (section === 'homeLayoutSettings') {
    await upsertSystemConfigItem(executor, SYSTEM_CONFIG_CODES.homeLayoutSettings, normalized.homeLayoutSettings)
  }
}

export const saveAdminSystemConfigSections = async (
  payload: Partial<SystemConfigPayload>,
  sections: SystemConfigSectionKey[],
) => {
  const current = await getAdminSystemConfig()
  const normalized = normalizeSystemConfig({
    ...current,
    ...payload,
  })
  const uniqueSections = Array.from(new Set(sections))

  await prisma.$transaction(async (tx) => {
    for (const section of uniqueSections) {
      await upsertSystemConfigSection(tx, normalized, section)
    }
  })

  await invalidateSystemConfigCaches()
  return normalized
}

export const getAdminRedisRuntimeSettings = async () => {
  return getOrSetJsonCache({
    key: REDIS_RUNTIME_SETTINGS_CACHE_KEY,
    ttlSeconds: 120,
    factory: async () => {
      const settings = await getAdminSystemConfig()
      return normalizeRedisRuntimeSettings(settings.redisRuntimeSettings)
    },
  })
}

export const saveAdminRedisRuntimeSettings = async (payload: SystemRedisRuntimeSettingsPayload) => {
  const normalized = normalizeRedisRuntimeSettings(payload)
  await prisma.$transaction(async (tx) => {
    await upsertSystemConfigItem(tx, SYSTEM_CONFIG_CODES.redisRuntimeSettings, normalized)
  })
  await invalidateSystemConfigCaches()
  return normalized
}
