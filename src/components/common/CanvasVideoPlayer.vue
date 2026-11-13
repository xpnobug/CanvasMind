<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = withDefaults(defineProps<{
  src: string
  poster?: string
  aspectRatio?: string | number
  resolution?: string
  loop?: boolean
  muted?: boolean
  playsinline?: boolean
  videoClass?: string
  fill?: 'contain' | 'cover'
  maxWidth?: string
  showBadge?: boolean
  showControls?: boolean
  /** 是否显示静音/有声切换按钮（底部控制条） */
  showMuteButton?: boolean
  /** 是否显示右上角悬浮静音按钮 */
  showOverlayMuteButton?: boolean
  /** 控制条是否始终展示（列表卡片等场景） */
  alwaysShowControls?: boolean
  /** 列表缩略图等场景禁用点击播放，由外层处理点击 */
  interactive?: boolean
  /** 鼠标移入自动播放，移出暂停并回到首帧 */
  playOnHover?: boolean
  /** 挂载或切换 src 后尝试自动播放（需配合用户手势场景，如点击打开详情） */
  autoplay?: boolean
  /**
   * 画布缩小时补偿控件屏幕尺寸（通常传 1/zoom）。
   * 仅影响静音按钮等小热区，避免缩放过小点不到、误触发拖拽。
   */
  controlScale?: number
  /** 优先使用视频文件自身宽高比（loadedmetadata 后覆盖） */
  useIntrinsicAspect?: boolean
}>(), {
  loop: true,
  muted: true,
  playsinline: true,
  fill: 'contain',
  showBadge: true,
  showControls: true,
  showMuteButton: true,
  showOverlayMuteButton: true,
  alwaysShowControls: false,
  interactive: true,
  playOnHover: false,
  autoplay: false,
  controlScale: 1,
  useIntrinsicAspect: false,
})

const emit = defineEmits<{
  /** 播放进度（秒） */
  timeupdate: [currentTimeSec: number]
}>()

const videoRef = ref<HTMLVideoElement | null>(null)
const isPlaying = ref(false)
const isHovered = ref(false)
const duration = ref(0)
const currentTime = ref(0)
/** 视频文件自身宽高比（videoWidth / videoHeight） */
const intrinsicAspect = ref<number | null>(null)
/** 用户可控静音状态，初始跟随 props.muted（默认静音） */
const isMuted = ref(props.muted)

const resolvedControlScale = computed(() => {
  const scale = Number(props.controlScale)
  if (!Number.isFinite(scale) || scale <= 0) return 1
  return Math.min(3, Math.max(1, scale))
})

const muteButtonStyle = computed(() => {
  const scale = resolvedControlScale.value
  if (scale <= 1.01) return undefined
  return {
    transform: `scale(${scale})`,
    transformOrigin: 'top right',
  } as Record<string, string>
})

watch(
  () => props.muted,
  (value) => {
    isMuted.value = value
  },
)

watch(
  () => props.src,
  () => {
    isMuted.value = props.muted
    intrinsicAspect.value = null
    void nextTick(() => tryAutoplay())
  },
)

const tryAutoplay = () => {
  if (!props.autoplay) return
  void playVideo()
}

const resolvedAspectRatio = computed(() => {
  if (props.useIntrinsicAspect && intrinsicAspect.value && intrinsicAspect.value > 0) {
    return String(intrinsicAspect.value)
  }

  const explicit = Number(props.aspectRatio)
  if (Number.isFinite(explicit) && explicit > 0) {
    return String(explicit)
  }

  const ratio = String(props.aspectRatio || '').trim().toLowerCase()
  if (ratio) {
    const colonMatch = ratio.match(/^(\d+(?:\.\d+)?)\s*:\s*(\d+(?:\.\d+)?)$/)
    if (colonMatch) {
      const width = Number(colonMatch[1])
      const height = Number(colonMatch[2])
      if (width > 0 && height > 0) {
        return String(width / height)
      }
    }

    const sizeMatch = ratio.match(/^(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)$/i)
    if (sizeMatch) {
      const width = Number(sizeMatch[1])
      const height = Number(sizeMatch[2])
      if (width > 0 && height > 0) {
        return String(width / height)
      }
    }
  }

  if (intrinsicAspect.value && intrinsicAspect.value > 0) {
    return String(intrinsicAspect.value)
  }

  return '1.7778'
})

const resolutionLabel = computed(() => {
  const normalized = String(props.resolution || '').trim().toUpperCase()
  return normalized || 'HD'
})

const progressPercent = computed(() => {
  if (!duration.value) return 0
  return Math.min(100, Math.max(0, (currentTime.value / duration.value) * 100))
})

const showControlBar = computed(() => (
  props.showControls && (props.alwaysShowControls || isHovered.value || isPlaying.value)
))

/** 底栏已露出播放键时不再叠一层中央大按钮，避免「两个播放」 */
const showPlayOverlay = computed(() => (
  !isPlaying.value && !showControlBar.value
))

/** 静音时始终显示开启按钮；有声时仅在 hover/播放时显示 */
const showMuteToggle = computed(() => (
  props.showOverlayMuteButton
  && (isMuted.value || isHovered.value || isPlaying.value)
))

const formatTime = (seconds: number) => {
  const safe = Math.max(0, Math.floor(Number(seconds) || 0))
  const minutes = Math.floor(safe / 60)
  const remain = safe % 60
  return `${minutes}:${String(remain).padStart(2, '0')}`
}

const syncIntrinsicAspect = () => {
  const video = videoRef.value
  if (!video) return
  const width = Number(video.videoWidth || 0)
  const height = Number(video.videoHeight || 0)
  if (width > 0 && height > 0) {
    intrinsicAspect.value = width / height
  }
}

const syncDuration = () => {
  duration.value = Number(videoRef.value?.duration) || 0
  syncIntrinsicAspect()
}

const handleTimeUpdate = () => {
  currentTime.value = Number(videoRef.value?.currentTime) || 0
  emit('timeupdate', currentTime.value)
}

const playVideo = async () => {
  const video = videoRef.value
  if (!video) return

  try {
    await video.play()
    isPlaying.value = true
  } catch {
    // 浏览器自动播放策略可能阻止播放，保持静默
  }
}

const pauseVideo = (resetToStart = false) => {
  const video = videoRef.value
  if (!video) return

  video.pause()
  if (resetToStart) {
    video.currentTime = 0
    currentTime.value = 0
  }
  isPlaying.value = false
}

const togglePlay = async () => {
  const video = videoRef.value
  if (!video) return

  if (video.paused) {
    await playVideo()
    return
  }

  pauseVideo()
}

const handleRootClick = (event: MouseEvent) => {
  if (!props.interactive) return
  event.stopPropagation()
  void togglePlay()
}

const handleMouseEnter = () => {
  isHovered.value = true
  if (props.playOnHover) {
    void playVideo()
  }
}

const handleMouseLeave = () => {
  isHovered.value = false
  if (props.playOnHover) {
    pauseVideo(true)
  }
}

const syncVideoMuted = () => {
  const video = videoRef.value
  if (!video) return
  video.muted = isMuted.value
}

const toggleMute = () => {
  isMuted.value = !isMuted.value
  syncVideoMuted()
}

const seekByRatio = (ratio: number) => {
  const video = videoRef.value
  if (!video || !duration.value) return
  const nextTime = Math.min(duration.value, Math.max(0, ratio * duration.value))
  video.currentTime = nextTime
  currentTime.value = nextTime
}

const handleProgressClick = (event: MouseEvent) => {
  const target = event.currentTarget as HTMLElement | null
  if (!target) return
  const rect = target.getBoundingClientRect()
  if (!rect.width) return
  const ratio = (event.clientX - rect.left) / rect.width
  seekByRatio(ratio)
}

onBeforeUnmount(() => {
  videoRef.value?.pause()
})

onMounted(() => {
  void nextTick(() => tryAutoplay())
})

const handleLoadedData = () => {
  syncVideoMuted()
  tryAutoplay()
}

defineExpose({
  play: playVideo,
  pause: pauseVideo,
  togglePlay,
})
</script>

<template>
  <div
    class="canvas-video-player"
    :class="{ 'is-playing': isPlaying, 'is-hovered': isHovered }"
    :style="{
      '--canvas-video-aspect': resolvedAspectRatio,
      maxWidth: maxWidth || undefined,
    }"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    @click="handleRootClick"
  >
    <div class="canvas-video-player__container">
      <div class="canvas-video-player__inner">
        <video
          ref="videoRef"
          :class="['canvas-video-player__element', videoClass]"
          :src="src"
          :poster="poster"
          :loop="loop"
          :muted="isMuted"
          :playsinline="playsinline"
          preload="metadata"
          draggable="false"
          @loadedmetadata="syncDuration"
          @loadeddata="handleLoadedData"
          @timeupdate="handleTimeUpdate"
          @play="isPlaying = true"
          @pause="isPlaying = false"
          @ended="isPlaying = false"
        />
      </div>

      <span
        v-if="showBadge && resolution"
        class="canvas-video-player__badge"
      >
        {{ resolutionLabel }}
      </span>

      <button
        v-if="showMuteToggle"
        type="button"
        class="canvas-video-player__mute-btn nodrag nopan"
        :class="{ 'is-muted': isMuted }"
        :style="muteButtonStyle"
        :aria-label="isMuted ? '开启声音' : '关闭声音'"
        :title="isMuted ? '开启声音' : '关闭声音'"
        @pointerdown.stop
        @mousedown.stop
        @click.stop="toggleMute"
      >
        <svg v-if="isMuted" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" role="presentation">
          <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63Zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0 0 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71ZM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 0 0 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3ZM12 4 9.91 6.09 12 8.18V4Z" />
        </svg>
        <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="currentColor" role="presentation">
          <path d="M3 9v6h4l5 5V4L7 9H3Zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02ZM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77Z" />
        </svg>
      </button>

      <div v-if="showPlayOverlay" class="canvas-video-player__play-overlay" aria-hidden="true">
        <div class="canvas-video-player__play-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" role="presentation">
            <path d="M8 5.14v14.72a1 1 0 0 0 1.5.86l11.04-7.36a1 1 0 0 0 0-1.72L9.5 4.28A1 1 0 0 0 8 5.14Z" />
          </svg>
        </div>
      </div>

      <div
        v-if="showControlBar"
        class="canvas-video-player__controls nodrag nopan"
        @mousedown.stop
        @click.stop
      >
        <button
          type="button"
          class="canvas-video-player__ctrl-btn"
          :aria-label="isPlaying ? '暂停' : '播放'"
          @click.stop="togglePlay"
        >
          <svg v-if="isPlaying" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 6h3v12H8V6Zm5 0h3v12h-3V6Z" />
          </svg>
          <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5.14v14.72a1 1 0 0 0 1.5.86l11.04-7.36a1 1 0 0 0 0-1.72L9.5 4.28A1 1 0 0 0 8 5.14Z" />
          </svg>
        </button>
        <button
          v-if="showMuteButton"
          type="button"
          class="canvas-video-player__ctrl-btn"
          :aria-label="isMuted ? '开启声音' : '关闭声音'"
          :title="isMuted ? '开启声音' : '关闭声音'"
          @click.stop="toggleMute"
        >
          <svg v-if="isMuted" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63Zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0 0 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71ZM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 0 0 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3ZM12 4 9.91 6.09 12 8.18V4Z" />
          </svg>
          <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 9v6h4l5 5V4L7 9H3Zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02ZM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77Z" />
          </svg>
        </button>
        <span class="canvas-video-player__time">
          {{ formatTime(currentTime) }} / {{ formatTime(duration) }}
        </span>
        <div class="canvas-video-player__progress" @click.stop="handleProgressClick">
          <div class="canvas-video-player__progress-bg">
            <div
              class="canvas-video-player__progress-current"
              :style="{ width: `${progressPercent}%` }"
            >
              <span class="canvas-video-player__progress-handle" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.canvas-video-player {
  width: 100%;
  max-width: 100%;
}

.canvas-video-player__container {
  position: relative;
  width: 100%;
  aspect-ratio: var(--canvas-video-aspect, 16 / 9);
  overflow: hidden;
  border-radius: 2px;
  background: var(--bg-block-primary-default, rgba(204, 221, 255, 0.06));
  cursor: pointer;
}

.canvas-video-player__inner {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.canvas-video-player__element {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  transform: translate(-50%, -50%);
  object-fit: v-bind(fill);
  background: transparent;
}

/* 关闭系统原生起播按钮，避免与自定义 play overlay 叠两层 */
.canvas-video-player__element::-webkit-media-controls-start-playback-button {
  display: none !important;
  -webkit-appearance: none;
}

.canvas-video-player__element::-webkit-media-controls {
  display: none !important;
}

.canvas-video-player__badge {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 3;
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--bg-mask-30, rgba(0, 0, 0, 0.3));
  color: var(--onmedia-text-primary, #f5fbff);
  font-size: 11px;
  font-weight: 600;
  line-height: 16px;
  letter-spacing: 0.02em;
  pointer-events: none;
  transition: opacity 0.15s ease;
}

.canvas-video-player.is-hovered .canvas-video-player__badge,
.canvas-video-player.is-playing .canvas-video-player__badge {
  opacity: 0;
}

.canvas-video-player__mute-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 5;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: var(--bg-mask-30, rgba(0, 0, 0, 0.3));
  color: var(--onmedia-text-primary, #f5fbff);
  cursor: pointer;
  transition: opacity 0.15s ease, background 0.15s ease;
}

/* 扩大命中区：缩小时配合 controlScale，避免点到边缘误拖节点 */
.canvas-video-player__mute-btn::before {
  content: '';
  position: absolute;
  inset: -12px;
}

.canvas-video-player__mute-btn.is-muted {
  opacity: 1;
}

.canvas-video-player:not(.is-hovered):not(.is-playing) .canvas-video-player__mute-btn:not(.is-muted) {
  opacity: 0;
  pointer-events: none;
}

.canvas-video-player__mute-btn:hover {
  background: var(--bg-mask-50, rgba(0, 0, 0, 0.5));
}

.canvas-video-player__play-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, transparent 55%, rgba(0, 0, 0, 0.18));
  pointer-events: none;
}

.canvas-video-player__play-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--bg-mask-30, rgba(0, 0, 0, 0.3));
  color: var(--onmedia-text-primary, #f5fbff);
  box-shadow: 0 6px 16px rgba(4, 4, 4, 0.12);
}

.canvas-video-player__controls {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 4;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px 12px;
  background: linear-gradient(180deg, transparent, rgba(0, 0, 0, 0.55));
  opacity: 0;
  transform: translateY(6px);
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.canvas-video-player.is-hovered .canvas-video-player__controls,
.canvas-video-player.is-playing .canvas-video-player__controls {
  opacity: 1;
  transform: translateY(0);
}

.canvas-video-player__ctrl-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--onmedia-text-primary, #f5fbff);
  cursor: pointer;
}

.canvas-video-player__ctrl-btn:hover {
  background: var(--onmedia-block-light-hover, rgba(255, 255, 255, 0.08));
}

.canvas-video-player__time {
  flex-shrink: 0;
  color: var(--onmedia-text-secondary, rgba(245, 251, 255, 0.88));
  font-size: 11px;
  line-height: 16px;
  font-variant-numeric: tabular-nums;
}

.canvas-video-player__progress {
  flex: 1 1 auto;
  min-width: 0;
  padding: 8px 0;
  cursor: pointer;
}

.canvas-video-player__progress-bg {
  position: relative;
  height: 3px;
  border-radius: 999px;
  background: var(--onmedia-text-disabled, rgba(224, 245, 255, 0.2));
  overflow: hidden;
  transition: height 0.15s ease;
}

.canvas-video-player.is-hovered .canvas-video-player__progress-bg {
  height: 4px;
  backdrop-filter: blur(4px);
}

.canvas-video-player__progress-current {
  position: relative;
  height: 100%;
  background: var(--onmedia-text-primary, #f5fbff);
  border-radius: inherit;
}

.canvas-video-player__progress-handle {
  position: absolute;
  top: 50%;
  right: 0;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--onmedia-text-primary, #f5fbff);
  box-shadow: 0 6px 16px rgba(4, 4, 4, 0.06);
  transform: translate(50%, -50%);
  opacity: 0;
  transition: opacity 0.15s ease;
}

.canvas-video-player.is-hovered .canvas-video-player__progress-handle {
  opacity: 1;
}
</style>
