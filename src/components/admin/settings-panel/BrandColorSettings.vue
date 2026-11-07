<template>
  <div>
    <SectionTitle
      title="品牌与语义色"
      :tip="BRAND_SECTION_TIP"
    />
    <div class="admin-settings-color-row">
      <button
        v-for="color in presetColors"
        :key="color"
        type="button"
        class="admin-settings-color-dot"
        :style="{ background: color }"
        :title="color"
        @click="selectColor(color)"
      >
        <span v-if="color === primaryColor" style="color:#fff;font-size:12px">✓</span>
      </button>
    </div>

    <ThemeColorPreview />

    <div class="admin-settings-subsection">
      <SubsectionTitle title="主按钮颜色" :tip="PRIMARY_BUTTON_TIP" />
      <div class="admin-settings-color-grid">
        <SettingColorField
          v-for="field in primaryButtonFields"
          :key="field.key"
          :model-value="draft.globalThemeSettings.brandColors[field.key]"
          :label="field.label"
          :placeholder="field.placeholder"
          @update:model-value="updateBrandColor(field.key, $event)"
        />
      </div>
    </div>

    <div class="admin-settings-subsection">
      <SubsectionTitle title="辅助与强调" :tip="ACCENT_TIP" />
      <div class="admin-settings-color-grid">
        <SettingColorField
          v-for="field in accentButtonFields"
          :key="field.key"
          :model-value="draft.globalThemeSettings.brandColors[field.key]"
          :label="field.label"
          :placeholder="field.placeholder"
          @update:model-value="updateBrandColor(field.key, $event)"
        />
      </div>
    </div>

    <div class="admin-settings-subsection">
      <SubsectionTitle title="状态反馈颜色" :tip="STATUS_COLOR_TIP" />
      <div class="admin-settings-color-grid">
        <SettingColorField
          v-for="field in statusColorFields"
          :key="field.key"
          :model-value="draft.globalThemeSettings.brandColors[field.key]"
          :label="field.label"
          :placeholder="field.placeholder"
          @update:model-value="updateBrandColor(field.key, $event)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import SectionTitle from './SectionTitle.vue'
import SubsectionTitle from './SubsectionTitle.vue'
import SettingColorField from './SettingColorField.vue'
import ThemeColorPreview from './ThemeColorPreview.vue'
import { useAdminAppearanceSettingsStore } from '@/stores/admin-appearance-settings'

type BrandColorKey =
  | 'primary'
  | 'primaryHover'
  | 'primaryActive'
  | 'secondary'
  | 'accent'
  | 'success'
  | 'warning'
  | 'danger'

const BRAND_SECTION_TIP = [
  '公开版品牌色为全站共用一套（明暗主题共用主色），状态色同样全局生效。',
  '可快速选择主色预设，或在下方细项中分别调整。',
  '修改后预览区即时反映，点底部「保存」写入全站。',
].join('\n')

const PRIMARY_BUTTON_TIP = '影响：主操作按钮、链接强调、进度条与选中描边。'
const ACCENT_TIP = '影响：次按钮、标签、侧栏次要文字与辅助入口。'
const STATUS_COLOR_TIP = '全局生效，用于成功 / 警告 / 失败类反馈。'

const PRESET_COLORS = ['#6f35ff', '#1677ff', '#0d9488', '#e6a23c', '#f56c6c', '#111827']

const primaryButtonFields = [
  { key: 'primary' as const, label: '主按钮默认色', placeholder: '#6f35ff' },
  { key: 'primaryHover' as const, label: '主按钮悬浮色', placeholder: '#5b28e6' },
  { key: 'primaryActive' as const, label: '主按钮按下色', placeholder: '#4c20c4' },
]

const accentButtonFields = [
  { key: 'secondary' as const, label: '辅助色', placeholder: '#00c2d6' },
  { key: 'accent' as const, label: '强调色', placeholder: '#ff7a59' },
]

const statusColorFields = [
  { key: 'success' as const, label: '成功色', placeholder: '#18b566' },
  { key: 'warning' as const, label: '警告色', placeholder: '#ffb020' },
  { key: 'danger' as const, label: '危险色', placeholder: '#f04438' },
]

const appearanceStore = useAdminAppearanceSettingsStore()
const { draft } = appearanceStore

const presetColors = PRESET_COLORS
const primaryColor = computed(() => draft.value.globalThemeSettings.brandColors.primary)

const shadeColor = (hex: string, amount: number) => {
  const normalized = hex.replace('#', '')
  if (normalized.length !== 6) {
    return hex
  }
  const channels = [0, 2, 4].map(index => Number.parseInt(normalized.slice(index, index + 2), 16))
  const next = channels.map(channel => {
    const value = channel + amount
    return Math.max(0, Math.min(255, value))
  })
  return `#${next.map(value => value.toString(16).padStart(2, '0')).join('')}`
}

const selectColor = (color: string) => {
  const brand = draft.value.globalThemeSettings.brandColors
  brand.primary = color
  brand.primaryHover = shadeColor(color, -18)
  brand.primaryActive = shadeColor(color, -36)
}

const updateBrandColor = (key: BrandColorKey, value: string) => {
  draft.value.globalThemeSettings.brandColors[key] = value
}
</script>
