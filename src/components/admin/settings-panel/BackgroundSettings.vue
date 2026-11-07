<template>
  <div>
    <SectionTitle
      title="背景体系"
      :tip="BACKGROUND_SECTION_TIP"
    />

    <div class="admin-settings-subsection">
      <SubsectionTitle title="深色背景方案" :tip="DARK_BACKGROUND_TIP" />
      <div class="admin-settings-color-grid">
        <SettingColorField
          v-model="darkPage"
          label="深色页面背景"
          placeholder="#0f0f12"
        />
        <SettingColorField
          v-model="darkSurface"
          label="深色表层背景"
          placeholder="#15161a"
        />
        <SettingColorField
          v-model="darkSideMenu"
          label="深色侧栏背景"
          placeholder="#111218"
        />
      </div>
    </div>

    <div class="admin-settings-subsection">
      <SubsectionTitle title="浅色背景方案" :tip="LIGHT_BACKGROUND_TIP" />
      <div class="admin-settings-color-grid">
        <SettingColorField
          v-model="lightPage"
          label="浅色页面背景"
          placeholder="#f8f9fa"
        />
        <SettingColorField
          v-model="lightSurface"
          label="浅色表层背景"
          placeholder="#ffffff"
        />
        <SettingColorField
          v-model="lightSideMenu"
          label="浅色侧栏背景"
          placeholder="#ffffff"
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
import { useAdminAppearanceSettingsStore } from '@/stores/admin-appearance-settings'

const BACKGROUND_SECTION_TIP = [
  '按深、浅主题各配一套页面 / 卡片 / 侧栏底色，与品牌色独立配置。',
  '保存后写入 --bg-body、--bg-surface 等 CSS 变量。',
].join('\n')

const DARK_BACKGROUND_TIP = '用户处于深色主题时，控制整页底色、卡片与输入面板表层色，以及左侧导航背景。'
const LIGHT_BACKGROUND_TIP = '用户处于浅色主题时，控制整页底色、卡片与输入面板表层色，以及左侧导航背景。'

const appearanceStore = useAdminAppearanceSettingsStore()
const { draft } = appearanceStore

const bindBackground = (theme: 'dark' | 'light', key: 'page' | 'surface' | 'sideMenu') => {
  return computed({
    get: () => draft.value.globalThemeSettings.themes[theme].backgrounds[key],
    set: (value: string) => {
      draft.value.globalThemeSettings.themes[theme].backgrounds[key] = value
    },
  })
}

const darkPage = bindBackground('dark', 'page')
const darkSurface = bindBackground('dark', 'surface')
const darkSideMenu = bindBackground('dark', 'sideMenu')
const lightPage = bindBackground('light', 'page')
const lightSurface = bindBackground('light', 'surface')
const lightSideMenu = bindBackground('light', 'sideMenu')
</script>
