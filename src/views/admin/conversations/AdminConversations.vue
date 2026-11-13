<template>
  <AdminPageContainer
    class="admin-list-page"
    title="会话列表"
    description="按用户维度统一管理全站创作会话，并查看会话下的生成记录明细。"
    compact
  >
    <AdminListFrame>
      <template #toolbar>
        <AdminListToolbar
          :disabled="loading"
          :has-active-filters="hasActiveFilters"
          :facets="listFacets"
          @update:facet="handleFacetUpdate"
          @clear="resetFilters"
        >
          <input
            v-model.trim="filters.keyword"
            class="admin-list-toolbar__input is-wide"
            type="text"
            placeholder="搜索会话标题、提示词或错误信息"
            :disabled="loading"
            @keydown.enter="handleSearch"
          >
          <input
            v-model.trim="filters.userKeyword"
            class="admin-list-toolbar__input is-wide"
            type="text"
            placeholder="搜索用户名、邮箱或用户 ID"
            :disabled="loading"
            @keydown.enter="handleSearch"
          >
        </AdminListToolbar>
      </template>

      <div class="admin-conversation-grid" :class="{ 'is-loading': loading }">
        <template v-if="loading && sessions.length === 0">
          <div
            v-for="index in 8"
            :key="`skeleton-${index}`"
            class="admin-conversation-card admin-conversation-card--skeleton"
            aria-hidden="true"
          >
            <div class="admin-conversation-card__head">
              <div class="admin-conversation-card__avatar is-skeleton" />
              <div class="admin-conversation-card__identity">
                <div class="admin-conversation-card__skeleton-line is-title" />
                <div class="admin-conversation-card__skeleton-line is-sub" />
              </div>
            </div>
            <div class="admin-conversation-card__skeleton-line is-summary" />
            <div class="admin-conversation-card__stats">
              <div class="admin-conversation-card__skeleton-line is-stat" />
              <div class="admin-conversation-card__skeleton-line is-stat" />
            </div>
            <div class="admin-conversation-card__footer">
              <div class="admin-conversation-card__skeleton-line is-badge" />
              <div class="admin-conversation-card__skeleton-line is-time" />
            </div>
          </div>
        </template>

        <AdminEmptyState
          v-else-if="sessions.length === 0"
          class="admin-conversation-grid__empty"
          :message="emptyListMessage"
        />

        <article
          v-for="session in sessions"
          :key="session.id"
          class="admin-conversation-card"
          :title="buildSessionHoverTitle(session)"
          role="button"
          tabindex="0"
          @click="handleOpenDetail(session.id)"
          @keydown.enter.prevent="handleOpenDetail(session.id)"
        >
          <div class="admin-conversation-card__head">
            <div class="admin-conversation-card__avatar">
              <img
                v-if="session.user.avatarUrl"
                :src="session.user.avatarUrl"
                :alt="formatUserName(session.user.name) || '用户头像'"
                class="admin-conversation-card__media"
              >
              <span v-else class="admin-conversation-card__fallback">
                {{ getSessionInitial(session) }}
              </span>
            </div>

            <div class="admin-conversation-card__identity">
              <div class="admin-conversation-card__title">
                {{ session.title || '未命名会话' }}
              </div>
              <div class="admin-conversation-card__user">
                {{ formatUserName(session.user.name) || '未知用户' }}
              </div>
            </div>
          </div>

          <el-dropdown
            class="admin-conversation-card__menu"
            trigger="click"
            placement="bottom-end"
            :show-arrow="false"
            :popper-options="cardMenuPopperOptions"
            popper-class="admin-conversation-card-dropdown"
            @command="(command: string | number | boolean | object) => handleSessionCommand(String(command), session)"
            @click.stop
          >
            <button
              class="admin-conversation-card__more"
              type="button"
              aria-label="更多操作"
              @click.stop
            >
              <el-icon class="admin-conversation-card__more-icon"><MoreFilled /></el-icon>
            </button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="detail">查看记录</el-dropdown-item>
                <el-dropdown-item
                  command="rename"
                  :disabled="!conversationSettings.basicRules.allowAdminRename"
                >
                  重命名
                </el-dropdown-item>
                <el-dropdown-item
                  command="export"
                  :disabled="!canExportSessions || exportingSessionId === session.id"
                >
                  {{ exportingSessionId === session.id ? '导出中...' : '导出会话' }}
                </el-dropdown-item>
                <el-dropdown-item
                  command="delete"
                  class="is-danger"
                  divided
                  :disabled="!conversationSettings.basicRules.allowAdminDelete || (!conversationSettings.basicRules.allowDeleteDefaultSession && session.isDefault)"
                >
                  <el-icon><Delete /></el-icon>
                  删除
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>

          <p
            v-if="session.latestRecord?.prompt"
            class="admin-conversation-card__summary"
          >
            {{ session.latestRecord.prompt }}
          </p>

          <div class="admin-conversation-card__stats" :title="buildRecordStatsTitle(session)">
            <span class="admin-conversation-card__stat">
              <el-icon><ChatDotRound /></el-icon>
              {{ session.recordCount }} 条记录
            </span>
            <span v-if="session.latestRecord" class="admin-conversation-card__stat">
              <el-icon><Picture /></el-icon>
              {{ getRecordTypeLabel(session.latestRecord.type) }}
            </span>
          </div>

          <div class="admin-conversation-card__footer">
            <div class="admin-conversation-card__badges">
              <span
                class="admin-conversation-badge"
                :class="getSessionOriginTone(session)"
                :title="buildSessionOriginTitle(session)"
              >
                {{ session.originLabel || '会话' }}
              </span>
              <span
                class="admin-conversation-badge"
                :class="getSessionStateTone(session)"
              >
                {{ getSessionStatusLabel(session) }}
              </span>
            </div>
            <span
              class="admin-conversation-card__time"
              :title="`创建 ${formatDate(session.createdAt)}`"
            >
              {{ formatSessionRelativeTime(session) }}
            </span>
          </div>
        </article>
      </div>

      <template #pagination>
        <AdminPagination
          v-model:page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="summary.totalCount"
          :page-sizes="PAGE_SIZES"
          :disabled="loading"
          @change="handlePaginationChange"
        />
      </template>
    </AdminListFrame>

    <el-drawer
      v-model="detailVisible"
      :title="selectedSession?.title || '未命名会话'"
      size="min(48rem, 100%)"
      destroy-on-close
      class="admin-session-detail-drawer"
      @closed="handleClosedDetail"
    >
      <template #header>
        <div class="admin-session-drawer-header">
          <h3 class="admin-session-drawer-header__title">
            {{ selectedSession?.title || '未命名会话' }}
          </h3>
          <div v-if="selectedSession" class="admin-session-drawer-header__meta">
            <span
              class="admin-conversation-badge"
              :class="getSessionOriginTone(selectedSession)"
              :title="buildSessionOriginTitle(selectedSession)"
            >
              {{ selectedSession.originLabel || '会话' }}
            </span>
          </div>
          <div v-if="selectedSession" class="admin-session-drawer-header__user">
            <div class="admin-session-drawer-header__avatar">
              <img
                v-if="selectedSession.user.avatarUrl"
                :src="selectedSession.user.avatarUrl"
                :alt="formatUserName(selectedSession.user.name) || '用户头像'"
              >
              <span v-else>{{ getSessionInitial(selectedSession) }}</span>
            </div>
            <span class="admin-session-drawer-header__name">
              {{ formatUserName(selectedSession.user.name) || '未知用户' }}
            </span>
            <button
              class="admin-button admin-button--secondary admin-session-drawer-header__export"
              type="button"
              :disabled="!canExportSessions || exportingSessionId === selectedSession.id"
              @click="handleExport(selectedSession)"
            >
              {{ exportingSessionId === selectedSession.id ? '导出中...' : '导出会话' }}
            </button>
          </div>
        </div>
      </template>

      <div class="admin-session-drawer">
        <div
          v-if="detailLoading && detailRecords.length === 0"
          class="admin-session-drawer__empty"
        >
          加载记录中...
        </div>
        <div
          v-else-if="!detailLoading && detailRecords.length === 0"
          class="admin-session-drawer__empty"
        >
          暂无生成记录
        </div>
        <div v-else class="admin-session-record-feed">
          <article
            v-for="record in detailRecords"
            :key="record.id"
            class="admin-session-turn"
          >
            <div class="admin-session-bubble admin-session-bubble--user">
              <div class="admin-session-bubble__body">
                {{ record.prompt || '暂无提示词' }}
              </div>
            </div>

            <div class="admin-session-bubble admin-session-bubble--assistant">
              <div class="admin-session-bubble__meta">
                <span class="admin-session-bubble__type">{{ getRecordTypeLabel(record.type) }}</span>
                <span
                  class="admin-conversation-badge"
                  :class="getRecordStatusTone(record)"
                >
                  {{ getRecordStatusLabel(record) }}
                </span>
                <span class="admin-session-bubble__time" :title="formatDate(record.createdAt)">
                  {{ formatRelativeTime(record.createdAt) || formatDate(record.createdAt) }}
                </span>
              </div>

              <div
                v-if="getRecordPreviewMedia(record).url"
                class="admin-session-bubble__media"
              >
                <CanvasVideoPlayer
                  v-if="getRecordPreviewMedia(record).kind === 'video'"
                  :src="getRecordPreviewMedia(record).url"
                  :aspect-ratio="record.ratio || '16:9'"
                  :resolution="record.resolution || 'HD'"
                  :show-controls="true"
                  :show-badge="true"
                  fill="cover"
                  class="admin-session-bubble__video"
                />
                <img
                  v-else
                  :src="getRecordPreviewMedia(record).url"
                  :alt="record.prompt || '记录预览'"
                  class="admin-session-bubble__image"
                >
              </div>

              <div
                v-else-if="record.content && record.type === 'agent'"
                class="admin-session-bubble__content"
              >
                <button
                  v-if="isLongRecordContent(record.content)"
                  class="admin-session-bubble__toggle"
                  type="button"
                  @click="toggleRecordContent(record.id)"
                >
                  {{ expandedRecordContentMap[record.id] ? '收起' : '展开全文' }}
                </button>
                <p :class="{ 'is-collapsed': isLongRecordContent(record.content) && !expandedRecordContentMap[record.id] }">
                  {{ record.content }}
                </p>
              </div>

              <div v-if="record.error" class="admin-session-bubble__error">
                {{ formatGenerationError(record.error, '任务执行失败') }}
              </div>

              <div class="admin-session-bubble__toolbar">
                <span>{{ record.model || record.modelKey || '未记录模型' }}</span>
                <span v-if="record.skill">{{ record.skill }}</span>
                <span v-if="record.ratio">{{ record.ratio }}</span>
                <span>{{ record.outputs.length || record.images.length }} 个输出</span>
              </div>
            </div>
          </article>

          <div class="admin-session-record-feed__pagination">
            <AdminPagination
              v-model:page="detailPagination.page"
              v-model:page-size="detailPagination.pageSize"
              :total="detailSummary.totalCount"
              :page-sizes="PAGE_SIZES"
              :disabled="detailLoading"
              @change="handleDetailPaginationChange"
            />
          </div>
        </div>
      </div>
    </el-drawer>

    <AdminDialog
      v-model:visible="renameDialogVisible"
      title="重命名会话"
      description="调整后台展示与用户侧会话标题，保存后会同步刷新当前列表和详情。"
      panel-class="admin-session-rename-dialog"
      mask-class="admin-session-rename-mask"
      :close-disabled="renameSubmitting"
      @close="closeRenameDialog"
    >
        <form class="admin-form admin-dialog__body" @submit.prevent="handleSubmitRename">
          <label class="admin-form__field">
            <span class="admin-form__label">会话名称</span>
            <input
              v-model.trim="renameTitle"
              class="admin-input"
              type="text"
              placeholder="请输入会话名称"
              :disabled="renameSubmitting"
              autofocus
            >
          </label>
          <div class="admin-form__footer">
            <button class="admin-button admin-button--secondary" type="button" :disabled="renameSubmitting" @click="closeRenameDialog">取消</button>
            <button class="admin-button admin-button--primary" type="submit" :disabled="renameSubmitting || !renameTitle.trim()">
              {{ renameSubmitting ? '保存中...' : '保存' }}
            </button>
          </div>
        </form>
    </AdminDialog>
  </AdminPageContainer>
</template>

<script setup lang="ts">
defineOptions({ name: 'AdminConversations' })
import './admin-conversations.css'
import { computed, onMounted, reactive, ref } from 'vue'
import { ChatDotRound, Delete, MoreFilled, Picture } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import CanvasVideoPlayer from '@/components/common/CanvasVideoPlayer.vue'
import AdminDialog from '@/components/admin/common/AdminDialog.vue'
import AdminEmptyState from '@/components/admin/common/AdminEmptyState.vue'
import AdminListFrame from '@/components/admin/common/AdminListFrame.vue'
import AdminListToolbar from '@/components/admin/common/AdminListToolbar.vue'
import AdminPagination from '@/components/admin/common/AdminPagination.vue'
import AdminPageContainer from '@/components/admin/layout/AdminPageContainer.vue'
import { useAdminConfirm } from '@/composables/admin/useAdminConfirm'
import { useAdminListFilters } from '@/composables/useAdminListFilters'
import { useAdminPagination } from '@/composables/useAdminPagination'
import { formatRelativeTime } from '@/utils/notification-format'
import {
  createDefaultConversationSettings,
  getAdminConversationSettings,
  type ConversationSettingsConfig,
} from '@/api/admin-conversation-settings'
import {
  deleteAdminGenerationSession,
  getAdminGenerationSessionDetail,
  listAdminGenerationSessionRecords,
  listAdminGenerationSessions,
  updateAdminGenerationSession,
  type AdminGenerationSessionItem,
  type AdminGenerationSessionStatus,
  type AdminGenerationSessionType,
  type AdminSessionRecordItem,
} from '@/api/admin-generation-sessions'
import { resolveGenerationPreviewMedia } from '@/shared/generation-preview'
import { normalizeGenerationErrorMessage } from '@/shared/generation-error'
import { getGenerationSessionOriginToneClass } from '@/shared/generation-session-origin'
import { downloadAdminGenerationSessionExport } from './export-admin-session'

const PAGE_SIZES = [12, 20, 50] as const
const DEFAULT_PAGE_SIZE = 20

const loading = ref(false)
const detailLoading = ref(false)
const sessions = ref<AdminGenerationSessionItem[]>([])
const { confirmDanger } = useAdminConfirm()
const formatGenerationError = (message?: string | null, fallback = '任务执行失败') => {
  return normalizeGenerationErrorMessage(String(message || '').trim(), fallback)
}
const conversationSettings = reactive<ConversationSettingsConfig>(createDefaultConversationSettings())
const summary = reactive({
  totalCount: 0,
  totalPages: 1,
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
})

const filters = reactive<{
  keyword: string
  userKeyword: string
  status: AdminGenerationSessionStatus
  type: AdminGenerationSessionType
}>({
  keyword: '',
  userKeyword: '',
  status: 'ALL',
  type: 'ALL',
})

const filterDefaults = {
  keyword: '',
  userKeyword: '',
  status: 'ALL' as AdminGenerationSessionStatus,
  type: 'ALL' as AdminGenerationSessionType,
}

const { resetFilters: resetFilterValues } = useAdminListFilters({
  filters,
  defaults: filterDefaults,
})

const { pagination } = useAdminPagination({
  initialPageSize: DEFAULT_PAGE_SIZE,
})

/** 菜单右对齐触发按钮，间距 4px */
const cardMenuPopperOptions = {
  modifiers: [
    {
      name: 'offset',
      options: { offset: [0, 4] },
    },
  ],
}

const detailVisible = ref(false)
const selectedSession = ref<AdminGenerationSessionItem | null>(null)
const detailRecords = ref<AdminSessionRecordItem[]>([])
const expandedRecordContentMap = reactive<Record<string, boolean>>({})
const renameDialogVisible = ref(false)
const renameSubmitting = ref(false)
const renamingSession = ref<AdminGenerationSessionItem | null>(null)
const renameTitle = ref('')
/** 正在导出的会话 ID；用于菜单/按钮防重 */
const exportingSessionId = ref('')

const canExportSessions = computed(() => (
  conversationSettings.managementPolicy.allowExportSessions === true
))
const detailSummary = reactive({
  totalCount: 0,
  totalPages: 1,
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
})
const detailPagination = reactive({
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
})

const syncSharedPageSize = (pageSize: number) => {
  const nextSize = Math.max(1, Number(pageSize) || DEFAULT_PAGE_SIZE)
  pagination.pageSize = nextSize
  detailPagination.pageSize = nextSize
  detailSummary.pageSize = nextSize
}

const statusOptions: Array<{ label: string; value: AdminGenerationSessionStatus }> = [
  { label: '全部状态', value: 'ALL' },
  { label: '异常', value: 'HAS_ERROR' },
  { label: '运行中', value: 'RUNNING' },
  { label: '已完成', value: 'COMPLETED' },
  { label: '空会话', value: 'EMPTY' },
]

const typeOptions: Array<{ label: string; value: AdminGenerationSessionType }> = [
  { label: '全部类型', value: 'ALL' },
  { label: '图片', value: 'IMAGE' },
  { label: '视频', value: 'VIDEO' },
  { label: '智能体', value: 'AGENT' },
  { label: '数字人', value: 'DIGITAL_HUMAN' },
  { label: '动态内容', value: 'MOTION' },
]

const statusFacetOptions = statusOptions.filter((item) => item.value !== 'ALL')
const typeFacetOptions = typeOptions.filter((item) => item.value !== 'ALL')

// CM 后端暂无 origin 筛选；仅保留状态 / 类型 facet，避免假筛选。
const listFacets = computed(() => [
  {
    key: 'status',
    title: '会话状态',
    options: statusFacetOptions,
    modelValue: filters.status,
    emptyValue: 'ALL',
  },
  {
    key: 'type',
    title: '最近类型',
    options: typeFacetOptions,
    modelValue: filters.type,
    emptyValue: 'ALL',
  },
])

const hasActiveFilters = computed(() => (
  Boolean(filters.keyword?.trim())
  || Boolean(filters.userKeyword?.trim())
  || filters.status !== 'ALL'
  || filters.type !== 'ALL'
))

const emptyListMessage = computed(() => {
  if (filters.keyword || filters.userKeyword) {
    const keyword = filters.keyword || filters.userKeyword
    return `没有找到与“${keyword}”相关的会话`
  }
  return '暂无会话记录'
})

const applyConversationSettings = (value?: ConversationSettingsConfig | null) => {
  const nextValue = value || createDefaultConversationSettings()
  Object.assign(conversationSettings.basicRules, nextValue.basicRules)
  Object.assign(conversationSettings.listDisplay, nextValue.listDisplay)
  Object.assign(conversationSettings.entryDisplay.hero, nextValue.entryDisplay.hero)
  Object.assign(conversationSettings.entryDisplay.workbench, nextValue.entryDisplay.workbench)
  Object.assign(conversationSettings.entryDisplay.input, nextValue.entryDisplay.input)
  Object.assign(conversationSettings.entryDisplay.mode, {
    ...nextValue.entryDisplay.mode,
    options: nextValue.entryDisplay.mode.options.map(item => ({ ...item })),
  })
  Object.assign(conversationSettings.entryDisplay.modelSelector, {
    ...nextValue.entryDisplay.modelSelector,
    allowedModelKeys: [...nextValue.entryDisplay.modelSelector.allowedModelKeys],
  })
  Object.assign(conversationSettings.entryDisplay.assistantSelector, {
    ...nextValue.entryDisplay.assistantSelector,
    allowedAssistantKeys: [...nextValue.entryDisplay.assistantSelector.allowedAssistantKeys],
  })
  Object.assign(conversationSettings.entryDisplay.actions.auto, nextValue.entryDisplay.actions.auto)
  Object.assign(conversationSettings.entryDisplay.actions.inspiration, nextValue.entryDisplay.actions.inspiration)
  Object.assign(conversationSettings.entryDisplay.actions.creativeDesign, nextValue.entryDisplay.actions.creativeDesign)
  Object.assign(conversationSettings.managementPolicy, nextValue.managementPolicy)
}

const loadConversationSettings = async () => {
  try {
    const result = await getAdminConversationSettings()
    applyConversationSettings(result?.conversationSettings)
  } catch {
    applyConversationSettings(createDefaultConversationSettings())
  }
  conversationSettings.listDisplay.defaultPageSize = DEFAULT_PAGE_SIZE
  syncSharedPageSize(DEFAULT_PAGE_SIZE)
}

const loadSessions = async () => {
  loading.value = true
  try {
    const result = await listAdminGenerationSessions({
      ...filters,
      page: pagination.page,
      pageSize: pagination.pageSize,
    })
    sessions.value = result.items
    summary.totalCount = Number(result.summary?.totalCount || 0)
    summary.totalPages = Number(result.summary?.totalPages || 1)
    summary.page = Number(result.summary?.page || pagination.page)
    summary.pageSize = Number(result.summary?.pageSize || pagination.pageSize)
    pagination.page = summary.page
    pagination.pageSize = summary.pageSize
  } finally {
    loading.value = false
  }
}

const loadSessionDetail = async (sessionId: string) => {
  detailLoading.value = true
  try {
    const [sessionDetail, recordsResult] = await Promise.all([
      getAdminGenerationSessionDetail(sessionId),
      listAdminGenerationSessionRecords(sessionId, detailPagination.page, detailPagination.pageSize),
    ])
    selectedSession.value = sessionDetail
    detailRecords.value = recordsResult.items
    detailSummary.totalCount = Number(recordsResult.summary?.totalCount || 0)
    detailSummary.totalPages = Number(recordsResult.summary?.totalPages || 1)
    detailSummary.page = Number(recordsResult.summary?.page || detailPagination.page)
    detailSummary.pageSize = Number(recordsResult.summary?.pageSize || detailPagination.pageSize)
    detailPagination.page = detailSummary.page
    detailPagination.pageSize = detailSummary.pageSize
  } finally {
    detailLoading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  void loadSessions()
}

const handleFacetUpdate = ({ key, value }: { key: string; value: string }) => {
  if (key === 'status') {
    filters.status = value as AdminGenerationSessionStatus
  }
  if (key === 'type') {
    filters.type = value as AdminGenerationSessionType
  }
  pagination.page = 1
  void loadSessions()
}

const handlePaginationChange = (payload: { page: number; pageSize: number }) => {
  pagination.page = payload.page
  syncSharedPageSize(payload.pageSize)
  void loadSessions()
}

const resetFilters = () => {
  resetFilterValues()
  pagination.page = 1
  void loadSessions()
}

const handleOpenDetail = async (sessionId: string) => {
  detailVisible.value = true
  detailPagination.page = 1
  await loadSessionDetail(sessionId)
}

const handleCloseDetail = () => {
  detailVisible.value = false
}

const handleClosedDetail = () => {
  selectedSession.value = null
  detailRecords.value = []
  detailPagination.page = 1
  Object.keys(expandedRecordContentMap).forEach((recordId) => {
    delete expandedRecordContentMap[recordId]
  })
}

const handleDetailPaginationChange = (payload: { page: number; pageSize: number }) => {
  detailPagination.page = payload.page
  syncSharedPageSize(payload.pageSize)
  if (selectedSession.value?.id) {
    void loadSessionDetail(selectedSession.value.id)
  }
}

const handleRename = async (session: AdminGenerationSessionItem) => {
  if (!conversationSettings.basicRules.allowAdminRename) {
    return
  }

  renamingSession.value = session
  renameTitle.value = session.title || ''
  renameDialogVisible.value = true
}

const closeRenameDialog = () => {
  if (renameSubmitting.value) {
    return
  }
  renameDialogVisible.value = false
  renamingSession.value = null
  renameTitle.value = ''
}

const handleSubmitRename = async () => {
  const session = renamingSession.value
  const nextTitle = renameTitle.value.trim()
  if (!session || !nextTitle) {
    return
  }

  renameSubmitting.value = true
  try {
    await updateAdminGenerationSession(session.id, nextTitle)
    await loadSessions()

    if (selectedSession.value?.id === session.id) {
      await loadSessionDetail(session.id)
    }

  } finally {
    renameSubmitting.value = false
  }

  closeRenameDialog()
}

const handleDelete = async (session: AdminGenerationSessionItem) => {
  if (!conversationSettings.basicRules.allowAdminDelete) {
    return
  }

  await confirmDanger({
    title: '删除会话',
    message: `确定删除会话“${session.title}”吗？该会话下的生成记录也会一并移除。`,
    confirmText: '确定删除',
  })

  await deleteAdminGenerationSession(session.id)

  if (selectedSession.value?.id === session.id) {
    handleCloseDetail()
  }

  await loadSessions()
}

const formatDate = (value?: string) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  const y = date.getFullYear()
  const m = date.getMonth() + 1
  const d = date.getDate()
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  return `${y}/${m}/${d} ${hh}:${mm}`
}

const formatSessionRelativeTime = (session: AdminGenerationSessionItem) => {
  const value = conversationSettings.listDisplay.showLastRecordTime
    ? (session.lastRecordAt || session.updatedAt || session.createdAt)
    : (session.updatedAt || session.createdAt)
  return formatRelativeTime(value) || formatDate(value)
}

const getSessionInitial = (session: AdminGenerationSessionItem) => {
  const name = formatUserName(session.user.name) || session.title || '会'
  return String(name).trim().charAt(0).toUpperCase() || '会'
}

const handleExport = async (session: AdminGenerationSessionItem) => {
  if (!canExportSessions.value || !session?.id || exportingSessionId.value) {
    return
  }

  exportingSessionId.value = session.id
  try {
    const recordCount = await downloadAdminGenerationSessionExport(session.id, session.title)
    ElMessage.success(`会话已导出（${recordCount} 条记录）`)
  } catch {
    // 错误提示由 adminGet 统一处理
  } finally {
    exportingSessionId.value = ''
  }
}

const handleSessionCommand = (command: string, session: AdminGenerationSessionItem) => {
  if (command === 'detail') {
    void handleOpenDetail(session.id)
    return
  }
  if (command === 'rename') {
    void handleRename(session)
    return
  }
  if (command === 'export') {
    void handleExport(session)
    return
  }
  if (command === 'delete') {
    void handleDelete(session)
  }
}

const buildSessionHoverTitle = (session: AdminGenerationSessionItem) => {
  const parts = [
    session.title || '未命名会话',
    `来源：${session.originLabel || '未知'}`,
    formatUserName(session.user.name) || '未命名用户',
  ]
  if (session.workflowId) parts.push(`工作流 ID ${session.workflowId}`)
  if (session.source && session.source !== session.originLabel) parts.push(`source ${session.source}`)
  if (session.user.email) parts.push(formatUserEmail(session.user.email))
  if (conversationSettings.listDisplay.showSessionId) parts.push(`ID ${session.id}`)
  if (conversationSettings.listDisplay.showLatestPrompt && session.latestRecord?.prompt) {
    parts.push(session.latestRecord.prompt)
  }
  return parts.join('\n')
}

const buildRecordStatsTitle = (session: AdminGenerationSessionItem) => {
  return [
    `共 ${session.recordCount} 条`,
    `完成 ${session.completedRecordCount}`,
    `失败 ${session.failedRecordCount}`,
    `运行中 ${session.runningRecordCount}`,
  ].join(' · ')
}

const maskMiddle = (value: string, left = 2, right = 2) => {
  const normalizedValue = String(value || '').trim()
  if (!normalizedValue) {
    return ''
  }

  if (normalizedValue.length <= left + right) {
    return `${normalizedValue.slice(0, 1)}***`
  }

  return `${normalizedValue.slice(0, left)}***${normalizedValue.slice(-right)}`
}

const formatUserName = (value?: string) => {
  const normalizedValue = String(value || '').trim()
  if (!conversationSettings.listDisplay.enableUserMasking) {
    return normalizedValue
  }

  return maskMiddle(normalizedValue, 1, 1)
}

const formatUserEmail = (value?: string) => {
  const normalizedValue = String(value || '').trim()
  if (!conversationSettings.listDisplay.enableUserMasking) {
    return normalizedValue
  }

  const [prefix, domain] = normalizedValue.split('@')
  if (!domain) {
    return maskMiddle(normalizedValue, 1, 1)
  }

  return `${maskMiddle(prefix, 1, 1)}@${domain}`
}

const getSessionStatusLabel = (session: AdminGenerationSessionItem) => {
  if (session.recordCount === 0) return '空会话'

  // 会话状态取用户最近一次执行记录，不因历史失败一直标异常。
  const latestStatus = String(session.latestRecord?.status || '').toUpperCase()
  const latestError = String(session.latestRecord?.error || '').trim()
  if (latestStatus === 'FAILED' || latestError) return '异常'
  if (latestStatus === 'STOPPED') return '已停止'
  if (latestStatus === 'PENDING' || latestStatus === 'RUNNING') return '运行中'
  if (latestStatus === 'COMPLETED') return '已完成'

  if (session.runningRecordCount > 0) return '运行中'
  if (session.failedRecordCount > 0) return '异常'
  return '已完成'
}

const getSessionStateTone = (session: AdminGenerationSessionItem) => {
  if (session.recordCount === 0) return 'is-muted'

  const latestStatus = String(session.latestRecord?.status || '').toUpperCase()
  const latestError = String(session.latestRecord?.error || '').trim()
  if (latestStatus === 'FAILED' || latestError) return 'is-danger'
  if (latestStatus === 'STOPPED') return 'is-warning'
  if (latestStatus === 'PENDING' || latestStatus === 'RUNNING') return 'is-warning'
  if (latestStatus === 'COMPLETED') return 'is-success'

  if (session.runningRecordCount > 0) return 'is-warning'
  if (session.failedRecordCount > 0) return 'is-danger'
  return 'is-success'
}

const getSessionOriginTone = (session: AdminGenerationSessionItem) => (
  getGenerationSessionOriginToneClass(session.originCategory || 'other')
)

const buildSessionOriginTitle = (session: AdminGenerationSessionItem) => {
  const parts = [`来源：${session.originLabel || '未知'}`]
  if (session.workflowId) {
    parts.push(`工作流 ID：${session.workflowId}`)
  }
  if (session.source) {
    parts.push(`source：${session.source}`)
  }
  const feature = String(session.latestRecord?.feature || '').trim()
  if (feature) {
    parts.push(`最近 feature：${feature}`)
  }
  return parts.join('\n')
}

const getRecordPreviewMedia = (record: AdminSessionRecordItem) => resolveGenerationPreviewMedia(record)

const getRecordTypeLabel = (type: string) => {
  const normalizedType = String(type || '').trim()
  if (normalizedType === 'image') return '图片'
  if (normalizedType === 'video') return '视频'
  if (normalizedType === 'agent') return '智能体'
  if (normalizedType === 'digital-human') return '数字人'
  if (normalizedType === 'motion') return '动态内容'
  return normalizedType || '未知类型'
}

const getRecordStatusLabel = (record: AdminSessionRecordItem) => {
  if (record.error) return '失败'
  if (record.stopped) return '已停止'
  if (record.done) return '已完成'
  return '进行中'
}

const getRecordStatusTone = (record: AdminSessionRecordItem) => {
  if (record.error) return 'is-danger'
  if (record.stopped) return 'is-warning'
  if (record.done) return 'is-success'
  return 'is-warning'
}

const isLongRecordContent = (value?: string | null) => {
  return String(value || '').trim().length > 180
}

const toggleRecordContent = (recordId: string) => {
  expandedRecordContentMap[recordId] = !expandedRecordContentMap[recordId]
}

onMounted(() => {
  void (async () => {
    await loadConversationSettings()
    await loadSessions()
  })()
})
</script>
