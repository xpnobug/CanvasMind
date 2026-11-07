import type {
  ConversationEntryDisplayConfig,
  ConversationSettingsConfig,
  SystemConfigPayload,
  SystemGenerationProgressSettingsConfig,
  SystemGlobalThemeSettingsConfig,
  SystemHomeLayoutSettingsConfig,
  SystemHomeSideMenuSettingsConfig,
} from '@/api/system-config'
import {
  createDefaultConversationSettings,
  createDefaultGenerationProgressSettings,
  createDefaultGlobalThemeSettings,
  createDefaultHomeLayoutSettings,
  createDefaultHomeSideMenuSettings,
  normalizeHomeTopBannerSettings,
} from '@/api/system-config'

export const THEME_CONFIG_BUNDLE_KIND = 'canana-theme-config' as const
export const THEME_CONFIG_BUNDLE_VERSION = 1 as const

/** 公开版可导入导出的主题分节（不含 Pro 专属 uiMotion / generationUpstream） */
export type ThemeConfigSectionKey =
  | 'globalThemeSettings'
  | 'homeSideMenuSettings'
  | 'homeLayoutSettings'
  | 'conversationSettings'
  | 'generationProgressSettings'

export const THEME_CONFIG_SECTION_OPTIONS: Array<{ key: ThemeConfigSectionKey, label: string }> = [
  { key: 'globalThemeSettings', label: '品牌色 / 背景 / 圆角 / 深浅模式' },
  { key: 'homeSideMenuSettings', label: '首页侧栏菜单' },
  { key: 'homeLayoutSettings', label: '首页 Banner / 头部 / 顶部横幅' },
  { key: 'conversationSettings', label: '会话与生成入口（欢迎区 / 创作面板）' },
  { key: 'generationProgressSettings', label: '生成进度阶段与预估' },
]

export type ThemeConfigTransferSource = Pick<
  SystemConfigPayload,
  | 'globalThemeSettings'
  | 'homeSideMenuSettings'
  | 'homeLayoutSettings'
  | 'conversationSettings'
  | 'generationProgressSettings'
>

export interface ThemeConfigExportBundle {
  kind: typeof THEME_CONFIG_BUNDLE_KIND
  version: typeof THEME_CONFIG_BUNDLE_VERSION
  exportedAt: string
  globalThemeSettings?: SystemGlobalThemeSettingsConfig
  homeSideMenuSettings?: SystemHomeSideMenuSettingsConfig
  homeLayoutSettings?: SystemHomeLayoutSettingsConfig
  conversationSettings?: ConversationSettingsConfig
  /** @deprecated 旧导出包字段；导入时仅合并 entryDisplay */
  conversationEntryDisplay?: ConversationEntryDisplayConfig
  generationProgressSettings?: SystemGenerationProgressSettingsConfig
}

export interface ThemeConfigImportResult {
  appliedSections: ThemeConfigSectionKey[]
}

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

const normalizeHomeLayoutSettings = (value?: Partial<SystemHomeLayoutSettingsConfig> | null) => {
  const defaults = createDefaultHomeLayoutSettings()
  const layout = value || defaults
  return {
    ...defaults,
    ...layout,
    header: {
      ...defaults.header,
      ...(layout.header || {}),
    },
    topBanner: normalizeHomeTopBannerSettings(layout.topBanner),
    banner: {
      ...defaults.banner,
      ...(layout.banner || {}),
      items: Array.isArray(layout.banner?.items) && layout.banner.items.length
        ? layout.banner.items
        : defaults.banner.items.map(item => ({ ...item })),
    },
  }
}

export const normalizeThemeConfigImportSections = (
  payload: Partial<ThemeConfigTransferSource>,
): ThemeConfigTransferSource => ({
  globalThemeSettings: {
    ...createDefaultGlobalThemeSettings(),
    ...(payload.globalThemeSettings || {}),
    modePolicy: {
      ...createDefaultGlobalThemeSettings().modePolicy,
      ...(payload.globalThemeSettings?.modePolicy || {}),
    },
    themes: {
      dark: {
        backgrounds: {
          ...createDefaultGlobalThemeSettings().themes.dark.backgrounds,
          ...(payload.globalThemeSettings?.themes?.dark?.backgrounds || {}),
        },
      },
      light: {
        backgrounds: {
          ...createDefaultGlobalThemeSettings().themes.light.backgrounds,
          ...(payload.globalThemeSettings?.themes?.light?.backgrounds || {}),
        },
      },
    },
    brandColors: {
      ...createDefaultGlobalThemeSettings().brandColors,
      ...(payload.globalThemeSettings?.brandColors || {}),
    },
    gradients: {
      ...createDefaultGlobalThemeSettings().gradients,
      ...(payload.globalThemeSettings?.gradients || {}),
    },
    surfaces: {
      ...createDefaultGlobalThemeSettings().surfaces,
      ...(payload.globalThemeSettings?.surfaces || {}),
    },
  },
  homeSideMenuSettings: {
    ...createDefaultHomeSideMenuSettings(),
    ...(payload.homeSideMenuSettings || {}),
    groups: Array.isArray(payload.homeSideMenuSettings?.groups)
      ? payload.homeSideMenuSettings.groups
      : createDefaultHomeSideMenuSettings().groups,
    items: Array.isArray(payload.homeSideMenuSettings?.items)
      ? payload.homeSideMenuSettings.items
      : createDefaultHomeSideMenuSettings().items,
  },
  homeLayoutSettings: normalizeHomeLayoutSettings(payload.homeLayoutSettings),
  conversationSettings: payload.conversationSettings || createDefaultConversationSettings(),
  generationProgressSettings: payload.generationProgressSettings || createDefaultGenerationProgressSettings(),
})

const mergeConversationEntryDisplay = (
  current: ConversationSettingsConfig,
  imported: ConversationEntryDisplayConfig,
): ConversationSettingsConfig => ({
  ...current,
  entryDisplay: {
    ...current.entryDisplay,
    ...imported,
    hero: {
      ...current.entryDisplay.hero,
      ...(imported.hero || {}),
    },
    workbench: {
      ...current.entryDisplay.workbench,
      ...(imported.workbench || {}),
    },
    input: {
      ...current.entryDisplay.input,
      ...(imported.input || {}),
    },
    mode: {
      ...current.entryDisplay.mode,
      ...(imported.mode || {}),
    },
    modelSelector: {
      ...current.entryDisplay.modelSelector,
      ...(imported.modelSelector || {}),
    },
    assistantSelector: {
      ...current.entryDisplay.assistantSelector,
      ...(imported.assistantSelector || {}),
    },
    actions: {
      auto: {
        ...current.entryDisplay.actions.auto,
        ...(imported.actions?.auto || {}),
      },
      inspiration: {
        ...current.entryDisplay.actions.inspiration,
        ...(imported.actions?.inspiration || {}),
      },
      creativeDesign: {
        ...current.entryDisplay.actions.creativeDesign,
        ...(imported.actions?.creativeDesign || {}),
      },
    },
  },
})

const mergeConversationSettings = (
  current: ConversationSettingsConfig,
  imported: ConversationSettingsConfig,
): ConversationSettingsConfig => {
  const withEntry = mergeConversationEntryDisplay(current, imported.entryDisplay || current.entryDisplay)
  return {
    ...withEntry,
    ...imported,
    basicRules: {
      ...current.basicRules,
      ...(imported.basicRules || {}),
    },
    listDisplay: {
      ...current.listDisplay,
      ...(imported.listDisplay || {}),
    },
    managementPolicy: {
      ...current.managementPolicy,
      ...(imported.managementPolicy || {}),
    },
    entryDisplay: withEntry.entryDisplay,
  }
}

export const buildThemeConfigExportBundle = (
  source: ThemeConfigTransferSource,
  sections: ThemeConfigSectionKey[],
): ThemeConfigExportBundle => {
  const normalized = normalizeThemeConfigImportSections(source)
  const bundle: ThemeConfigExportBundle = {
    kind: THEME_CONFIG_BUNDLE_KIND,
    version: THEME_CONFIG_BUNDLE_VERSION,
    exportedAt: new Date().toISOString(),
  }

  if (sections.includes('globalThemeSettings')) {
    bundle.globalThemeSettings = normalized.globalThemeSettings
  }
  if (sections.includes('homeSideMenuSettings')) {
    bundle.homeSideMenuSettings = normalized.homeSideMenuSettings
  }
  if (sections.includes('homeLayoutSettings')) {
    bundle.homeLayoutSettings = normalized.homeLayoutSettings
  }
  if (sections.includes('conversationSettings')) {
    bundle.conversationSettings = normalized.conversationSettings
  }
  if (sections.includes('generationProgressSettings')) {
    bundle.generationProgressSettings = normalized.generationProgressSettings
  }

  return bundle
}

const parseThemeConfigBundle = (raw: unknown): ThemeConfigExportBundle => {
  if (!isPlainObject(raw)) {
    throw new Error('配置包必须是 JSON 对象')
  }

  if (raw.kind !== THEME_CONFIG_BUNDLE_KIND) {
    throw new Error('不是有效的主题配置导出包（缺少 kind: canana-theme-config）')
  }

  if (raw.version !== THEME_CONFIG_BUNDLE_VERSION) {
    throw new Error(`不支持的配置包版本：${String(raw.version)}`)
  }

  return raw as unknown as ThemeConfigExportBundle
}

export const parseThemeConfigImportText = (rawJson: string): ThemeConfigExportBundle => {
  const trimmed = rawJson.trim()
  if (!trimmed) {
    throw new Error('请先粘贴或上传 JSON 内容')
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(trimmed)
  } catch {
    throw new Error('JSON 格式无效，请检查内容')
  }

  return parseThemeConfigBundle(parsed)
}

export const applyThemeConfigImportBundle = (
  current: ThemeConfigTransferSource,
  bundle: ThemeConfigExportBundle,
): { next: ThemeConfigTransferSource, result: ThemeConfigImportResult } => {
  const appliedSections: ThemeConfigSectionKey[] = []
  const patch: Partial<ThemeConfigTransferSource> = {}

  if (bundle.globalThemeSettings) {
    patch.globalThemeSettings = bundle.globalThemeSettings
    appliedSections.push('globalThemeSettings')
  }
  if (bundle.homeSideMenuSettings) {
    patch.homeSideMenuSettings = bundle.homeSideMenuSettings
    appliedSections.push('homeSideMenuSettings')
  }
  if (bundle.homeLayoutSettings) {
    patch.homeLayoutSettings = bundle.homeLayoutSettings
    appliedSections.push('homeLayoutSettings')
  }

  if (bundle.conversationSettings) {
    patch.conversationSettings = mergeConversationSettings(
      current.conversationSettings,
      bundle.conversationSettings,
    )
    appliedSections.push('conversationSettings')
  } else if (bundle.conversationEntryDisplay) {
    patch.conversationSettings = mergeConversationEntryDisplay(
      current.conversationSettings,
      bundle.conversationEntryDisplay,
    )
    appliedSections.push('conversationSettings')
  }

  if (bundle.generationProgressSettings) {
    patch.generationProgressSettings = bundle.generationProgressSettings
    appliedSections.push('generationProgressSettings')
  }

  if (!appliedSections.length) {
    throw new Error('配置包内没有可导入的分节')
  }

  const normalized = normalizeThemeConfigImportSections({
    ...current,
    ...patch,
  })

  return {
    next: normalized,
    result: { appliedSections },
  }
}

export const createDefaultThemeConfigSectionSelection = (): Record<ThemeConfigSectionKey, boolean> => ({
  globalThemeSettings: true,
  homeSideMenuSettings: true,
  homeLayoutSettings: true,
  conversationSettings: true,
  generationProgressSettings: true,
})

export const getSelectedThemeConfigSections = (
  selection: Record<ThemeConfigSectionKey, boolean>,
): ThemeConfigSectionKey[] => {
  return THEME_CONFIG_SECTION_OPTIONS
    .map(item => item.key)
    .filter(key => selection[key])
}

/** 兼容旧包：若直接粘贴了分节对象而非带 kind 的导出包，尝试识别并包装 */
export const parseThemeConfigImportTextLoose = (rawJson: string): ThemeConfigExportBundle => {
  try {
    return parseThemeConfigImportText(rawJson)
  } catch (error) {
    const trimmed = rawJson.trim()
    if (!trimmed) {
      throw error
    }
    const parsed = JSON.parse(trimmed) as Record<string, unknown>
    if (parsed.kind === THEME_CONFIG_BUNDLE_KIND) {
      throw error
    }
    const fallback: ThemeConfigExportBundle = {
      kind: THEME_CONFIG_BUNDLE_KIND,
      version: THEME_CONFIG_BUNDLE_VERSION,
      exportedAt: new Date().toISOString(),
    }
    if (parsed.globalThemeSettings) {
      fallback.globalThemeSettings = parsed.globalThemeSettings as ThemeConfigExportBundle['globalThemeSettings']
    }
    if (parsed.homeSideMenuSettings) {
      fallback.homeSideMenuSettings = parsed.homeSideMenuSettings as ThemeConfigExportBundle['homeSideMenuSettings']
    }
    if (parsed.homeLayoutSettings) {
      fallback.homeLayoutSettings = parsed.homeLayoutSettings as ThemeConfigExportBundle['homeLayoutSettings']
    }
    if (parsed.conversationSettings && isPlainObject(parsed.conversationSettings)) {
      fallback.conversationSettings = parsed.conversationSettings as unknown as ConversationSettingsConfig
    } else if (parsed.conversationEntryDisplay) {
      fallback.conversationEntryDisplay = parsed.conversationEntryDisplay as ConversationEntryDisplayConfig
    }
    if (parsed.generationProgressSettings) {
      fallback.generationProgressSettings = parsed.generationProgressSettings as SystemGenerationProgressSettingsConfig
    }
    if (
      !fallback.globalThemeSettings
      && !fallback.homeSideMenuSettings
      && !fallback.homeLayoutSettings
      && !fallback.conversationSettings
      && !fallback.conversationEntryDisplay
      && !fallback.generationProgressSettings
    ) {
      throw error
    }
    return fallback
  }
}

export const formatThemeConfigImportSummary = (sections: ThemeConfigSectionKey[]) => {
  const labelMap = new Map(THEME_CONFIG_SECTION_OPTIONS.map(item => [item.key, item.label]))
  return sections.map(key => labelMap.get(key) || key).join('、')
}
