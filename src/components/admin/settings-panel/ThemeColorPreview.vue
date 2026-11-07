<template>
  <div class="admin-theme-color-preview" aria-label="主题色实时预览">
    <div class="admin-theme-color-preview__title-row">
      <span class="admin-theme-color-preview__title">实时预览</span>
      <SettingHelpTip :content="PREVIEW_TIP" />
    </div>

    <div class="admin-theme-color-preview__row">
      <span
        class="admin-theme-color-preview__btn admin-theme-color-preview__btn--primary"
        :style="primaryBtnStyle"
      >
        主按钮
      </span>
      <span
        class="admin-theme-color-preview__btn admin-theme-color-preview__btn--secondary"
        :style="secondaryBtnStyle"
      >
        次按钮
      </span>
    </div>

    <div class="admin-theme-color-preview__row">
      <span
        v-for="badge in statusBadges"
        :key="badge.key"
        class="admin-theme-color-preview__badge"
        :style="{ color: badge.color, borderColor: badge.color }"
      >
        {{ badge.label }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import SettingHelpTip from './SettingHelpTip.vue'
import { useAdminAppearanceSettingsStore } from '@/stores/admin-appearance-settings'

const PREVIEW_TIP = '下方样例随左侧色值即时变化，保存后全站生效。'

const appearanceStore = useAdminAppearanceSettingsStore()
const { draft } = appearanceStore

const colors = computed(() => {
  const brand = draft.value.globalThemeSettings.brandColors
  return {
    primary: brand.primary,
    primaryHover: brand.primaryHover,
    success: brand.success,
    warning: brand.warning,
    danger: brand.danger,
    secondary: brand.secondary,
  }
})

const primaryBtnStyle = computed(() => ({
  background: colors.value.primary,
  borderColor: colors.value.primary,
}))

const secondaryBtnStyle = computed(() => ({
  color: colors.value.secondary,
  borderColor: colors.value.secondary,
}))

const statusBadges = computed(() => [
  { key: 'success', label: '成功提示', color: colors.value.success },
  { key: 'warning', label: '警告提示', color: colors.value.warning },
  { key: 'danger', label: '危险提示', color: colors.value.danger },
])
</script>
