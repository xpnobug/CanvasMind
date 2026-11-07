<template>
  <div>
    <SectionTitle
      title="盒子样式"
      tip="统一设置前台卡片、Banner 等盒状区域的圆角（单位 px）。保存后写入主题变量 --theme-card-radius，主题预览即时生效。"
    />
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
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import SectionTitle from './SectionTitle.vue'
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
