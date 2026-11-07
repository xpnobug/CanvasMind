<template>
  <FrontstagePageShell main-container-id="dreamina-ui-configuration-content-wrapper">
    <div class="scroll-container-Jsws2j scroll-container-QnV2C9">
      <div>
        <div class="scroll-content-DaYLnh scroll-content">
          <div class="home-content-shell">
            <div class="section-generator">
              <!-- 顶通已由 FrontstagePageShell 挂载，Header 内不再重复渲染 -->
              <HomeHeader :render-top-banner="false" />
            </div>

            <!-- Tabs 区域 -->
            <TabsSection
              @tab-change="handleTabChange"
              @search="handleSearch"
              @open-work-detail="handleOpenWorkDetail"
            />
          </div>
        </div>
      </div>
    </div>

    <template #after>
      <HomeDetailModalFrom
        v-model="workDetailOpen"
        :image-src="workDetailImageSrc"
        :owner-id="workDetailOwnerId"
        :prompt-text="workDetailPromptText"
        :author-name="workDetailAuthorName"
        :author-avatar-src="workDetailAuthorAvatarSrc"
        :like-count="workDetailLikeCount"
        :create-date="workDetailCreateDate"
        :ai-generated-text="workDetailAiGeneratedText"
        :prompt-tip-label="workDetailPromptTipLabel"
        :model-label="workDetailModelLabel"
        :aspect-ratio-label="workDetailAspectRatioLabel"
        :gallery-length="workDetailGallery.length"
        @gallery-nav="handleGalleryNav"
        @favorite="handleWorkDetailFavorite"
        @delete="handleWorkDetailDelete"
        @report="handleWorkDetailReport"
      />
    </template>
  </FrontstagePageShell>
</template>

<script setup>
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, defineAsyncComponent, ref, watch } from 'vue'
import FrontstagePageShell from '@/components/layout/FrontstagePageShell.vue'
import HomeHeader from '../../components/home/components/HomeHeader.vue'
import TabsSection from '@components/home/components/TabsSection.vue'
// 作品详情弹窗：用户点开作品时才需要，首屏不下载（节省 21KB JS + 74KB CSS）
const HomeDetailModalFrom = defineAsyncComponent(() => import('@components/home/components/HomeDetailModalFrom.vue'))
import HomeFooter from '@components/home/components/HomeFooter.vue'
import { applyAssetAction } from '@/api/asset-items'

const handleTabChange = (index) => {
  console.log('Tab changed to:', index)
}

const handleSearch = (searchText) => {
  console.log('Search:', searchText)
}

const workDetailOpen = ref(false)
/** @type {import('vue').Ref<Array<{ id?: string, imageSrc: string, promptText?: string, user?: { name?: string, avatarSrc?: string }, favoriteCount?: number|string, detail?: { createDate?: string, aiGeneratedText?: string, promptTipLabel?: string, modelLabel?: string, aspectRatioLabel?: string } }>>} */
const workDetailGallery = ref([])
const workDetailGalleryIndex = ref(0)
const viewedAssetIds = new Set()

const workDetailImageSrc = computed(() => {
  const g = workDetailGallery.value
  const i = workDetailGalleryIndex.value
  return g[i]?.imageSrc ?? ''
})

/** 空字符串视为未传，弹层用内置模拟提示词 */
const workDetailPromptText = computed(() => {
  const g = workDetailGallery.value
  const i = workDetailGalleryIndex.value
  const t = g[i]?.promptText
  if (t === undefined || t === '') return undefined
  return t
})

const workDetailAuthorName = computed(() => {
  const g = workDetailGallery.value
  const i = workDetailGalleryIndex.value
  return g[i]?.user?.name || '创作者'
})

const workDetailAuthorAvatarSrc = computed(() => {
  const g = workDetailGallery.value
  const i = workDetailGalleryIndex.value
  return g[i]?.user?.avatarSrc || ''
})

const workDetailOwnerId = computed(() => {
  const g = workDetailGallery.value
  const i = workDetailGalleryIndex.value
  return g[i]?.user?.id || ''
})

const workDetailLikeCount = computed(() => {
  const g = workDetailGallery.value
  const i = workDetailGalleryIndex.value
  return g[i]?.favoriteCount ?? 999
})

const currentWorkDetailAssetId = computed(() => {
  const g = workDetailGallery.value
  const i = workDetailGalleryIndex.value
  return g[i]?.id || ''
})

const workDetailCreateDate = computed(() => {
  const g = workDetailGallery.value
  const i = workDetailGalleryIndex.value
  return g[i]?.detail?.createDate || '2026-04-16'
})

const workDetailAiGeneratedText = computed(() => {
  const g = workDetailGallery.value
  const i = workDetailGalleryIndex.value
  return g[i]?.detail?.aiGeneratedText || '内容由 AI 生成'
})

const workDetailPromptTipLabel = computed(() => {
  const g = workDetailGallery.value
  const i = workDetailGalleryIndex.value
  return g[i]?.detail?.promptTipLabel || '图片提示词'
})

const workDetailModelLabel = computed(() => {
  const g = workDetailGallery.value
  const i = workDetailGalleryIndex.value
  return g[i]?.detail?.modelLabel || '图片 4.1'
})

const workDetailAspectRatioLabel = computed(() => {
  const g = workDetailGallery.value
  const i = workDetailGalleryIndex.value
  return g[i]?.detail?.aspectRatioLabel || '9:16'
})

/**
 * 发现页点击图片/轮播：可带整组画廊以便弹层内上下切换
 * @param {{
 *   gallery: Array<{ imageSrc: string, promptText?: string, user?: { name?: string, avatarSrc?: string }, favoriteCount?: number|string, detail?: { createDate?: string, aiGeneratedText?: string, promptTipLabel?: string, modelLabel?: string, aspectRatioLabel?: string } }>
 *   index: number
 * } | { imageSrc: string, promptText?: string, user?: { name?: string, avatarSrc?: string }, favoriteCount?: number|string, detail?: { createDate?: string, aiGeneratedText?: string, promptTipLabel?: string, modelLabel?: string, aspectRatioLabel?: string } }} payload
 */
function handleOpenWorkDetail(payload) {
  if ('gallery' in payload && Array.isArray(payload.gallery) && payload.gallery.length > 0) {
    workDetailGallery.value = payload.gallery
    const ix = payload.index ?? 0
    workDetailGalleryIndex.value = Math.min(Math.max(0, ix), payload.gallery.length - 1)
  } else {
    workDetailGallery.value = [{
      id: payload.id,
      imageSrc: payload.imageSrc,
      promptText: payload.promptText,
      user: payload.user,
      favoriteCount: payload.favoriteCount,
      detail: payload.detail,
    }]
    workDetailGalleryIndex.value = 0
  }
  viewedAssetIds.clear()
  workDetailOpen.value = true
}

/** @param {number} delta -1 上一张，1 下一张（循环） */
function handleGalleryNav(delta) {
  const n = workDetailGallery.value.length
  if (n <= 1) return
  workDetailGalleryIndex.value = (workDetailGalleryIndex.value + delta + n) % n
}

async function trackWorkDetailView() {
  const assetId = currentWorkDetailAssetId.value
  if (!assetId || viewedAssetIds.has(assetId)) return

  viewedAssetIds.add(assetId)

  try {
    await applyAssetAction('view', [assetId])
  } catch (error) {
    console.warn('记录作品浏览失败', error)
  }
}

async function handleWorkDetailFavorite() {
  const assetId = currentWorkDetailAssetId.value
  if (!assetId) return

  const index = workDetailGalleryIndex.value
  const current = workDetailGallery.value[index]
  const currentCount = Number(current?.favoriteCount || 0) || 0

  if (current) {
    workDetailGallery.value[index] = {
      ...current,
      favoriteCount: currentCount + 1,
    }
  }

  try {
    await applyAssetAction('favorite', [assetId])
  } catch (error) {
    if (current) {
      workDetailGallery.value[index] = {
        ...current,
        favoriteCount: currentCount,
      }
    }
    console.warn('收藏作品失败', error)
  }
}

function removeCurrentWorkDetailItem() {
  const currentIndex = workDetailGalleryIndex.value
  const currentItem = workDetailGallery.value[currentIndex]
  if (!currentItem) return ''

  workDetailGallery.value = workDetailGallery.value.filter((_, index) => index !== currentIndex)
  if (!workDetailGallery.value.length) {
    workDetailOpen.value = false
    workDetailGalleryIndex.value = 0
  } else if (currentIndex >= workDetailGallery.value.length) {
    workDetailGalleryIndex.value = workDetailGallery.value.length - 1
  }

  return currentItem.id || ''
}

async function handleWorkDetailDelete() {
  const assetId = currentWorkDetailAssetId.value
  if (!assetId) return

  try {
    await ElMessageBox.confirm('确定删除这条作品吗？删除后将无法恢复。', '删除确认', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
  } catch {
    return
  }

  await applyAssetAction('delete', [assetId])
  const deletedAssetId = removeCurrentWorkDetailItem()
  if (deletedAssetId) {
    document.dispatchEvent(new CustomEvent('asset-item-deleted', {
      detail: {
        id: deletedAssetId,
      },
    }))
  }
  ElMessage.success('作品已删除')
}

function handleWorkDetailReport() {
  ElMessage.success('举报已提交，我们会尽快处理')
}

watch(
  [workDetailOpen, currentWorkDetailAssetId],
  ([open]) => {
    if (!open) return
    void trackWorkDetailView()
  },
)
</script>

<style scoped>
.home-content-shell {
  --home-shell-pad-inline-start: 10px;
  --home-shell-pad-inline-end: 10px;
  box-sizing: border-box;
  padding-inline: var(--home-shell-pad-inline-start) var(--home-shell-pad-inline-end);
}

/* sticky Tabs 头突破 shell 左右 padding，避免毛玻璃两侧硬边 */
.home-content-shell :deep(.section-tab-maWQnS .lv-tabs-header-nav) {
  margin-inline:
    calc(-1 * var(--home-shell-pad-inline-start))
    calc(-1 * var(--home-shell-pad-inline-end));
  padding-inline:
    var(--home-shell-pad-inline-start)
    var(--home-shell-pad-inline-end);
}

@media (min-width: 1280px) {
  .home-content-shell {
    --home-shell-pad-inline-start: 40px;
    --home-shell-pad-inline-end: 44px;
    padding: 0 var(--home-shell-pad-inline-end) 0 var(--home-shell-pad-inline-start);
  }
}
</style>
