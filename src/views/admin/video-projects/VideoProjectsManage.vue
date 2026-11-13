<template>
  <AdminPageContainer
    class="admin-list-page"
    title="视频项目"
    description="查看与管理用户的视频编辑器工程。"
    compact
  >
    <AdminListFrame>
      <template #toolbar>
        <AdminListToolbar
          :disabled="loading || acting"
          :has-active-filters="hasActiveFilters"
          @clear="resetFilters"
        >
          <input
            v-model.trim="keyword"
            class="admin-list-toolbar__input is-wide"
            type="text"
            placeholder="搜索项目名"
            :disabled="loading || acting"
            @keydown.enter="handleSearch"
          >
        </AdminListToolbar>
      </template>

      <AdminArtTable
        :loading="loading"
        :data="items"
        row-key="id"
        empty-text="当前筛选条件下还没有视频项目"
      >
        <el-table-column label="项目" min-width="280">
          <template #default="{ row }">
            <div class="admin-vp-row">
              <div class="admin-vp-row__thumb">
                <img
                  v-if="resolveThumb(row)"
                  :src="resolveThumb(row)"
                  :alt="row.metadata.name || '项目封面'"
                  class="admin-vp-row__media"
                >
                <span v-else class="admin-vp-row__media admin-vp-row__media--empty">无封面</span>
              </div>
              <div class="admin-vp-row__main">
                <div class="admin-vp-row__title" :title="row.metadata.name || '未命名项目'">
                  {{ row.metadata.name || '未命名项目' }}
                </div>
                <div class="admin-vp-row__id">{{ row.id }}</div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="所属用户" min-width="180">
          <template #default="{ row }">
            <div v-if="row.owner" class="admin-vp-owner">
              <div class="admin-vp-owner__name">{{ row.owner.name || '未命名用户' }}</div>
              <div v-if="row.owner.email" class="admin-vp-owner__email">{{ row.owner.email }}</div>
            </div>
            <span v-else class="admin-vp-muted">—</span>
          </template>
        </el-table-column>

        <el-table-column label="时长" width="88">
          <template #default="{ row }">
            <span class="admin-vp-mono">{{ formatDuration(row.metadata.duration ?? row.durationSeconds) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="版本" width="72">
          <template #default="{ row }">
            <span class="admin-vp-mono">v{{ row.version }}</span>
          </template>
        </el-table-column>

        <el-table-column label="更新时间" width="148">
          <template #default="{ row }">
            <span class="admin-vp-time">{{ formatTime(row.updatedAt || row.metadata.updatedAt) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="88" fixed="right">
          <template #default="{ row }">
            <div class="admin-vp-ops">
              <button
                class="admin-vp-ops__btn is-danger"
                type="button"
                :disabled="acting"
                @click="handleDelete(row)"
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
          :total="pagination.total"
          :disabled="loading || acting"
          @change="handlePaginationChange"
        />
      </template>
    </AdminListFrame>
  </AdminPageContainer>
</template>

<script setup lang="ts">
defineOptions({ name: 'AdminVideoProjects' })
import './admin-video-projects.css'
import { computed, onMounted, ref } from 'vue'
import { ElMessageBox } from 'element-plus'
import AdminListFrame from '@/components/admin/common/AdminListFrame.vue'
import AdminListToolbar from '@/components/admin/common/AdminListToolbar.vue'
import AdminPagination from '@/components/admin/common/AdminPagination.vue'
import AdminArtTable from '@/components/admin/table/AdminArtTable.vue'
import AdminPageContainer from '@/components/admin/layout/AdminPageContainer.vue'
import { useAdminList } from '@/composables/admin/useAdminList'
import {
  deleteVideoProject,
  listAllVideoProjects,
  type VideoProjectListItem,
} from '@/api/video-projects'
import { cananaMessageBoxOptions } from '@/utils/canana-message-box'

type AdminVideoProjectRow = VideoProjectListItem & { id: string }

const keyword = ref('')
const acting = ref(false)

const hasActiveFilters = computed(() => Boolean(keyword.value.trim()))

const {
  loading,
  items,
  pagination,
  loadList,
  resetAndLoad,
  handlePaginationChange,
} = useAdminList<AdminVideoProjectRow>({
  initialPageSize: 20,
  fetcher: async ({ page, pageSize }) => {
    const result = await listAllVideoProjects({
      page,
      pageSize,
      keyword: keyword.value.trim() || undefined,
    })
    return {
      items: result.items.map((item) => ({
        ...item,
        id: item.metadata.id,
      })),
      summary: result.summary,
    }
  },
})

const resolveThumb = (row: AdminVideoProjectRow) => {
  return String(row.thumbnail || row.metadata.thumbnail || '').trim()
}

const handleSearch = () => {
  void resetAndLoad()
}

const resetFilters = () => {
  keyword.value = ''
  void resetAndLoad()
}

const handleDelete = async (row: AdminVideoProjectRow) => {
  try {
    await ElMessageBox.confirm(
      `确定删除视频项目「${row.metadata.name || '未命名项目'}」吗？删除后不可恢复。`,
      '删除视频项目',
      cananaMessageBoxOptions({
        type: 'warning',
        confirmButtonText: '删除',
        cancelButtonText: '取消',
      }),
    )
  } catch {
    return
  }

  acting.value = true
  try {
    await deleteVideoProject(row.id)
    await loadList()
  } finally {
    acting.value = false
  }
}

const formatDuration = (seconds?: number) => {
  const total = Math.max(0, Math.round(Number(seconds || 0)))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

const formatTime = (iso?: string) => {
  if (!iso) {
    return '—'
  }
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) {
    return '—'
  }
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

onMounted(() => {
  void loadList()
})
</script>
