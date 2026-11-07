<template>
  <el-tooltip
    :placement="placement"
    :show-after="200"
    popper-class="canana-ep-tooltip admin-settings-help-popper"
  >
    <template #content>
      <slot name="content">
        <span class="admin-settings-help-tip__text">{{ content }}</span>
      </slot>
    </template>
    <button
      type="button"
      class="admin-settings-help-tip"
      :aria-label="ariaLabel"
      @click.stop
    >
      ?
    </button>
  </el-tooltip>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  content?: string
  ariaLabel?: string
  placement?: 'top' | 'bottom' | 'left' | 'right'
}>(), {
  content: '',
  ariaLabel: '查看说明',
  placement: 'top',
})
</script>
