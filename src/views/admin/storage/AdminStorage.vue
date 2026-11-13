<template>
  <AdminPageContainer
    title="存储配置"
    description="集中管理对象存储配置，并清晰展示当前启用状态与本地回退策略。"
  >
    <!-- 配置区纵向 stack，不套列表 Frame -->
    <div class="admin-storage-tab-stack">
      <AdminListToolbar
        :disabled="loading || submitting || activatingId !== ''"
        :has-active-filters="hasFilters"
        :facets="listFacets"
        @update:facet="handleFacetUpdate"
        @clear="handleResetFilters"
      >
        <input
          v-model.trim="filters.keyword"
          class="admin-list-toolbar__input is-wide"
          type="text"
          placeholder="搜索配置名称或编码"
        >
        <template #actions>
          <button
            class="admin-button admin-button--secondary"
            type="button"
            :disabled="loading || submitting || activatingId !== ''"
            @click="loadConfigs"
          >
            {{ loading ? '刷新中...' : '刷新列表' }}
          </button>
        </template>
      </AdminListToolbar>

      <div class="admin-grid admin-grid--stats">
        <div class="admin-stat-card">
          <div class="admin-stat-card__label">配置总数</div>
          <div class="admin-stat-card__value">{{ configs.length }}</div>
          <div class="admin-stat-card__hint">当前后台已保存的全部对象存储配置</div>
        </div>
        <div class="admin-stat-card">
          <div class="admin-stat-card__label">启用配置</div>
          <div class="admin-stat-card__value">{{ enabledCount }}</div>
          <div class="admin-stat-card__hint">包含默认配置与备用启用配置</div>
        </div>
        <div class="admin-stat-card">
          <div class="admin-stat-card__label">当前生效</div>
          <div class="admin-stat-card__value">{{ activeConfig?.name || '本地回退' }}</div>
          <div class="admin-stat-card__hint">未配置时自动回退到本地 `uploads/`</div>
        </div>
        <div class="admin-stat-card">
          <div class="admin-stat-card__label">存储模式</div>
          <div class="admin-stat-card__value">S3</div>
          <div class="admin-stat-card__hint">当前后端统一按 S3 兼容协议接入</div>
        </div>
      </div>

      <AdminSectionCard
        title="配置列表"
        :description="`${filteredConfigs.length} 条结果，默认配置会优先承接生成资源上传。`"
        compact
      >
        <div class="admin-provider-grid admin-storage-grid">
          <button class="admin-provider-create-card" type="button" @click="openCreateDialog">
            <div class="admin-provider-create-card__plus">+</div>
            <div class="admin-provider-create-card__title">新增配置</div>
            <div class="admin-provider-create-card__desc">添加新的对象存储配置</div>
            <div class="admin-provider-create-card__footer-actions">
              <span class="admin-provider-create-card__action admin-provider-create-card__action--muted">本地回退</span>
              <span class="admin-provider-create-card__action">手动创建</span>
            </div>
          </button>

          <div class="admin-storage-local-card">
            <div class="admin-storage-local-card__title">本地 uploads 回退</div>
            <div class="admin-storage-local-card__desc">当没有可用对象存储配置时，系统会自动回退到服务器本地目录。</div>
            <div class="admin-storage-local-card__path">`/app/uploads` / `uploads/`</div>
            <div class="admin-storage-local-card__footer">无需额外配置，可作为兜底存储方案。</div>
          </div>

          <div v-if="!loading && filteredConfigs.length === 0" class="admin-empty admin-storage-empty">
            当前筛选条件下暂无存储配置，建议清空筛选或新增一条配置。
          </div>

          <div
            v-for="config in paginatedConfigs"
            :key="config.id"
            class="admin-provider-tile admin-storage-card"
            :class="{ 'is-active': config.isDefault }"
          >
            <div class="admin-provider-tile__header">
              <div class="admin-provider-tile__brand">
                <div class="admin-provider-avatar">
                  <span>{{ getStorageInitial(config.name || config.code) }}</span>
                </div>
                <div class="admin-provider-tile__meta">
                  <div class="admin-provider-tile__title">{{ config.name || config.code }}</div>
                  <div class="admin-provider-tile__link admin-storage-card__subline">{{ config.code }}</div>
                </div>
              </div>
              <div class="admin-provider-tile__actions">
                <button
                  class="admin-inline-button"
                  type="button"
                  :disabled="submitting || activatingId !== '' || testingId !== ''"
                  @click="handleTest(config.id)"
                >
                  {{ testingId === config.id ? '测试中...' : '测试' }}
                </button>
                <button
                  class="admin-inline-button"
                  type="button"
                  :disabled="submitting || activatingId !== '' || testingId !== ''"
                  @click="openEditDialog(config)"
                >
                  编辑
                </button>
              </div>
            </div>

            <div class="admin-provider-tile__status-row">
              <span
                class="admin-status"
                :class="config.isDefault ? 'admin-status--success' : config.isEnabled ? 'admin-status--success' : 'admin-status--warning'"
              >
                {{ config.isDefault ? '当前启用' : config.isEnabled ? '已启用' : '未启用' }}
              </span>
              <button
                v-if="!config.isDefault"
                class="admin-inline-button"
                type="button"
                :disabled="activatingId === config.id || submitting"
                @click="handleActivate(config.id)"
              >
                {{ activatingId === config.id ? '启用中...' : '设为启用' }}
              </button>
            </div>

            <div class="admin-storage-card__info">
              <div><span class="admin-storage-card__label">Endpoint</span>{{ config.endpoint || '未配置' }}</div>
              <div><span class="admin-storage-card__label">Bucket</span>{{ config.bucket || '未配置' }}</div>
              <div><span class="admin-storage-card__label">Region</span>{{ config.region || '未配置' }}</div>
              <div><span class="admin-storage-card__label">Domain</span>{{ config.domain || '未配置' }}</div>
              <template v-if="testResults[config.id]">
                <div>
                  <span class="admin-storage-card__label">连接测试</span>
                  <span :class="testResults[config.id].ok ? 'admin-status admin-status--success' : 'admin-status admin-status--warning'">
                    {{ testResults[config.id].ok ? '通过' : '失败' }}
                  </span>
                </div>
                <div v-for="step in testResults[config.id].steps" :key="step.name">
                  <span class="admin-storage-card__label">{{ step.name }}</span>{{ formatStorageTestStep(step) }}
                </div>
              </template>
            </div>

            <div class="admin-provider-tile__chips">
              <span class="admin-chip">{{ config.providerType }}</span>
              <span class="admin-chip">排序 {{ config.sortOrder }}</span>
              <span v-if="config.accessKeyHint" class="admin-chip">AK {{ config.accessKeyHint }}</span>
              <span v-if="config.secretKeyHint" class="admin-chip">SK {{ config.secretKeyHint }}</span>
            </div>

            <div class="admin-provider-tile__footer">
              <span>{{ config.description || '暂无说明' }}</span>
              <span>{{ formatDate(config.updatedAt) }}</span>
            </div>
          </div>
        </div>
      </AdminSectionCard>

      <AdminPagination
        v-if="filteredConfigs.length > 0"
        v-model:page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="filteredConfigs.length"
        :disabled="loading || submitting || activatingId !== ''"
      />
    </div>
  </AdminPageContainer>

  <AdminDialog
    v-model:visible="dialogVisible"
    :title="editingId ? '编辑存储配置' : '新增存储配置'"
    description="维护对象存储连接信息、启用状态与默认配置。"
    size="provider-form"
    :close-disabled="submitting"
    @close="closeDialog"
  >
    <form class="admin-form admin-dialog__body" @submit.prevent="handleSubmit">
      <div class="admin-form__grid">
        <div class="admin-form__field">
          <label class="admin-form__label" for="storage-name">名称</label>
          <input id="storage-name" v-model.trim="form.name" class="admin-input" type="text" placeholder="例如：生产 MinIO">
        </div>

        <div class="admin-form__field">
          <label class="admin-form__label" for="storage-code">编码</label>
          <input id="storage-code" v-model.trim="form.code" class="admin-input" type="text" placeholder="例如：minio-prod">
        </div>

        <div class="admin-form__field">
          <label class="admin-form__label" for="storage-access-key">Access Key</label>
          <input id="storage-access-key" v-model.trim="form.accessKey" class="admin-input" type="text" placeholder="请输入 Access Key">
          <div class="admin-form__hint">编辑已有配置时，如果不想修改 Access Key，可以留空。</div>
        </div>

        <div class="admin-form__field">
          <label class="admin-form__label" for="storage-secret-key">Secret Key</label>
          <input id="storage-secret-key" v-model.trim="form.secretKey" class="admin-input" type="password" placeholder="请输入 Secret Key">
          <div class="admin-form__hint">编辑已有配置时，如果不想修改 Secret Key，可以留空。</div>
        </div>

        <div class="admin-form__field admin-form__field--full">
          <label class="admin-form__label" for="storage-endpoint">Endpoint</label>
          <input id="storage-endpoint" v-model.trim="form.endpoint" class="admin-input" type="text" placeholder="例如：https://s3.example.com">
        </div>

        <div class="admin-form__field">
          <label class="admin-form__label" for="storage-bucket">Bucket</label>
          <input id="storage-bucket" v-model.trim="form.bucket" class="admin-input" type="text" placeholder="请输入 Bucket">
        </div>

        <div class="admin-form__field">
          <label class="admin-form__label" for="storage-region">区域</label>
          <input id="storage-region" v-model.trim="form.region" class="admin-input" type="text" placeholder="例如：ap-guangzhou">
        </div>

        <div class="admin-form__field admin-form__field--full">
          <label class="admin-form__label" for="storage-domain">自定义域名</label>
          <input id="storage-domain" v-model.trim="form.domain" class="admin-input" type="text" placeholder="例如：https://cdn.example.com">
        </div>

        <div class="admin-form__field">
          <label class="admin-form__label" for="storage-sort-order">排序</label>
          <input id="storage-sort-order" v-model.number="form.sortOrder" class="admin-input" type="number" min="0" step="1" placeholder="999">
        </div>

        <div class="admin-form__field">
          <label class="admin-form__label">状态选项</label>
          <label class="admin-switch-row">
            <input v-model="form.isEnabled" type="checkbox">
            <span>保存后立即启用</span>
          </label>
          <label class="admin-switch-row">
            <input v-model="form.isDefault" type="checkbox">
            <span>设为默认配置</span>
          </label>
        </div>

        <div class="admin-form__field admin-form__field--full">
          <label class="admin-form__label" for="storage-description">描述</label>
          <textarea id="storage-description" v-model.trim="form.description" class="admin-textarea" placeholder="可填写用途、环境说明、负责人等信息"></textarea>
        </div>
      </div>

      <div class="admin-form__footer">
        <button class="admin-button admin-button--secondary" type="button" @click="closeDialog" :disabled="submitting">取消</button>
        <button class="admin-button admin-button--primary" type="submit" :disabled="submitting || loading">
          {{ submitting ? '提交中...' : editingId ? '保存修改' : '创建配置' }}
        </button>
      </div>
    </form>
  </AdminDialog>
</template>

<script setup lang="ts">
defineOptions({ name: 'AdminStorage' })
import './admin-storage.css'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import AdminDialog from '@/components/admin/common/AdminDialog.vue'
import AdminListToolbar, { type AdminListToolbarFacet } from '@/components/admin/common/AdminListToolbar.vue'
import AdminPagination from '@/components/admin/common/AdminPagination.vue'
import AdminSectionCard from '@/components/admin/common/AdminSectionCard.vue'
import AdminPageContainer from '@/components/admin/layout/AdminPageContainer.vue'
import { matchesAdminKeyword, useAdminListFilters } from '@/composables/useAdminListFilters'
import { useAdminPagination } from '@/composables/useAdminPagination'
import {
  activateStorageConfig,
  createStorageConfig,
  listStorageConfigs,
  testStorageConfig,
  updateStorageConfig,
  type StorageConnectivityResult,
  type StorageConnectivityStep,
  type StorageConfigItem,
  type StorageConfigPayload,
} from '@/api/storage-config'

const loading = ref(false)
const submitting = ref(false)
const activatingId = ref('')
const testingId = ref('')
const editingId = ref('')
const dialogVisible = ref(false)
const configs = ref<StorageConfigItem[]>([])
const testResults = reactive<Record<string, StorageConnectivityResult>>({})
const filters = reactive({
  keyword: '',
  status: 'ALL' as 'ALL' | 'DEFAULT' | 'ENABLED' | 'DISABLED',
})
const filterDefaults = {
  keyword: '',
  status: 'ALL' as 'ALL' | 'DEFAULT' | 'ENABLED' | 'DISABLED',
}

const createDefaultForm = () => ({
  name: '',
  code: '',
  accessKey: '',
  secretKey: '',
  endpoint: '',
  bucket: '',
  domain: '',
  region: '',
  sortOrder: 999,
  description: '',
  isEnabled: true,
  isDefault: false,
})

const form = reactive(createDefaultForm())

const enabledCount = computed(() => configs.value.filter(item => item.isEnabled).length)
const activeConfig = computed(() => configs.value.find(item => item.isDefault) || null)
const { hasFilters, resetFilters } = useAdminListFilters({
  filters,
  defaults: filterDefaults,
})
const { pagination, sliceItems, resetPage } = useAdminPagination({
  initialPageSize: 8,
})

// 统一维护筛选状态，保证列表、统计和空状态展示逻辑一致。
const filteredConfigs = computed(() => {
  return configs.value.filter((config) => {
    const matchedKeyword = matchesAdminKeyword(filters.keyword, [config.name, config.code])

    const matchedStatus = filters.status === 'ALL'
      || (filters.status === 'DEFAULT' && config.isDefault)
      || (filters.status === 'ENABLED' && config.isEnabled)
      || (filters.status === 'DISABLED' && !config.isEnabled)

    return matchedKeyword && matchedStatus
  })
})
const paginatedConfigs = computed(() => sliceItems(filteredConfigs.value))

const applyForm = (value = createDefaultForm()) => {
  form.name = value.name
  form.code = value.code
  form.accessKey = value.accessKey
  form.secretKey = value.secretKey
  form.endpoint = value.endpoint
  form.bucket = value.bucket
  form.domain = value.domain
  form.region = value.region
  form.sortOrder = value.sortOrder
  form.description = value.description
  form.isEnabled = value.isEnabled
  form.isDefault = value.isDefault
}

const loadConfigs = async () => {
  loading.value = true
  try {
    configs.value = await listStorageConfigs()
  } finally {
    loading.value = false
  }
}

const handleResetFilters = () => {
  resetFilters()
  resetPage()
}

const listFacets = computed<AdminListToolbarFacet[]>(() => [
  {
    key: 'status',
    title: '配置状态',
    options: [
      { label: '当前启用', value: 'DEFAULT' },
      { label: '已启用', value: 'ENABLED' },
      { label: '未启用', value: 'DISABLED' },
    ],
    modelValue: filters.status,
    emptyValue: 'ALL',
  },
])

const handleFacetUpdate = ({ key, value }: { key: string; value: string }) => {
  if (key === 'status') {
    filters.status = value as typeof filters.status
  }
}

watch(() => [filters.keyword, filters.status] as const, () => {
  resetPage()
})

const resetForm = () => {
  editingId.value = ''
  applyForm()
}

const openCreateDialog = () => {
  resetForm()
  dialogVisible.value = true
}

const closeDialog = () => {
  dialogVisible.value = false
  resetForm()
}

// 编辑已有配置时不回填明文密钥，留空表示沿用旧值。
const openEditDialog = (config: StorageConfigItem) => {
  editingId.value = config.id
  applyForm({
    name: config.name,
    code: config.code,
    accessKey: '',
    secretKey: '',
    endpoint: config.endpoint,
    bucket: config.bucket,
    domain: config.domain,
    region: config.region,
    sortOrder: config.sortOrder,
    description: config.description,
    isEnabled: config.isEnabled,
    isDefault: config.isDefault,
  })
  dialogVisible.value = true
}

const buildPayload = (): StorageConfigPayload => ({
  name: form.name,
  code: form.code,
  accessKey: form.accessKey,
  secretKey: form.secretKey,
  endpoint: form.endpoint,
  bucket: form.bucket,
  domain: form.domain || undefined,
  region: form.region || undefined,
  sortOrder: Number.isFinite(Number(form.sortOrder)) ? Number(form.sortOrder) : 999,
  description: form.description || undefined,
  isEnabled: form.isEnabled,
  isDefault: form.isDefault,
})

const handleSubmit = async () => {
  submitting.value = true
  try {
    if (editingId.value) {
      await updateStorageConfig(editingId.value, buildPayload())
    } else {
      await createStorageConfig(buildPayload())
    }

    await loadConfigs()
    closeDialog()
  } finally {
    submitting.value = false
  }
}

// 启用成功后重新拉一次列表，确保后台状态与服务端保持一致。
const handleActivate = async (id: string) => {
  activatingId.value = id
  try {
    await activateStorageConfig(id)
    await loadConfigs()
  } finally {
    activatingId.value = ''
  }
}

const handleTest = async (id: string) => {
  testingId.value = id
  try {
    testResults[id] = await testStorageConfig(id)
  } finally {
    testingId.value = ''
  }
}

const getStorageInitial = (value: string) => String(value || '').trim().slice(0, 1).toUpperCase() || 'S'
const formatDate = (value: string) => String(value || '').replace('T', ' ').slice(0, 16) || '未知时间'
const formatStorageTestStep = (step: StorageConnectivityStep) => {
  const statusText = step.ok ? '通过' : step.error || '失败'
  return `${statusText} · ${step.durationMs}ms`
}

onMounted(() => {
  void loadConfigs()
})
</script>
