<script setup lang="ts">
/**
 * 画布外观面板
 *
 * 挂在底部 Dock 工具栏"调色板"按钮上方的浮层，包含：
 *   - 主题模式切换（light / dark）
 *   - 画布背景模式 segmented（点阵 / 网格 / 空白）
 *   - 显示图片信息开关
 */
import { computed } from 'vue'
import { useThemePreferenceStore } from '@/stores/theme-preference'
import {
  canvasBackgroundMode,
  type WorkflowBackgroundMode,
} from '@/views/workflow/composables/useWorkflowCanvas'

const themePref = useThemePreferenceStore()

const isDark = computed(() => themePref.currentTheme.value === 'dark')

const setTheme = (mode: 'light' | 'dark') => {
  themePref.setThemeMode(mode)
}

const backgroundOptions: Array<{ value: WorkflowBackgroundMode; label: string }> = [
  { value: 'dots', label: '点阵' },
  { value: 'lines', label: '网格' },
  { value: 'blank', label: '空白' },
]

const setBackground = (mode: WorkflowBackgroundMode) => {
  canvasBackgroundMode.value = mode
}
</script>

<template>
  <div class="canvas-appearance-panel" role="dialog" aria-label="画布外观">
    <div class="canvas-appearance-panel__row">
      <span class="canvas-appearance-panel__label">主题</span>
      <div class="canvas-appearance-panel__theme">
        <button
          type="button"
          class="canvas-appearance-panel__icon-btn"
          :class="{ 'is-active': !isDark }"
          aria-label="浅色主题"
          @click="setTheme('light')"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
          </svg>
        </button>
        <button
          type="button"
          class="canvas-appearance-panel__icon-btn"
          :class="{ 'is-active': isDark }"
          aria-label="深色主题"
          @click="setTheme('dark')"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        </button>
      </div>
    </div>

    <div class="canvas-appearance-panel__divider" />

    <div class="canvas-appearance-panel__row">
      <span class="canvas-appearance-panel__label">背景</span>
      <div class="canvas-appearance-panel__segmented">
        <button
          v-for="opt in backgroundOptions"
          :key="opt.value"
          type="button"
          class="canvas-appearance-panel__seg-btn"
          :class="{ 'is-active': canvasBackgroundMode === opt.value }"
          @click="setBackground(opt.value)"
        >
          {{ opt.label }}
        </button>
      </div>
    </div>

    <div class="canvas-appearance-panel__divider" />

<!--    <div class="canvas-appearance-panel__row">-->
<!--      <span class="canvas-appearance-panel__label">图片信息</span>-->
<!--      <label class="canvas-appearance-panel__switch">-->
<!--        <input-->
<!--          type="checkbox"-->
<!--          :checked="canvasShowImageInfo"-->
<!--          @change="(e) => toggleShowImageInfo((e.target as HTMLInputElement).checked)"-->
<!--        />-->
<!--        <span class="canvas-appearance-panel__switch-slider" />-->
<!--      </label>-->
<!--    </div>-->
  </div>
</template>

<style scoped>
.canvas-appearance-panel {
  width: 248px;
  padding: 10px 12px;
  background: var(--canvas-float-block-default);
  backdrop-filter: blur(var(--canvas-float-backdrop-blur));
  -webkit-backdrop-filter: blur(var(--canvas-float-backdrop-blur));
  border: 0.5px solid var(--stroke-secondary);
  border-radius: var(--lv-border-radius-large);
  box-shadow: var(--shadow-generator-float-block);
  color: var(--text-primary);
  user-select: none;
}

.canvas-appearance-panel__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 4px 0;
}

.canvas-appearance-panel__label {
  font-size: 12px;
  color: var(--text-secondary);
}

.canvas-appearance-panel__theme {
  display: flex;
  gap: 4px;
}

.canvas-appearance-panel__icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  background: transparent;
  border: 0;
  border-radius: var(--lv-border-radius-medium);
  color: var(--text-secondary);
  cursor: pointer;
  transition: background-color 0.12s, color 0.12s;
}
.canvas-appearance-panel__icon-btn:hover {
  background: var(--canvas-float-block-hover);
}
.canvas-appearance-panel__icon-btn.is-active {
  background: var(--brand-main-block-default);
  color: var(--brand-main-default);
}

.canvas-appearance-panel__segmented {
  display: inline-flex;
  gap: 2px;
  padding: 2px;
  background: var(--canvas-bg-block-default);
  border-radius: var(--lv-border-radius-medium);
}
.canvas-appearance-panel__seg-btn {
  padding: 3px 10px;
  background: transparent;
  border: 0;
  border-radius: var(--lv-border-radius-small);
  font-size: 12px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: background-color 0.12s, color 0.12s;
}
.canvas-appearance-panel__seg-btn:hover {
  color: var(--text-primary);
}
.canvas-appearance-panel__seg-btn.is-active {
  background: var(--canvas-float-block-default);
  color: var(--brand-main-default);
}

.canvas-appearance-panel__divider {
  height: 1px;
  margin: 4px -12px;
  background: var(--stroke-secondary);
}

.canvas-appearance-panel__switch {
  position: relative;
  display: inline-block;
  width: 32px;
  height: 18px;
  cursor: pointer;
}
.canvas-appearance-panel__switch input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}
.canvas-appearance-panel__switch-slider {
  position: absolute;
  inset: 0;
  background: var(--canvas-bg-block-default);
  border-radius: 999px;
  transition: background-color 0.16s;
}
.canvas-appearance-panel__switch-slider::before {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 14px;
  height: 14px;
  background: var(--text-primary);
  border-radius: 50%;
  transition: transform 0.16s;
}
.canvas-appearance-panel__switch input:checked + .canvas-appearance-panel__switch-slider {
  background: var(--brand-main-default);
}
.canvas-appearance-panel__switch input:checked + .canvas-appearance-panel__switch-slider::before {
  transform: translateX(14px);
  background: #fff;
}
</style>
