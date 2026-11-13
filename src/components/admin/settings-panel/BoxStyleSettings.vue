<template>
  <div class="admin-settings-pane">
    <div class="admin-settings-group">
      <p class="admin-settings-group__title">
        卡片圆角
        <SettingHelpTip content="写入 --theme-card-radius；影响卡片、Banner 等盒状区域。" />
      </p>
      <div class="admin-settings-segment">
        <button
          v-for="option in options"
          :key="option.value"
          type="button"
          class="admin-settings-segment__item"
          :class="{ 'is-active': cardRadius === option.value }"
          @click="cardRadius = option.value"
        >
          {{ option.label }}
        </button>
      </div>
      <div
        class="admin-settings-radius-demo"
        :style="{ borderRadius: `${cardRadius}px` }"
        aria-hidden="true"
      >
        {{ cardRadius }}px
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import SettingHelpTip from './SettingHelpTip.vue'
import { useAdminAppearanceSettingsStore } from '@/stores/admin-appearance-settings'

const appearanceStore = useAdminAppearanceSettingsStore()
const { draft } = appearanceStore

const options = [
  { value: 0, label: '0' },
  { value: 6, label: '6' },
  { value: 12, label: '12' },
  { value: 16, label: '16' },
  { value: 24, label: '24' },
]

const cardRadius = computed({
  get: () => draft.value.globalThemeSettings.surfaces.cardRadius,
  set: (value: number) => {
    draft.value.globalThemeSettings.surfaces.cardRadius = value
  },
})
</script>
