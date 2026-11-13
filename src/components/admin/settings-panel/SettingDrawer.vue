<template>
  <el-drawer
    v-model="visible"
    class="admin-settings-drawer"
    size="min(840px, 96vw)"
    :with-header="false"
    :lock-scroll="true"
    :destroy-on-close="false"
    modal-class="admin-setting-modal"
    @open="emit('open')"
    @close="emit('close')"
  >
    <div class="admin-settings-panel__body">
      <slot />
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  open: []
  close: []
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
})
</script>
