<template>
  <div class="admin-list-toolbar">
    <slot />

    <AdminFacetedFilter
      v-for="facet in facets"
      :key="facet.key"
      :title="facet.title"
      :options="facet.options"
      :model-value="facet.modelValue"
      :empty-value="facet.emptyValue ?? ''"
      :disabled="disabled || facet.disabled"
      @update:model-value="(value) => emitFacet(facet.key, value)"
      @change="(value) => emitFacetChange(facet.key, value)"
    />

    <slot name="after" />

    <button
      v-if="hasActiveFilters"
      class="admin-list-toolbar__clear"
      type="button"
      :disabled="disabled"
      @click="emit('clear')"
    >
      <el-icon :size="14"><RefreshLeft /></el-icon>
      <span>{{ clearLabel }}</span>
    </button>

    <slot name="actions" />
  </div>
</template>

<script setup lang="ts">
import { RefreshLeft } from '@element-plus/icons-vue'
import AdminFacetedFilter, {
  type AdminFacetedFilterOption,
} from '@/components/admin/common/AdminFacetedFilter.vue'

export interface AdminListToolbarFacet {
  key: string
  title: string
  options: AdminFacetedFilterOption[]
  modelValue: string
  emptyValue?: string
  disabled?: boolean
}

withDefaults(defineProps<{
  facets?: AdminListToolbarFacet[]
  hasActiveFilters?: boolean
  disabled?: boolean
  clearLabel?: string
}>(), {
  facets: () => [],
  hasActiveFilters: false,
  disabled: false,
  clearLabel: '清除筛选',
})

const emit = defineEmits<{
  clear: []
  'update:facet': [payload: { key: string; value: string }]
  'facet-change': [payload: { key: string; value: string }]
}>()

const emitFacet = (key: string, value: string) => {
  emit('update:facet', { key, value })
}

const emitFacetChange = (key: string, value: string) => {
  emit('facet-change', { key, value })
}
</script>
