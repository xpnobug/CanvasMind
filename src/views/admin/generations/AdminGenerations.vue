<template>
  <AdminPageContainer
    class="admin-list-page"
    compact title="生成记录" description="先打通生成记录后台列表、状态筛选、结果预览和错误排查，便于定位线上生成链路问题。">
    <template #actions>
      <button class="admin-button admin-button--secondary" type="button" @click="loadRecords" :disabled="loading">
        {{ loading ? '刷新中...' : '刷新列表' }}
      </button>
    </template>

    <div class="admin-grid admin-grid--stats">
      <AdminStatCard label="记录总数" :value="pagination.total" hint="当前筛选条件命中的全站记录数" />
      <AdminStatCard label="当前页" :value="records.length" hint="当前页加载的生成记录数" />
      <AdminStatCard label="成功完成" :value="completedCount" hint="当前页已完成且无错误的记录数" />
      <AdminStatCard label="失败记录" :value="failedCount" hint="当前页优先用于排查厂商、落盘和入库问题" />
    </div>

    <AdminListFrame>
      <template #toolbar>
        <AdminListToolbar
          :disabled="loading"
          :has-active-filters="activeFilterCount > 0"
          :facets="listFacets"
          @update:facet="handleFacetUpdate"
          @clear="clearFilters"
        >
          <template #actions>
            <span class="admin-skill-toolbar__summary">共 {{ pagination.total }} 条记录</span>
          </template>
        </AdminListToolbar>
      </template>

      <AdminEmptyState v-if="loading && !records.length" message="正在加载生成记录..." :illustrated="false" compact />
      <AdminEmptyState v-else-if="!records.length" message="当前筛选条件下还没有生成记录。" />
      <div v-else class="admin-generation-list">
          <div v-for="record in records" :key="record.id" class="admin-generation-card">
            <div class="admin-generation-card__preview">
              <img
                v-if="getPreviewUrl(record)"
                :src="getPreviewUrl(record) || ''"
                :alt="record.prompt || '生成结果预览'"
                class="admin-generation-card__image"
              >
              <div v-else class="admin-generation-card__image admin-generation-card__image--empty">
                无结果预览
              </div>
            </div>

            <div class="admin-generation-card__body">
              <div class="admin-generation-card__head">
                <div>
                  <div class="admin-generation-card__title">{{ buildRecordTitle(record) }}</div>
                  <div class="admin-generation-card__meta">
                    用户：{{ record.user?.name || record.user?.email || record.user?.phone || '未知用户' }} · 类型：{{ record.type || 'unknown' }} · 创建于 {{ formatDate(record.createdAt) }}
                  </div>
                </div>
                <div class="admin-generation-card__tags">
                  <AdminStatusBadge category="generationStatus" :value="getRecordStatus(record)" />
                  <span class="admin-chip">模型：{{ record.model || record.modelKey || '未记录' }}</span>
                </div>
              </div>

              <div class="admin-generation-card__prompt">
                {{ record.prompt || '暂无提示词' }}
              </div>

              <div class="admin-generation-card__stats">
                <span>比例：{{ record.ratio || '未记录' }}</span>
                <span>分辨率：{{ record.resolution || '未记录' }}</span>
                <span>功能：{{ record.feature || '未记录' }}</span>
                <span>技能：{{ record.skill || '未记录' }}</span>
                <span>输出数：{{ record.outputs.length || record.images.length }}</span>
              </div>

              <div v-if="record.error" class="admin-generation-card__error">
                <strong>错误信息：</strong>{{ formatGenerationError(record.error, '任务执行失败') }}
              </div>

              <div v-else-if="record.content && record.type === 'agent'" class="admin-generation-card__content-preview">
                <strong>文本结果：</strong>{{ record.content }}
              </div>

              <div class="admin-generation-card__footer">
                <div class="admin-generation-card__meta">
                  任务 ID：{{ record.agentTaskId || '未记录' }}
                </div>
                <div class="admin-generation-card__meta">
                  {{ buildOutputSummary(record) }}
                </div>
              </div>
            </div>
          </div>
      </div>

      <template #pagination>
        <AdminPagination
          v-model:page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :disabled="loading"
          @change="handlePaginationChange"
        />
      </template>
    </AdminListFrame>
  </AdminPageContainer>
</template>

<script setup lang="ts">
import './admin-generations.css'
import { computed, onMounted, reactive } from 'vue'
import AdminEmptyState from '@/components/admin/common/AdminEmptyState.vue'
import AdminListFrame from '@/components/admin/common/AdminListFrame.vue'
import AdminListToolbar, { type AdminListToolbarFacet } from '@/components/admin/common/AdminListToolbar.vue'
import AdminPagination from '@/components/admin/common/AdminPagination.vue'
import AdminStatCard from '@/components/admin/common/AdminStatCard.vue'
import AdminStatusBadge from '@/components/admin/common/AdminStatusBadge.vue'
import AdminPageContainer from '@/components/admin/layout/AdminPageContainer.vue'
import { useAdminList } from '@/composables/admin/useAdminList'
import { resolveAdminDictionaryItem } from '@/config/adminDictionaries'
import {
  listAdminGenerationRecords,
  type AdminGenerationRecordItem,
  type AdminGenerationRecordStatusFilter,
  type AdminGenerationRecordTypeFilter,
} from '@/api/admin-generation-records'
import { normalizeGenerationErrorMessage } from '@/shared/generation-error'

type GenerationStatusFilter = AdminGenerationRecordStatusFilter
type GenerationTypeFilter = AdminGenerationRecordTypeFilter

const formatGenerationError = (message?: string | null, fallback = '任务执行失败') => {
  return normalizeGenerationErrorMessage(String(message || '').trim(), fallback)
}

const filters = reactive<{
  type: GenerationTypeFilter
  status: GenerationStatusFilter
}>({
  type: 'all',
  status: 'all',
})

const {
  loading,
  items: records,
  pagination,
  loadList: loadRecords,
  resetAndLoad,
  handlePaginationChange,
} = useAdminList<AdminGenerationRecordItem>({
  initialPageSize: 10,
  fetcher: ({ page, pageSize }) => listAdminGenerationRecords({
    type: filters.type,
    status: filters.status,
    page,
    pageSize,
  }),
})

const typeOptions: Array<{ label: string; value: GenerationTypeFilter }> = [
  { label: '全部类型', value: 'all' },
  { label: '图片', value: 'image' },
  { label: '视频', value: 'video' },
  { label: '智能体', value: 'agent' },
  { label: '深度研究', value: 'research' },
  { label: '数字人', value: 'digital-human' },
  { label: '动态内容', value: 'motion' },
]

const statusOptions: Array<{ label: string; value: GenerationStatusFilter }> = [
  { label: '全部状态', value: 'all' },
  { label: resolveAdminDictionaryItem('generationStatus', 'completed').label, value: 'completed' },
  { label: resolveAdminDictionaryItem('generationStatus', 'failed').label, value: 'failed' },
  { label: resolveAdminDictionaryItem('generationStatus', 'running').label, value: 'running' },
]

const listFacets = computed<AdminListToolbarFacet[]>(() => [
  {
    key: 'type',
    title: '类型',
    options: typeOptions.filter((item) => item.value !== 'all').map((item) => ({
      label: item.label,
      value: item.value,
    })),
    modelValue: filters.type,
    emptyValue: 'all',
  },
  {
    key: 'status',
    title: '状态',
    options: statusOptions.filter((item) => item.value !== 'all').map((item) => ({
      label: item.label,
      value: item.value,
    })),
    modelValue: filters.status,
    emptyValue: 'all',
  },
])

const getRecordStatus = (record: AdminGenerationRecordItem): GenerationStatusFilter => {
  if (record.error) {
    return 'failed'
  }

  if (record.done) {
    return 'completed'
  }

  return 'running'
}

const completedCount = computed(() => records.value.filter((record) => getRecordStatus(record) === 'completed').length)
const failedCount = computed(() => records.value.filter((record) => getRecordStatus(record) === 'failed').length)
const activeFilterCount = computed(() => {
  return [
    filters.type !== 'all',
    filters.status !== 'all',
  ].filter(Boolean).length
})

const handleFacetUpdate = ({ key, value }: { key: string; value: string }) => {
  if (key === 'type') {
    filters.type = value as GenerationTypeFilter
    void resetAndLoad()
    return
  }
  if (key === 'status') {
    filters.status = value as GenerationStatusFilter
    void resetAndLoad()
  }
}

const clearFilters = () => {
  filters.type = 'all'
  filters.status = 'all'
  void resetAndLoad()
}

const getPreviewUrl = (record: AdminGenerationRecordItem) => {
  const imageOutput = record.outputs.find((output) => output.outputType === 'image' && output.url)
  if (imageOutput?.url) {
    return imageOutput.url
  }

  const videoOutput = record.outputs.find((output) => output.outputType === 'video' && output.url)
  if (videoOutput?.url) {
    return videoOutput.url
  }

  return record.images[0] || ''
}

const buildRecordTitle = (record: AdminGenerationRecordItem) => {
  if (record.model) {
    return `${record.model} 生成记录`
  }

  if (record.modelKey) {
    return `${record.modelKey} 生成记录`
  }

  return '生成记录'
}

const buildOutputSummary = (record: AdminGenerationRecordItem) => {
  const outputTypes = record.outputs.map((output) => output.outputType)
  if (outputTypes.length) {
    return `输出类型：${outputTypes.join(' / ')}`
  }

  if (record.images.length) {
    return `图片结果：${record.images.length} 张`
  }

  return '暂无输出结果'
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

onMounted(() => {
  void loadRecords()
})
</script>
