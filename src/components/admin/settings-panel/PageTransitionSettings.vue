<template>
  <div class="admin-settings-pane">
    <div class="admin-settings-group">
      <p class="admin-settings-group__title">
        路由过渡
        <SettingHelpTip content="前台与后台主内容区共用；侧栏与顶栏不参与。" />
      </p>
      <label class="admin-settings-select-field">
        <span class="admin-settings-select-field__label">过渡效果</span>
        <select v-model="pageTransition" class="admin-settings-select-field__control">
          <option
            v-for="option in PAGE_TRANSITION_OPTIONS"
            :key="option.value || 'none'"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import SettingHelpTip from './SettingHelpTip.vue'

type PageTransitionType = '' | 'fade' | 'slide-left' | 'slide-bottom' | 'slide-top'

const PAGE_TRANSITION_OPTIONS: Array<{ value: PageTransitionType, label: string }> = [
  { value: '', label: '无动画' },
  { value: 'fade', label: '淡入淡出' },
  { value: 'slide-left', label: '左侧滑入' },
  { value: 'slide-bottom', label: '下方滑入' },
  { value: 'slide-top', label: '上方滑入' },
]

const pageTransition = ref<PageTransitionType>('slide-left')
</script>
