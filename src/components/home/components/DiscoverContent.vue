<template>
  <div class="discover-masonry-viewport">
    <div
      class="masonry-layout-ynW6QL masonry-layout discover-masonry-shell"
      :style="{ height: `${scrollHeight}px` }"
    >
      <div
        ref="trackRef"
        class="masonry-layout-scroll-content-clXJoF discover-masonry-track"
        :style="{ height: `${scrollHeight}px`, maxHeight: 'none' }"
      >
      <!-- 顶部大卡：固定占位，占两列宽 -->
      <div
        class="masonry-layout-item-J63wqA masonry-layout-item discover-masonry-hero"
        data-index="0"
        data-col="0"
        :style="heroInlineStyle"
      >
        <div class="carousel-FWRj1r">
          <div class="list-container-vuJDVb">
            <div
              v-for="(item, index) in carouselItems"
              :key="index"
              :class="['list-item-ZCXUDd', 'animated-iDahmY', getCarouselItemClass(index)]"
            >
              <div class="carousel-item-etX02e" :data-index="index">
                <div class="container-bG3PQ9">
                  <div style="transition:opacity 300ms;opacity:1">
                    <img
                      data-apm-action="feed-item-video"
                      fetchpriority="high"
                      loading="lazy"
                      class="image-dDSP59 discover-masonry-cover"
                      :src="item.image"
                      :alt="item.title"
                    >
                  </div>
                </div>
                <div class="gradient-s76omw"></div>
                <div class="description-LBLc4Y">
                  <p class="title-rWMvWE">{{ item.title }}</p>
                  <p v-if="item.participants" class="subtitle-gSQDQC">
                    已有<span class="number-GeGXES">{{ item.participants }}</span>人参与
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Carousel Arrows -->
          <div class="arrow-container-LaBgq_">
            <div class="arrow-button-h6oOIX" role="button" tabindex="0" aria-label="上一个" @click="prevSlide">
              <svg width="1em" height="1em" viewBox="0 0 24 24"
                   preserveAspectRatio="xMidYMid meet" fill="none" role="presentation"
                   xmlns="http://www.w3.org/2000/svg" class="icon-XIKnET">
                <g>
                  <path data-follow-fill="currentColor" fill-rule="evenodd"
                        clip-rule="evenodd"
                        d="M6.26 12.844a1.2 1.2 0 0 1 0-1.688L14.321 3a1.2 1.2 0 0 1 1.707 1.687L8.801 12l7.227 7.313A1.2 1.2 0 0 1 14.321 21l-8.06-8.156Z"
                        fill="currentColor"></path>
                </g>
              </svg>
            </div>
            <div class="arrow-button-h6oOIX" role="button" tabindex="0" aria-label="下一个" @click="nextSlide">
              <svg width="1em" height="1em" viewBox="0 0 24 24"
                   preserveAspectRatio="xMidYMid meet" fill="none" role="presentation"
                   xmlns="http://www.w3.org/2000/svg" class="icon-XIKnET">
                <g>
                  <path data-follow-fill="currentColor"
                        d="M17.74 12.844a1.2 1.2 0 0 0 0-1.688L9.678 3A1.2 1.2 0 1 0 7.97 4.687L15.2 12l-7.23 7.313A1.2 1.2 0 1 0 9.68 21l8.06-8.156Z"
                        fill="currentColor"></path>
                </g>
              </svg>
            </div>
          </div>
          
          <!-- Carousel Dots -->
          <div class="dots-container-FwLPgG">
            <div
              v-for="(item, index) in carouselItems"
              :key="index"
              :data-index="index"
              :class="['dot-uLga1M', { 'curr-F1jSlh': currentSlide === index }]"
              @click="goToSlide(index)"
            ></div>
          </div>
        </div>
      </div>

      <!-- Feed：位置由图片 natural 尺寸换算高度 + 最短列堆叠 -->
      <div
        v-for="(item, index) in feedItems"
        :key="item.src"
        class="masonry-layout-item-J63wqA masonry-layout-item"
        :data-index="index + 1"
        :style="feedTileStyle(index)"
      >
        <div class="feed-item-IXsc39 feed-item-image-NrtAVV cover-container-zfPgao">
          <div class="content-TIH4aR">
            <div class="container-bG3PQ9">
              <div style="transition:opacity 300ms;opacity:1">
                <img
                  data-apm-action="feed-item-image"
                  elementtiming
                  :fetchpriority="index < 4 ? 'high' : 'low'"
                  loading="lazy"
                  class="cover-W9HnBB discover-masonry-cover"
                  ccfmp-element="true"
                  :src="item.src"
                  :alt="item.alt"
                  @load="onFeedImgLoad($event, index)"
                  @error="onFeedImgError(index)"
                >
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  buildFeedLayoutsFromSizes,
  computeMasonryMetrics,
  masonryScrollHeight,
} from '@/components/home/discoverMasonryLayout'

/** 可替换为接口数据；默认 01–40 共 40 张 */
const feedImageBase = 'https://qwe-oss.oss-cn-beijing.aliyuncs.com/ai-gen'

/** 使用 .png 的编号（从 1 开始），未列出的为 .jpeg，例如 new Set([3, 7, 15]) 表示 03.png、07.png、15.png */
const FEED_USE_PNG = new Set(
  /** @type {number[]} */
  ([5,39]),
)

function buildFeedSrc(n) {
  const name = `${String(n).padStart(2, '0')}.${FEED_USE_PNG.has(n) ? 'png' : 'jpeg'}`
  return `${feedImageBase}/${name}`
}

/** Fisher–Yates：返回新数组，不打乱入参 */
function shuffleArray(arr) {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const t = a[i]
    a[i] = a[j]
    a[j] = t
  }
  return a
}

const feedItems = ref(
  shuffleArray(
    Array.from({ length: 40 }, (_, i) => {
      const n = i + 1
      return {
        n,
        src: buildFeedSrc(n),
        alt: `Feed ${n}`,
      }
    }),
  ),
)

/** 每张图 natural 尺寸；null 表示未加载，布局按 1:1 占位 */
const feedNaturalSizes = ref(
  /** @type {Array<{ w: number; h: number } | null>} */
  ([]),
)

watch(
  () => feedItems.value.map((x) => x.src),
  (urls) => {
    feedNaturalSizes.value = urls.map(() => null)
  },
  { immediate: true },
)

function onFeedImgLoad(ev, index) {
  const el = ev.target
  if (!el || !el.naturalWidth || !el.naturalHeight) return
  const next = feedNaturalSizes.value.slice()
  next[index] = { w: el.naturalWidth, h: el.naturalHeight }
  feedNaturalSizes.value = next
}

function onFeedImgError(index) {
  if (feedNaturalSizes.value[index]) return
  const next = feedNaturalSizes.value.slice()
  next[index] = { w: 1, h: 1 }
  feedNaturalSizes.value = next
}

/** 瀑布流轨道宽度，用于按屏宽重算列；ResizeObserver 更新 */
const trackRef = ref(null)
const trackWidth = ref(1653)

let trackResizeObserver = null
/** @type {(() => void) | null} */
let trackWinResize = null

onMounted(() => {
  const el = trackRef.value
  if (!el) return
  const apply = () => {
    const w = el.getBoundingClientRect().width
    if (w > 0) trackWidth.value = w
  }
  apply()
  if (typeof ResizeObserver !== 'undefined') {
    trackResizeObserver = new ResizeObserver(() => apply())
    trackResizeObserver.observe(el)
  } else {
    trackWinResize = apply
    window.addEventListener('resize', trackWinResize)
  }
})

onBeforeUnmount(() => {
  trackResizeObserver?.disconnect()
  trackResizeObserver = null
  if (trackWinResize) {
    window.removeEventListener('resize', trackWinResize)
    trackWinResize = null
  }
})

const masonryMetrics = computed(() => computeMasonryMetrics(trackWidth.value))

const feedLayouts = computed(() =>
  buildFeedLayoutsFromSizes(feedNaturalSizes.value, masonryMetrics.value),
)

const scrollHeight = computed(() =>
  masonryScrollHeight(feedLayouts.value, masonryMetrics.value.heroRect),
)

const heroInlineStyle = computed(() => {
  const h = masonryMetrics.value.heroRect
  return {
    left: `${h.left}px`,
    top: `${h.top}px`,
    width: `${h.width}px`,
    height: `${h.height}px`,
  }
})

function feedTileStyle(index) {
  const r = feedLayouts.value[index]
  if (!r) {
    return { left: '0', top: '0', width: '0', height: '0', visibility: 'hidden' }
  }
  return {
    left: `${r.left}px`,
    top: `${r.top}px`,
    width: `${r.width}px`,
    height: `${r.height}px`,
  }
}

const currentSlide = ref(0)

const carouselItems = ref([
  {
    title: '视觉实验室第1期 · 图标银行',
    participants: 4888,
    image:
      'https://p9-heycan-hgt-sign.byteimg.com/tos-cn-i-31yrirwxg7/7854351dae514807b2411d3ed374be2f~tplv-3jr8j4ixpe-resize:720:720.webp?lk3s=8e790bc3&x-expires=1800580713&x-signature=9CfIpRLH%2BnjqJMGA0iOyWYBmqIQ%3D',
  },
  {
    title: '第105届ADC年度设计大奖·AI设计作品征集',
    participants: null,
    image:
      'https://p9-heycan-hgt-sign.byteimg.com/tos-cn-i-31yrirwxg7/35cb2eb1fd6a465090d743cd79344dcc~tplv-3jr8j4ixpe-resize:720:720.webp?lk3s=8e790bc3&x-expires=1800580713&x-signature=rJdP73v4TQQ6I%2BGP0yeUGGIOLkA%3D',
  },
  {
    title: '迷你剧场第21期 · 看见那一刻的发生',
    participants: 926,
    image:
      'https://p9-heycan-hgt-sign.byteimg.com/tos-cn-i-31yrirwxg7/62a31d95776e4106b2e2533626551ad2~tplv-3jr8j4ixpe-resize:720:720.webp?lk3s=8e790bc3&x-expires=1800580713&x-signature=m5M3guAWnzX5TTgBNdpTuFZUNZQ%3D',
  },
])

const getCarouselItemClass = (index) => {
  if (index === currentSlide.value) return 'curr-F1jSlh'
  if (index === (currentSlide.value + 1) % carouselItems.value.length) return 'next-fFJk8u'
  if (index === (currentSlide.value - 1 + carouselItems.value.length) % carouselItems.value.length) {
    return 'prev-CbPcEG'
  }
  return ''
}

const nextSlide = () => {
  currentSlide.value = (currentSlide.value + 1) % carouselItems.value.length
}

const prevSlide = () => {
  currentSlide.value = (currentSlide.value - 1 + carouselItems.value.length) % carouselItems.value.length
}

const goToSlide = (index) => {
  currentSlide.value = index
}
</script>

<style scoped>
.discover-masonry-viewport {
  border-radius: 16px;
  overflow: hidden;
  width: 100%;
  min-width: 0;
  /* 避免子层圆角裁切抗锯齿问题 */
  isolation: isolate;
}

.discover-masonry-shell {
  min-width: 0;
  overflow-x: auto;
  position: relative;
  width: 100%;
  -webkit-overflow-scrolling: touch;
}

.discover-masonry-track {
  box-sizing: border-box;
  min-width: 0;
  position: relative;
  width: 100%;
}

.discover-masonry-cover {
  object-fit: cover;
}
</style>
