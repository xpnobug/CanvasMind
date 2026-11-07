<template>
  <AdminPageContainer
    title="主题配置"
    description="预览并编辑首页布局；品牌色 / 背景 / 圆角请点顶栏「外观设置」。"
    hide-intro
  >
    <div class="admin-theme-page">
      <div v-if="loading" class="admin-empty admin-theme-loading">正在加载主题配置...</div>

      <template v-else>
        <section class="admin-theme-shell admin-card">
          <AdminThemeWorkbenchTopbar
            :preview-theme-class="previewThemeClass"
            :loading="loading"
            :saving="saving"
            @export="themeExportDialogVisible = true"
            @import="themeImportDialogVisible = true"
            @open-settings="openAppearanceSettings"
            @save="handleSaveAppearance"
            @reset="appearanceStore.resetThemeDefaults"
          />

          <div class="admin-theme-shell__body">
            <AdminThemeWorkbenchPreview
              :system-form="systemForm"
              :preview-theme-class="previewThemeClass"
              :preview-theme-vars="previewThemeVars"
              :preview-frontstage-body-style="previewFrontstageBodyStyle"
              :preview-sidebar-style="previewSidebarStyle"
              :preview-surface-frame-style="previewSurfaceFrameStyle"
              :preview-surface-card-style="previewSurfaceCardStyle"
              :preview-banner-card-style="previewBannerCardStyle"
              :preview-banner-glow-style="previewBannerGlowStyle"
              :preview-active-menu-key="previewActiveMenuKey"
              :preview-top-menu-item="previewTopMenuItem"
              :preview-center-menu-groups="previewCenterMenuGroups"
              :preview-bottom-menu-groups="previewBottomMenuGroups"
              :preview-primary-banner="previewPrimaryBanner"
              :preview-secondary-banners="previewSecondaryBanners"
              :toggle-menu-visibility="toggleMenuItemVisible"
              :apply-menu-reorder="handlePreviewMenuReorder"
              :active-theme-section-id="null"
              :active-theme-field-id="null"
              @menu-action="handlePreviewMenuAction"
              @menu-reorder="handlePreviewMenuReorder"
              @content-block-action="handleWorkbenchContentAction"
              @banner-item-action="handleBannerItemAction"
              @banner-item-reorder="handleBannerItemReorder"
            />
          </div>
        </section>
      </template>
    </div>

    <AdminThemeMenuItemDialog
      :visible="menuItemDialogVisible"
      :draft="editingMenuItemDraft"
      @close="closeMenuItemDialog"
      @submit="submitMenuItemDialog"
      @trigger-icon-upload="triggerEditingMenuIconUpload"
      @icon-file-change="handleEditingMenuIconFileChange"
      @clear-icon="clearEditingMenuIcon"
    />

    <AdminThemeDeleteMenuItemDialog
      :visible="deleteMenuItemDialogVisible"
      :label="deleteMenuItemLabel"
      @close="closeDeleteMenuItemDialog"
      @confirm="confirmRemoveMenuItem"
    />

    <AdminThemeWorkbenchContentDialog
      :visible="workbenchContentDialogVisible"
      :draft="editingWorkbenchContentDraft"
      @close="closeWorkbenchContentDialog"
      @submit="submitWorkbenchContentDialog"
    />

    <AdminThemeTopBannerDialog
      :visible="topBannerDialogVisible"
      :draft="editingTopBannerDraft"
      @close="closeTopBannerDialog"
      @submit="submitTopBannerDialog"
    />

    <AdminThemeBannerItemDialog
      :visible="bannerItemDialogVisible"
      :draft="editingBannerItemDraft"
      :preset-options="HOME_BANNER_PRESET_OPTIONS"
      @close="closeBannerItemDialog"
      @submit="submitBannerItemDialog"
    />

    <AdminThemeExportDialog
      v-model:visible="themeExportDialogVisible"
      :source="themeTransferSource"
    />

    <AdminThemeImportDialog
      v-model:visible="themeImportDialogVisible"
      :source="themeTransferSource"
      :apply-import="applyThemeImport"
    />
  </AdminPageContainer>
</template>

<script setup lang="ts">
defineOptions({ name: 'AdminTheme' })

import { computed, defineAsyncComponent, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import AdminPageContainer from '@/components/admin/layout/AdminPageContainer.vue'
import AdminThemeWorkbenchPreview from '@/views/admin/theme/components/AdminThemeWorkbenchPreview.vue'
import AdminThemeWorkbenchTopbar from '@/views/admin/theme/components/AdminThemeWorkbenchTopbar.vue'
import type { ThemeBannerItemDialogDraft } from '@/views/admin/theme/components/AdminThemeBannerItemDialog.vue'
import type { ThemeTopBannerDialogDraft } from '@/views/admin/theme/components/AdminThemeTopBannerDialog.vue'
import type { WorkbenchContentDialogDraft } from '@/views/admin/theme/components/AdminThemeWorkbenchContentDialog.vue'
import type { WorkbenchContentBlockKey } from '@/views/admin/theme/components/AdminThemeWorkbenchPreview.vue'
import type { WorkbenchMenuActionKey } from '@/views/admin/theme/components/AdminThemeWorkbenchItemActions.vue'
import { useAdminThemeMenuEditor } from '@/views/admin/theme/useAdminThemeMenuEditor'
import { HOME_BANNER_PRESET_OPTIONS, useAdminLayoutConfig } from '@/views/admin/system/useAdminLayoutConfig'
import { normalizeHomeTopBannerSettings } from '@/api/system-config'
import { useAdminAppearanceSettingsStore } from '@/stores/admin-appearance-settings'
import { useThemePreferenceStore } from '@/stores/theme-preference'
import type { ThemeConfigTransferSource } from '@/views/admin/theme/theme-config-transfer'
import './components/admin-theme-ops-dialog.css'

const AdminThemeBannerItemDialog = defineAsyncComponent(() => import('@/views/admin/theme/components/AdminThemeBannerItemDialog.vue'))
const AdminThemeDeleteMenuItemDialog = defineAsyncComponent(() => import('@/views/admin/theme/components/AdminThemeDeleteMenuItemDialog.vue'))
const AdminThemeExportDialog = defineAsyncComponent(() => import('@/views/admin/theme/components/AdminThemeExportDialog.vue'))
const AdminThemeImportDialog = defineAsyncComponent(() => import('@/views/admin/theme/components/AdminThemeImportDialog.vue'))
const AdminThemeMenuItemDialog = defineAsyncComponent(() => import('@/views/admin/theme/components/AdminThemeMenuItemDialog.vue'))
const AdminThemeTopBannerDialog = defineAsyncComponent(() => import('@/views/admin/theme/components/AdminThemeTopBannerDialog.vue'))
const AdminThemeWorkbenchContentDialog = defineAsyncComponent(() => import('@/views/admin/theme/components/AdminThemeWorkbenchContentDialog.vue'))

const appearanceStore = useAdminAppearanceSettingsStore()
const systemForm = appearanceStore.draft
const loading = appearanceStore.loading
const saving = appearanceStore.saving
const themeStore = useThemePreferenceStore()

// 进入主题页时兜底补齐 topBanner，避免旧草稿缺字段导致预览首屏崩溃
appearanceStore.ensureHomeLayoutNormalized()

const themeExportDialogVisible = ref(false)
const themeImportDialogVisible = ref(false)
const workbenchContentDialogVisible = ref(false)
const editingWorkbenchContentDraft = ref<WorkbenchContentDialogDraft | null>(null)
const topBannerDialogVisible = ref(false)
const editingTopBannerDraft = ref<ThemeTopBannerDialogDraft | null>(null)
const bannerItemDialogVisible = ref(false)
const editingBannerItemDraft = ref<ThemeBannerItemDialogDraft | null>(null)

const themeTransferSource = computed<ThemeConfigTransferSource>(() => ({
  globalThemeSettings: systemForm.value.globalThemeSettings,
  homeSideMenuSettings: systemForm.value.homeSideMenuSettings,
  homeLayoutSettings: systemForm.value.homeLayoutSettings,
  conversationSettings: systemForm.value.conversationSettings,
  generationProgressSettings: systemForm.value.generationProgressSettings,
}))

const applyThemeImport = async (next: ThemeConfigTransferSource) => {
  appearanceStore.applyThemeImportSections(next)
  try {
    await appearanceStore.save()
  } catch {
    ElMessage.error('保存失败，请稍后重试')
    throw new Error('save failed')
  }
}

const previewThemeClass = computed<'is-dark' | 'is-light'>(() => {
  const mode = systemForm.value.globalThemeSettings.modePolicy.defaultMode
  if (mode === 'dark') {
    return 'is-dark'
  }
  if (mode === 'system') {
    return themeStore.currentTheme.value === 'dark' ? 'is-dark' : 'is-light'
  }
  return 'is-light'
})

const previewResolvedBackgrounds = computed(() => {
  return previewThemeClass.value === 'is-light'
    ? systemForm.value.globalThemeSettings.themes.light.backgrounds
    : systemForm.value.globalThemeSettings.themes.dark.backgrounds
})

const previewThemeVars = computed(() => {
  const theme = systemForm.value.globalThemeSettings
  const backgrounds = previewResolvedBackgrounds.value
  const isLight = previewThemeClass.value === 'is-light'

  return {
    '--bg-body': backgrounds.page,
    '--bg-surface': backgrounds.surface,
    '--bg-float': backgrounds.surface,
    '--bg-muted': isLight ? '#f1f2f3' : '#1c1e22',
    '--theme-page-background': backgrounds.page,
    '--theme-surface-background': backgrounds.surface,
    '--theme-side-menu-background': backgrounds.sideMenu,
    '--brand-main-default': theme.brandColors.primary,
    '--brand-main-hover': theme.brandColors.primaryHover,
    '--brand-main-pressed': theme.brandColors.primaryActive,
    '--brand-secondary-default': theme.brandColors.secondary,
    '--brand-accent-default': theme.brandColors.accent,
    '--brand-success-default': theme.brandColors.success,
    '--brand-warning-default': theme.brandColors.warning,
    '--brand-danger-default': theme.brandColors.danger,
    '--theme-banner-glow': theme.gradients.bannerGlow,
  }
})

const previewBannerCardStyle = computed(() => ({
  background: systemForm.value.globalThemeSettings.gradients.primaryGradient,
  borderRadius: `${systemForm.value.globalThemeSettings.surfaces.cardRadius}px`,
}))

const previewBannerGlowStyle = computed(() => ({
  background: systemForm.value.globalThemeSettings.gradients.bannerGlow,
}))

const previewSurfaceFrameStyle = computed(() => ({
  maxWidth: `${Math.min(systemForm.value.globalThemeSettings.surfaces.contentMaxWidth, 560)}px`,
}))

const previewSurfaceCardStyle = computed(() => ({
  borderRadius: `${systemForm.value.globalThemeSettings.surfaces.cardRadius}px`,
}))

const previewSidebarWidth = computed(() => {
  if (systemForm.value.homeSideMenuSettings.layoutMode === 'top') {
    return 560
  }
  const collapsedWidth = Math.max(systemForm.value.homeSideMenuSettings.collapsedWidth, 0)
  return Math.min(Math.max(collapsedWidth + 16, 92), 120)
})

const previewSidebarStyle = computed(() => ({
  width: systemForm.value.homeSideMenuSettings.layoutMode === 'top' ? '100%' : `${previewSidebarWidth.value}px`,
  height: systemForm.value.homeSideMenuSettings.layoutMode === 'top' ? '112px' : '100%',
}))

const previewFrontstageBodyStyle = computed(() => {
  if (systemForm.value.homeSideMenuSettings.layoutMode === 'top') {
    return {
      gridTemplateColumns: 'minmax(0, 1fr)',
      gridTemplateRows: systemForm.value.homeSideMenuSettings.enabled ? '128px minmax(0, 1fr)' : 'minmax(0, 1fr)',
    }
  }
  return {
    gridTemplateColumns: systemForm.value.homeSideMenuSettings.enabled
      ? `${previewSidebarWidth.value}px minmax(0, 1fr)`
      : 'minmax(0, 1fr)',
  }
})

const {
  normalizedMenuGroups,
  reorderMenuItemWithinGroup,
  handleMenuIconFileChange,
  clearMenuIcon,
} = useAdminLayoutConfig(systemForm.value)

const previewSortedMenuItems = computed(() => {
  return [...systemForm.value.homeSideMenuSettings.items]
    .sort((current, next) => current.sortOrder - next.sortOrder)
})

const previewTopMenuItem = computed(() => {
  return previewSortedMenuItems.value.find(item => item.section === 'top') || null
})

const previewCenterMenuGroups = computed(() => {
  return normalizedMenuGroups.value
    .filter(group => group.section === 'center' && group.visible)
    .map(group => ({ ...group, items: group.items }))
    .filter(group => group.items.length > 0)
})

const previewBottomMenuGroups = computed(() => {
  return normalizedMenuGroups.value
    .filter(group => group.section === 'bottom' && group.visible)
    .map(group => ({ ...group, items: group.items }))
    .filter(group => group.items.length > 0)
})

const previewActiveMenuKey = computed(() => {
  return previewSortedMenuItems.value.find(item => item.visible)?.key
    || previewSortedMenuItems.value[0]?.key
    || ''
})

const previewVisibleBanners = computed(() => {
  return [...systemForm.value.homeLayoutSettings.banner.items]
    .filter(item => item.visible)
    .sort((current, next) => current.sortOrder - next.sortOrder)
})

const previewPrimaryBanner = computed(() => previewVisibleBanners.value[0] || null)
const previewSecondaryBanners = computed(() => previewVisibleBanners.value.slice(1, 4))

const {
  menuItemDialogVisible,
  editingMenuItemDraft,
  deleteMenuItemDialogVisible,
  deleteMenuItemLabel,
  openMenuItemDialog,
  closeMenuItemDialog,
  submitMenuItemDialog,
  triggerEditingMenuIconUpload,
  handleEditingMenuIconFileChange,
  clearEditingMenuIcon,
  toggleMenuItemVisible,
  requestRemoveMenuItem,
  closeDeleteMenuItemDialog,
  confirmRemoveMenuItem,
} = useAdminThemeMenuEditor({
  getItems: () => systemForm.value.homeSideMenuSettings.items,
  handleMenuIconFileChange,
  clearMenuIcon,
})

const openAppearanceSettings = () => {
  void appearanceStore.openDrawer()
}

const handleSaveAppearance = () => {
  void appearanceStore.saveAndNotify()
}

const handlePreviewMenuAction = ({ action, menuKey }: { action: WorkbenchMenuActionKey, menuKey: string }) => {
  if (action === 'edit') {
    openMenuItemDialog(menuKey)
    return
  }
  if (action === 'visible') {
    toggleMenuItemVisible(menuKey)
    return
  }
  if (action === 'delete') {
    requestRemoveMenuItem(menuKey)
  }
}

const handlePreviewMenuReorder = ({ sourceMenuKey, targetMenuKey, position }: {
  sourceMenuKey: string
  targetMenuKey: string
  position: 'before' | 'after'
}) => {
  const items = systemForm.value.homeSideMenuSettings.items
  const sourceItem = items.find(item => item.key === sourceMenuKey)
  const targetItem = items.find(item => item.key === targetMenuKey)
  if (!sourceItem || !targetItem) return
  if (sourceItem.key === targetItem.key) return
  if (sourceItem.section !== targetItem.section || sourceItem.groupKey !== targetItem.groupKey) return
  reorderMenuItemWithinGroup(sourceItem.groupKey, sourceMenuKey, targetMenuKey, position)
}

const createWorkbenchContentDraft = (blockKey: Exclude<WorkbenchContentBlockKey, 'top-banner'>): WorkbenchContentDialogDraft => {
  const workbench = systemForm.value.conversationSettings.entryDisplay.workbench
  const input = systemForm.value.conversationSettings.entryDisplay.input
  const header = systemForm.value.homeLayoutSettings.header
  const draftMap: Record<Exclude<WorkbenchContentBlockKey, 'top-banner'>, string> = {
    'header-background': '创作区背景',
    title: '标题块',
    generator: '创作面板块',
    'task-indicator': '任务状态块',
    banner: 'Banner 块',
  }

  const enabledByBlock: Record<Exclude<WorkbenchContentBlockKey, 'top-banner'>, boolean> = {
    'header-background': workbench.headerBackgroundEnabled !== false,
    title: workbench.titleEnabled !== false,
    generator: workbench.generatorEnabled !== false,
    'task-indicator': workbench.taskIndicatorEnabled !== false,
    banner: workbench.bannerEnabled !== false,
  }

  return {
    blockKey,
    label: draftMap[blockKey],
    settings: {
      enabled: enabledByBlock[blockKey],
      showSiteName: workbench.showSiteName !== false,
      prefixText: String(workbench.prefixText || ''),
      suffixText: String(workbench.suffixText || ''),
      showModeSelectorInTitle: workbench.showModeSelectorInTitle !== false,
      showSubmitButton: workbench.showSubmitButton !== false,
      showSiteDescription: header.showSiteDescription !== false,
      placeholder: String(input.placeholder || ''),
      headerBackgroundImageUrl: String(workbench.headerBackgroundImageUrl || ''),
      headerBackgroundImageUrlLight: String(workbench.headerBackgroundImageUrlLight || ''),
      headerBackgroundGlowColor: String(workbench.headerBackgroundGlowColor || ''),
      headerBackgroundGlowColorLight: String(workbench.headerBackgroundGlowColorLight || ''),
      headerBackgroundGlowOpacity: Number(workbench.headerBackgroundGlowOpacity),
      headerBackgroundGlowOpacityLight: Number(workbench.headerBackgroundGlowOpacityLight),
      headerBackgroundGlowEnabled: workbench.headerBackgroundGlowEnabled !== false,
      headerBackgroundStarEnabled: workbench.headerBackgroundStarEnabled !== false,
      headerBackgroundStarColor: String(workbench.headerBackgroundStarColor || ''),
      headerBackgroundStarColorLight: String(workbench.headerBackgroundStarColorLight || ''),
    },
  }
}

const openWorkbenchContentDialog = (blockKey: Exclude<WorkbenchContentBlockKey, 'top-banner'>) => {
  editingWorkbenchContentDraft.value = createWorkbenchContentDraft(blockKey)
  workbenchContentDialogVisible.value = true
}

const closeWorkbenchContentDialog = () => {
  workbenchContentDialogVisible.value = false
  editingWorkbenchContentDraft.value = null
}

const submitWorkbenchContentDialog = () => {
  const draft = editingWorkbenchContentDraft.value
  if (!draft) return

  const workbench = systemForm.value.conversationSettings.entryDisplay.workbench
  const header = systemForm.value.homeLayoutSettings.header

  if (draft.blockKey === 'header-background') {
    workbench.headerBackgroundEnabled = draft.settings.enabled
    workbench.headerBackgroundImageUrl = String(draft.settings.headerBackgroundImageUrl || '').trim()
    workbench.headerBackgroundImageUrlLight = String(draft.settings.headerBackgroundImageUrlLight || '').trim()
    workbench.headerBackgroundGlowColor = String(draft.settings.headerBackgroundGlowColor || '').trim()
    workbench.headerBackgroundGlowColorLight = String(draft.settings.headerBackgroundGlowColorLight || '').trim()
    workbench.headerBackgroundGlowOpacity = Number(draft.settings.headerBackgroundGlowOpacity)
    workbench.headerBackgroundGlowOpacityLight = Number(draft.settings.headerBackgroundGlowOpacityLight)
    workbench.headerBackgroundGlowEnabled = draft.settings.headerBackgroundGlowEnabled !== false
    workbench.headerBackgroundStarEnabled = draft.settings.headerBackgroundStarEnabled !== false
    workbench.headerBackgroundStarColor = String(draft.settings.headerBackgroundStarColor || '').trim()
    workbench.headerBackgroundStarColorLight = String(draft.settings.headerBackgroundStarColorLight || '').trim()
  }

  if (draft.blockKey === 'title') {
    Object.assign(workbench, {
      titleEnabled: draft.settings.enabled,
      showSiteName: draft.settings.showSiteName,
      prefixText: draft.settings.prefixText,
      suffixText: draft.settings.suffixText,
      showModeSelectorInTitle: draft.settings.showModeSelectorInTitle,
    })
  }

  if (draft.blockKey === 'generator') {
    Object.assign(workbench, {
      generatorEnabled: draft.settings.enabled,
      showSubmitButton: draft.settings.showSubmitButton,
    })
    Object.assign(systemForm.value.conversationSettings.entryDisplay.input, {
      placeholder: draft.settings.placeholder,
    })
    header.showSiteDescription = draft.settings.showSiteDescription
  }

  if (draft.blockKey === 'task-indicator') {
    workbench.taskIndicatorEnabled = draft.settings.enabled
    header.showTaskIndicator = draft.settings.enabled
  }

  if (draft.blockKey === 'banner') {
    workbench.bannerEnabled = draft.settings.enabled
    header.showBanner = draft.settings.enabled
  }

  closeWorkbenchContentDialog()
}

const toggleWorkbenchContentVisibility = (blockKey: WorkbenchContentBlockKey) => {
  const workbench = systemForm.value.conversationSettings.entryDisplay.workbench
  const header = systemForm.value.homeLayoutSettings.header
  const topBanner = systemForm.value.homeLayoutSettings.topBanner

  if (blockKey === 'top-banner') {
    // 旧配置可能缺 topBanner，先补默认再翻转开关；开启时若无主文案则写入占位，否则前台不渲染
    const next = normalizeHomeTopBannerSettings(topBanner)
    const enabling = next.enabled !== true
    next.enabled = enabling
    if (enabling && !String(next.contentText || '').trim()) {
      next.contentText = String(next.tagText || '').trim() || '活动进行中，点击了解详情'
    }
    systemForm.value.homeLayoutSettings.topBanner = next
    return
  }

  if (blockKey === 'header-background') {
    workbench.headerBackgroundEnabled = workbench.headerBackgroundEnabled === false
    return
  }

  if (blockKey === 'title') {
    workbench.titleEnabled = !(workbench.titleEnabled !== false)
    return
  }

  if (blockKey === 'generator') {
    workbench.generatorEnabled = !(workbench.generatorEnabled !== false)
    return
  }

  if (blockKey === 'task-indicator') {
    const nextVisible = !(workbench.taskIndicatorEnabled !== false)
    workbench.taskIndicatorEnabled = nextVisible
    header.showTaskIndicator = nextVisible
    return
  }

  const nextVisible = !(workbench.bannerEnabled !== false)
  workbench.bannerEnabled = nextVisible
  header.showBanner = nextVisible
}

const openTopBannerDialog = () => {
  editingTopBannerDraft.value = normalizeHomeTopBannerSettings(systemForm.value.homeLayoutSettings.topBanner)
  topBannerDialogVisible.value = true
}

const closeTopBannerDialog = () => {
  topBannerDialogVisible.value = false
  editingTopBannerDraft.value = null
}

const submitTopBannerDialog = async () => {
  if (!editingTopBannerDraft.value) {
    closeTopBannerDialog()
    return
  }

  const next = normalizeHomeTopBannerSettings(editingTopBannerDraft.value)
  // 开启却无主文案时前台不展示；保存前补占位，避免「后台开了、前台空白」
  if (next.enabled && !String(next.contentText || '').trim()) {
    next.contentText = String(next.tagText || '').trim() || '活动进行中，点击了解详情'
  }
  systemForm.value.homeLayoutSettings.topBanner = next
  closeTopBannerDialog()
  await appearanceStore.saveAndNotify()
}

const handleWorkbenchContentAction = ({ action, blockKey }: { action: WorkbenchMenuActionKey, blockKey: WorkbenchContentBlockKey }) => {
  if (blockKey === 'top-banner') {
    if (action === 'edit') {
      openTopBannerDialog()
      return
    }
    if (action === 'visible') {
      toggleWorkbenchContentVisibility(blockKey)
    }
    return
  }

  if (action === 'edit') {
    openWorkbenchContentDialog(blockKey)
    return
  }

  if (action === 'visible') {
    toggleWorkbenchContentVisibility(blockKey)
  }
}

const normalizeBannerSortOrder = () => {
  systemForm.value.homeLayoutSettings.banner.items = systemForm.value.homeLayoutSettings.banner.items.map((item, index) => ({
    ...item,
    sortOrder: (index + 1) * 10,
  }))
}

const openBannerItemDialog = (bannerKey: string) => {
  const items = systemForm.value.homeLayoutSettings.banner.items
  const index = items.findIndex(item => item.key === bannerKey)
  if (index < 0) return
  editingBannerItemDraft.value = { ...items[index], index }
  bannerItemDialogVisible.value = true
}

const closeBannerItemDialog = () => {
  bannerItemDialogVisible.value = false
  editingBannerItemDraft.value = null
}

const submitBannerItemDialog = () => {
  const draft = editingBannerItemDraft.value
  if (!draft) return

  const currentItem = systemForm.value.homeLayoutSettings.banner.items[draft.index]
  if (!currentItem) {
    closeBannerItemDialog()
    return
  }

  systemForm.value.homeLayoutSettings.banner.items.splice(draft.index, 1, {
    ...currentItem,
    key: String(draft.key || currentItem.key).trim() || currentItem.key,
    title: String(draft.title || '').trim(),
    subtitle: String(draft.subtitle || '').trim(),
    imageSource: draft.imageSource,
    presetKey: draft.presetKey,
    imageUrl: String(draft.imageUrl || '').trim(),
    backgroundImageUrl: String(draft.backgroundImageUrl || '').trim(),
    mainImageUrl: String(draft.mainImageUrl || '').trim(),
    overlayImageUrl: String(draft.overlayImageUrl || '').trim(),
    glowColor: String(draft.glowColor || '').trim() || '#2FE3FF',
    actionType: draft.actionType,
    actionValue: String(draft.actionValue || '').trim(),
    visible: draft.visible !== false,
  })

  normalizeBannerSortOrder()
  closeBannerItemDialog()
}

const toggleBannerItemVisible = (bannerKey: string) => {
  const item = systemForm.value.homeLayoutSettings.banner.items.find(current => current.key === bannerKey)
  if (!item) return
  item.visible = item.visible === false
}

const handleBannerItemAction = ({ action, bannerKey }: { action: WorkbenchMenuActionKey, bannerKey: string }) => {
  if (action === 'edit') {
    openBannerItemDialog(bannerKey)
    return
  }
  if (action === 'visible') {
    toggleBannerItemVisible(bannerKey)
  }
}

const handleBannerItemReorder = (payload: { sourceBannerKey: string, targetBannerKey: string, position: 'before' | 'after' }) => {
  const items = [...systemForm.value.homeLayoutSettings.banner.items]
  const sourceIndex = items.findIndex(item => item.key === payload.sourceBannerKey)
  const targetIndex = items.findIndex(item => item.key === payload.targetBannerKey)
  if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) {
    return
  }

  const [currentItem] = items.splice(sourceIndex, 1)
  const adjustedTargetIndex = sourceIndex < targetIndex ? targetIndex - 1 : targetIndex
  const insertIndex = payload.position === 'after' ? adjustedTargetIndex + 1 : adjustedTargetIndex
  items.splice(insertIndex, 0, currentItem)
  systemForm.value.homeLayoutSettings.banner.items = items
  normalizeBannerSortOrder()
}

onMounted(() => {
  void appearanceStore.load(true)
})
</script>

<style scoped>
.admin-theme-page {
  display: grid;
  gap: 16px;
  height: calc(100vh - 148px);
  min-height: 860px;
  overflow: hidden;
}

.admin-theme-loading {
  min-height: 160px;
  display: grid;
  place-items: center;
}

.admin-theme-shell {
  height: 100%;
  min-height: 0;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  overflow: hidden;
}

.admin-theme-shell__body {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  min-height: 0;
  height: 100%;
}
</style>
