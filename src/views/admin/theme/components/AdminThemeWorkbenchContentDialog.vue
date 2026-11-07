<template>
  <div v-if="visible && draft" class="admin-dialog-mask" @click="emit('close')">
    <div class="admin-dialog admin-theme-workbench-content-dialog" @click.stop>
      <div class="admin-dialog__header">
        <div>
          <h3 class="admin-dialog__title">编辑{{ draft.label }}</h3>
          <div class="admin-dialog__desc">直接维护前台首页右侧工作台的实时展示内容。</div>
        </div>
        <button class="admin-dialog__close" type="button" @click="emit('close')">×</button>
      </div>

      <div class="admin-form admin-dialog__body">
        <div class="admin-form__grid">
          <div class="admin-form__field admin-form__field--full">
            <label class="admin-switch-row">
              <input v-model="draft.settings.enabled" type="checkbox">
              <span>{{ visibilityLabel }}</span>
            </label>
          </div>

          <template v-if="draft.blockKey === 'header-background'">
            <div class="admin-form__field admin-form__field--full">
              <div class="admin-theme-workbench-content-dialog__hint">
                控制首页整页背景图与顶区光晕/星点。关闭后前台不铺图、不挂载 SVG；后台预览仍保留操作入口。
              </div>
            </div>
            <div class="admin-form__field admin-form__field--full">
              <div class="admin-theme-workbench-content-dialog__section-head">
                <label class="admin-form__label">背景图</label>
                <button class="admin-button admin-button--secondary admin-theme-workbench-content-dialog__reset" type="button" @click="resetHeaderBackgroundSettings">
                  重置默认
                </button>
              </div>
              <p class="admin-theme-workbench-content-dialog__desc">
                暗/亮色分别配置；对应主题下为空则不铺整页图，仅保留顶区光晕与星点。
              </p>
            </div>
            <div class="admin-form__field admin-form__field--full">
              <label class="admin-form__label">暗色背景图 URL</label>
              <input
                v-model.trim="draft.settings.headerBackgroundImageUrl"
                class="admin-input"
                type="text"
                placeholder="例如：https://…/home-background-new.png"
              >
            </div>
            <div class="admin-form__field admin-form__field--full">
              <label class="admin-form__label">亮色背景图 URL</label>
              <input
                v-model.trim="draft.settings.headerBackgroundImageUrlLight"
                class="admin-input"
                type="text"
                placeholder="例如：https://…/home-background-light.png"
              >
            </div>

            <div class="admin-form__field admin-form__field--full">
              <div class="admin-theme-workbench-content-dialog__section-head">
                <label class="admin-form__label">光晕</label>
                <button class="admin-button admin-button--secondary admin-theme-workbench-content-dialog__reset" type="button" @click="resetHeaderBackgroundGlow">
                  重置默认
                </button>
              </div>
            </div>
            <div class="admin-form__field admin-form__field--full">
              <label class="admin-switch-row">
                <input v-model="draft.settings.headerBackgroundGlowEnabled" type="checkbox">
                <span>显示光晕</span>
              </label>
            </div>
            <div class="admin-form__field">
              <label class="admin-form__label">暗色光晕色</label>
              <input v-model.trim="draft.settings.headerBackgroundGlowColor" class="admin-input" type="text" placeholder="#008EE5">
            </div>
            <div class="admin-form__field">
              <label class="admin-form__label">暗色透明度</label>
              <input
                v-model.number="draft.settings.headerBackgroundGlowOpacity"
                class="admin-input"
                type="number"
                min="0"
                max="1"
                step="0.02"
              >
            </div>
            <div class="admin-form__field">
              <label class="admin-form__label">亮色光晕色</label>
              <input v-model.trim="draft.settings.headerBackgroundGlowColorLight" class="admin-input" type="text" placeholder="#008EE5">
            </div>
            <div class="admin-form__field">
              <label class="admin-form__label">亮色透明度</label>
              <input
                v-model.number="draft.settings.headerBackgroundGlowOpacityLight"
                class="admin-input"
                type="number"
                min="0"
                max="1"
                step="0.02"
              >
            </div>

            <div class="admin-form__field admin-form__field--full">
              <div class="admin-theme-workbench-content-dialog__section-head">
                <label class="admin-form__label">星点</label>
                <button class="admin-button admin-button--secondary admin-theme-workbench-content-dialog__reset" type="button" @click="resetHeaderBackgroundStars">
                  重置默认
                </button>
              </div>
            </div>
            <div class="admin-form__field admin-form__field--full">
              <label class="admin-switch-row">
                <input v-model="draft.settings.headerBackgroundStarEnabled" type="checkbox">
                <span>显示星点</span>
              </label>
            </div>
            <div class="admin-form__field">
              <label class="admin-form__label">暗色星点色</label>
              <input v-model.trim="draft.settings.headerBackgroundStarColor" class="admin-input" type="text" placeholder="#FFFFFF0A">
            </div>
            <div class="admin-form__field">
              <label class="admin-form__label">亮色星点色</label>
              <input v-model.trim="draft.settings.headerBackgroundStarColorLight" class="admin-input" type="text" placeholder="#00000008">
            </div>
          </template>

          <template v-else-if="draft.blockKey === 'title'">
            <div class="admin-form__field admin-form__field--full">
              <label class="admin-switch-row">
                <input v-model="draft.settings.showSiteName" type="checkbox">
                <span>标题中显示站点名称</span>
              </label>
            </div>
            <div class="admin-form__field">
              <label class="admin-form__label">标题前半句</label>
              <input v-model.trim="draft.settings.prefixText" class="admin-input" type="text" placeholder="开启你的">
            </div>
            <div class="admin-form__field">
              <label class="admin-form__label">标题后半句</label>
              <input v-model.trim="draft.settings.suffixText" class="admin-input" type="text" placeholder="即刻造梦！">
            </div>
            <div class="admin-form__field admin-form__field--full">
              <label class="admin-switch-row">
                <input v-model="draft.settings.showModeSelectorInTitle" type="checkbox">
                <span>标题中显示模式标签</span>
              </label>
            </div>
          </template>

          <template v-else-if="draft.blockKey === 'generator'">
            <div class="admin-form__field admin-form__field--full">
              <label class="admin-switch-row">
                <input v-model="draft.settings.showSiteDescription" type="checkbox">
                <span>显示输入区下方站点说明</span>
              </label>
            </div>
            <div class="admin-form__field admin-form__field--full">
              <label class="admin-switch-row">
                <input v-model="draft.settings.showSubmitButton" type="checkbox">
                <span>显示提交按钮</span>
              </label>
            </div>
            <div class="admin-form__field admin-form__field--full">
              <label class="admin-form__label">输入框占位文案</label>
              <input v-model.trim="draft.settings.placeholder" class="admin-input" type="text" placeholder="说说今天想做点什么">
            </div>
          </template>

          <template v-else-if="draft.blockKey === 'task-indicator'">
            <div class="admin-form__field admin-form__field--full">
              <div class="admin-theme-workbench-content-dialog__hint">
                控制首页右侧“任务状态”反馈条的显示，便于运营按阶段打开或关闭即时状态提示。
              </div>
            </div>
          </template>

          <template v-else-if="draft.blockKey === 'banner'">
            <div class="admin-form__field admin-form__field--full">
              <div class="admin-theme-workbench-content-dialog__hint">
                控制首页右侧 Banner 区域的整体显隐。Banner 图层内容仍沿用 Banner 编排数据。
              </div>
            </div>
          </template>
        </div>

        <div class="admin-form__footer">
          <button class="admin-button admin-button--secondary" type="button" @click="emit('close')">取消</button>
          <button class="admin-button admin-button--primary" type="button" @click="emit('submit')">保存内容块</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  DEFAULT_HEADER_BACKGROUND_GLOW_COLOR,
  DEFAULT_HEADER_BACKGROUND_GLOW_OPACITY,
  DEFAULT_HEADER_BACKGROUND_GLOW_OPACITY_LIGHT,
  DEFAULT_HEADER_BACKGROUND_STAR_COLOR,
  DEFAULT_HEADER_BACKGROUND_STAR_COLOR_LIGHT,
} from '@/api/system-config'
import type { WorkbenchContentBlockKey } from './AdminThemeFrontHomeHeaderPreview.vue'

export interface WorkbenchContentDialogDraft {
  blockKey: WorkbenchContentBlockKey
  label: string
  settings: {
    enabled: boolean
    showSiteName: boolean
    prefixText: string
    suffixText: string
    showModeSelectorInTitle: boolean
    showSubmitButton: boolean
    showSiteDescription: boolean
    placeholder: string
    headerBackgroundImageUrl: string
    headerBackgroundImageUrlLight: string
    headerBackgroundGlowColor: string
    headerBackgroundGlowColorLight: string
    headerBackgroundGlowOpacity: number
    headerBackgroundGlowOpacityLight: number
    headerBackgroundGlowEnabled: boolean
    headerBackgroundStarEnabled: boolean
    headerBackgroundStarColor: string
    headerBackgroundStarColorLight: string
  }
}

const props = defineProps<{
  visible: boolean
  draft: WorkbenchContentDialogDraft | null
}>()

const emit = defineEmits<{
  close: []
  submit: []
}>()

const visibilityLabel = computed(() => {
  if (!props.draft) {
    return '显示内容块'
  }

  return `显示${props.draft.label}`
})

/** 重置暗/亮色整页背景图为空（现网默认无图） */
const resetHeaderBackgroundSettings = () => {
  if (!props.draft) return
  props.draft.settings.headerBackgroundImageUrl = ''
  props.draft.settings.headerBackgroundImageUrlLight = ''
}

/** 重置光晕显隐 / 色 / 透明度为现网写死值 */
const resetHeaderBackgroundGlow = () => {
  if (!props.draft) return
  props.draft.settings.headerBackgroundGlowEnabled = true
  props.draft.settings.headerBackgroundGlowColor = DEFAULT_HEADER_BACKGROUND_GLOW_COLOR
  props.draft.settings.headerBackgroundGlowColorLight = DEFAULT_HEADER_BACKGROUND_GLOW_COLOR
  props.draft.settings.headerBackgroundGlowOpacity = DEFAULT_HEADER_BACKGROUND_GLOW_OPACITY
  props.draft.settings.headerBackgroundGlowOpacityLight = DEFAULT_HEADER_BACKGROUND_GLOW_OPACITY_LIGHT
}

/** 重置星点显隐与颜色为现网写死值 */
const resetHeaderBackgroundStars = () => {
  if (!props.draft) return
  props.draft.settings.headerBackgroundStarEnabled = true
  props.draft.settings.headerBackgroundStarColor = DEFAULT_HEADER_BACKGROUND_STAR_COLOR
  props.draft.settings.headerBackgroundStarColorLight = DEFAULT_HEADER_BACKGROUND_STAR_COLOR_LIGHT
}
</script>

<style scoped>
.admin-theme-workbench-content-dialog__hint {
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(148, 163, 184, 0.12);
  color: var(--text-secondary, #64748b);
  font-size: 13px;
  line-height: 1.7;
}

.admin-theme-workbench-content-dialog__section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.admin-theme-workbench-content-dialog__desc {
  margin: 6px 0 0;
  color: var(--text-secondary, #64748b);
  font-size: 12px;
  line-height: 1.6;
}

.admin-theme-workbench-content-dialog__reset {
  flex: 0 0 auto;
  min-height: 28px;
  padding: 0 10px;
  font-size: 12px;
}
</style>
