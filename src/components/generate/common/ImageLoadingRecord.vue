<template>
  <div class="responsive-container-msS_cP responsive-container-NBoaUU">
    <div class="content-DPogfx ai-generated-record-content-hg5EL8">
      <div class="image-record-ytX6Dp">
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
          <div class="image-record-content-TuJi21">
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
import { ref, onMounted, onUnmounted } from 'vue'
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
  progress: { type: Number, default: 0 }
})

const currentProgress = ref(props.progress)
let timer = null

onMounted(() => {
  timer = setInterval(() => {
    if (currentProgress.value < 99) {
      // 越接近 99 增长越慢
      const remaining = 99 - currentProgress.value
      const step = Math.max(1, Math.floor(remaining * 0.08))
      currentProgress.value = Math.min(99, currentProgress.value + step)
    }
  }, 800)
})

onUnmounted(() => {
  clearInterval(timer)
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
</style>
