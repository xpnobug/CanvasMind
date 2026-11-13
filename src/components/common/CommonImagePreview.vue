<template>
  <Teleport to="body">
    <div v-if="visible" class="common-image-preview" @click="handleMaskClick">
      <div class="common-image-preview__panel" @click.stop>
        <header class="common-image-preview__header">
          <div class="common-image-preview__heading">
            <h3>{{ title || defaultTitle }}</h3>
            <p v-if="description">{{ description }}</p>
          </div>
          <div class="common-image-preview__actions">
            <a
              v-if="resolvedMediaSrc"
              class="common-image-preview__button"
              :href="resolvedMediaSrc"
              target="_blank"
              rel="noreferrer"
            >
              {{ openOriginalLabel }}
            </a>
            <button
              v-if="resolvedMediaSrc"
              class="common-image-preview__button"
              type="button"
              :disabled="downloading"
              @click="handleDownload"
            >
              {{ downloading ? '下载中…' : '下载' }}
            </button>
            <button class="common-image-preview__close" type="button" @click="closePreview">×</button>
          </div>
        </header>

        <main class="common-image-preview__stage">
          <CanvasVideoPlayer
            v-if="isVideo && resolvedMediaSrc"
            class="common-image-preview__video"
            :src="resolvedMediaSrc"
            :poster="resolvedPoster || undefined"
            :aspect-ratio="aspectRatio || '16:9'"
            fill="contain"
            :show-controls="true"
            :show-badge="false"
            :loop="false"
            :muted="false"
          />
          <img
            v-else-if="resolvedMediaSrc"
            :src="resolvedMediaSrc"
            :alt="title || defaultTitle"
          >
          <div v-else class="common-image-preview__empty">{{ emptyLabel }}</div>
        </main>

        <footer v-if="metaItems.length" class="common-image-preview__meta">
          <div v-for="item in metaItems" :key="item.label">
            <span>{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
          </div>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, watch } from 'vue'
import { buildAssetUrl } from '@/api/http'
import CanvasVideoPlayer from '@/components/common/CanvasVideoPlayer.vue'
import { useMediaDownloadFeedback } from '@/composables/useMediaDownloadFeedback'

export interface CommonImagePreviewMetaItem {
  label: string
  value: string | number
}

export type CommonImagePreviewMediaType = 'image' | 'video'

const props = withDefaults(defineProps<{
  visible: boolean
  src?: string
  assetId?: string
  poster?: string
  mediaType?: CommonImagePreviewMediaType
  aspectRatio?: string
  title?: string
  description?: string
  downloadName?: string
  meta?: CommonImagePreviewMetaItem[]
  closeOnMask?: boolean
}>(), {
  src: '',
  assetId: '',
  poster: '',
  mediaType: 'image',
  aspectRatio: '16:9',
  title: '',
  description: '',
  downloadName: '',
  meta: () => [],
  closeOnMask: true,
})

const emit = defineEmits<{
  'update:visible': [value: boolean]
  close: []
  downloaded: []
}>()

const { downloading, downloadWithFeedback } = useMediaDownloadFeedback()

const isVideo = computed(() => props.mediaType === 'video')
const resolvedMediaSrc = computed(() => buildAssetUrl(props.src || ''))
const resolvedPoster = computed(() => buildAssetUrl(props.poster || ''))
const defaultTitle = computed(() => (isVideo.value ? '视频预览' : '图片预览'))
const openOriginalLabel = computed(() => (isVideo.value ? '打开原视频' : '打开原图'))
const emptyLabel = computed(() => (isVideo.value ? '暂无可预览视频' : '暂无可预览图片'))
const metaItems = computed(() => props.meta.filter(item => item.label && String(item.value || '').trim()))

const closePreview = () => {
  emit('update:visible', false)
  emit('close')
}

const handleMaskClick = () => {
  if (props.closeOnMask) {
    closePreview()
  }
}

const handleDownload = async () => {
  if (!resolvedMediaSrc.value || downloading.value) {
    return
  }

  const ok = await downloadWithFeedback({
    assetId: props.assetId || undefined,
    url: props.src || resolvedMediaSrc.value,
    filename: props.downloadName || undefined,
    kind: props.mediaType,
    prompt: props.title || props.description,
    recordId: props.assetId || undefined,
  })
  if (ok) {
    emit('downloaded')
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && props.visible) {
    closePreview()
  }
}

watch(() => props.visible, (visible) => {
  if (visible) {
    window.addEventListener('keydown', handleKeydown)
    return
  }
  window.removeEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.common-image-preview {
  position: fixed;
  inset: 0;
  z-index: 3200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 28px;
  background: rgba(7, 10, 16, 0.72);
  backdrop-filter: blur(10px);
}

.common-image-preview__panel {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  width: min(1120px, 100%);
  max-height: calc(100vh - 56px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  overflow: hidden;
  background: var(--bg-surface, #12141a);
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.42);
}

.common-image-preview__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 18px;
  border-bottom: 1px solid var(--line-divider, #00000014);
  background: color-mix(in srgb, var(--bg-surface, #12141a) 92%, transparent);
}

.common-image-preview__heading {
  min-width: 0;
}

.common-image-preview__heading h3 {
  margin: 0;
  overflow: hidden;
  color: var(--text-primary, #fff);
  font-size: 16px;
  font-weight: 700;
  line-height: 1.4;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.common-image-preview__heading p {
  display: -webkit-box;
  margin: 6px 0 0;
  color: var(--text-secondary, #b5b8c4);
  font-size: 13px;
  line-height: 1.55;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.common-image-preview__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
}

.common-image-preview__button,
.common-image-preview__close {
  height: 34px;
  border: 1px solid var(--line-divider, #00000014);
  border-radius: 8px;
  background: var(--bg-block-secondary-default, #232733);
  color: var(--text-primary, #fff);
  cursor: pointer;
  font-size: 13px;
  text-decoration: none;
}

.common-image-preview__button {
  display: inline-flex;
  align-items: center;
  padding: 0 12px;
}

.common-image-preview__close {
  width: 34px;
  padding: 0;
  font-size: 20px;
  line-height: 1;
}

.common-image-preview__stage {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 360px;
  padding: 18px;
  overflow: auto;
  background: #080a0f;
}

.common-image-preview__stage img,
.common-image-preview__video {
  display: block;
  max-width: 100%;
  max-height: calc(100vh - 240px);
  object-fit: contain;
}

.common-image-preview__video {
  width: min(100%, 960px);
}

.common-image-preview__empty {
  color: var(--text-tertiary, #848895);
  font-size: 14px;
}

.common-image-preview__meta {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  padding: 12px 18px 16px;
  border-top: 1px solid var(--line-divider, #00000014);
}

.common-image-preview__meta div {
  min-width: 0;
  padding: 8px 10px;
  border-radius: 8px;
  background: var(--bg-block-secondary-default, #232733);
}

.common-image-preview__meta span,
.common-image-preview__meta strong {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.common-image-preview__meta span {
  color: var(--text-tertiary, #848895);
  font-size: 11px;
}

.common-image-preview__meta strong {
  margin-top: 4px;
  color: var(--text-primary, #fff);
  font-size: 13px;
  font-weight: 700;
}

@media (max-width: 768px) {
  .common-image-preview {
    padding: 12px;
  }

  .common-image-preview__header {
    flex-direction: column;
    align-items: stretch;
  }

  .common-image-preview__actions {
    justify-content: flex-end;
  }

  .common-image-preview__stage {
    min-height: 260px;
  }

  .common-image-preview__meta {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
