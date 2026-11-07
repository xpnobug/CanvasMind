<template>
  <div
    v-if="shouldRender"
    class="home-top-banner"
    :style="bannerStyle"
    role="status"
    aria-live="polite"
    @click="handleBannerClick"
  >
    <div class="home-top-banner__row">
      <div
        v-if="showTag"
        class="home-top-banner__tag"
        :style="tagStyle"
      >
        <span v-if="config.showTagIcon" class="home-top-banner__tag-icon" aria-hidden="true">
          <svg fill="none" height="13" viewBox="0 0 10 13" width="10" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M8.69238 0C8.98211 0.000263646 9.2168 0.235604 9.2168 0.525391C9.21671 0.815103 8.98205 1.05052 8.69238 1.05078H8.05078V2.95898C8.05064 3.4075 7.87186 3.83815 7.55469 4.15527L5.35156 6.3584L7.55469 8.5625C7.8718 8.87965 8.05069 9.31029 8.05078 9.75879V11.667H8.69238C8.98211 11.6673 9.2168 11.9026 9.2168 12.1924C9.21653 12.4819 8.98195 12.7165 8.69238 12.7168H0.525391C0.235604 12.7168 0.000263516 12.4821 0 12.1924C0 11.9024 0.235441 11.667 0.525391 11.667H1.16699V9.75879C1.16709 9.31036 1.3451 8.87964 1.66211 8.5625L3.86621 6.3584L1.66211 4.15527C1.34493 3.83815 1.16713 3.4075 1.16699 2.95898V1.05078H0.525391C0.235495 1.05078 8.80085e-05 0.815265 0 0.525391C0 0.235441 0.235441 0 0.525391 0H8.69238ZM2.40527 9.30469C2.28494 9.42499 2.21684 9.58864 2.2168 9.75879V11.667H7V9.75879L6.99707 9.69531C6.98249 9.54845 6.91774 9.40997 6.8125 9.30469L4.6084 7.10156L2.40527 9.30469ZM2.2168 2.95898L2.21973 3.02246C2.23439 3.16925 2.30003 3.30689 2.40527 3.41211L4.6084 5.61621L6.8125 3.41211C6.93259 3.29188 6.99991 3.12892 7 2.95898V1.05078H2.2168V2.95898Z"
              fill="currentColor"
            />
          </svg>
        </span>
        <span class="home-top-banner__tag-label">{{ tagLabel }}</span>
        <span
          v-if="config.tagMode === 'countdown'"
          class="home-top-banner__tag-countdown"
        >{{ countdownText }}</span>
      </div>

      <span class="home-top-banner__text" :style="contentTextStyle">{{ config.contentText }}</span>

      <button
        v-if="showCta"
        class="home-top-banner__cta"
        type="button"
        :style="ctaStyle"
        :disabled="disableNavigation || !isActionable"
        @click.stop="handleClick"
      >
        {{ config.ctaText }}
      </button>
    </div>

    <button
      v-if="config.showClose"
      class="home-top-banner__close"
      type="button"
      aria-label="关闭顶部横幅"
      :style="{ color: config.contentTextColor || '#141414' }"
      @click.stop="handleDismiss"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M18.364 6.05a1 1 0 0 1 0 1.414L13.828 12l4.536 4.536a1 1 0 0 1-1.414 1.414L12.414 13.414 7.88 17.95a1 1 0 0 1-1.415-1.414L11 12 6.464 7.464A1 1 0 0 1 7.88 6.05l4.535 4.536 4.536-4.536a1 1 0 0 1 1.414 0Z"
          fill="currentColor"
        />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
// 首页顶部横幅：倒计时标签 + 文案 + CTA，支持站内路由或外链跳转。
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { SystemHomeTopBannerConfig } from '@/api/system-config'
import { useLoginModalStore } from '@/stores/login-modal'
import { useMarketingModalStore, type MarketingModalTab } from '@/stores/marketing-modal'

const DISMISSED_KEY_PREFIX = 'canana:home-top-banner:dismissed:'

const props = withDefaults(defineProps<{
  config: SystemHomeTopBannerConfig
  disableNavigation?: boolean
  previewReadonly?: boolean
}>(), {
  disableNavigation: false,
  previewReadonly: false,
})

const router = useRouter()
const loginModalStore = useLoginModalStore()
const marketingModalStore = useMarketingModalStore()
const dismissed = ref(false)
const nowMs = ref(Date.now())
let countdownTimer: ReturnType<typeof setInterval> | null = null

/**
 * 关闭态按「横幅身份 + 文案指纹」隔离。
 * 后台改文案 / 重新开启后应用新 key，避免一次关闭后永久不再展示。
 */
const storageKey = computed(() => {
  const id = String(props.config.bannerId || 'default').trim() || 'default'
  const fingerprint = [
    props.config.contentText,
    props.config.tagText,
    props.config.ctaText,
    props.config.tagMode,
    props.config.countdownEndAt,
  ].map(part => String(part || '').trim()).join('|')
  let hash = 0
  for (let i = 0; i < fingerprint.length; i += 1) {
    hash = ((hash << 5) - hash) + fingerprint.charCodeAt(i)
    hash |= 0
  }
  return `${DISMISSED_KEY_PREFIX}${id}:${hash.toString(36)}`
})
const isActionable = computed(() => {
  if (props.config.actionType === 'dialog') {
    return !!String(props.config.actionValue || '').trim()
  }
  return (props.config.actionType === 'route' || props.config.actionType === 'url')
    && !!String(props.config.actionValue || '').trim()
})
const shouldRender = computed(() => {
  // 与 Pro 一致：必须有主文案（预览层用 \u00A0 占位时 trim 后仍为空，故对预览放宽空白字符）
  const raw = String(props.config.contentText || '')
  const hasContent = props.previewReadonly
    ? !!raw
    : !!raw.trim()
  return props.config.enabled
    && hasContent
    && (!dismissed.value || props.previewReadonly)
})

const showTag = computed(() => {
  if (props.config.tagMode === 'countdown') {
    return true
  }
  return !!String(props.config.tagText || '').trim()
})

const tagLabel = computed(() => {
  const text = String(props.config.tagText || '').trim()
  if (props.config.tagMode === 'countdown') {
    return text || '活动剩余'
  }
  return text
})

const showCta = computed(() => {
  return props.config.ctaEnabled === true && !!String(props.config.ctaText || '').trim()
})

const formatCountdown = (remainMs: number) => {
  const totalSeconds = Math.max(0, Math.floor(remainMs / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${pad(hours)}时 ${pad(minutes)}分 ${pad(seconds)}秒`
}

const countdownText = computed(() => {
  const endAt = Date.parse(String(props.config.countdownEndAt || '').trim())
  if (!Number.isFinite(endAt)) {
    return '00时 00分 00秒'
  }
  return formatCountdown(endAt - nowMs.value)
})

const bannerStyle = computed(() => {
  const backgroundImageUrl = String(props.config.backgroundImageUrl || '').trim()
  const gradientStart = props.config.gradientStart || '#D5F5FF'
  const gradientEnd = props.config.gradientEnd || '#D5F5FF'
  const gradient = `linear-gradient(90deg, ${gradientStart} 0%, ${gradientEnd} 100%)`
  const height = Number(props.config.height) || 0
  // 默认跟参考一样：仅上下 padding 撑开；仅当显式配置 height>0 时才固定高度。
  const baseStyle: Record<string, string> = {
    color: props.config.contentTextColor || '#000000',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'cover',
    backgroundColor: gradientEnd,
  }

  if (height > 0) {
    baseStyle.height = `${height}px`
  }

  if (backgroundImageUrl) {
    return {
      ...baseStyle,
      backgroundImage: `url(${JSON.stringify(backgroundImageUrl)})`,
    }
  }

  return {
    ...baseStyle,
    backgroundImage: gradient,
  }
})

const tagStyle = computed(() => {
  return {
    color: props.config.tagTextColor || '#FFFFFF',
    backgroundColor: props.config.tagBackgroundColor || '#F50095',
  }
})

const contentTextStyle = computed(() => {
  return {
    color: props.config.contentTextColor || '#000000',
  }
})

const ctaStyle = computed(() => {
  const backgroundColor = String(props.config.ctaBackgroundColor || '').trim()
  return {
    color: props.config.ctaTextColor || '#000000',
    borderColor: props.config.ctaBorderColor || '#000000',
    background: backgroundColor || 'transparent',
  }
})

const syncDismissedState = () => {
  if (props.previewReadonly || typeof window === 'undefined') {
    dismissed.value = false
    return
  }

  dismissed.value = window.localStorage.getItem(storageKey.value) === '1'
}

const stopCountdownTimer = () => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
}

const syncCountdownTimer = () => {
  stopCountdownTimer()
  if (props.config.tagMode !== 'countdown') {
    return
  }
  nowMs.value = Date.now()
  countdownTimer = setInterval(() => {
    nowMs.value = Date.now()
  }, 1000)
}

watch(storageKey, syncDismissedState, { immediate: true })
watch(() => [props.config.tagMode, props.config.countdownEndAt], syncCountdownTimer, { immediate: true })

onMounted(() => {
  syncCountdownTimer()
})

onBeforeUnmount(() => {
  stopCountdownTimer()
})

const handleDismiss = () => {
  dismissed.value = true
  if (props.previewReadonly || typeof window === 'undefined') {
    return
  }
  window.localStorage.setItem(storageKey.value, '1')
}

const navigateByAction = () => {
  if (props.previewReadonly || props.disableNavigation || !isActionable.value) {
    return
  }

  const target = String(props.config.actionValue || '').trim()
  if (!target) {
    return
  }

  if (props.config.actionType === 'route') {
    void router.push(target)
    return
  }

  if (props.config.actionType === 'url' && typeof window !== 'undefined') {
    window.open(target, '_self')
    return
  }

  if (props.config.actionType === 'dialog') {
    if (target === 'login') {
      loginModalStore.openLoginModal('home-top-banner')
      return
    }

    // marketing / marketing:membership / marketing:checkin / marketing:redeem / marketing:recharge
    const [dialogKey, tabRaw] = target.split(':')
    if (dialogKey === 'marketing') {
      const allowedTabs: MarketingModalTab[] = ['membership', 'recharge', 'checkin', 'redeem']
      const tab = allowedTabs.includes(tabRaw as MarketingModalTab)
        ? (tabRaw as MarketingModalTab)
        : 'membership'
      marketingModalStore.openMarketingModal({
        source: 'home-top-banner',
        tab,
      })
    }
  }
}

const handleClick = () => {
  navigateByAction()
}

const handleBannerClick = () => {
  // 有独立 CTA 时，整条横幅点击也走同一跳转；无 CTA 时同样可点跳转。
  navigateByAction()
}
</script>

<style scoped>
.home-top-banner {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 10px 48px;
  box-sizing: border-box;
  cursor: pointer;
  overflow: hidden;
  z-index: 1000;
}

.home-top-banner__row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: max-content;
  max-width: 100%;
  min-width: 0;
}

.home-top-banner__tag {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  gap: 4px;
  padding: 3px 10px 4px 12px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
}

.home-top-banner__tag-icon {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
}

.home-top-banner__tag-label {
  flex-shrink: 0;
}

.home-top-banner__tag-countdown {
  margin-left: 6px;
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
  min-width: 60px;
}

.home-top-banner__text {
  display: block;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: 'Microsoft YaHei', 'PingFang SC', sans-serif;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.3;
}

.home-top-banner__cta {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 12px;
  border: 1.5px solid currentColor;
  border-radius: 999px;
  background: transparent;
  font-family: 'Microsoft YaHei', 'PingFang SC', sans-serif;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.4;
  cursor: pointer;
}

.home-top-banner__cta:disabled {
  cursor: default;
}

.home-top-banner__close {
  position: absolute;
  top: 50%;
  right: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  padding: 0;
  border: none;
  background: transparent;
  color: #141414;
  cursor: pointer;
  transform: translateY(-50%);
  z-index: 1;
}

.home-top-banner__close:hover {
  color: #000;
}

@media (max-width: 960px) {
  .home-top-banner {
    padding: 10px 40px 10px 16px;
  }

  .home-top-banner__row {
    width: 100%;
    justify-content: flex-start;
  }

  .home-top-banner__text {
    flex: 1 1 auto;
  }
}

@media (max-width: 640px) {
  .home-top-banner {
    padding: 8px 36px 8px 12px;
  }

  .home-top-banner__row {
    gap: 8px;
  }

  .home-top-banner__tag {
    font-size: 11px;
    padding: 2px 8px 3px 10px;
  }

  .home-top-banner__tag-countdown {
    margin-left: 4px;
    min-width: 52px;
  }

  .home-top-banner__text {
    font-size: 12px;
    font-weight: 600;
  }

  .home-top-banner__cta {
    font-size: 11px;
    padding: 2px 10px;
    border-width: 1px;
  }
}
</style>
