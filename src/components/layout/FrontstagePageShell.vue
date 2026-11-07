<template>
  <div
    class="frontstage-page-shell"
    :class="[`frontstage-page-shell--${layoutModeClass}`]"
    :data-layout-mode="layoutModeClass"
  >
    <div id="csr-root">
      <div class="global-dreamina-container">
        <div id="dreamina" class="root_bf55f">
          <div class="top-down-layer">
            <!-- 对齐 Pro FrontstageAppLayout：顶通挂在壳层最上方，仅首页展示 -->
            <HomeTopBanner
              v-if="showHomeTopBanner"
              class="frontstage-page-shell__top-banner"
              :config="topBannerSettings"
            />
            <div
              class="container-moSF_y"
              :class="{ 'home-main-content-background': showHomeMainContentBackground }"
              :style="homeDesktopShellStyle"
              :data-layout-mode="layoutModeClass"
            >
              <TopMenuBar v-if="isTopMenuLayout" />
              <SideMenu v-else />
              <slot v-if="layout === 'raw'" />
              <div v-else class="content-wrapper-cF1zaN">
                <div :id="mainContainerId || undefined" class="main-container-nXfW_A">
                  <div class="content-TZbgMr" :data-content-scroll-y="contentScrollY">
                    <slot />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <slot name="after" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import HomeTopBanner from '@/components/home/components/HomeTopBanner.vue'
import SideMenu from '@/components/home/components/SideMenu.vue'
import TopMenuBar from '@/components/home/components/TopMenuBar.vue'
import { useHomeLayoutConfig } from '@/composables/useHomeLayoutConfig'
import { useHomeSideMenuConfig } from '@/composables/useHomeSideMenuConfig'
import '@/components/home/components/home-main-content-background.css'

withDefaults(defineProps<{
  layout?: 'standard' | 'raw'
  mainContainerId?: string
  contentScrollY?: 'auto' | 'hidden'
}>(), {
  layout: 'standard',
  mainContainerId: '',
  contentScrollY: 'auto',
})

const route = useRoute()
const { sideMenuStyleVars, layoutMode } = useHomeSideMenuConfig()
const {
  topBannerSettings,
  showTopBanner,
  headerBackgroundEnabled,
  headerBackgroundImageUrl,
} = useHomeLayoutConfig()
const isTopMenuLayout = computed(() => layoutMode.value === 'top')
const layoutModeClass = computed(() => (isTopMenuLayout.value ? 'top' : 'side'))

/** 与 Pro 一致：仅首页挂顶通（path 或路由名） */
const showHomeTopBanner = computed(() => {
  const isHome = route.path === '/' || route.name === 'Home'
  return isHome && showTopBanner.value
})

/** 仅首页：有自定义背景图时整页 cover */
const showHomeMainContentBackground = computed(() => {
  const isHome = route.path === '/' || route.name === 'Home'
  return isHome
    && headerBackgroundEnabled.value
    && Boolean(headerBackgroundImageUrl.value)
})

/** 侧栏 CSS 变量 + 可选整页背景图 url */
const homeDesktopShellStyle = computed(() => {
  const style: Record<string, string> = { ...sideMenuStyleVars.value }
  if (showHomeMainContentBackground.value && headerBackgroundImageUrl.value) {
    style['--home-main-content-background-image'] = `url(${JSON.stringify(headerBackgroundImageUrl.value)})`
  }
  return style
})
</script>

<style scoped>
:deep(.content-TZbgMr) {
  overflow-x: hidden;
}

:deep(.content-TZbgMr[data-content-scroll-y='auto']) {
  overflow-y: auto;
}

:deep(.content-TZbgMr[data-content-scroll-y='hidden']) {
  overflow-y: hidden !important;
}

.frontstage-page-shell__top-banner {
  width: 100%;
  flex: 0 0 auto;
  position: relative;
  z-index: 5;
}

/* 有顶通时主壳吃掉剩余高度，避免 100% + 横幅把顶通挤出视口 */
.frontstage-page-shell :deep(.container-moSF_y) {
  flex: 1 1 auto;
  min-height: 0;
}

.frontstage-page-shell[data-layout-mode='top'] :deep(.container-moSF_y) {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.frontstage-page-shell[data-layout-mode='top'] :deep(.content-wrapper-cF1zaN),
.frontstage-page-shell[data-layout-mode='top'] :deep(.main-container-nXfW_A),
.frontstage-page-shell[data-layout-mode='top'] :deep(.content-TZbgMr) {
  flex: 1 1 auto;
  min-height: 0;
  min-width: 0;
}

.frontstage-page-shell[data-layout-mode='top'] :deep(.entry-erESAd),
.frontstage-page-shell[data-layout-mode='top'] :deep(.entry-lav5_s) {
  height: 100%;
  min-height: 0;
}

.frontstage-page-shell[data-layout-mode='top'] :deep(.record-list-container) {
  flex: 1 1 auto;
  min-height: 0;
}
</style>
