<template>
  <AdminPageContainer
    class="admin-system-page"
    :title="pageTitle"
    :description="pageDescription"
  >
    <template #actions>
      <button
        v-if="currentTab !== 'login'"
        class="admin-button admin-button--primary"
        type="button"
        :disabled="systemSaving || loading"
        @click="handleSaveSystemSettings"
      >
        {{ systemSaving ? '保存中...' : '保存当前分组' }}
      </button>
      <button
        v-else
        class="admin-button admin-button--primary"
        type="button"
        :disabled="loading || methodSaving || !authMethods.length"
        @click="handleSaveAuthMethods"
      >
        {{ methodSaving ? '保存中...' : '保存登录方式' }}
      </button>
    </template>

    <div v-if="!isLayoutOnlyRoute" class="admin-grid admin-grid--stats">
      <template>
        <AdminStatCard label="站点名称" :value="systemForm.siteInfo.siteName || '未设置'" hint="登录弹窗标题与浏览器标题都会复用这里的配置" />
        <AdminStatCard label="启用登录方式" :value="enabledMethodCount" hint="当前对前台用户可见且可用的登录方式数量" />
        <AdminStatCard label="协议勾选" :value="systemForm.policySettings.agreementRequired ? '开启' : '关闭'" hint="控制登录前是否必须勾选协议" />
        <AdminStatCard label="当前分组" :value="activeTabMeta.label" :hint="activeTabMeta.description" />
      </template>
    </div>

    <div class="admin-system-shell" :class="{ 'admin-system-shell--single': !showTabNav }">
      <nav v-if="showTabNav" class="admin-system-tabs-bar" role="tablist" aria-label="系统设置分组">
        <button
          v-for="item in tabItems"
          :key="item.key"
          class="admin-system-tabs-bar__item"
          :class="{ 'is-active': currentTab === item.key }"
          type="button"
          role="tab"
          :aria-selected="currentTab === item.key"
          @click="currentTab = item.key"
        >
          <span class="admin-system-tabs-bar__label">{{ item.label }}</span>
          <span class="admin-system-tabs-bar__desc">{{ item.description }}</span>
        </button>
      </nav>

      <div class="admin-system-main">
        <AdminSystemSitePanel
          v-if="currentTab === 'site'"
          :form="systemForm"
          :on-submit="handleSaveSystemSettings"
        />

        <AdminSystemPolicyPanel
          v-else-if="currentTab === 'policy'"
          :form="systemForm"
          :on-submit="handleSaveSystemSettings"
        />

        <AdminSystemLayoutPanel
          v-else-if="currentTab === 'layout'"
          :form="systemForm"
          :home-banner-preset-options="HOME_BANNER_PRESET_OPTIONS"
          :home-side-menu-base-status="homeSideMenuBaseStatus"
          :home-side-menu-items-status="homeSideMenuItemsStatus"
          :home-banner-status="homeBannerStatus"
          :on-submit="handleSaveSystemSettings"
          :scroll-to-layout-section="scrollToLayoutSection"
          :get-menu-section-label="getMenuSectionLabel"
          :move-home-side-menu-item="moveHomeSideMenuItem"
          :trigger-menu-icon-upload="triggerMenuIconUpload"
          :handle-menu-icon-file-change="handleMenuIconFileChange"
          :clear-menu-icon="clearMenuIcon"
          :append-home-banner-item="appendHomeBannerItem"
          :move-home-banner-item="moveHomeBannerItem"
          :remove-home-banner-item="removeHomeBannerItem"
        />

        <AdminSystemLoginPanel
          v-else
          :loading="loading"
          :method-saving="methodSaving"
          :enabled-method-count="enabledMethodCount"
          :auth-methods="authMethods"
          :sorted-auth-methods="sortedAuthMethods"
          :creatable-method-templates="creatableMethodTemplates"
          :active-method-menu-type="activeMethodMenuType"
          :build-method-preview-items="buildMethodPreviewItems"
          :get-method-category-label="getMethodCategoryLabel"
          :get-method-type-label="getMethodTypeLabel"
          :open-create-method-dialog="openCreateMethodDialog"
          :open-edit-method-dialog="openEditMethodDialog"
          :toggle-method-menu="toggleMethodMenu"
          :handle-method-menu-edit="handleMethodMenuEdit"
          :handle-method-menu-toggle-enabled="handleMethodMenuToggleEnabled"
          :handle-method-menu-toggle-visible="handleMethodMenuToggleVisible"
          :handle-method-menu-delete="handleMethodMenuDelete"
          :toggle-method-enabled="toggleMethodEnabled"
          :toggle-method-visible="toggleMethodVisible"
          :remove-method="removeMethod"
        />
      </div>
    </div>
  </AdminPageContainer>

  <AdminSystemMethodDialog
    :visible="methodDialogVisible"
    :editing-method-type="editingMethodType"
    :method-form="methodForm"
    :creatable-method-templates="creatableMethodTemplates"
    :close-method-dialog="closeMethodDialog"
    :handle-submit-method-dialog="handleSubmitMethodDialog"
    :handle-create-method-type-change="handleCreateMethodTypeChange"
  />
</template>

<script setup lang="ts">
// 系统设置页：站点 / 协议 / 登录分组。
defineOptions({ name: 'AdminSystem' })
import './admin-system.css'
import { computed, defineAsyncComponent, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AdminStatCard from '@/components/admin/common/AdminStatCard.vue'
import AdminPageContainer from '@/components/admin/layout/AdminPageContainer.vue'
// 4 个 Panel + 1 个 Dialog 通过 v-if 切换显示，改为异步组件后未激活的 Tab 不再下载
const AdminSystemLayoutPanel = defineAsyncComponent(() => import('@/views/admin/system/components/AdminSystemLayoutPanel.vue'))
const AdminSystemPolicyPanel = defineAsyncComponent(() => import('@/views/admin/system/components/AdminSystemPolicyPanel.vue'))
const AdminSystemSitePanel = defineAsyncComponent(() => import('@/views/admin/system/components/AdminSystemSitePanel.vue'))
const AdminSystemLoginPanel = defineAsyncComponent(() => import('@/views/admin/system/components/AdminSystemLoginPanel.vue'))
const AdminSystemMethodDialog = defineAsyncComponent(() => import('@/views/admin/system/components/AdminSystemMethodDialog.vue'))
import {
  createDefaultConversationSettings,
  createDefaultGenerationProgressSettings,
  createDefaultGlobalThemeSettings,
  createDefaultHomeLayoutSettings,
  createDefaultHomeSideMenuSettings,
  getAdminSystemConfig,
  normalizeHomeTopBannerSettings,
  saveAdminHomeLayoutSettings,
  saveAdminPolicySettings,
  saveAdminSiteInfoSettings,
  type SystemConfigPayload,
} from '@/api/system-config'
import { useSystemSettingsStore } from '@/stores/system-settings'
import { HOME_BANNER_PRESET_OPTIONS, useAdminLayoutConfig } from '@/views/admin/system/useAdminLayoutConfig'
import { getMethodCategoryLabel, useAdminAuthMethods } from '@/views/admin/system/useAdminAuthMethods'

const loading = ref(false)
const route = useRoute()
const currentTab = ref<'site' | 'policy' | 'layout' | 'login'>('site')
const systemTabItems = [
  { key: 'site', label: '站点信息', description: '品牌、标题、页脚与备案信息' },
  { key: 'policy', label: '政策协议', description: '协议文案、正文与登录提示' },
  { key: 'login', label: '登录方式', description: '启用状态、排序与登录字段' },
] as const
const layoutTabItem = { key: 'layout', label: '布局配置', description: '左侧菜单、首页结构与展示编排' } as const
const isLayoutOnlyRoute = computed(() => route.name === 'AdminLayout')
const showTabNav = computed(() => !isLayoutOnlyRoute.value)
const tabItems = computed(() => {
  return isLayoutOnlyRoute.value ? [layoutTabItem] : systemTabItems
})
const pageTitle = computed(() => {
  return isLayoutOnlyRoute.value ? '布局配置' : '系统设置'
})
const pageDescription = computed(() => {
  return isLayoutOnlyRoute.value
    ? '单独维护左侧导航、首页头部展示与 Banner 编排。'
    : '统一维护站点信息、政策协议以及登录方式配置。'
})
const syncCurrentTabWithRoute = () => {
  if (isLayoutOnlyRoute.value) {
    currentTab.value = 'layout'
    return
  }

  if (currentTab.value === 'layout') {
    currentTab.value = 'site'
  }
}
const activeTabMeta = computed(() => {
  return tabItems.value.find(item => item.key === currentTab.value) || tabItems.value[0]
})

watch(
  () => route.name,
  () => {
    syncCurrentTabWithRoute()
  },
  { immediate: true },
)
const systemSaving = ref(false)
const { applyPublicSystemSettings } = useSystemSettingsStore()
const {
  methodSaving,
  methodDialogVisible,
  activeMethodMenuType,
  editingMethodType,
  authMethods,
  methodForm,
  enabledMethodCount,
  sortedAuthMethods,
  creatableMethodTemplates,
  buildMethodPreviewItems,
  getMethodTypeLabel,
  openCreateMethodDialog,
  openEditMethodDialog,
  closeMethodDialog,
  handleCreateMethodTypeChange,
  handleSubmitMethodDialog,
  handleSaveAuthMethods,
  toggleMethodMenu,
  handleMethodMenuEdit,
  handleMethodMenuToggleEnabled,
  handleMethodMenuToggleVisible,
  handleMethodMenuDelete,
  toggleMethodEnabled,
  toggleMethodVisible,
  removeMethod,
  loadAuthMethodData,
} = useAdminAuthMethods()

const createDefaultSystemForm = (): SystemConfigPayload => ({
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
    ...createDefaultGenerationProgressSettings(),
  },
  conversationSettings: createDefaultConversationSettings(),
  globalThemeSettings: createDefaultGlobalThemeSettings(),
  homeSideMenuSettings: createDefaultHomeSideMenuSettings(),
  homeLayoutSettings: createDefaultHomeLayoutSettings(),
})

const systemForm = reactive<SystemConfigPayload>(createDefaultSystemForm())

const {
  homeSideMenuBaseStatus,
  homeSideMenuItemsStatus,
  homeBannerStatus,
  getMenuSectionLabel,
  scrollToLayoutSection,
  moveHomeSideMenuItem,
  triggerMenuIconUpload,
  handleMenuIconFileChange,
  clearMenuIcon,
  appendHomeBannerItem,
  moveHomeBannerItem,
  removeHomeBannerItem,
} = useAdminLayoutConfig(systemForm)


const applySystemForm = (value: SystemConfigPayload) => {
  systemForm.siteInfo.siteName = value.siteInfo.siteName
  systemForm.siteInfo.siteDescription = value.siteInfo.siteDescription
  systemForm.siteInfo.siteLogoUrl = value.siteInfo.siteLogoUrl
  systemForm.siteInfo.siteIconUrl = value.siteInfo.siteIconUrl
  systemForm.siteInfo.icpText = value.siteInfo.icpText
  systemForm.siteInfo.icpLink = value.siteInfo.icpLink
  systemForm.siteInfo.copyrightText = value.siteInfo.copyrightText
  systemForm.policySettings.agreementRequired = value.policySettings.agreementRequired
  systemForm.policySettings.agreementTextPrefix = value.policySettings.agreementTextPrefix
  systemForm.policySettings.userAgreementTitle = value.policySettings.userAgreementTitle
  systemForm.policySettings.userAgreementUrl = value.policySettings.userAgreementUrl
  systemForm.policySettings.userAgreementContent = value.policySettings.userAgreementContent
  systemForm.policySettings.privacyPolicyTitle = value.policySettings.privacyPolicyTitle
  systemForm.policySettings.privacyPolicyUrl = value.policySettings.privacyPolicyUrl
  systemForm.policySettings.privacyPolicyContent = value.policySettings.privacyPolicyContent
  systemForm.policySettings.aiNoticeTitle = value.policySettings.aiNoticeTitle
  systemForm.policySettings.aiNoticeUrl = value.policySettings.aiNoticeUrl
  systemForm.policySettings.aiNoticeContent = value.policySettings.aiNoticeContent
  systemForm.loginSettings.welcomeTitle = value.loginSettings.welcomeTitle
  systemForm.loginSettings.welcomeSubtitle = value.loginSettings.welcomeSubtitle
  systemForm.generationProgressSettings.enabled = value.generationProgressSettings.enabled
  systemForm.generationProgressSettings.stages = value.generationProgressSettings.stages.map(item => ({ ...item }))
  systemForm.conversationSettings = JSON.parse(JSON.stringify(value.conversationSettings || createDefaultConversationSettings()))
  systemForm.globalThemeSettings = JSON.parse(JSON.stringify(value.globalThemeSettings || createDefaultGlobalThemeSettings()))
  systemForm.homeSideMenuSettings = JSON.parse(JSON.stringify(value.homeSideMenuSettings || createDefaultHomeSideMenuSettings()))
  {
    const layoutDefaults = createDefaultHomeLayoutSettings()
    const layout = JSON.parse(JSON.stringify(value.homeLayoutSettings || layoutDefaults)) as typeof layoutDefaults
    systemForm.homeLayoutSettings = {
      ...layoutDefaults,
      ...layout,
      header: {
        ...layoutDefaults.header,
        ...(layout.header || {}),
      },
      topBanner: normalizeHomeTopBannerSettings(layout.topBanner),
      banner: {
        ...layoutDefaults.banner,
        ...(layout.banner || {}),
        items: Array.isArray(layout.banner?.items) && layout.banner.items.length
          ? layout.banner.items
          : layoutDefaults.banner.items.map(item => ({ ...item })),
      },
    }
  }
}

const loadPageData = async () => {
  loading.value = true
  try {
    const systemSettings = await getAdminSystemConfig()
    applySystemForm(systemSettings || createDefaultSystemForm())
    await loadAuthMethodData()
  } finally {
    loading.value = false
  }
}

const buildSystemPayload = (): SystemConfigPayload => ({
  siteInfo: {
    siteName: systemForm.siteInfo.siteName,
    siteDescription: systemForm.siteInfo.siteDescription,
    siteLogoUrl: systemForm.siteInfo.siteLogoUrl,
    siteIconUrl: systemForm.siteInfo.siteIconUrl,
    icpText: systemForm.siteInfo.icpText,
    icpLink: systemForm.siteInfo.icpLink,
    copyrightText: systemForm.siteInfo.copyrightText,
  },
  policySettings: {
    agreementRequired: systemForm.policySettings.agreementRequired,
    agreementTextPrefix: systemForm.policySettings.agreementTextPrefix,
    userAgreementTitle: systemForm.policySettings.userAgreementTitle,
    userAgreementUrl: systemForm.policySettings.userAgreementUrl,
    userAgreementContent: systemForm.policySettings.userAgreementContent,
    privacyPolicyTitle: systemForm.policySettings.privacyPolicyTitle,
    privacyPolicyUrl: systemForm.policySettings.privacyPolicyUrl,
    privacyPolicyContent: systemForm.policySettings.privacyPolicyContent,
    aiNoticeTitle: systemForm.policySettings.aiNoticeTitle,
    aiNoticeUrl: systemForm.policySettings.aiNoticeUrl,
    aiNoticeContent: systemForm.policySettings.aiNoticeContent,
  },
  loginSettings: {
    welcomeTitle: systemForm.loginSettings.welcomeTitle,
    welcomeSubtitle: systemForm.loginSettings.welcomeSubtitle,
  },
  generationProgressSettings: {
    enabled: systemForm.generationProgressSettings.enabled,
    stages: systemForm.generationProgressSettings.stages.map(item => ({
      key: item.key,
      label: item.label,
      percent: item.percent,
      showPercent: item.showPercent,
      description: item.description,
    })),
  },
  conversationSettings: JSON.parse(JSON.stringify(systemForm.conversationSettings)),
  globalThemeSettings: JSON.parse(JSON.stringify(systemForm.globalThemeSettings)),
  homeSideMenuSettings: {
    ...JSON.parse(JSON.stringify(systemForm.homeSideMenuSettings)),
    items: systemForm.homeSideMenuSettings.items.map(item => ({
      ...JSON.parse(JSON.stringify(item)),
      iconType: item.iconSource === 'custom' ? 'image' : 'system',
    })),
  },
  homeLayoutSettings: JSON.parse(JSON.stringify(systemForm.homeLayoutSettings)),
})

const buildSiteInfoPayload = (): Pick<SystemConfigPayload, 'siteInfo'> => ({
  siteInfo: buildSystemPayload().siteInfo,
})

const buildPolicyPayload = (): Pick<SystemConfigPayload, 'policySettings'> => ({
  policySettings: buildSystemPayload().policySettings,
})

const buildHomeLayoutPayload = (): Pick<SystemConfigPayload, 'homeSideMenuSettings' | 'homeLayoutSettings'> => {
  const payload = buildSystemPayload()
  return {
    homeSideMenuSettings: payload.homeSideMenuSettings,
    homeLayoutSettings: payload.homeLayoutSettings,
  }
}

const saveCurrentSystemGroup = () => {
  if (currentTab.value === 'site') {
    return saveAdminSiteInfoSettings(buildSiteInfoPayload())
  }
  if (currentTab.value === 'policy') {
    return saveAdminPolicySettings(buildPolicyPayload())
  }
  return saveAdminHomeLayoutSettings(buildHomeLayoutPayload())
}

const handleSaveSystemSettings = async () => {
  systemSaving.value = true
  try {
    const saved = await saveCurrentSystemGroup()
    applySystemForm(saved)
    applyPublicSystemSettings(saved)
  } finally {
    systemSaving.value = false
  }
}

onMounted(() => {
  void loadPageData()
})
</script>

<style scoped>
.admin-system-shell {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.admin-system-shell--single {
  gap: 0;
}

.admin-system-tabs-bar {
  display: flex;
  align-items: stretch;
  gap: 8px;
  padding: 6px;
  border: 1px solid var(--line-divider, #00000014);
  border-radius: var(--admin-radius-panel);
  background: color-mix(in srgb, var(--bg-block-secondary-default) 72%, var(--bg-surface));
  overflow-x: auto;
  scrollbar-width: none;
}

.admin-system-tabs-bar::-webkit-scrollbar {
  display: none;
}

.admin-system-tabs-bar__item {
  flex: 1 1 0;
  min-width: 148px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  padding: 12px 16px;
  border: 1px solid transparent;
  border-radius: var(--admin-radius-control);
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, color 0.2s ease;
  text-align: left;
}

.admin-system-tabs-bar__item:hover {
  color: var(--text-primary);
  background: color-mix(in srgb, var(--bg-surface) 72%, transparent);
}

.admin-system-tabs-bar__item.is-active {
  color: var(--text-primary);
  border-color: color-mix(in srgb, var(--brand-main-default) 28%, transparent);
  background: var(--bg-surface);
  box-shadow: 0 8px 24px color-mix(in srgb, var(--brand-main-default) 8%, transparent);
}

.admin-system-tabs-bar__label {
  font-size: 14px;
  font-weight: 600;
  line-height: 1.4;
  white-space: nowrap;
}

.admin-system-tabs-bar__desc {
  font-size: 12px;
  line-height: 1.5;
  color: var(--text-tertiary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.admin-system-tabs-bar__item.is-active .admin-system-tabs-bar__desc {
  color: color-mix(in srgb, var(--text-secondary) 88%, var(--brand-main-default) 12%);
}

.admin-system-main {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.admin-system-progress-summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.admin-system-progress-summary__value {
  color: var(--text-primary);
  font-size: 24px;
  font-weight: 700;
}

.admin-system-stage-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.admin-system-stage-card {
  border: 1px solid var(--line-divider, #00000014);
  border-radius: var(--admin-radius-panel);
  padding: 18px;
  background: var(--bg-surface);
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.04);
  transition: border-color .2s ease, box-shadow .2s ease, transform .2s ease;
}

.admin-system-stage-card:hover {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--brand-main-default) 16%, var(--line-divider, #00000014));
  box-shadow: 0 16px 32px rgba(15, 23, 42, 0.08);
}

.admin-system-stage-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.admin-system-stage-card__header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.admin-system-stage-card__title-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.admin-system-stage-card__title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
}

.admin-system-stage-card__key {
  font-size: 12px;
  font-weight: 600;
}

.admin-system-stage-card__desc {
  margin-top: 6px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--text-tertiary);
}

.admin-system-stage-card__preview {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding: 12px 14px;
  border-radius: var(--admin-radius-panel);
  background: var(--bg-block-primary-default);
  border: 1px solid var(--line-divider, #00000014);
}

.admin-system-stage-card__preview-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-tertiary);
  white-space: nowrap;
}

.admin-system-stage-card__badge {
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  padding: 0 12px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--brand-main-block-default) 72%, var(--bg-surface));
  color: var(--brand-main-default);
  font-size: 13px;
  font-weight: 600;
  border: 1px solid color-mix(in srgb, var(--brand-main-default) 18%, transparent);
}

.admin-system-stage-card__body {
  padding-top: 2px;
}

@media (max-width: 900px) {
  .admin-system-tabs-bar__item {
    min-width: 120px;
    padding: 10px 12px;
  }

  .admin-system-tabs-bar__desc {
    display: none;
  }

  .admin-system-stage-card__header {
    flex-direction: column;
    align-items: flex-start;
  }

  .admin-system-stage-card__header-actions {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>

<style>
/* 系统设置页在 admin-page-view(height:100%) 内自建滚动，避免长表单/协议编辑被裁切 */
.admin-page.admin-system-page {
  height: 100%;
  min-height: 0;
  box-sizing: border-box;
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
</style>
