<template>
  <div
    v-if="shouldShow"
    class="admin-pagination"
    :class="{ 'is-disabled': disabled }"
  >
    <div v-if="totalPages > 1" class="admin-pagination__controls">
      <button
        class="admin-pagination__button is-nav"
        type="button"
        aria-label="上一页"
        :disabled="disabled || currentPage <= 1"
        @click="updatePage(currentPage - 1)"
      >
        <el-icon :size="16"><ArrowLeft /></el-icon>
        <span class="admin-pagination__nav-text">上一页</span>
      </button>

      <button
        v-for="item in pageItems"
        :key="item.key"
        class="admin-pagination__button"
        :class="{
          'is-active': item.type === 'page' && item.value === currentPage,
          'is-ellipsis': item.type === 'ellipsis',
          'is-page': item.type === 'page',
        }"
        type="button"
        :disabled="disabled || item.type === 'ellipsis'"
        @click="item.type === 'page' && updatePage(item.value)"
      >
        <el-icon v-if="item.type === 'ellipsis'" :size="16"><MoreFilled /></el-icon>
        <template v-else>{{ item.label }}</template>
      </button>

      <button
        class="admin-pagination__button is-nav"
        type="button"
        aria-label="下一页"
        :disabled="disabled || currentPage >= totalPages"
        @click="updatePage(currentPage + 1)"
      >
        <span class="admin-pagination__nav-text">下一页</span>
        <el-icon :size="16"><ArrowRight /></el-icon>
      </button>
    </div>

    <div
      v-if="showSizeChanger"
      class="admin-pagination__size"
      role="group"
      aria-label="每页条数"
    >
      <span class="admin-pagination__size-label">每页</span>
      <div class="admin-pagination__size-options">
        <button
          v-for="size in resolvedPageSizes"
          :key="size"
          class="admin-pagination__button is-size"
          :class="{ 'is-active': size === currentPageSize }"
          type="button"
          :disabled="disabled"
          :aria-pressed="size === currentPageSize"
          @click="updatePageSize(size)"
        >
          {{ size }}
        </button>
      </div>
      <span class="admin-pagination__size-label">条</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ArrowLeft, ArrowRight, MoreFilled } from '@element-plus/icons-vue'

interface PaginationItem {
  key: string
  label: string
  type: 'page' | 'ellipsis'
  value: number
}

const DEFAULT_PAGE_SIZES = [12, 20, 50]

const props = withDefaults(defineProps<{
  page: number
  pageSize: number
  total: number
  disabled?: boolean
  /** 是否显示每页条数选择；默认开启，后台列表统一可调 */
  showSizeChanger?: boolean
  /** 可选每页条数；默认 12 / 20 / 50 */
  pageSizes?: readonly number[]
}>(), {
  disabled: false,
  showSizeChanger: true,
  // withDefaults 宏默认值不能引用外部变量，需内联字面量
  pageSizes: () => [12, 20, 50],
})

const emit = defineEmits<{
  'update:page': [value: number]
  'update:pageSize': [value: number]
  'change': [payload: { page: number; pageSize: number }]
}>()

const totalPages = computed(() => {
  const safePageSize = Math.max(1, Number(props.pageSize || 1))
  return Math.max(1, Math.ceil(Math.max(0, Number(props.total || 0)) / safePageSize))
})

const currentPage = computed(() => {
  const rawPage = Number(props.page || 1)
  return Math.min(Math.max(1, rawPage), totalPages.value)
})

const currentPageSize = computed(() => Math.max(1, Number(props.pageSize || 1)))

const resolvedPageSizes = computed(() => {
  const sizes = (props.pageSizes?.length ? props.pageSizes : DEFAULT_PAGE_SIZES)
    .map(size => Math.max(1, Number(size) || 0))
    .filter(size => size > 0)
  const unique = Array.from(new Set(sizes)).sort((a, b) => a - b)
  if (!unique.includes(currentPageSize.value)) {
    unique.push(currentPageSize.value)
    unique.sort((a, b) => a - b)
  }
  return unique
})

const shouldShow = computed(() => {
  if (Number(props.total || 0) <= 0) {
    return false
  }
  return totalPages.value > 1 || props.showSizeChanger
})

/** 分页页码槽位：siblingCount=1 → 约 7 个槽位 */
const pageItems = computed<PaginationItem[]>(() => {
  const pages = totalPages.value
  const maxVisible = 7

  if (pages <= maxVisible) {
    return Array.from({ length: pages }, (_, index) => ({
      key: `page-${index + 1}`,
      label: String(index + 1),
      type: 'page' as const,
      value: index + 1,
    }))
  }

  const items: PaginationItem[] = []
  const innerWindow = maxVisible - 2
  const halfWindow = Math.floor(innerWindow / 2)
  let start = Math.max(2, currentPage.value - halfWindow)
  let end = Math.min(pages - 1, start + innerWindow - 1)

  if (end >= pages - 1) {
    end = pages - 1
    start = Math.max(2, end - innerWindow + 1)
  }

  items.push({ key: 'page-1', label: '1', type: 'page', value: 1 })

  if (start > 2) {
    items.push({ key: 'ellipsis-left', label: '...', type: 'ellipsis', value: -1 })
  }

  for (let page = start; page <= end; page += 1) {
    items.push({ key: `page-${page}`, label: String(page), type: 'page', value: page })
  }

  if (end < pages - 1) {
    items.push({ key: 'ellipsis-right', label: '...', type: 'ellipsis', value: -1 })
  }

  items.push({ key: `page-${pages}`, label: String(pages), type: 'page', value: pages })
  return items
})

const updatePage = (page: number) => {
  const nextPage = Math.min(Math.max(1, page), totalPages.value)
  if (nextPage === currentPage.value) {
    return
  }
  emit('update:page', nextPage)
  emit('change', { page: nextPage, pageSize: currentPageSize.value })
}

const updatePageSize = (pageSize: number) => {
  const nextSize = Math.max(1, Number(pageSize) || currentPageSize.value)
  if (nextSize === currentPageSize.value) {
    return
  }
  emit('update:pageSize', nextSize)
  emit('update:page', 1)
  emit('change', { page: 1, pageSize: nextSize })
}
</script>

<style scoped>
.admin-pagination {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-start;
  width: fit-content;
  max-width: 100%;
  margin: 0;
  padding: 8px 0;
  border-top: none;
  gap: 12px;
  background: transparent;
}

.admin-pagination.is-disabled {
  opacity: 0.72;
}

.admin-pagination__controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-start;
  gap: 4px;
}

.admin-pagination__button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-width: 36px;
  width: auto;
  height: 36px;
  padding: 0 12px;
  border: 1px solid transparent;
  border-radius: var(--admin-radius-panel);
  background: transparent;
  color: var(--text-secondary);
  box-shadow: none;
  font-size: 14px;
  font-weight: 500;
  line-height: 1;
  cursor: pointer;
  transition: background-color .15s ease, color .15s ease, border-color .15s ease;
}

.admin-pagination__button.is-page {
  width: 36px;
  min-width: 36px;
  max-width: 36px;
  padding: 0;
  font-variant-numeric: tabular-nums;
}

.admin-pagination__button.is-active {
  background: color-mix(in srgb, var(--text-primary, #fff) 18%, transparent);
  border-color: color-mix(in srgb, var(--text-primary, #fff) 30%, transparent);
  color: var(--text-primary);
  font-weight: 600;
}

.admin-pagination__button.is-nav {
  padding: 0 10px;
}

.admin-pagination__button:hover:not(:disabled) {
  background: color-mix(in srgb, var(--text-primary, #fff) 10%, transparent);
  color: var(--text-primary);
  border-color: transparent;
}

.admin-pagination__button.is-active:hover:not(:disabled) {
  background: color-mix(in srgb, var(--text-primary, #fff) 24%, transparent);
  border-color: color-mix(in srgb, var(--text-primary, #fff) 36%, transparent);
}

.admin-pagination__button.is-ellipsis {
  width: 36px;
  min-width: 36px;
  max-width: 36px;
  padding: 0;
  color: var(--text-tertiary, var(--text-secondary));
  pointer-events: none;
  border-color: transparent;
}

.admin-pagination__button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.admin-pagination__nav-text {
  display: none;
}

.admin-pagination__size {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  user-select: none;
}

.admin-pagination__size-label {
  color: var(--text-tertiary);
  font-size: 13px;
  line-height: 1;
}

.admin-pagination__size-options {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px;
  border-radius: var(--admin-radius-control);
  background: color-mix(in srgb, var(--text-primary, #fff) 6%, transparent);
}

.admin-pagination__button.is-size {
  min-width: 36px;
  width: auto;
  height: 32px;
  padding: 0 10px;
  border-radius: var(--admin-radius-panel);
  font-size: 13px;
  font-variant-numeric: tabular-nums;
}

@media (min-width: 640px) {
  .admin-pagination__nav-text {
    display: inline;
  }
}
</style>

<style>
html[data-theme='dark'] .admin-pagination .admin-pagination__button.is-active {
  background: rgba(255, 255, 255, 0.16) !important;
  border-color: rgba(255, 255, 255, 0.28) !important;
  color: #f3f4f6 !important;
}

html[data-theme='dark'] .admin-pagination .admin-pagination__button.is-active:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.22) !important;
  border-color: rgba(255, 255, 255, 0.34) !important;
}
</style>
