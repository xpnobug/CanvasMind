<template>
  <AdminDialog
    :visible="visible"
    title="导出主题配置"
    description="导出当前主题与生成页相关配置为 JSON，可在其他环境导入复用"
    panel-class="admin-console-dialog admin-console-dialog--form admin-theme-ops-dialog"
    :close-disabled="exporting"
    @close="handleClose"
    @update:visible="value => emit('update:visible', value)"
  >
    <div class="admin-dialog__body admin-console-dialog__body admin-theme-ops-dialog__body theme-export-dialog__body">
      <section class="theme-ops-section">
        <div class="theme-ops-section__head">
          <div>
            <h4 class="theme-ops-section__title">导出分节</h4>
            <p class="theme-ops-section__desc">勾选需要导出的主题与生成页配置分节。</p>
          </div>
        </div>
        <div class="theme-export-dialog__sections">
          <label
            v-for="item in THEME_CONFIG_SECTION_OPTIONS"
            :key="item.key"
            class="admin-checkbox-item theme-export-dialog__section-item"
          >
            <input v-model="sectionSelection[item.key]" type="checkbox" :disabled="exporting">
            <span>{{ item.label }}</span>
          </label>
        </div>
      </section>

      <div class="admin-form__footer admin-console-dialog__footer admin-theme-ops-dialog__footer">
        <button class="admin-button admin-button--secondary admin-theme-ops-dialog__footer-btn" type="button" :disabled="exporting" @click="handleClose">取消</button>
        <button class="admin-button admin-button--primary admin-theme-ops-dialog__footer-btn" type="button" :disabled="exporting || !selectedSections.length" @click="handleExport">
          {{ exporting ? '导出中...' : '导出 JSON' }}
        </button>
      </div>
    </div>
  </AdminDialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import AdminDialog from '@/components/admin/common/AdminDialog.vue'
import { buildExportFilename, downloadJsonFile } from '@/utils/download-json'
import {
  THEME_CONFIG_SECTION_OPTIONS,
  buildThemeConfigExportBundle,
  createDefaultThemeConfigSectionSelection,
  getSelectedThemeConfigSections,
  type ThemeConfigSectionKey,
  type ThemeConfigTransferSource,
} from '@/views/admin/theme/theme-config-transfer'

defineOptions({ name: 'AdminThemeExportDialog' })

const props = defineProps<{
  visible: boolean
  source: ThemeConfigTransferSource
}>()

const emit = defineEmits<{
  (event: 'update:visible', value: boolean): void
}>()

const exporting = ref(false)
const sectionSelection = ref<Record<ThemeConfigSectionKey, boolean>>(createDefaultThemeConfigSectionSelection())

const selectedSections = computed(() => getSelectedThemeConfigSections(sectionSelection.value))

watch(() => props.visible, (visible) => {
  if (visible) {
    sectionSelection.value = createDefaultThemeConfigSectionSelection()
  }
})

const handleClose = () => {
  if (exporting.value) return
  emit('update:visible', false)
}

const handleExport = () => {
  if (!selectedSections.value.length || exporting.value) return
  exporting.value = true
  try {
    const bundle = buildThemeConfigExportBundle(props.source, selectedSections.value)
    downloadJsonFile(buildExportFilename('theme-config'), bundle)
    ElMessage.success(`已导出 ${selectedSections.value.length} 个分节`)
    emit('update:visible', false)
  } finally {
    exporting.value = false
  }
}
</script>

<style scoped>
.theme-export-dialog__sections {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.theme-export-dialog__section-item {
  display: inline-flex;
  align-items: flex-start;
  gap: 8px;
  cursor: pointer;
  font-size: 12px;
  line-height: 1.6;
}
</style>
