<template>
  <div class="admin-settings-footer">
    <button
      class="admin-button admin-button--secondary"
      type="button"
      :disabled="saving"
      @click="appearanceStore.resetDraft()"
    >
      撤销修改
    </button>
    <button
      class="admin-button admin-button--primary"
      type="button"
      :disabled="saving || loading"
      @click="handleSave"
    >
      {{ saving ? '保存中...' : '保存并生效' }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { useAdminAppearanceSettingsStore } from '@/stores/admin-appearance-settings'

const appearanceStore = useAdminAppearanceSettingsStore()
const { saving, loading } = appearanceStore

const handleSave = () => {
  void appearanceStore.saveAndNotify()
}
</script>
