<template>
  <div
    aria-hidden="true"
    class="top-background-I8Kms9"
    data-create-page-top-background="true"
    :style="cssVars"
  >
    <!-- 整页背景图由布局 / 预览主栏 ::before 挂载；此处只保留顶区 SVG 光晕与星点 -->
    <svg
      v-if="showGlow || showStars"
      class="top-background-artwork-cXz6jh"
      focusable="false"
      preserveAspectRatio="xMidYMin meet"
      viewBox="0 0 1200 400"
    >
      <defs>
        <radialGradient
          v-if="showGlow"
          :id="glowId"
          cx="0"
          cy="0"
          r="10"
          gradientTransform="matrix(-1.6461e-13 17.9 -60 3.0403e-12 600 0)"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" :stop-color="resolvedGlowColor" stop-opacity="0.6" />
          <stop offset="0.5" :stop-color="resolvedGlowColor" stop-opacity="0.3" />
          <stop offset="1" :stop-color="resolvedGlowColor" stop-opacity="0" />
        </radialGradient>
        <pattern
          v-if="showStars"
          :id="patternId"
          x="200"
          y="2"
          width="20.901"
          height="20.959"
          patternUnits="userSpaceOnUse"
          preserveAspectRatio="none"
          viewBox="0 0 20.901 20.959"
        >
          <svg
            focusable="false"
            height="8"
            preserveAspectRatio="xMidYMid meet"
            viewBox="0 0 25 24"
            width="8"
            x="-1.2"
            y="-0.67"
          >
            <path
              class="top-background-star-NqYy6V"
              d="M22.044 12.695a.77.77 0 0 0-.596-.734c-4.688-1.152-7.18-3.92-7.986-9.924a.358.358 0 0 0-.006-.033.573.573 0 0 0-1.137 0l-.007.033c-.805 6.004-3.298 8.772-7.986 9.924a.77.77 0 0 0-.596.734v.033a.82.82 0 0 0 .625.796c3.3.859 6.851 2.872 7.9 6.022.086.26.332.443.613.454h.037a.673.673 0 0 0 .614-.454c1.048-3.15 4.598-5.163 7.9-6.021a.82.82 0 0 0 .625-.797v-.033Z"
            />
          </svg>
        </pattern>
        <filter
          v-if="showStars"
          :id="blurId"
          x="127.652"
          y="-82.73"
          width="944.696"
          height="412.461"
          color-interpolation-filters="sRGB"
          filterUnits="userSpaceOnUse"
        >
          <feGaussianBlur stdDeviation="42.1739" />
        </filter>
        <mask
          v-if="showStars"
          :id="maskId"
          x="127.652"
          y="-82.73"
          width="944.696"
          height="412.461"
          maskContentUnits="userSpaceOnUse"
          maskUnits="userSpaceOnUse"
        >
          <ellipse
            cx="600"
            cy="123.5"
            rx="388"
            ry="121.883"
            fill="white"
            :filter="`url(#${blurId})`"
          />
        </mask>
      </defs>
      <rect
        v-if="showGlow"
        class="top-background-glow-XbQGT1"
        width="1200"
        height="400"
        :fill="`url(#${glowId})`"
      />
      <rect
        v-if="showStars"
        x="200"
        y="2"
        width="800"
        height="320.216"
        :fill="`url(#${patternId})`"
        :mask="`url(#${maskId})`"
      />
    </svg>
  </div>
</template>

<script setup lang="ts">
/**
 * 首页创作区顶背景：SVG 光晕 + 星点。
 * 自定义整页背景图由布局层 `.home-main-content-background::before` 铺开。
 * 颜色由父级按当前主题传入，避免组件内重复读主题 store。
 */
import { computed, useId } from 'vue'
import {
  DEFAULT_HEADER_BACKGROUND_GLOW_COLOR,
  DEFAULT_HEADER_BACKGROUND_GLOW_OPACITY,
  DEFAULT_HEADER_BACKGROUND_STAR_COLOR,
  clampHeaderBackgroundOpacity,
  normalizeCssHexColor,
} from '@/api/system-config'

const props = withDefaults(defineProps<{
  /** @deprecated 整页背景改由布局层挂载；保留 prop 避免调用方瞬时报错 */
  imageUrl?: string
  glowColor?: string
  glowOpacity?: number
  starEnabled?: boolean
  starColor?: string
  /** 关掉星点时，是否仍画光晕（默认 true） */
  glowEnabled?: boolean
}>(), {
  imageUrl: '',
  glowColor: DEFAULT_HEADER_BACKGROUND_GLOW_COLOR,
  glowOpacity: DEFAULT_HEADER_BACKGROUND_GLOW_OPACITY,
  starEnabled: true,
  starColor: DEFAULT_HEADER_BACKGROUND_STAR_COLOR,
  glowEnabled: true,
})

const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
const glowId = computed(() => `create-page-top-glow-${uid}`)
const patternId = computed(() => `create-page-top-pattern-${uid}`)
const blurId = computed(() => `create-page-top-mask-blur-${uid}`)
const maskId = computed(() => `create-page-top-mask-${uid}`)

const resolvedGlowColor = computed(() => normalizeCssHexColor(
  props.glowColor,
  DEFAULT_HEADER_BACKGROUND_GLOW_COLOR,
))
const resolvedGlowOpacity = computed(() => clampHeaderBackgroundOpacity(
  props.glowOpacity,
  DEFAULT_HEADER_BACKGROUND_GLOW_OPACITY,
))
const resolvedStarColor = computed(() => normalizeCssHexColor(
  props.starColor,
  DEFAULT_HEADER_BACKGROUND_STAR_COLOR,
))

const showGlow = computed(() => props.glowEnabled !== false)
const showStars = computed(() => props.starEnabled !== false)

const cssVars = computed(() => ({
  '--create-page-top-glow-opacity': String(resolvedGlowOpacity.value),
  '--create-page-top-star-color': resolvedStarColor.value,
}))
</script>
