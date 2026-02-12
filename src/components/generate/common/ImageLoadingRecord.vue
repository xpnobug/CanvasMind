<template>
  <div class="responsive-container-msS_cP responsive-container-NBoaUU">
    <div class="content-DPogfx ai-generated-record-content-hg5EL8">
      <div class="image-record-ytX6Dp">
        <!-- 头部：提示词和标签 -->
        <div class="record-header-E91Dfj">
          <div class="record-header-content-Lkk9CM">
            <div class="prompt-suffix-labels-wrapper-qthJZj"
                 style="--line-height:24px;--padding-top:4px">
              <div class="prompt-suffix-labels-NBprFc"
                   style="--line-height:24px;--padding-top:4px">
                <div class="prompt-suffix-labels-content-uFKTga">
                  <span class="prompt-P_8aF8">
                    <span class="prompt-value-container-KCtKOf">
                      <span>{{ prompt }}</span>
                    </span>
                  </span>
                  <span class="labels-mHLx1x" style="visibility:visible">
                    <span class="label-lhnDlt">{{ model }}</span>
                    <span v-if="feature" class="label-lhnDlt">{{ feature }}</span>
                    <span class="label-lhnDlt">{{ ratio }}</span>
                    <span class="label-lhnDlt">{{ resolution }}</span>
                    <span v-if="duration" class="label-lhnDlt">{{ duration }}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="record-box-wrapper-MDgaBP">
          <!-- 错误状态 -->
          <div v-if="error" class="image-error-container">
            <div class="image-error-content">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 8v4m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span>{{ error }}</span>
            </div>
          </div>
          <!-- 生成完成：显示图片 -->
          <div v-else-if="done && images.length" class="image-record-content-TuJi21">
            <div class="responsive-image-grid-WOh0lB">
              <div v-for="(url, i) in images" :key="i"
                   class="image-card-wrapper-WOgXrk landscape-Ven8Mz"
                   :style="`--aspect-ratio:${aspectRatio}`">
                <div class="image-record-item-W6Y7Df">
                  <div class="context-menu-trigger-WJ6VDZ">
                    <div class="slot-card-container-gulhrr image-card-container-dFemyw">
                      <div class="content-container-z0JOWv">
                        <div class="image-card-container-qy7ui4">
                          <div class="container-bG3PQ9 image-GnB1sY">
                            <div style="transition:opacity 300ms;opacity:1">
                              <img class="image-TLmgkP"
                                   crossorigin="anonymous"
                                   draggable="false"
                                   loading="lazy"
                                   :src="url" />
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
          <!-- 加载中 -->
          <div v-else class="image-record-content-TuJi21">
            <div class="responsive-image-grid-WOh0lB">
              <div v-for="i in count" :key="i"
                   class="image-card-wrapper-WOgXrk landscape-Ven8Mz"
                   :style="`--aspect-ratio:${aspectRatio}`">
                <div class="image-record-item-W6Y7Df"></div>
              </div>
              <!-- 加载动画覆盖层 -->
              <div class="loading-container-VeCJoq">
                <div class="animation-wrapper-etExey">
                  <video class="loading-animation-x3v9Mu"
                         autoplay loop muted preload="auto"
                         :src="loadingVideoUrl"
                         crossorigin="anonymous" />
                </div>
              </div>
              <!-- 网格分割线 -->
              <div class="divider-container-PJpG3l vertical-divider-container-romu4d">
                <div v-for="i in (count - 1)" :key="i" class="vertical-divider"
                     :style="`left:${(i / count) * 100}%;transform:translateX(-50%)`"></div>
              </div>
            </div>
            <!-- 进度徽章 -->
            <div class="progress-badge-RuihdC progress-badge-RQDqWu">
              {{ currentProgress }}%造梦中
            </div>
          </div>
          <div class="operations-NxPE1B"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import loadingVideoUrl from '@/assets/animations/record-loading-animation.mp4'

const props = defineProps({
  /** 提示词 */
  prompt: { type: String, default: '' },
  /** 模型版本 */
  model: { type: String, default: '图片 5.0' },
  /** 宽高比标签 */
  ratio: { type: String, default: '1:1' },
  /** 分辨率标签 */
  resolution: { type: String, default: '2K' },
  /** 时长（视频模式） */
  duration: { type: String, default: '' },
  /** 功能（视频模式） */
  feature: { type: String, default: '' },
  /** 生成图片数量 */
  count: { type: Number, default: 4 },
  /** 图片宽高比数值 */
  aspectRatio: { type: Number, default: 1 },
  /** 初始进度百分比 */
  progress: { type: Number, default: 0 },
  /** 是否生成完成 */
  done: { type: Boolean, default: false },
  /** 生成的图片 URL 列表 */
  images: { type: Array, default: () => [] },
  /** 错误信息 */
  error: { type: String, default: '' }
})

const currentProgress = ref(props.progress)
let timer = null

const startTimer = () => {
  timer = setInterval(() => {
    if (currentProgress.value < 99) {
      const remaining = 99 - currentProgress.value
      const step = Math.max(1, Math.floor(remaining * 0.08))
      currentProgress.value = Math.min(99, currentProgress.value + step)
    }
  }, 800)
}

const stopTimer = () => {
  if (timer) { clearInterval(timer); timer = null }
}

// 完成时停止进度条
watch(() => props.done, (val) => {
  if (val) stopTimer()
})

watch(() => props.error, (val) => {
  if (val) stopTimer()
})

onMounted(() => {
  if (!props.done && !props.error) startTimer()
})

onUnmounted(() => {
  stopTimer()
})
</script>

<style scoped>
/* 加载动画覆盖层 */
.loading-container-VeCJoq {
  border-radius: 2px;
  height: 100%;
  left: 0;
  pointer-events: none;
  position: absolute;
  top: 0;
  width: 100%;
}

.animation-wrapper-etExey {
  background-color: var(--bg-mask-60);
  height: 100%;
  left: 0;
  position: absolute;
  top: 0;
  width: 100%;
  overflow: hidden;
}

.loading-animation-x3v9Mu {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 网格分割线 */
.divider-container-PJpG3l {
  height: 100%;
  left: 0;
  pointer-events: none;
  position: absolute;
  top: 0;
  transform: translateZ(0);
  width: 100%;
  z-index: 5;
}

.vertical-divider {
  background-color: var(--bg-body);
  height: 100%;
  position: absolute;
  top: 0;
  width: 2px;
}

/* 进度徽章 */
.progress-badge-RuihdC {
  align-items: center;
  background: var(--bg-block-primary-default, rgba(204, 221, 255, .08));
  border-radius: 6px;
  color: var(--text-primary);
  display: flex;
  font-family: PingFang SC, sans-serif;
  font-size: 12px;
  font-weight: 500;
  line-height: 20px;
  padding: 2px 7px 2px 8px;
}

.image-record-content-TuJi21 .progress-badge-RQDqWu {
  left: 8px;
  position: absolute;
  top: 8px;
}

/* 错误状态 */
.image-error-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 120px;
  padding: 24px;
}

.image-error-content {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--functional-danger, #f53f3f);
  font-size: 14px;
}
</style>
