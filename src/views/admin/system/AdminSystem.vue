<template>
  <AdminPageContainer :title="pageTitle" :description="pageDescription">
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
      <aside v-if="showTabNav" class="admin-system-nav admin-card">
        <div class="admin-card__header">
          <div>
            <h4 class="admin-card__title">配置分组</h4>
            <div class="admin-card__desc">按品牌、协议与登录分组维护系统设置。</div>
          </div>
        </div>
        <div class="admin-card__content admin-system-nav__content">
          <button
            v-for="item in tabItems"
            :key="item.key"
            class="admin-system-tabs__item"
            :class="{ 'is-active': currentTab === item.key }"
            type="button"
            @click="currentTab = item.key"
          >
            <span class="admin-system-tabs__title">{{ item.label }}</span>
            <span class="admin-system-tabs__desc">{{ item.description }}</span>
          </button>
        </div>
      </aside>

      <div class="admin-system-main">
        <div v-if="!isLayoutOnlyRoute" class="admin-system-section-head admin-card">
          <div class="admin-card__content">
            <div class="admin-system-section-head__inner">
              <div>
                <div class="admin-system-section-head__eyebrow">当前分组</div>
                <h3 class="admin-system-section-head__title">{{ activeTabMeta.label }}</h3>
                <p class="admin-system-section-head__desc">{{ activeTabMeta.description }}</p>
              </div>
              <div class="admin-system-section-head__tips">
                <span class="admin-system-section-head__tip">
                  保存后会同步影响前台展示与后台默认行为
                </span>
              </div>
            </div>
          </div>
        </div>

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
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 16px;
  align-items: start;
}

.admin-system-shell--single {
  grid-template-columns: minmax(0, 1fr);
}

.admin-system-nav {
  position: sticky;
  top: 24px;
}

.admin-system-nav__content {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.admin-system-main {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.admin-system-section-head__inner {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
}

.admin-system-section-head__eyebrow {
  margin-bottom: 8px;
  color: var(--text-tertiary);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.admin-system-section-head__title {
  margin: 0;
  color: var(--text-primary);
  font-size: 24px;
  line-height: 1.2;
}

.admin-system-section-head__desc {
  margin: 8px 0 0;
  color: var(--text-secondary);
  line-height: 1.7;
}

.admin-system-section-head__tips {
  display: flex;
  justify-content: flex-end;
}

.admin-system-section-head__tip {
  display: inline-flex;
  align-items: center;
  min-height: 36px;
  padding: 0 14px;
  border: 1px solid color-mix(in srgb, var(--brand-primary, #6b8cff) 22%, transparent);
  border-radius: 999px;
  background: color-mix(in srgb, var(--brand-primary, #6b8cff) 8%, var(--bg-surface));
  color: var(--text-secondary);
  font-size: 12px;
}

.admin-system-tabs__item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  width: 100%;
  padding: 16px 18px;
  border: 1px solid var(--line-divider, #00000014);
  border-radius: 16px;
  background: var(--bg-surface);
  color: var(--text-secondary);
  transition: all 0.2s ease;
  text-align: left;
}

.admin-system-tabs__item:hover,
.admin-system-tabs__item.is-active {
  border-color: color-mix(in srgb, var(--brand-primary, #6b8cff) 32%, transparent);
  background: color-mix(in srgb, var(--brand-primary, #6b8cff) 10%, var(--bg-surface));
  color: var(--text-primary);
}

.admin-system-tabs__title {
  font-size: 15px;
  font-weight: 600;
}

.admin-system-tabs__desc {
  font-size: 12px;
  line-height: 1.5;
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
  border-radius: 18px;
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
  border-radius: 14px;
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

@media (max-width: 1200px) {
  .admin-system-shell {
    grid-template-columns: minmax(0, 1fr);
  }

  .admin-system-nav {
    position: static;
  }

  .admin-system-nav__content {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {

  .admin-system-section-head__inner {
    flex-direction: column;
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
