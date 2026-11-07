<template>
  <AdminDialog
    :visible="visible"
    title="导入主题配置"
    description="粘贴或上传「主题配置导出」生成的 JSON；导入后覆盖对应分节并保存（兼容旧包仅含 conversationEntryDisplay）"
    panel-class="admin-console-dialog admin-console-dialog--form admin-theme-ops-dialog"
    :close-disabled="importing"
    @close="handleClose"
    @update:visible="value => emit('update:visible', value)"
  >
    <div class="admin-dialog__body admin-console-dialog__body admin-theme-ops-dialog__body theme-import-dialog__body">
      <section v-if="result" class="theme-ops-section">
        <div class="theme-ops-section__head">
          <div>
            <h4 class="theme-ops-section__title">导入完成</h4>
            <p class="theme-ops-section__desc">已应用以下分节。</p>
          </div>
        </div>
        <p class="theme-import-dialog__result-summary">{{ result.summary }}</p>
      </section>

      <section v-else class="theme-ops-section">
        <div class="theme-ops-section__head">
          <div class="theme-ops-section__heading">
            <h4 class="theme-ops-section__title">配置包 JSON</h4>
          </div>
          <button class="admin-button admin-button--secondary theme-ops-add" type="button" :disabled="importing" @click="triggerFilePick">
            选择文件
          </button>
          <input
            ref="fileInputRef"
            class="theme-import-dialog__file"
            type="file"
            accept=".json,application/json"
            @change="handleFilePicked"
          >
        </div>
        <div class="theme-ops-grid">
          <div class="theme-ops-field theme-ops-field--full">
            <textarea
              v-model="jsonText"
              class="admin-input theme-import-dialog__textarea"
              rows="10"
              placeholder='粘贴导出的 JSON 内容，或点击上方「选择文件」读取'
              :disabled="importing"
            />
          </div>
          <p class="theme-ops-hint theme-ops-field--full">
            导入会覆盖配置包内包含的分节（品牌色、侧栏菜单、Banner、动画、工作台展示等），并立即保存到后台。
          </p>
        </div>
      </section>

      <div class="admin-form__footer admin-console-dialog__footer admin-theme-ops-dialog__footer">
        <button class="admin-button admin-button--secondary admin-theme-ops-dialog__footer-btn" type="button" :disabled="importing" @click="handleClose">
          {{ result ? '关闭' : '取消' }}
        </button>
        <button v-if="result" class="admin-button admin-button--primary admin-theme-ops-dialog__footer-btn" type="button" @click="resetForm">继续导入</button>
        <button v-else class="admin-button admin-button--primary admin-theme-ops-dialog__footer-btn" type="button" :disabled="importing || !jsonText.trim()" @click="handleImport">
          {{ importing ? '导入中...' : '开始导入' }}
        </button>
      </div>
    </div>
  </AdminDialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import AdminDialog from '@/components/admin/common/AdminDialog.vue'
import {
  applyThemeConfigImportBundle,
  formatThemeConfigImportSummary,
  parseThemeConfigImportTextLoose,
  type ThemeConfigTransferSource,
} from '@/views/admin/theme/theme-config-transfer'

defineOptions({ name: 'AdminThemeImportDialog' })

const props = defineProps<{
  visible: boolean
  source: ThemeConfigTransferSource
  applyImport: (next: ThemeConfigTransferSource) => Promise<void>
}>()

const emit = defineEmits<{
  (event: 'update:visible', value: boolean): void
}>()

const fileInputRef = ref<HTMLInputElement | null>(null)
const jsonText = ref('')
const importing = ref(false)
const result = ref<{ summary: string } | null>(null)

const resetForm = () => {
  jsonText.value = ''
  result.value = null
}

watch(() => props.visible, (visible) => {
  if (visible) {
    resetForm()
  }
})

const handleClose = () => {
  if (importing.value) return
  emit('update:visible', false)
}

const triggerFilePick = () => {
  fileInputRef.value?.click()
}

const handleFilePicked = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    jsonText.value = String(reader.result || '')
  }
  reader.onerror = () => {
    ElMessage.error('文件读取失败')
  }
  reader.readAsText(file)
}

const handleImport = async () => {
  if (!jsonText.value.trim() || importing.value) return
  importing.value = true
  try {
    const bundle = parseThemeConfigImportTextLoose(jsonText.value)
    const { next, result: importResult } = applyThemeConfigImportBundle(props.source, bundle)
    await props.applyImport(next)
    result.value = {
      summary: formatThemeConfigImportSummary(importResult.appliedSections),
    }
    ElMessage.success('主题配置已导入并保存')
  } catch (error) {
    if (!(error instanceof Error && error.message === 'save failed')) {
      ElMessage.error(error instanceof Error ? error.message : '导入失败，请检查 JSON 内容')
    }
  } finally {
    importing.value = false
  }
}
</script>

<style scoped>
.theme-import-dialog__file {
  display: none;
}

.theme-import-dialog__textarea {
  width: 100%;
  box-sizing: border-box;
  min-height: 220px;
  resize: vertical;
  font-family: var(--admin-font-mono, monospace);
  font-size: 12px;
  line-height: 1.6;
}

.theme-import-dialog__result-summary {
  margin: 0;
  font-size: 13px;
  line-height: 1.8;
}
</style>
