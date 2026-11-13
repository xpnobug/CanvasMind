<template>
  <div class="admin-table-header">
    <div v-if="$slots.left" class="admin-table-header__left">
      <slot name="left" />
    </div>
    <div class="admin-table-header__right">
      <button
        class="admin-table-header__btn"
        type="button"
        :disabled="loading"
        aria-label="刷新"
        @click="emit('refresh')"
      >
        <el-icon :class="{ 'is-loading': loading }">
          <Refresh />
        </el-icon>
      </button>
      <slot name="right" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { Refresh } from '@element-plus/icons-vue'
import './admin-art-table.css'

withDefaults(defineProps<{
  loading?: boolean
}>(), {
  loading: false,
})

const emit = defineEmits<{
  refresh: []
}>()
</script>
