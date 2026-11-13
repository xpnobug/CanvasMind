<template>
  <div class="admin-art-table" :class="{ 'is-empty': isEmpty }">
    <el-table
      ref="tableRef"
      v-loading="showLoadingOverlay"
      class="admin-art-table__el"
      element-loading-background="transparent"
      :data="data"
      :header-cell-style="headerCellStyle"
      v-bind="$attrs"
    >
      <slot />

      <template #empty>
        <div v-if="loading" />
        <slot
          v-else
          name="empty"
        >
          <el-empty
            :description="emptyText"
            :image-size="120"
          />
        </slot>
      </template>
    </el-table>
    <slot name="footer" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import './admin-art-table.css'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  data?: unknown[]
  loading?: boolean
  emptyText?: string
}>(), {
  data: () => [],
  loading: false,
  emptyText: '暂无数据',
})

const tableRef = ref<{ clearSelection: () => void } | null>(null)

const isEmpty = computed(() => !props.loading && props.data.length === 0)

// 翻页时保留当前数据，不再盖全表 loading 遮罩，避免分页切换闪烁。
const showLoadingOverlay = computed(() => Boolean(props.loading) && props.data.length === 0)

const headerCellStyle = {
  background: 'var(--bg-block-secondary-default)',
  color: 'var(--text-secondary)',
  fontWeight: 600,
}

const clearSelection = () => {
  tableRef.value?.clearSelection()
}

defineExpose({
  tableRef,
  clearSelection,
})
</script>
