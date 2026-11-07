<template>
  <header v-if="sideMenuSettings.enabled" class="top-menu-bar">
    <div class="top-menu-bar__inner">
      <button
        v-if="sideMenuSettings.showTopMenu && topItems.length"
        type="button"
        class="top-menu-bar__brand"
        @click="handleTopItemClick(topItems[0])"
      >
        <img
          v-if="resolvedSiteLogoUrl"
          :src="resolvedSiteLogoUrl"
          class="top-menu-bar__brand-logo"
          :alt="resolvedSiteName"
        >
        <div v-else class="top-menu-bar__brand-fallback">
          <HomeSideMenuIcon
            :icon-key="topItems[0].icon"
            :icon-source="topItems[0].iconSource"
            :inactive-icon-url="topItems[0].inactiveIconUrl"
            :active-icon-url="topItems[0].activeIconUrl"
            active
          />
        </div>
      </button>

      <nav v-if="sideMenuSettings.showCenterMenu && centerItems.length" class="top-menu-bar__center">
        <button
          v-for="item in centerItems"
          :key="item.key"
          type="button"
          class="top-menu-bar__nav-item"
          :class="{ 'is-active': isItemActive(item) }"
          @click="handleMenuClick(item)"
        >
          <HomeSideMenuIcon
            :icon-key="item.icon"
            :icon-source="item.iconSource"
            :inactive-icon-url="item.inactiveIconUrl"
            :active-icon-url="item.activeIconUrl"
            :active="isItemActive(item)"
          />
          <span>{{ item.title }}</span>
        </button>
      </nav>

      <div v-if="sideMenuSettings.showBottomMenu" class="top-menu-bar__actions">
        <button
          v-if="marketingItem"
          type="button"
          class="top-menu-bar__action-chip top-menu-bar__action-chip--marketing"
          @click="openMarketingEntry"
        >
          <span class="top-menu-bar__action-kicker">{{ isLoggedIn ? '会员中心' : (marketingItem.title || '福利') }}</span>
          <span class="top-menu-bar__action-value">{{ marketingPointsText }}</span>
        </button>

        <button
          v-if="accountEntryItem && !isLoggedIn"
          type="button"
          class="top-menu-bar__action-chip"
          @click="openLoginModal('top-menu')"
        >
          {{ accountEntryItem.title || loginButtonText }}
        </button>

        <div
          v-if="accountDisplayItem && isLoggedIn"
          class="top-menu-bar__account-hover-group"
        >
          <button
            type="button"
            class="top-menu-bar__avatar-button"
            :class="{ 'is-active': currentPath === '/account' }"
            @click="navigateToAccount"
          >
            <img :src="resolvedAvatarSrc" class="top-menu-bar__avatar" :alt="loginButtonText">
          </button>

          <div v-if="actionItems.length" class="top-menu-bar__account-hover-panel">
            <button
              v-for="item in actionItems"
              :key="item.key"
              type="button"
              class="top-menu-bar__icon-button"
              :class="{ 'is-active': isItemActive(item) }"
              @click="handleBottomItemClick(item)"
            >
              <HomeSideMenuIcon
                :icon-key="item.icon"
                :icon-source="item.iconSource"
                :inactive-icon-url="item.inactiveIconUrl"
                :active-icon-url="item.activeIconUrl"
                :active="isItemActive(item)"
              />
            </button>
          </div>
        </div>

      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useLoginModalStore } from '@/stores/login-modal'
import { useMarketingCenterStore } from '@/stores/marketing-center'
import { useMarketingModalStore } from '@/stores/marketing-modal'
import { useSystemSettingsStore } from '@/stores/system-settings'
import { useHomeSideMenuConfig } from '@/composables/useHomeSideMenuConfig'
import HomeSideMenuIcon from './HomeSideMenuIcon.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { openLoginModal } = useLoginModalStore()
const { openMarketingModal, isVisible: marketingModalVisible } = useMarketingModalStore()
const marketingCenterStore = useMarketingCenterStore()
const { publicSystemSettings } = useSystemSettingsStore()
const { sideMenuSettings, topItems, centerItems, bottomItems } = useHomeSideMenuConfig()

const isLoggedIn = computed(() => authStore.isLoggedIn.value)
const loginButtonText = authStore.loginButtonText
const currentPath = computed(() => route.path)

const resolvedSiteLogoUrl = computed(() => String(publicSystemSettings.value.siteInfo.siteLogoUrl || '').trim())
const resolvedSiteName = computed(() => String(publicSystemSettings.value.siteInfo.siteName || 'Canana').trim() || 'Canana')
const resolvedAvatarSrc = computed(() => {
  return authStore.currentUser.value?.avatarUrl
    || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' rx='100' fill='%23E5E7EB'/%3E%3Ccircle cx='100' cy='76' r='30' fill='%239CA3AF'/%3E%3Cpath d='M52 154c8-24 28-38 48-38s40 14 48 38' fill='%239CA3AF'/%3E%3C/svg%3E"
})

const marketingPointsText = computed(() => {
  if (!isLoggedIn.value) {
    return '福利'
  }
  return String(marketingCenterStore.pointsBalance.value || 0)
})

const marketingItem = computed(() => bottomItems.value.find(item => item.key === 'marketing') || null)
const accountEntryItem = computed(() => bottomItems.value.find(item => item.key === 'account-entry') || null)
const accountItem = computed(() => centerItems.value.find(item => item.key === 'account') || null)
const accountDisplayItem = computed(() => accountEntryItem.value || accountItem.value || null)
const actionItems = computed(() => {
  return bottomItems.value.filter(item => !['marketing', 'account-entry'].includes(item.key))
})

const resolveMenuRoutePath = (item: { key: string, actionType: string, actionValue: string }) => {
  if (item.key === 'workflow' && item.actionType === 'route') {
    return '/agentic-assets-canvas'
  }
  return item.actionValue
}

const isItemActive = (item: { key: string, actionType: string, actionValue: string }) => {
  if (item.key === 'home') {
    return currentPath.value === '/'
  }
  if (item.key === 'account') {
    return currentPath.value === '/account'
  }
  return item.actionType === 'route' && currentPath.value === resolveMenuRoutePath(item)
}

const handleMenuClick = (item: { key: string, actionType: string, actionValue: string }) => {
  if (item.actionType !== 'route') {
    return
  }

  if (item.actionValue === '/account' && !authStore.isLoggedIn.value) {
    void router.push({
      path: '/',
      query: { login: '1' },
    })
    return
  }

  void router.push(resolveMenuRoutePath(item) || '/')
}

const handleTopItemClick = (item?: { actionType?: string, actionValue?: string }) => {
  if (!item) {
    return
  }

  if (item.actionType === 'route' && item.actionValue) {
    void router.push(item.actionValue)
    return
  }

  if (item.actionType === 'url' && item.actionValue) {
    window.open(item.actionValue, '_blank', 'noopener,noreferrer')
  }
}

const openMarketingEntry = () => {
  openMarketingModal({
    source: 'top-menu',
    tab: isLoggedIn.value ? 'recharge' : 'membership',
  })
}

const navigateToAccount = () => {
  if (!isLoggedIn.value) {
    openLoginModal('account-entry')
    return
  }

  void router.push('/account')
}

const handleBottomItemClick = (item: { actionType: string, actionValue: string }) => {
  if (item.actionType === 'route' && item.actionValue) {
    void router.push(item.actionValue)
    return
  }

  if (item.actionType === 'dialog' && item.actionValue === 'marketing') {
    openMarketingEntry()
    return
  }

  if (item.actionType === 'dialog' && item.actionValue === 'login') {
    openLoginModal('top-menu')
  }
}

onMounted(() => {
  if (marketingModalVisible.value) {
    return
  }
  void marketingCenterStore.loadOverview()
})
</script>

<style scoped>
.top-menu-bar {
  position: sticky;
  top: 0;
  z-index: 40;
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--theme-page-background, #0f0f12) 96%, transparent) 0%, color-mix(in srgb, var(--theme-page-background, #0f0f12) 88%, transparent) 70%, transparent 100%);
}

.top-menu-bar__inner {
  min-height: 72px;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 16px;
  padding: 0px 20px;
  /* border-radius: 20px; */
  background: var(--theme-side-menu-background, #111218);
  border: 1px solid var(--stroke-primary, rgba(255, 255, 255, 0.08));
}

.top-menu-bar__brand,
.top-menu-bar__nav-item,
.top-menu-bar__action-chip,
.top-menu-bar__icon-button,
.top-menu-bar__avatar-button {
  border: 0;
  background: transparent;
  color: var(--text-primary);
}

.top-menu-bar__brand {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border-radius: 14px;
  cursor: pointer;
}

.top-menu-bar__brand:hover,
.top-menu-bar__nav-item:hover,
.top-menu-bar__action-chip:hover,
.top-menu-bar__icon-button:hover,
.top-menu-bar__avatar-button:hover,
.top-menu-bar__nav-item.is-active,
.top-menu-bar__icon-button.is-active,
.top-menu-bar__avatar-button.is-active {
  background: var(--bg-block-primary-default, rgba(255, 255, 255, 0.08));
}

.top-menu-bar__brand-logo {
  display: block;
  max-width: 32px;
  max-height: 32px;
  object-fit: contain;
}

.top-menu-bar__brand-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  font-size: 24px;
}

.top-menu-bar__center {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-width: 0;
  flex-wrap: wrap;
}

.top-menu-bar__nav-item {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 44px;
  padding: 0 14px;
  border-radius: 14px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
}

.top-menu-bar__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.top-menu-bar__account-hover-group {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  min-width: 40px;
  height: 40px;
}

.top-menu-bar__account-hover-group::after {
  content: "";
  position: absolute;
  top: 100%;
  right: 50%;
  width: 88px;
  height: 18px;
  transform: translateX(50%);
}

.top-menu-bar__account-hover-panel {
  position: absolute;
  top: calc(100% + 6px);
  right: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: 64px;
  padding: 10px 8px;
  border-radius: 24px;
  background: color-mix(in srgb, var(--theme-side-menu-background, #111218) 94%, transparent);
  border: 1px solid var(--stroke-primary, rgba(255, 255, 255, 0.08));
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.24);
  opacity: 0;
  pointer-events: none;
  transform: translate(50%, -8px);
  transition: opacity .18s ease, transform .18s ease;
  z-index: 2;
}

.top-menu-bar__account-hover-panel .top-menu-bar__icon-button {
  width: 40px;
  height: 40px;
  margin: 0 auto;
  border-radius: 14px;
}

.top-menu-bar__account-hover-group:hover .top-menu-bar__account-hover-panel,
.top-menu-bar__account-hover-group:focus-within .top-menu-bar__account-hover-panel {
  opacity: 1;
  pointer-events: auto;
  transform: translate(50%, 0);
}

.top-menu-bar__action-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 40px;
  padding: 0 12px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
}

.top-menu-bar__action-chip--marketing {
  background: color-mix(in srgb, var(--brand-main-default, #6f35ff) 16%, transparent);
  color: var(--text-primary);
}

.top-menu-bar__action-kicker {
  color: var(--text-secondary);
}

.top-menu-bar__action-value {
  font-weight: 700;
}

.top-menu-bar__icon-button,
.top-menu-bar__avatar-button {
  width: 40px;
  height: 40px;
  padding: 0;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.top-menu-bar__avatar {
  width: 28px;
  height: 28px;
  border-radius: 999px;
  object-fit: cover;
}

@media (max-width: 1080px) {
  .top-menu-bar__inner {
    grid-template-columns: minmax(0, 1fr);
    justify-items: stretch;
  }

  .top-menu-bar__center {
    justify-content: flex-start;
  }

  .top-menu-bar__actions {
    justify-content: flex-start;
    flex-wrap: wrap;
  }
}
</style>
