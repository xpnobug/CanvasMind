<template>
  <AdminPageContainer
    class="admin-list-page"
    title="审计日志"
    description="查看后台关键操作记录，快速定位操作者、目标对象、来源 IP 与变更摘要。"
    compact
  >
    <div class="admin-grid admin-grid--stats admin-audit-kpis">
      <AdminStatCard label="命中记录" :value="pagination.total" hint="当前筛选条件下的审计日志数量" />
      <AdminStatCard label="当前页" :value="logs.length" hint="当前页已加载的操作记录" />
      <AdminStatCard label="操作类型" :value="actionCount" hint="当前页涉及的 action 数量" />
      <AdminStatCard label="目标类型" :value="targetTypeCount" hint="当前页涉及的 targetType 数量" />
    </div>

    <AdminListFrame>
      <template #toolbar>
        <AdminListToolbar
          :disabled="loading"
          :has-active-filters="activeFilterCount > 0"
          @clear="handleResetFilters"
        >
          <input
            v-model.trim="filters.operatorKeyword"
            class="admin-list-toolbar__input is-wide"
            type="text"
            placeholder="搜索操作者姓名、邮箱、手机号"
            :disabled="loading"
            @keydown.enter="resetAndLoad"
          >
          <input
            v-model.trim="filters.action"
            class="admin-list-toolbar__input"
            type="text"
            placeholder="操作类型"
            :disabled="loading"
            @keydown.enter="resetAndLoad"
          >
          <input
            v-model.trim="filters.targetType"
            class="admin-list-toolbar__input"
            type="text"
            placeholder="目标类型"
            :disabled="loading"
            @keydown.enter="resetAndLoad"
          >
          <input
            v-model.trim="filters.targetId"
            class="admin-list-toolbar__input"
            type="text"
            placeholder="目标 ID"
            :disabled="loading"
            @keydown.enter="resetAndLoad"
          >
          <input
            v-model="filters.createdFrom"
            class="admin-list-toolbar__input is-wide"
            type="datetime-local"
            title="开始时间"
            :disabled="loading"
          >
          <input
            v-model="filters.createdTo"
            class="admin-list-toolbar__input is-wide"
            type="datetime-local"
            title="结束时间"
            :disabled="loading"
          >
          <template #actions>
            <button
              class="admin-button admin-button--primary"
              type="button"
              :disabled="loading"
              @click="resetAndLoad"
            >
              查询
            </button>
          </template>
        </AdminListToolbar>
      </template>

      <AdminEmptyState v-if="loading && !logs.length" message="正在加载审计日志..." />
      <AdminEmptyState v-else-if="!logs.length" message="当前筛选条件下没有审计日志" />
      <div v-else class="admin-audit-list">
        <div class="admin-audit-table-wrap">
          <table class="admin-audit-table">
            <thead>
              <tr>
                <th>时间</th>
                <th>操作</th>
                <th>操作者</th>
                <th>目标类型</th>
                <th>目标 ID</th>
                <th>来源</th>
                <th>变更</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="log in logs" :key="log.id">
                <tr class="admin-audit-table__row">
                  <td class="admin-audit-table__time">
                    <div class="admin-audit-time-stack">
                      <strong>{{ formatDatePart(log.createdAt) }}</strong>
                      <span>{{ formatTimePart(log.createdAt) }}</span>
                    </div>
                  </td>
                  <td>
                    <div class="admin-audit-action-cell">
                      <strong>{{ log.action }}</strong>
                      <span>{{ log.id }}</span>
                    </div>
                  </td>
                  <td>
                    <div class="admin-audit-principal">
                      <div class="admin-audit-principal__avatar">{{ formatOperatorInitial(log) }}</div>
                      <div class="admin-audit-principal__body">
                        <strong>{{ formatOperator(log) }}</strong>
                        <span>{{ log.operatorUserId }}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span class="admin-audit-type">{{ log.targetType || 'unknown' }}</span>
                  </td>
                  <td class="admin-audit-table__mono">{{ log.targetId || '—' }}</td>
                  <td>
                    <div class="admin-audit-source">
                      <strong>{{ log.ipAddress || '—' }}</strong>
                      <span :title="log.userAgent">{{ formatUserAgent(log.userAgent) }}</span>
                    </div>
                  </td>
                  <td>
                    <div class="admin-audit-snapshot-cell">
                      <button
                        class="admin-audit-snapshot-button"
                        type="button"
                        :class="{ 'is-active': isAuditExpanded(log.id) }"
                        @click="toggleAuditExpanded(log.id)"
                      >
                        {{ isAuditExpanded(log.id) ? '收起' : '展开' }}
                      </button>
                      <span class="admin-audit-snapshot-state">
                        {{ formatJsonState(log.beforeJsonPreview) }} / {{ formatJsonState(log.afterJsonPreview) }}
                      </span>
                    </div>
                  </td>
                </tr>
                <tr v-if="isAuditExpanded(log.id)" class="admin-audit-table__detail-row">
                  <td colspan="7">
                    <div class="admin-audit-detail">
                      <header class="admin-audit-detail__head">
                        <span>before_json {{ formatJsonState(log.beforeJsonPreview) }}</span>
                        <span>after_json {{ formatJsonState(log.afterJsonPreview) }}</span>
                      </header>
                      <div class="admin-audit-json-grid">
                        <section class="admin-audit-json">
                          <header>before_json</header>
                          <pre>{{ formatJsonPreview(log.beforeJsonPreview) }}</pre>
                        </section>
                        <section class="admin-audit-json">
                          <header>after_json</header>
                          <pre>{{ formatJsonPreview(log.afterJsonPreview) }}</pre>
                        </section>
                      </div>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
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
defineOptions({ name: 'AdminAuditLogs' })
import { computed, onMounted, reactive, ref } from 'vue'
import AdminEmptyState from '@/components/admin/common/AdminEmptyState.vue'
import AdminListFrame from '@/components/admin/common/AdminListFrame.vue'
import AdminListToolbar from '@/components/admin/common/AdminListToolbar.vue'
import AdminPagination from '@/components/admin/common/AdminPagination.vue'
import AdminStatCard from '@/components/admin/common/AdminStatCard.vue'
import AdminPageContainer from '@/components/admin/layout/AdminPageContainer.vue'
import { useAdminList } from '@/composables/admin/useAdminList'
import {
  listAdminAuditLogs,
  type AdminAuditLogItem,
  type ListAdminAuditLogsOptions,
} from '@/api/admin-audit-logs'

const filterDefaults: ListAdminAuditLogsOptions = {
  action: '',
  targetType: '',
  targetId: '',
  operatorKeyword: '',
  createdFrom: '',
  createdTo: '',
}

const filters = reactive<ListAdminAuditLogsOptions>({ ...filterDefaults })
const expandedAuditIds = ref<Set<string>>(new Set())

const {
  loading,
  items: logs,
  pagination,
  loadList: loadLogs,
  resetAndLoad,
  handlePaginationChange,
} = useAdminList<AdminAuditLogItem>({
  initialPageSize: 20,
  fetcher: ({ page, pageSize }) => listAdminAuditLogs({
    ...filters,
    page,
    pageSize,
  }),
})

const actionCount = computed(() => new Set(logs.value.map(log => log.action)).size)
const targetTypeCount = computed(() => new Set(logs.value.map(log => log.targetType)).size)
const activeFilterCount = computed(() => {
  return [
    filters.action,
    filters.targetType,
    filters.targetId,
    filters.operatorKeyword,
    filters.createdFrom,
    filters.createdTo,
  ].filter(value => String(value || '').trim()).length
})

const handleResetFilters = () => {
  Object.assign(filters, filterDefaults)
  expandedAuditIds.value = new Set()
  resetAndLoad()
}

const isAuditExpanded = (id: string) => expandedAuditIds.value.has(id)

const toggleAuditExpanded = (id: string) => {
  const nextIds = new Set(expandedAuditIds.value)
  if (nextIds.has(id)) {
    nextIds.delete(id)
  } else {
    nextIds.add(id)
  }
  expandedAuditIds.value = nextIds
}

const formatDate = (value: string) => String(value || '').replace('T', ' ').slice(0, 19) || '未知时间'

const formatDatePart = (value: string) => {
  const normalized = formatDate(value)
  return normalized.includes(' ') ? normalized.split(' ')[0] : normalized
}

const formatTimePart = (value: string) => {
  const normalized = formatDate(value)
  return normalized.includes(' ') ? normalized.split(' ')[1] : ''
}

const formatOperator = (log: AdminAuditLogItem) => {
  const operator = log.operator
  if (!operator) {
    return log.operatorUserId || '未知操作者'
  }

  return operator.name || operator.username || operator.email || operator.phone || operator.id
}

const formatOperatorInitial = (log: AdminAuditLogItem) => {
  const value = formatOperator(log).trim()
  return value ? value.slice(0, 1).toUpperCase() : '?'
}

const formatUserAgent = (value: string) => {
  const text = String(value || '').trim()
  if (!text) {
    return '未记录 UA'
  }

  return text.length > 96 ? `${text.slice(0, 96)}...` : text
}

const formatJsonState = (value: string | null) => {
  if (!value) {
    return 'empty'
  }

  return `${formatJsonPreview(value).length} chars`
}

const formatJsonPreview = (value: string | null) => {
  if (!value) {
    return '无'
  }

  try {
    return JSON.stringify(JSON.parse(value), null, 2)
  } catch {
    return value
  }
}

onMounted(() => {
  void loadLogs()
})
</script>

<style scoped>
.admin-audit-kpis {
  flex: 0 0 auto;
}

:deep(.admin-list-frame__body) {
  overflow: auto;
}

.admin-audit-list {
  display: grid;
  gap: 14px;
}

.admin-audit-table-wrap {
  min-width: 0;
  overflow-x: auto;
  border: 1px solid var(--line-divider, rgba(0, 0, 0, 0.08));
  border-radius: var(--admin-radius-control);
  background: var(--bg-surface);
}

.admin-audit-table {
  width: 100%;
  min-width: 1120px;
  border-collapse: collapse;
  table-layout: fixed;
}

.admin-audit-table th,
.admin-audit-table td {
  padding: 10px 12px;
  border-bottom: 1px solid var(--line-divider, rgba(0, 0, 0, 0.08));
  text-align: left;
  vertical-align: middle;
}

.admin-audit-table th {
  position: sticky;
  top: 0;
  z-index: 1;
  background: var(--bg-surface);
  color: var(--text-tertiary);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0;
  text-transform: uppercase;
  height: 36px;
}

.admin-audit-table th:nth-child(1) { width: 132px; }
.admin-audit-table th:nth-child(2) { width: 190px; }
.admin-audit-table th:nth-child(3) { width: 240px; }
.admin-audit-table th:nth-child(4) { width: 130px; }
.admin-audit-table th:nth-child(5) { width: 180px; }
.admin-audit-table th:nth-child(6) { width: 220px; }
.admin-audit-table th:nth-child(7) { width: 150px; }

.admin-audit-table__row:hover td {
  background: var(--bg-block-secondary-default);
}

.admin-audit-time-stack {
  display: grid;
  gap: 3px;
}

.admin-audit-time-stack strong {
  color: var(--text-primary);
  font-size: 12px;
  line-height: 1.4;
}

.admin-audit-time-stack span,
.admin-audit-table__mono,
.admin-audit-action-cell span,
.admin-audit-principal__body span,
.admin-audit-snapshot-state {
  color: var(--text-tertiary);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
  font-size: 11px;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.admin-audit-snapshot-state {
  min-width: 0;
  display: inline-block;
  color: var(--text-tertiary);
  white-space: nowrap;
}

.admin-audit-snapshot-cell {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.admin-audit-snapshot-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 28px;
  padding: 0 12px;
  border: 1px solid var(--line-divider, rgba(0, 0, 0, 0.08));
  border-radius: 999px;
  background: var(--bg-block-secondary-default);
  color: var(--text-primary);
  cursor: pointer;
  font-size: 12px;
  font-weight: 700;
  transition: background-color .2s ease, border-color .2s ease;
}

.admin-audit-snapshot-button:hover,
.admin-audit-snapshot-button.is-active {
  background: var(--bg-block-secondary-hover);
  border-color: var(--brand-main-default);
  color: var(--brand-main-default);
}

.admin-audit-action-cell,
.admin-audit-source {
  min-width: 0;
  display: grid;
  gap: 4px;
}

.admin-audit-action-cell strong {
  min-width: 0;
  color: var(--text-primary);
  font-size: 13px;
  line-height: 1.45;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.admin-audit-principal {
  min-width: 0;
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr);
  align-items: center;
  gap: 9px;
}

.admin-audit-principal__avatar {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--brand-main-block-default);
  color: var(--brand-main-default);
  font-size: 12px;
  font-weight: 800;
}

.admin-audit-principal__body {
  min-width: 0;
  display: grid;
  gap: 2px;
}

.admin-audit-principal__body strong,
.admin-audit-source strong {
  min-width: 0;
  color: var(--text-primary);
  font-size: 12px;
  line-height: 1.45;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.admin-audit-type {
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  min-height: 24px;
  padding: 0 9px;
  border-radius: 999px;
  background: var(--brand-main-block-default);
  color: var(--brand-main-default);
  font-size: 12px;
  font-weight: 700;
  overflow-wrap: anywhere;
}

.admin-audit-source span {
  color: var(--text-tertiary);
  font-size: 11px;
  line-height: 1.45;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.admin-audit-table__detail-row > td {
  padding: 0;
  background: var(--bg-block-secondary-default);
  vertical-align: top;
}

.admin-audit-detail {
  min-width: 0;
}

.admin-audit-detail__head {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  min-height: 38px;
  padding: 0 12px;
  color: var(--text-tertiary);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
  font-size: 11px;
  font-weight: 600;
  border-bottom: 1px solid var(--line-divider, rgba(0, 0, 0, 0.08));
}

.admin-audit-json-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.admin-audit-json {
  min-width: 0;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  background: var(--bg-surface);
}

.admin-audit-json + .admin-audit-json {
  border-left: 1px solid var(--line-divider, rgba(0, 0, 0, 0.08));
}

.admin-audit-json header {
  padding: 10px 12px;
  border-bottom: 1px solid var(--line-divider, rgba(0, 0, 0, 0.08));
  color: var(--text-tertiary);
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
}

.admin-audit-json pre {
  max-height: 240px;
  margin: 0;
  padding: 12px;
  overflow: auto;
  color: var(--text-secondary);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

:global(html[data-theme='dark']) .admin-audit-table-wrap,
:global(body[lv-theme='dark']) .admin-audit-table-wrap,
:global(html[data-theme='dark']) .admin-audit-table th,
:global(body[lv-theme='dark']) .admin-audit-table th,
:global(html[data-theme='dark']) .admin-audit-table td,
:global(body[lv-theme='dark']) .admin-audit-table td,
:global(html[data-theme='dark']) .admin-audit-snapshot-button,
:global(body[lv-theme='dark']) .admin-audit-snapshot-button,
:global(html[data-theme='dark']) .admin-audit-detail__head,
:global(body[lv-theme='dark']) .admin-audit-detail__head,
:global(html[data-theme='dark']) .admin-audit-json + .admin-audit-json,
:global(body[lv-theme='dark']) .admin-audit-json + .admin-audit-json,
:global(html[data-theme='dark']) .admin-audit-json header,
:global(body[lv-theme='dark']) .admin-audit-json header {
  border-color: rgba(224, 245, 255, 0.12);
}

:global(html[data-theme='dark']) .admin-audit-table th,
:global(body[lv-theme='dark']) .admin-audit-table th,
:global(html[data-theme='dark']) .admin-audit-json,
:global(body[lv-theme='dark']) .admin-audit-json {
  background: #15161a;
}

:global(html[data-theme='dark']) .admin-audit-table__row:hover td,
:global(body[lv-theme='dark']) .admin-audit-table__row:hover td,
:global(html[data-theme='dark']) .admin-audit-table__detail-row > td,
:global(body[lv-theme='dark']) .admin-audit-table__detail-row > td {
  background: rgba(204, 221, 255, 0.05);
}

@media (max-width: 760px) {
  .admin-audit-table {
    min-width: 960px;
  }

  .admin-audit-detail__head {
    justify-content: flex-start;
    flex-wrap: wrap;
    height: auto;
    padding: 10px 12px;
  }

  .admin-audit-json-grid {
    grid-template-columns: 1fr;
  }

  .admin-audit-json + .admin-audit-json {
    border-left: none;
    border-top: 1px solid var(--line-divider, rgba(0, 0, 0, 0.08));
  }
}
</style>
