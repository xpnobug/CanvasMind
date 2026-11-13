<template>
  <AdminPageContainer
    class="admin-list-page"
    title="资源管理"
    description="统一管理全站资源与我的资源，支持按用户维度检索，并保留管理员批量发布、下架和删除能力。"
    compact
  >
    <AdminListFrame>
      <template #toolbar>
        <AdminListToolbar
          :disabled="loading || acting"
          :has-active-filters="hasActiveFilters"
          :facets="listFacets"
          @update:facet="handleFacetUpdate"
          @clear="resetFilters"
        >
          <input
            v-if="filters.scope === 'all'"
            v-model.trim="filters.ownerKeyword"
            class="admin-list-toolbar__input is-wide"
            type="text"
            placeholder="搜索用户 ID / 昵称 / 邮箱"
            :disabled="loading || acting"
            @keydown.enter="handleSearch"
          >
        </AdminListToolbar>
      </template>

      <template v-if="selectedIds.length > 0" #meta>
        <div class="admin-asset-bulk-bar has-selection">
          <div class="admin-asset-bulk-bar__meta">
            <span class="admin-asset-bulk-bar__count">
              已选 <strong>{{ selectedIds.length }}</strong>
            </span>
            <span class="admin-asset-bulk-bar__sep">
              已发布 {{ selectedPublishedCount }} · 待审 {{ selectedPendingCount }} · 草稿 {{ selectedDraftCount }}
            </span>
          </div>
          <div class="admin-asset-bulk-bar__actions">
            <button class="admin-inline-button" type="button" :disabled="acting || publishableSelectedIds.length === 0" @click="handleBatchAction('publish')">
              {{ actingAction === 'publish' ? '审核中...' : `通过 ${publishableSelectedIds.length}` }}
            </button>
            <button class="admin-inline-button" type="button" :disabled="acting || unpublishableSelectedIds.length === 0" @click="handleBatchAction('unpublish')">
              {{ actingAction === 'unpublish' ? '下架中...' : `下架 ${unpublishableSelectedIds.length}` }}
            </button>
            <button class="admin-inline-button admin-inline-button--danger" type="button" :disabled="acting" @click="handleBatchAction('delete')">
              {{ actingAction === 'delete' ? '删除中...' : `删除 ${selectedIds.length}` }}
            </button>
          </div>
        </div>
      </template>

      <AdminArtTable
        ref="artTableRef"
        :loading="loading"
        :data="assets"
        row-key="id"
        empty-text="当前筛选条件下还没有资源"
        @selection-change="handleTableSelectionChange"
      >
        <el-table-column type="selection" width="44" reserve-selection />
        <el-table-column label="资源" min-width="280">
          <template #default="{ row }">
            <div class="admin-asset-row">
              <button
                class="admin-asset-row__thumb"
                type="button"
                :disabled="acting || !(
                  (row.assetType === 'video' && resolveAssetVideoUrl(row))
                  || resolveAssetImagePreviewUrl(row)
                )"
                @click="openImagePreview(row)"
              >
                <video
                  v-if="row.assetType === 'video' && resolveAssetVideoUrl(row)"
                  :src="resolveAssetVideoUrl(row)"
                  :poster="resolveAssetVideoPosterUrl(row) || undefined"
                  class="admin-asset-row__media"
                  muted
                  playsinline
                  preload="metadata"
                />
                <img
                  v-else-if="resolveAssetImagePreviewUrl(row)"
                  :src="resolveAssetImagePreviewUrl(row)"
                  :alt="row.title || '资源预览'"
                  class="admin-asset-row__media"
                >
                <span v-else class="admin-asset-row__media admin-asset-row__media--empty">无预览</span>
                <span class="admin-asset-row__type">{{ row.assetType === 'video' ? '视频' : '图片' }}</span>
              </button>

              <div class="admin-asset-row__main">
                <div class="admin-asset-row__title-line">
                  <span class="admin-asset-row__title" :title="row.title || buildAssetFallbackTitle(row)">
                    {{ row.title || buildAssetFallbackTitle(row) }}
                  </span>
                  <span class="admin-asset-row__source">{{ getSourceLabel(row.source) }}</span>
                </div>
                <div class="admin-asset-row__meta" :title="buildAssetMetaTitle(row)">
                  <span>{{ row.owner.name || '创作者' }}</span>
                  <span v-if="row.owner.email" class="admin-asset-row__dot">{{ row.owner.email }}</span>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="108">
          <template #default="{ row }">
            <div class="admin-asset-status">
              <AdminStatusBadge category="assetPublishStatus" :value="getAssetDisplayStatus(row)" />
              <span class="admin-asset-status__sub">
                {{ getVisibilityLabel(row.visibility) }} · {{ getReviewStatusLabel(row.reviewStatus) }}
              </span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="规格" min-width="150">
          <template #default="{ row }">
            <div class="admin-asset-spec" :title="buildSpecTitle(row)">
              <div class="admin-asset-spec__primary">{{ formatSpecPrimary(row) }}</div>
              <div class="admin-asset-spec__secondary">{{ formatSpecSecondary(row) }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="互动" width="132">
          <template #default="{ row }">
            <div class="admin-asset-stats">
              <span>{{ formatCount(row.viewCount) }} 浏览</span>
              <span>{{ formatCount(row.favoriteCount) }} 赞</span>
              <span>{{ formatCount(row.downloadCount) }} 下载</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="148">
          <template #default="{ row }">
            <span class="admin-asset-time">{{ formatDate(row.createdAt) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <div class="admin-asset-ops">
              <button
                v-if="row.publishStatus !== 'published'"
                class="admin-asset-ops__btn"
                type="button"
                :disabled="acting"
                @click="handleSingleAction('publish', row.id)"
              >
                {{ row.reviewStatus === 'pending' ? '通过' : '发布' }}
              </button>
              <button
                v-else
                class="admin-asset-ops__btn"
                type="button"
                :disabled="acting"
                @click="handleSingleAction('unpublish', row.id)"
              >
                下架
              </button>
              <button
                class="admin-asset-ops__btn is-danger"
                type="button"
                :disabled="acting"
                @click="handleSingleAction('delete', row.id)"
              >
                删除
              </button>
            </div>
          </template>
        </el-table-column>
      </AdminArtTable>

      <template #pagination>
        <AdminPagination
          v-model:page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="assetSummary.totalCount"
          :disabled="loading || acting"
          @change="handlePaginationChange"
        />
      </template>
    </AdminListFrame>

    <CommonImagePreview
      v-model:visible="imagePreview.visible"
      :src="imagePreview.src"
      :asset-id="imagePreview.assetId"
      :poster="imagePreview.poster"
      :media-type="imagePreview.mediaType"
      :aspect-ratio="imagePreview.aspectRatio"
      :title="imagePreview.title"
      :description="imagePreview.description"
      :download-name="imagePreview.downloadName"
      :meta="imagePreview.meta"
      @downloaded="handlePreviewDownloaded"
    />
  </AdminPageContainer>
</template>

<script setup lang="ts">
defineOptions({ name: 'AdminAssets' })
import './admin-assets.css'
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import AdminListFrame from '@/components/admin/common/AdminListFrame.vue'
import AdminListToolbar from '@/components/admin/common/AdminListToolbar.vue'
import AdminPagination from '@/components/admin/common/AdminPagination.vue'
import AdminStatusBadge from '@/components/admin/common/AdminStatusBadge.vue'
import AdminArtTable from '@/components/admin/table/AdminArtTable.vue'
import CommonImagePreview from '@/components/common/CommonImagePreview.vue'
import AdminPageContainer from '@/components/admin/layout/AdminPageContainer.vue'
import { useAdminList } from '@/composables/admin/useAdminList'
import { useAdminListFilters } from '@/composables/useAdminListFilters'
import { resolveAdminDictionaryItem } from '@/config/adminDictionaries'
import {
  applyAssetAction,
  listAdminAssetItems,
  type AssetActionType,
  type AssetKind,
  type AssetPublishState,
  type AssetScope,
  type PersistedAssetItem,
} from '@/api/asset-items'
import type { CommonImagePreviewMediaType } from '@/components/common/CommonImagePreview.vue'
import {
  isVideoFileUrl,
  resolveAssetImagePreviewUrl,
  resolveAssetVideoPosterUrl,
  resolveAssetVideoUrl,
} from '@/shared/asset-preview-url'

const acting = ref(false)
const actingAction = ref<AssetActionType | ''>('')
const artTableRef = ref<InstanceType<typeof AdminArtTable> | null>(null)
const imagePreview = reactive<{
  visible: boolean
  assetId: string
  src: string
  poster: string
  mediaType: CommonImagePreviewMediaType
  aspectRatio: string
  title: string
  description: string
  downloadName: string
  meta: Array<{ label: string; value: string | number }>
}>({
  visible: false,
  assetId: '',
  src: '',
  poster: '',
  mediaType: 'image',
  aspectRatio: '16:9',
  title: '',
  description: '',
  downloadName: '',
  meta: [],
})

const filters = reactive<{
  scope: Extract<AssetScope, 'mine' | 'all'>
  assetType: AssetKind
  publishState: AssetPublishState
  ownerKeyword: string
}>({
  scope: 'all',
  assetType: 'image',
  publishState: 'all',
  ownerKeyword: '',
})
const filterDefaults = {
  scope: 'all' as Extract<AssetScope, 'mine' | 'all'>,
  assetType: 'image' as AssetKind,
  publishState: 'all' as AssetPublishState,
  ownerKeyword: '',
}
const { resetFilters: resetFilterValues } = useAdminListFilters({
  filters,
  defaults: filterDefaults,
})
const {
  loading,
  items: assets,
  pagination,
  selectedMap,
  selectedIds,
  selectedItems: selectedAssets,
  loadList: loadAssetList,
  resetAndLoad,
  handlePaginationChange,
} = useAdminList<PersistedAssetItem>({
  initialPageSize: 20,
  fetcher: ({ page, pageSize }) => listAdminAssetItems({
    scope: filters.scope,
    assetType: filters.assetType,
    publishState: filters.publishState,
    page,
    pageSize,
    ownerKeyword: filters.scope === 'all' ? filters.ownerKeyword : '',
  }),
})

const typeOptions: Array<{ label: string; value: AssetKind }> = [
  { label: '图片资源', value: 'image' },
  { label: '视频资源', value: 'video' },
]

const scopeOptions: Array<{ label: string; value: Extract<AssetScope, 'mine' | 'all'> }> = [
  { label: '全站资源', value: 'all' },
  { label: '我的资源', value: 'mine' },
]

const publishStateFacetOptions = [
  { label: resolveAdminDictionaryItem('assetPublishStatus', 'published').label, value: 'published' },
  { label: resolveAdminDictionaryItem('assetPublishStatus', 'pending').label, value: 'pending' },
  { label: resolveAdminDictionaryItem('assetPublishStatus', 'draft').label, value: 'draft' },
]

const listFacets = computed(() => [
  {
    key: 'scope',
    title: '资源范围',
    options: scopeOptions,
    modelValue: filters.scope,
    emptyValue: 'all',
  },
  {
    key: 'assetType',
    title: '资源类型',
    options: typeOptions,
    modelValue: filters.assetType,
    emptyValue: 'image',
  },
  {
    key: 'publishState',
    title: '发布状态',
    options: publishStateFacetOptions,
    modelValue: filters.publishState,
    emptyValue: 'all',
  },
])

const hasActiveFilters = computed(() => (
  Boolean(filters.ownerKeyword?.trim())
  || filters.scope !== 'all'
  || filters.assetType !== 'image'
  || filters.publishState !== 'all'
))

const assetSummary = computed(() => ({
  totalCount: pagination.total,
  totalPages: pagination.totalPages,
  page: pagination.page,
  pageSize: pagination.pageSize,
}))
const selectedPublishedCount = computed(() => selectedAssets.value.filter((item) => item.publishStatus === 'published').length)
const selectedDraftCount = computed(() => selectedAssets.value.filter((item) => item.publishStatus !== 'published' && item.reviewStatus !== 'pending').length)
const selectedPendingCount = computed(() => selectedAssets.value.filter((item) => item.reviewStatus === 'pending').length)
const publishableSelectedIds = computed(() => selectedAssets.value.filter((item) => item.publishStatus !== 'published').map((item) => item.id))
const unpublishableSelectedIds = computed(() => selectedAssets.value.filter((item) => item.publishStatus === 'published').map((item) => item.id))

const handleSearch = () => {
  void resetAndLoad()
}

const resetFilters = () => {
  resetFilterValues()
  void resetAndLoad()
}

const setScope = (scope: Extract<AssetScope, 'mine' | 'all'>) => {
  if (filters.scope === scope) {
    return
  }

  filters.scope = scope
  if (scope !== 'all') {
    filters.ownerKeyword = ''
  }
  void resetAndLoad()
}

const setAssetType = (assetType: AssetKind) => {
  if (filters.assetType === assetType) {
    return
  }
  filters.assetType = assetType
  void resetAndLoad()
}

const setPublishState = (publishState: AssetPublishState) => {
  if (filters.publishState === publishState) {
    return
  }
  filters.publishState = publishState
  void resetAndLoad()
}

const handleFacetUpdate = ({ key, value }: { key: string; value: string }) => {
  if (key === 'scope') {
    setScope((value || 'all') as Extract<AssetScope, 'mine' | 'all'>)
    return
  }
  if (key === 'assetType') {
    setAssetType((value || 'image') as AssetKind)
    return
  }
  if (key === 'publishState') {
    setPublishState((value || 'all') as AssetPublishState)
  }
}

const handleTableSelectionChange = (rows: PersistedAssetItem[]) => {
  const selectedSet = new Set(rows.map((row) => row.id))
  const nextMap = { ...selectedMap.value }

  assets.value.forEach((item) => {
    if (selectedSet.has(item.id)) {
      nextMap[item.id] = true
    } else {
      delete nextMap[item.id]
    }
  })

  selectedMap.value = nextMap
}

const loadAssets = async () => {
  await loadAssetList()
  artTableRef.value?.clearSelection()
}

const resolveActionableIds = (action: Extract<AssetActionType, 'publish' | 'unpublish' | 'delete'>) => {
  if (action === 'publish') {
    return publishableSelectedIds.value
  }
  if (action === 'unpublish') {
    return unpublishableSelectedIds.value
  }
  return selectedIds.value
}

// 统一执行资源动作，避免单项和批量操作维护两套逻辑。
const runAssetAction = async (action: AssetActionType, ids: string[]) => {
  if (!ids.length) {
    return
  }

  acting.value = true
  actingAction.value = action
  try {
    await applyAssetAction(action, ids, filters.scope, {
      showSuccessMessage: true,
      showErrorMessage: true,
      successMessage: `资源${action === 'delete' ? '删除' : action === 'publish' ? '审核发布' : '下架'}成功`,
    })
    await loadAssets()
  } finally {
    acting.value = false
    actingAction.value = ''
  }
}

const handleBatchAction = async (action: Extract<AssetActionType, 'publish' | 'unpublish' | 'delete'>) => {
  const actionableIds = resolveActionableIds(action)
  if (!actionableIds.length) {
    ElMessage.warning(action === 'publish' ? '当前所选资源里没有可发布项。' : action === 'unpublish' ? '当前所选资源里没有可下架项。' : '请先选择要删除的资源。')
    return
  }

  if (actionableIds.length < selectedIds.value.length) {
    ElMessage.info(`已自动跳过 ${selectedIds.value.length - actionableIds.length} 条不可执行资源。`)
  }

  await runAssetAction(action, actionableIds)
}

const handleSingleAction = async (action: Extract<AssetActionType, 'publish' | 'unpublish' | 'delete'>, id: string) => {
  await runAssetAction(action, [id])
}

const resolveAssetPreviewRawUrl = (item: PersistedAssetItem) => {
  if (item.assetType === 'video') {
    return item.fileUrl || item.previewUrl || item.coverUrl || item.thumbnailUrl
  }
  return item.thumbnailUrl || item.coverUrl || item.previewUrl || item.fileUrl
}

const resolveAssetPreviewPosterRawUrl = (item: PersistedAssetItem) => {
  const candidates = [item.thumbnailUrl, item.coverUrl, item.previewUrl]
  for (const raw of candidates) {
    const value = String(raw || '').trim()
    if (value && !isVideoFileUrl(value)) {
      return value
    }
  }
  return ''
}

const openImagePreview = (item: PersistedAssetItem) => {
  const isVideo = item.assetType === 'video'
  imagePreview.assetId = item.id
  imagePreview.mediaType = isVideo ? 'video' : 'image'
  imagePreview.src = resolveAssetPreviewRawUrl(item)
  imagePreview.poster = isVideo ? resolveAssetPreviewPosterRawUrl(item) : ''
  imagePreview.aspectRatio = item.aspectRatio || (isVideo ? '16:9' : '1:1')
  imagePreview.title = item.title || buildAssetFallbackTitle(item)
  imagePreview.description = item.promptText || item.description || ''
  imagePreview.downloadName = `${item.id}.${isVideo ? 'mp4' : 'png'}`
  imagePreview.meta = [
    { label: '类型', value: isVideo ? '视频' : '图片' },
    { label: '尺寸', value: formatDimensions(item) || '未记录' },
    { label: '大小', value: formatFileSize(item.fileSizeBytes) || '未记录' },
    { label: '模型', value: item.modelLabel || '未记录' },
    { label: isVideo ? '时长' : '比例', value: isVideo ? (formatDuration(item.durationSeconds) || '未记录') : (item.aspectRatio || '未记录') },
    { label: '来源', value: getSourceLabel(item.source) },
    { label: '发布', value: getAssetDisplayStatus(item) === 'published' ? '已发布' : getAssetDisplayStatus(item) === 'pending' ? '待审核' : '草稿' },
    { label: '审核', value: getReviewStatusLabel(item.reviewStatus) },
  ]
  imagePreview.visible = true
}

const handlePreviewDownloaded = async () => {
  if (!imagePreview.assetId) {
    return
  }

  await loadAssets()
}

const formatDate = (value?: string) => {
  if (!value) {
    return '未知时间'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

const buildAssetFallbackTitle = (item: PersistedAssetItem) => {
  return `${item.assetType === 'video' ? '视频' : '图片'}资源`
}

const buildAssetMetaTitle = (item: PersistedAssetItem) => {
  const parts = [
    item.owner.name || '创作者',
    item.owner.email || '',
    item.id,
    item.promptText || item.description || '',
  ].filter(Boolean)
  return parts.join('\n')
}

const formatDimensions = (item: PersistedAssetItem) => {
  if (!item.width || !item.height) {
    return ''
  }
  return `${item.width}×${item.height}`
}

const formatDuration = (value?: number) => {
  const totalSeconds = Math.max(0, Number(value || 0))
  if (!totalSeconds) {
    return ''
  }
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`
}

const formatFileSize = (value?: number) => {
  const size = Number(value || 0)
  if (!Number.isFinite(size) || size <= 0) {
    return ''
  }
  const units = ['B', 'KB', 'MB', 'GB']
  let currentSize = size
  let unitIndex = 0
  while (currentSize >= 1024 && unitIndex < units.length - 1) {
    currentSize /= 1024
    unitIndex += 1
  }
  return `${currentSize >= 10 || unitIndex === 0 ? currentSize.toFixed(0) : currentSize.toFixed(1)} ${units[unitIndex]}`
}

/** 规格主行：尺寸/比例/时长；缺省用 — */
const formatSpecPrimary = (item: PersistedAssetItem) => {
  const parts = [
    formatDimensions(item) || '—',
    item.assetType === 'video'
      ? (formatDuration(item.durationSeconds) || '—')
      : (item.aspectRatio || '—'),
  ]
  return parts.join(' · ')
}

/** 规格次行：强制展示模型；有文件大小则前置 */
const formatSpecSecondary = (item: PersistedAssetItem) => {
  const model = item.modelLabel?.trim() || '未记录'
  const size = formatFileSize(item.fileSizeBytes)
  return size ? `${size} · 模型 ${model}` : `模型 ${model}`
}

const buildSpecTitle = (item: PersistedAssetItem) => {
  return [
    `尺寸 ${formatDimensions(item) || '未记录'}`,
    item.assetType === 'video'
      ? `时长 ${formatDuration(item.durationSeconds) || '未记录'}`
      : `比例 ${item.aspectRatio || '未记录'}`,
    formatFileSize(item.fileSizeBytes) && `大小 ${formatFileSize(item.fileSizeBytes)}`,
    `模型 ${item.modelLabel?.trim() || '未记录'}`,
  ].filter(Boolean).join('\n')
}

const formatCount = (value?: number) => {
  const count = Math.max(0, Math.floor(Number(value || 0)))
  if (!Number.isFinite(count)) {
    return '0'
  }
  return count.toLocaleString('zh-CN')
}

const getVisibilityLabel = (value?: string) => {
  const normalizedValue = String(value || '').toLowerCase()
  if (normalizedValue === 'public') return '公开'
  if (normalizedValue === 'private') return '私有'
  return normalizedValue || '未知'
}

const getReviewStatusLabel = (value?: string) => {
  const normalizedValue = String(value || '').toLowerCase()
  if (normalizedValue === 'approved') return '已通过'
  if (normalizedValue === 'pending') return '待审核'
  if (normalizedValue === 'rejected') return '已拒绝'
  return normalizedValue || '未知'
}

const getAssetDisplayStatus = (item: PersistedAssetItem) => {
  return item.reviewStatus === 'pending' ? 'pending' : item.publishStatus
}

const getSourceLabel = (value?: string) => {
  const normalizedValue = String(value || '').toLowerCase()
  if (normalizedValue === 'generated') return '生成'
  if (normalizedValue === 'uploaded') return '上传'
  if (normalizedValue === 'imported') return '导入'
  return normalizedValue || '来源未知'
}

onMounted(() => {
  void loadAssets()
})
</script>
