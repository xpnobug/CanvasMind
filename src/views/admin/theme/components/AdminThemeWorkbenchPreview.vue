<template>
  <div class="admin-theme-canvas-wrap">
    <div
      class="admin-theme-canvas"
      :class="previewThemeClass"
      :style="previewThemeVars"
      :lv-theme="previewThemeClass === 'is-light' ? 'light' : 'dark'"
      :data-theme="previewThemeClass === 'is-light' ? 'light' : 'dark'"
    >
      <div class="admin-theme-canvas__viewport">
        <div
          class="admin-theme-frontstage__top-banner"
          :class="{ 'is-hidden-block': !systemForm.homeLayoutSettings.topBanner.enabled }"
        >
          <HomeTopBanner
            :config="previewTopBannerSettings"
            :disable-navigation="true"
            :preview-readonly="true"
          />
          <div class="admin-theme-frontstage__top-banner-actions">
            <AdminThemeWorkbenchItemActions
              :visible="systemForm.homeLayoutSettings.topBanner.enabled"
              :action-keys="['edit', 'visible']"
              @action="$emit('contentBlockAction', { action: $event, blockKey: 'top-banner' })"
            />
          </div>
        </div>
        <div
          class="admin-theme-frontstage"
          :class="{ 'is-theme-linked-active': activeThemeSectionId === 'theme-section-mode' }"
          @click="$emit('themeSectionSelect', 'theme-section-mode')"
        >
          <div
            class="admin-theme-frontstage__body"
            :class="{ 'is-theme-linked-active': activeThemeSectionId === 'theme-section-surface' }"
            :style="previewFrontstageBodyStyle"
            @click.stop="$emit('themeSectionSelect', 'theme-section-surface')"
          >
            <aside
              v-if="systemForm.homeSideMenuSettings.enabled"
              class="admin-theme-frontstage__sidebar admin-theme-frontstage__sidebar--real"
              :class="{
                'is-theme-field-active': activeThemeFieldId === 'sideMenuBackground',
                'is-top-layout': systemForm.homeSideMenuSettings.layoutMode === 'top',
              }"
              :style="previewSidebarStyle"
            >
              <AdminThemeFrontSideMenuPreview
                :settings="systemForm.homeSideMenuSettings"
                :site-info="systemForm.siteInfo"
                :active-menu-key="previewActiveMenuKey"
                :active-theme-field-id="activeThemeFieldId"
                :top-item="previewTopMenuItem"
                :center-groups="previewCenterMenuGroups"
                :bottom-groups="previewBottomMenuGroups"
                :toggle-menu-visibility="toggleMenuVisibility"
                :apply-menu-reorder="applyMenuReorder"
                @menu-action="$emit('menuAction', $event)"
                @menu-reorder="$emit('menuReorder', $event)"
              />
            </aside>
            <main
              class="admin-theme-frontstage__main"
              :class="{
                'is-theme-field-active': activeThemeFieldId === 'pageBackground',
                'home-main-content-background': Boolean(previewHeaderBackgroundImageUrl),
              }"
              :style="previewMainStyle"
            >
              <!-- img 铺底：不依赖 CSS 变量 / ::before，避免 scoped 底色把图盖住 -->
              <img
                v-if="previewHeaderBackgroundImageUrl"
                class="home-main-content-background__layer"
                :src="previewHeaderBackgroundImageUrl"
                alt=""
                aria-hidden="true"
              >
              <div class="content-wrapper-cF1zaN admin-theme-frontstage__content-wrapper">
                <div class="main-container-nXfW_A admin-theme-frontstage__content-main">
                  <div class="content-TZbgMr admin-theme-frontstage__content-scroll">
                    <div
                      class="scroll-container-Jsws2j scroll-container-QnV2C9 admin-theme-frontstage__scroll-shell"
                      :class="{ 'is-theme-field-active': activeThemeFieldId === 'surfaceBackground' }"
                    >
                      <div>
                        <div class="scroll-content-DaYLnh scroll-content admin-theme-frontstage__scroll-content">
                          <div class="section-generator admin-theme-frontstage__section-generator">
                            <AdminThemeFrontHomeHeaderPreview
                              :system-form="systemForm"
                              :preview-banner-items="previewBannerItems"
                              :preview-is-light="previewThemeClass === 'is-light'"
                              :active-theme-section-id="activeThemeSectionId"
                              :active-theme-field-id="activeThemeFieldId"
                              @block-action="$emit('contentBlockAction', $event)"
                              @banner-item-action="$emit('bannerItemAction', $event)"
                              @banner-item-reorder="$emit('bannerItemReorder', $event)"
                              @theme-section-select="$emit('themeSectionSelect', $event)"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, type CSSProperties } from 'vue'
import AdminThemeFrontSideMenuPreview from '@/views/admin/theme/components/AdminThemeFrontSideMenuPreview.vue'
import AdminThemeFrontHomeHeaderPreview, { type WorkbenchContentBlockKey as HeaderBlockKey } from '@/views/admin/theme/components/AdminThemeFrontHomeHeaderPreview.vue'
import AdminThemeWorkbenchItemActions, { type WorkbenchMenuActionKey } from '@/views/admin/theme/components/AdminThemeWorkbenchItemActions.vue'
import HomeTopBanner from '@/components/home/components/HomeTopBanner.vue'
import '@/components/home/components/home-main-content-background.css'
import {
  normalizeHomeTopBannerSettings,
  type SystemConfigPayload,
  type SystemHomeBannerItemConfig,
  type SystemHomeSideMenuGroupConfig,
  type SystemHomeSideMenuItemConfig,
  type SystemHomeTopBannerConfig,
} from '@/api/system-config'

export type WorkbenchContentBlockKey = HeaderBlockKey | 'top-banner'

interface MenuGroupView extends SystemHomeSideMenuGroupConfig {
  items: SystemHomeSideMenuItemConfig[]
}

const props = defineProps<{
  systemForm: SystemConfigPayload
  previewThemeClass: 'is-dark' | 'is-light'
  previewThemeVars: Record<string, string>
  previewFrontstageBodyStyle: CSSProperties
  previewSidebarStyle: CSSProperties
  previewSurfaceFrameStyle: CSSProperties
  previewSurfaceCardStyle: CSSProperties
  previewBannerCardStyle: CSSProperties
  previewBannerGlowStyle: CSSProperties
  previewActiveMenuKey: string
  previewTopMenuItem: SystemHomeSideMenuItemConfig | null
  previewCenterMenuGroups: MenuGroupView[]
  previewBottomMenuGroups: MenuGroupView[]
  previewPrimaryBanner: SystemHomeBannerItemConfig | null
  previewSecondaryBanners: SystemHomeBannerItemConfig[]
  activeThemeSectionId: string | null
  activeThemeFieldId: string | null
  toggleMenuVisibility: (menuKey: string) => void
  applyMenuReorder: (payload: { sourceMenuKey: string, targetMenuKey: string, position: 'before' | 'after' }) => void
}>()

defineEmits<{
  menuAction: [payload: { action: WorkbenchMenuActionKey, menuKey: string }]
  menuReorder: [payload: { sourceMenuKey: string, targetMenuKey: string, position: 'before' | 'after' }]
  contentBlockAction: [payload: { action: WorkbenchMenuActionKey, blockKey: WorkbenchContentBlockKey }]
  bannerItemAction: [payload: { action: WorkbenchMenuActionKey, bannerKey: string }]
  bannerItemReorder: [payload: { sourceBannerKey: string, targetBannerKey: string, position: 'before' | 'after' }]
  themeSectionSelect: [sectionId: string]
}>()

const previewBannerItems = computed(() => {
  return [...(props.systemForm.homeLayoutSettings.banner.items || [])]
    .sort((left, right) => left.sortOrder - right.sortOrder)
})

const previewTopBannerSettings = computed<SystemHomeTopBannerConfig>(() => {
  const normalized = normalizeHomeTopBannerSettings(props.systemForm.homeLayoutSettings?.topBanner)
  return {
    ...normalized,
    // 预览区始终挂载横幅壳；真实 enabled 由外层 is-hidden-block / 操作钮反映
    enabled: true,
    // 未配置文案时用不可见空白占位，不注入默认运营文案
    contentText: normalized.contentText || '\u00A0',
  }
})

/**
 * 预览主栏整页铺底。
 * 按预览明暗取图；对应侧为空时回退另一侧，避免后台预览「有配置却全黑」。
 * 前台仍严格：亮色空不回退暗色。
 */
const previewHeaderBackgroundImageUrl = computed(() => {
  const workbench = props.systemForm.conversationSettings?.entryDisplay?.workbench
  if (workbench?.headerBackgroundEnabled === false) return ''
  const dark = String(workbench?.headerBackgroundImageUrl || '').trim()
  const light = String(workbench?.headerBackgroundImageUrlLight || '').trim()
  if (props.previewThemeClass === 'is-light') {
    return light || dark
  }
  return dark || light
})

/** 主栏同时内联 backgroundImage，双保险 */
const previewMainStyle = computed(() => {
  const url = previewHeaderBackgroundImageUrl.value
  if (!url) return undefined
  return {
    backgroundColor: 'transparent',
    backgroundImage: `url(${JSON.stringify(url)})`,
    backgroundPosition: 'top',
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'cover',
  } as CSSProperties
})
</script>

<style scoped>
.admin-theme-frontstage__top-banner {
  position: relative;
  width: 100%;
}

.admin-theme-frontstage__top-banner.is-hidden-block {
  opacity: 0.45;
}

.admin-theme-frontstage__top-banner :deep(.home-top-banner) {
  z-index: 1;
}

.admin-theme-frontstage__top-banner-actions {
  position: absolute;
  top: 8px;
  right: 12px;
  z-index: 2;
}

.admin-theme-canvas-wrap {
  min-height: 0;
  height: 100%;
  overflow: hidden;
}

.admin-theme-canvas {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  /* border-radius: 24px; */
  border: 1px solid rgba(255, 255, 255, 0.08);
  overflow: hidden;
  transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}

.admin-theme-canvas.is-dark {
  background: var(--theme-page-background, #0f0f12);
  color: #f8fafc;
}

.admin-theme-canvas.is-light {
  background: var(--theme-page-background, #f8f9fa);
  color: #0f172a;
}

.admin-theme-canvas__viewport {
  --admin-theme-side-preview-height: 1220px;
  flex: 1;
  min-height: 0;
  box-sizing: border-box;
  /* padding: 20px; */
  display: grid;
  gap: 24px;
  overflow: auto;
}

.admin-theme-canvas.is-dark .admin-theme-preview-block__title,
.admin-theme-canvas.is-dark .admin-theme-button-preview__label {
  color: rgba(226, 232, 240, 0.82);
}

.admin-theme-frontstage {
  /* border-radius: 22px; */
  overflow: visible;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: transparent;
  transition: box-shadow 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
}

.admin-theme-canvas.is-dark .admin-theme-frontstage {
  border-color: rgba(255, 255, 255, 0.08);
}

.admin-theme-frontstage__body {
  display: grid;
  grid-template-columns: 184px minmax(0, 1fr);
  min-height: var(--admin-theme-side-preview-height);
  border-radius: 22px;
  overflow: hidden;
  transition: box-shadow 0.2s ease, background 0.2s ease;
}

.admin-theme-frontstage.is-theme-linked-active {
  border-color: rgba(99, 102, 241, 0.42);
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.18), 0 18px 38px rgba(79, 70, 229, 0.16);
}

.admin-theme-frontstage__body.is-theme-linked-active {
  box-shadow: inset 0 0 0 2px rgba(99, 102, 241, 0.22);
}

.admin-theme-frontstage__sidebar {
  box-sizing: border-box;
  position: relative;
  z-index: 3;
  height: 100%;
  min-height: var(--admin-theme-side-preview-height);
  padding: 16px 8px;
  display: flex;
  align-items: stretch;
  overflow: visible;
}

.admin-theme-frontstage__sidebar.is-top-layout {
  min-height: 112px;
  padding: 16px;
}

.admin-theme-frontstage__sidebar.is-theme-field-active {
  box-shadow: inset 0 0 0 2px rgba(34, 211, 238, 0.34);
  border-radius: 24px;
}

.admin-theme-frontstage__sidebar--real {
  z-index: 6;
}

.admin-theme-frontstage__main {
  position: relative;
  z-index: 1;
  width: 100%;
  min-width: 0;
  min-height: var(--admin-theme-side-preview-height);
  overflow: auto;
  background: var(--theme-page-background, var(--bg-body, #0f0f12));
}

.admin-theme-frontstage__main.is-theme-field-active {
  box-shadow: inset 0 0 0 2px rgba(34, 211, 238, 0.3);
}

.admin-theme-frontstage__main.home-main-content-background {
  background-color: transparent;
}

.admin-theme-frontstage__main > .home-main-content-background__layer {
  position: absolute;
  inset: 0;
  z-index: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: top;
  pointer-events: none;
}

.admin-theme-frontstage__main.home-main-content-background > :not(.home-main-content-background__layer) {
  position: relative;
  z-index: 1;
}

.admin-theme-frontstage__main.home-main-content-background :deep(.admin-theme-frontstage__content-wrapper),
.admin-theme-frontstage__main.home-main-content-background :deep(.admin-theme-frontstage__content-main),
.admin-theme-frontstage__main.home-main-content-background :deep(.admin-theme-frontstage__content-scroll),
.admin-theme-frontstage__main.home-main-content-background :deep(.admin-theme-frontstage__scroll-shell),
.admin-theme-frontstage__main.home-main-content-background :deep(.admin-theme-frontstage__scroll-content),
.admin-theme-frontstage__main.home-main-content-background :deep(.scroll-container-Jsws2j),
.admin-theme-frontstage__main.home-main-content-background :deep(.scroll-content-DaYLnh),
.admin-theme-frontstage__main.home-main-content-background :deep(.section-generator),
.admin-theme-frontstage__main.home-main-content-background :deep(.admin-theme-front-home-preview),
.admin-theme-frontstage__main.home-main-content-background :deep(.home-header),
.admin-theme-frontstage__main.home-main-content-background :deep(.admin-theme-frontstage__section-generator) {
  background: transparent;
}

.admin-theme-frontstage__content-wrapper {
  height: 100%;
}

.admin-theme-frontstage__content-main {
  height: 100%;
}

.admin-theme-frontstage__content-scroll {
  height: 100%;
  border-radius: 0;
}

.admin-theme-frontstage__scroll-shell {
  height: 100%;
  overflow: auto;
}

.admin-theme-frontstage__scroll-shell.is-theme-field-active {
  box-shadow: inset 0 0 0 2px rgba(111, 53, 255, 0.26);
}

.admin-theme-frontstage__scroll-content {
  min-height: 100%;
  padding: 0 24px 48px;
}

.admin-theme-frontstage__section-generator {
  margin-bottom: 0;
}

.admin-theme-frontstage__section-generator :deep(.home-header) {
  padding-top: 100px;
}

.admin-theme-preview-hero-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.admin-theme-preview-hero-card__title {
  font-size: 18px;
  font-weight: 700;
}

.admin-theme-preview-hero-card__desc {
  margin-top: 8px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--text-secondary, #64748b);
}

.admin-theme-canvas.is-dark .admin-theme-preview-hero-card__desc {
  color: rgba(226, 232, 240, 0.72);
}

.admin-theme-preview-hero-card__indicator {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 34px;
  padding: 0 12px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--brand-main-default, #6f35ff) 10%, transparent);
  color: var(--brand-main-default, #6f35ff);
  font-size: 12px;
  font-weight: 600;
}

.admin-theme-preview-hero-card__indicator-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: currentColor;
}

.admin-theme-frontstage__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.admin-theme-preview-block {
  display: grid;
  gap: 14px;
}

.admin-theme-preview-block--card {
  padding: 18px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.62);
  border: 1px solid rgba(148, 163, 184, 0.16);
}

.admin-theme-canvas.is-dark .admin-theme-preview-block--card {
  background: rgba(15, 23, 42, 0.58);
  border-color: rgba(255, 255, 255, 0.08);
}

.admin-theme-preview-block__head {
  display: grid;
  gap: 6px;
}

.admin-theme-preview-block__title {
  font-size: 14px;
  font-weight: 700;
}

.admin-theme-preview-block__meta {
  font-size: 12px;
  line-height: 1.6;
  color: var(--text-secondary, #64748b);
}

.admin-theme-canvas.is-dark .admin-theme-preview-block__meta {
  color: rgba(226, 232, 240, 0.68);
}

.admin-theme-preview-empty {
  display: grid;
  place-items: center;
  min-height: 180px;
  padding: 20px;
  border: 1px dashed rgba(148, 163, 184, 0.24);
  border-radius: 22px;
  color: var(--text-secondary, #64748b);
  background: rgba(255, 255, 255, 0.4);
  font-size: 13px;
  text-align: center;
}

.admin-theme-canvas.is-dark .admin-theme-preview-empty {
  background: rgba(15, 23, 42, 0.42);
  color: rgba(226, 232, 240, 0.72);
  border-color: rgba(255, 255, 255, 0.12);
}

.admin-theme-banner-preview { position: relative; overflow: hidden; min-height: 280px; padding: 28px; display: grid; grid-template-columns: minmax(0, 1fr) 200px; gap: 18px; color: #fff; }
.admin-theme-banner-preview__glow { position: absolute; right: -28px; bottom: -42px; width: 220px; height: 220px; border-radius: 999px; opacity: 0.38; filter: blur(32px); }
.admin-theme-banner-preview__content, .admin-theme-banner-preview__visuals { position: relative; z-index: 1; }
.admin-theme-banner-preview__content { display: flex; flex-direction: column; justify-content: center; }
.admin-theme-banner-preview__badge { display: inline-flex; align-items: center; width: fit-content; padding: 6px 12px; border-radius: 999px; background: rgba(255, 255, 255, 0.16); font-size: 12px; }
.admin-theme-banner-preview__title { margin-top: 16px; font-size: 34px; line-height: 1.2; font-weight: 700; }
.admin-theme-banner-preview__desc { margin-top: 10px; max-width: 420px; color: rgba(255, 255, 255, 0.84); font-size: 15px; line-height: 1.7; }
.admin-theme-banner-preview__mini-list { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
.admin-theme-banner-preview__mini-list span { display: inline-flex; align-items: center; min-height: 28px; padding: 0 10px; border-radius: 999px; background: rgba(255, 255, 255, 0.14); font-size: 12px; color: rgba(255, 255, 255, 0.84); }
.admin-theme-banner-preview__visuals { min-height: 200px; }
.admin-theme-banner-preview__back-card, .admin-theme-banner-preview__middle-card, .admin-theme-banner-preview__front-card { position: absolute; right: 0; border-radius: 20px; }
.admin-theme-banner-preview__back-card { top: 8px; width: 132px; height: 164px; background: linear-gradient(180deg, rgba(255, 255, 255, 0.28) 0%, rgba(255, 255, 255, 0.08) 100%); opacity: 0.34; transform: rotate(8deg); }
.admin-theme-banner-preview__middle-card { top: 20px; right: 22px; width: 146px; height: 176px; background: linear-gradient(180deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.12) 100%); opacity: 0.5; transform: rotate(-5deg); }
.admin-theme-banner-preview__front-card { top: 34px; right: 14px; width: 164px; height: 188px; padding: 10px; background: rgba(8, 13, 25, 0.28); border: 1px solid rgba(255, 255, 255, 0.2); backdrop-filter: blur(14px); box-shadow: 0 18px 40px rgba(3, 8, 20, 0.18); overflow: hidden; }
.admin-theme-banner-preview__front-media { height: 112px; border-radius: 16px; background: linear-gradient(135deg, rgba(255, 255, 255, 0.28) 0%, rgba(255, 255, 255, 0.08) 100%); }
.admin-theme-banner-preview__front-copy { margin-top: 10px; display: grid; gap: 4px; }
.admin-theme-banner-preview__front-copy strong { font-size: 13px; color: #fff; }
.admin-theme-banner-preview__front-copy span { font-size: 11px; color: rgba(255, 255, 255, 0.78); }
.admin-theme-button-preview { display: grid; gap: 10px; }
.admin-theme-button-preview__row { display: grid; grid-template-columns: 90px minmax(0, 1fr); gap: 12px; align-items: center; }
.admin-theme-button-preview__row--secondary { align-items: start; }
.admin-theme-button-preview__label { font-size: 12px; }
.admin-theme-preview__actions { display: flex; flex-wrap: wrap; gap: 12px; }
.admin-theme-preview__primary, .admin-theme-preview__secondary, .admin-theme-preview__accent-chip { min-height: 42px; padding: 0 18px; border-radius: 12px; font-size: 14px; font-weight: 600; }
.admin-theme-preview__primary { color: #fff; border: none; background: var(--brand-main-default, #6f35ff); }
.admin-theme-preview__primary--hover { background: var(--brand-main-hover, #5b28e6); }
.admin-theme-preview__primary--active { background: var(--brand-main-pressed, #4c20c4); }
.admin-theme-preview__primary--disabled { background: rgba(148, 163, 184, 0.48); color: rgba(255, 255, 255, 0.82); cursor: not-allowed; }
.admin-theme-preview__secondary { color: var(--brand-secondary-default, #00c2d6); border: none; background: rgba(0, 194, 214, 0.12); }
.admin-theme-canvas.is-dark .admin-theme-preview__secondary { background: rgba(255, 255, 255, 0.08); }
.admin-theme-preview__accent-chip { display: inline-flex; align-items: center; color: var(--brand-accent-default, #ff7a59); background: rgba(255, 122, 89, 0.12); }
.admin-theme-canvas.is-dark .admin-theme-preview__accent-chip { background: rgba(255, 255, 255, 0.08); }
.admin-theme-status-preview { display: grid; gap: 12px; }
.admin-theme-status-preview__notice { display: grid; grid-template-columns: 32px minmax(0, 1fr); gap: 12px; align-items: center; padding: 14px 16px; border-radius: 14px; }
.admin-theme-status-preview__notice--success { color: var(--brand-success-default, #18b566); background: rgba(24, 181, 102, 0.12); }
.admin-theme-status-preview__notice-icon { width: 32px; height: 32px; display: grid; place-items: center; border-radius: 999px; background: rgba(255, 255, 255, 0.72); font-size: 14px; font-weight: 700; }
.admin-theme-status-preview__notice-content { display: grid; gap: 4px; }
.admin-theme-status-preview__notice-content strong, .admin-theme-status-preview__alert strong { font-size: 13px; }
.admin-theme-status-preview__notice-content span, .admin-theme-status-preview__alert span { font-size: 12px; line-height: 1.5; opacity: 0.92; }
.admin-theme-status-preview__tags { display: flex; flex-wrap: wrap; gap: 10px; }
.admin-theme-status-tag { display: inline-flex; align-items: center; min-height: 30px; padding: 0 12px; border-radius: 999px; font-size: 12px; font-weight: 600; }
.admin-theme-status-tag--success { color: var(--brand-success-default, #18b566); background: rgba(24, 181, 102, 0.12); }
.admin-theme-status-tag--warning { color: var(--brand-warning-default, #ffb020); background: rgba(255, 176, 32, 0.14); }
.admin-theme-status-tag--danger { color: var(--brand-danger-default, #f04438); background: rgba(240, 68, 56, 0.12); }
.admin-theme-status-preview__alert { display: grid; gap: 4px; padding: 14px 16px; border-radius: 14px; border: 1px solid transparent; }
.admin-theme-status-preview__alert--danger { color: var(--brand-danger-default, #f04438); background: rgba(240, 68, 56, 0.08); border-color: rgba(240, 68, 56, 0.18); }
.admin-theme-surface-preview__frame { width: 100%; display: grid; gap: 12px; padding: 14px; border-radius: 22px; background: linear-gradient(180deg, rgba(255, 255, 255, 0.72) 0%, rgba(248, 250, 252, 0.94) 100%); border: 1px solid rgba(148, 163, 184, 0.16); }
.admin-theme-canvas.is-dark .admin-theme-surface-preview__frame { background: linear-gradient(180deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.96) 100%); border-color: rgba(255, 255, 255, 0.08); }
.admin-theme-surface-preview__toolbar { display: flex; align-items: center; gap: 8px; }
.admin-theme-surface-preview__pill { width: 88px; height: 10px; border-radius: 999px; background: rgba(15, 23, 42, 0.08); }
.admin-theme-canvas.is-dark .admin-theme-surface-preview__pill, .admin-theme-canvas.is-dark .admin-theme-surface-preview__hero-copy, .admin-theme-canvas.is-dark .admin-theme-surface-preview__card::before { background: rgba(255, 255, 255, 0.14); }
.admin-theme-surface-preview__pill--active { background: color-mix(in srgb, var(--brand-main-default, #6f35ff) 22%, white); }
.admin-theme-surface-preview__pill--short { width: 56px; }
.admin-theme-surface-preview__hero-card, .admin-theme-surface-preview__card { background: linear-gradient(180deg, rgba(15, 23, 42, 0.05) 0%, rgba(15, 23, 42, 0.015) 100%); border: 1px solid rgba(148, 163, 184, 0.18); }
.admin-theme-canvas.is-dark .admin-theme-surface-preview__hero-copy--short, .admin-theme-canvas.is-dark .admin-theme-surface-preview__card::after { background: rgba(255, 255, 255, 0.08); }
.admin-theme-canvas.is-dark .admin-theme-surface-preview__hero-card, .admin-theme-canvas.is-dark .admin-theme-surface-preview__card { background: linear-gradient(180deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.03) 100%); border-color: rgba(255, 255, 255, 0.1); }
.admin-theme-surface-preview__hero-card { min-height: 112px; padding: 18px; }
.admin-theme-surface-preview__hero-copy { width: 42%; height: 12px; border-radius: 999px; background: rgba(15, 23, 42, 0.08); }
.admin-theme-surface-preview__hero-copy--short { width: 68%; height: 8px; margin-top: 12px; background: rgba(15, 23, 42, 0.05); }
.admin-theme-surface-preview__hero-action { width: 104px; height: 32px; margin-top: 18px; border-radius: 12px; background: color-mix(in srgb, var(--brand-main-default, #6f35ff) 18%, white); }
.admin-theme-surface-preview__grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.admin-theme-surface-preview__card { height: 88px; padding: 18px; }
.admin-theme-surface-preview__card--short { height: 56px; width: 72%; }
.admin-theme-surface-preview__card::before { content: ''; display: block; width: 42%; height: 12px; border-radius: 999px; background: rgba(15, 23, 42, 0.08); }
.admin-theme-surface-preview__card::after { content: ''; display: block; width: 68%; height: 8px; margin-top: 12px; border-radius: 999px; background: rgba(15, 23, 42, 0.05); }

@media (max-width: 1280px) {
  .admin-theme-frontstage__body { grid-template-columns: 1fr; }
  .admin-theme-frontstage__sidebar { border-right: none; border-bottom: 1px solid rgba(148, 163, 184, 0.14); grid-template-columns: repeat(4, minmax(0, 1fr)); }
  .admin-theme-frontstage__sidebar.is-top-layout { grid-template-columns: none; }
}

@media (max-width: 980px) {
  .admin-theme-banner-preview,
  .admin-theme-button-preview__row,
  .admin-theme-surface-preview__grid,
  .admin-theme-frontstage__grid {
    grid-template-columns: 1fr;
  }
  .admin-theme-banner-preview__visuals { min-height: 220px; }
  .admin-theme-preview-hero-card__head { display: grid; }
  .admin-theme-frontstage__sidebar { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
</style>
