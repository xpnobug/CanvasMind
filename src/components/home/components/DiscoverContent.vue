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
              <div
                class="carousel-item-etX02e"
                :data-index="index"
                role="button"
                tabindex="0"
                @click="openWorkDetailFromCarousel(item, index)"
                @keydown.enter.prevent="openWorkDetailFromCarousel(item, index)"
                @keydown.space.prevent="openWorkDetailFromCarousel(item, index)"
              >
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
        <div
          class="feed-item-IXsc39 feed-item-image-NrtAVV cover-container-zfPgao"
          role="button"
          tabindex="0"
          @click="openWorkDetailFromFeed(item, index)"
          @keydown.enter.prevent="openWorkDetailFromFeed(item, index)"
          @keydown.space.prevent="openWorkDetailFromFeed(item, index)"
        >
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
            <!-- 鼠标移入时显示的作品信息层 -->
            <div class="overlay-WWIpyU discover-feed-overlay" aria-hidden="true">
              <div class="tail-AclRiA discover-feed-overlay-tail">
                <div class="author-g6lhbl concealable-card-element-rpjFtw discover-feed-author">
                  <div class="dreamina-component-avatar-container avatar-LRSR55 discover-feed-avatar-shell">
                    <img
                      :src="item.user.avatarSrc"
                      class="dreamina-component-avatar discover-feed-avatar"
                      crossorigin="anonymous"
                      draggable="false"
                      :alt="item.user.name"
                    >
                  </div>
                  <span class="username-omeTE7 discover-feed-author-name">{{ item.user.name }}</span>
                </div>
                <div class="discover-feed-actions">
                <div class="operation-ptGIet discover-feed-operation" title="工作流">
                  <svg width="1em" height="1em" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" fill="none" role="presentation" xmlns="http://www.w3.org/2000/svg" class="icon-yH97ZW">
                    <g>
                      <path data-follow-fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" d="M4.92 3.537a4 4 0 0 0-2.83 4.899l2.585 9.645a4 4 0 0 0 4.899 2.829l2.737-.733a3.403 3.403 0 0 1-.874-1.837l-2.381.638a2 2 0 0 1-2.45-1.414L4.023 7.918a2 2 0 0 1 1.414-2.45l3.288-.88a2 2 0 0 1 2.45 1.414l2.318 8.654.553-.246a.683.683 0 0 0 .345-.368l.214-.516a3.56 3.56 0 0 1 .445-.784l-1.944-7.257a4 4 0 0 0-4.899-2.829l-3.287.881ZM21.6 9.766l-.885 3.303a3.332 3.332 0 0 0-1.687-1.433l.64-2.388a1.5 1.5 0 0 0-1.061-1.837l-2.437-.653a1.492 1.492 0 0 0-.659-.026l-.473-1.765c-.01-.039-.022-.077-.034-.115l-.016-.055a3.485 3.485 0 0 1 1.7.03l2.436.652A3.5 3.5 0 0 1 21.6 9.766Zm-3.433 11.127.208-.477a3.68 3.68 0 0 1 1.871-1.899l.64-.285a.447.447 0 0 0 0-.812l-.604-.269a3.682 3.682 0 0 1-1.898-1.961l-.214-.516a.427.427 0 0 0-.794 0l-.213.516a3.681 3.681 0 0 1-1.898 1.961l-.605.27a.447.447 0 0 0 0 .811l.64.285a3.68 3.68 0 0 1 1.872 1.899l.207.477a.427.427 0 0 0 .788 0Z" fill="currentColor"></path>
                    </g>
                  </svg>
                </div>
                <div class="operation-ptGIet discover-feed-operation" title="图片">
                  <svg width="1em" height="1em" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" fill="none" role="presentation" xmlns="http://www.w3.org/2000/svg" class="icon-yH97ZW">
                    <g>
                      <path data-follow-fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" d="M16.326 4.72H7.674A2.954 2.954 0 0 0 4.72 7.674v8.652c0 .054.001.108.004.162l3.509-3.508a2.954 2.954 0 0 1 4.03-.138l6.262 5.457c.47-.523.755-1.215.755-1.973V7.674a2.954 2.954 0 0 0-2.954-2.954Zm2.798 15.658a4.919 4.919 0 0 0 2.126-4.052V7.674a4.924 4.924 0 0 0-4.924-4.924H7.674A4.924 4.924 0 0 0 2.75 7.674v8.652a4.924 4.924 0 0 0 4.924 4.924h8.652a4.901 4.901 0 0 0 2.798-.872Zm-2.489-1.114-5.666-4.937a.985.985 0 0 0-1.344.046l-4.041 4.04a2.945 2.945 0 0 0 2.09.867h8.652c.104 0 .208-.005.31-.016ZM14.078 8.401a1.532 1.532 0 1 1 3.064 0 1.532 1.532 0 0 1-3.064 0Z" fill="currentColor"></path>
                    </g>
                  </svg>
                </div>
                <div class="favorite-RlC8dW discover-feed-favorite">
                  <div class="lottie-icon-container icon-QlNaEG discover-feed-operation">
                    <div class="lottie-icon-content">
                      <svg width="1em" height="1em" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" fill="none" role="presentation" xmlns="http://www.w3.org/2000/svg" class="icon-QlNaEG">
                        <g>
                          <path data-follow-fill="currentColor" d="M8.538 3.513a6.077 6.077 0 0 0-6.085 6.07c0 2.819 1.639 5.278 3.37 7.025 1.75 1.764 3.914 3.13 5.588 3.685a1.87 1.87 0 0 0 1.174 0c1.675-.556 3.84-1.92 5.588-3.685 1.732-1.747 3.37-4.206 3.37-7.025a6.077 6.077 0 0 0-6.084-6.07c-1.381 0-2.572.717-3.46 1.432-.889-.715-2.08-1.432-3.461-1.432Zm0 2a4.077 4.077 0 0 0-4.085 4.07c0 2.05 1.215 4.028 2.79 5.617 1.557 1.57 3.436 2.73 4.755 3.18 1.32-.45 3.2-1.61 4.755-3.18 1.575-1.59 2.79-3.568 2.79-5.617 0-2.24-1.82-4.07-4.084-4.07-.929 0-1.877.652-2.78 1.49a1 1 0 0 1-1.36 0c-.904-.838-1.853-1.49-2.781-1.49Z" clip-rule="evenodd" fill-rule="evenodd" fill="currentColor"></path>
                        </g>
                      </svg>
                    </div>
                  </div>
                  <span class="count-GysjBc discover-feed-favorite-count">{{ formatFavoriteCount(item.favoriteCount) }}</span>
                </div>
                </div>
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
import discoverContent from '@/data/homeDiscoverContent.json'

const emit = defineEmits(['open-work-detail'])

/**
 * @param {{
 *   gallery: Array<{ imageSrc: string, promptText?: string, user?: { name?: string, avatarSrc?: string }, favoriteCount?: number|string, detail?: { createDate?: string, aiGeneratedText?: string, promptTipLabel?: string, modelLabel?: string, aspectRatioLabel?: string } }>
 *   index: number
 * } | { imageSrc: string, promptText?: string, user?: { name?: string, avatarSrc?: string }, favoriteCount?: number|string, detail?: { createDate?: string, aiGeneratedText?: string, promptTipLabel?: string, modelLabel?: string, aspectRatioLabel?: string } }} payload
 */
function emitOpenWorkDetail(payload) {
  emit('open-work-detail', payload)
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

function formatFavoriteCount(count) {
  if (count >= 10000) return `${(count / 10000).toFixed(1)}w`
  return String(count)
}

const feedItems = ref(
  shuffleArray(
    discoverContent.feedItems.map((item) => ({
      id: item.id,
      src: item.imageSrc,
      alt: item.alt,
      promptText: item.promptText,
      user: item.user,
      favoriteCount: item.favoriteCount,
      detail: item.detail,
    })),
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

const carouselItems = ref(
  discoverContent.heroItems.map((item) => ({
    id: item.id,
    title: item.title,
    participants: item.participants,
    image: item.imageSrc,
    promptText: item.promptText,
  })),
)

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

function openWorkDetailFromFeed(item, index) {
  emitOpenWorkDetail({
    gallery: feedItems.value.map((it) => ({
      imageSrc: it.src,
      promptText: it.promptText || it.alt,
      user: it.user,
      favoriteCount: it.favoriteCount,
      detail: it.detail,
    })),
    index,
  })
}

function openWorkDetailFromCarousel(item, index) {
  emitOpenWorkDetail({
    gallery: carouselItems.value.map((it) => ({
      imageSrc: it.image,
      promptText: it.promptText || it.title,
      user: it.user,
      favoriteCount: it.favoriteCount,
    })),
    index,
  })
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

.cover-container-zfPgao {
  position: relative;
  overflow: hidden;
}

.discover-feed-overlay {
  position: absolute;
  inset: 0;
  display: block;
  color: #fff;
  background: linear-gradient(
    180deg,
    rgba(10, 10, 12, 0) 42%,
    rgba(10, 10, 12, 0.12) 64%,
    rgba(10, 10, 12, 0.56) 100%
  );
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease;
}

.feed-item-IXsc39:hover .discover-feed-overlay,
.feed-item-IXsc39:focus-visible .discover-feed-overlay,
.feed-item-IXsc39:focus-within .discover-feed-overlay {
  opacity: 1;
}

.discover-feed-overlay-tail {
  position: absolute;
  right: 12px;
  bottom: 10px;
  left: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.discover-feed-author {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1 1 auto;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.28);
}

.discover-feed-avatar-shell {
  width: 22px;
  height: 22px;
  border-radius: 999px;
  overflow: hidden;
  flex: 0 0 auto;
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.14);
}

.discover-feed-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.discover-feed-author-name {
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: 13px;
  line-height: 18px;
  font-weight: 500;
}

.discover-feed-actions {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  flex: 0 0 auto;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.28);
}

.discover-feed-operation,
.discover-feed-favorite {
  display: inline-flex;
  align-items: center;
  gap: 3px;
}

.discover-feed-operation {
  justify-content: center;
  width: 18px;
  height: 18px;
  color: rgba(255, 255, 255, 0.92);
  font-size: 18px;
}

.discover-feed-favorite-count {
  font-size: 13px;
  line-height: 18px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.92);
}
</style>
