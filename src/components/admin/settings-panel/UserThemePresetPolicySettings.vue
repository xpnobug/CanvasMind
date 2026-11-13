<template>
  <div class="admin-settings-pane admin-settings-pane--presets">
    <div class="admin-settings-group">
      <p class="admin-settings-group__title">
        前台能力
        <SettingHelpTip :content="SECTION_TIP" />
      </p>
      <div class="admin-settings-switch-list">
        <label class="admin-settings-switch-row">
          <span class="admin-settings-switch-row__text">
            <span class="admin-settings-switch-row__label">允许切换内置配色预设</span>
            <span class="admin-settings-switch-row__desc">用户可在设置中心选用命名预设</span>
          </span>
          <input
            v-model="allowUserPresets"
            type="checkbox"
            class="admin-settings-switch-row__input"
          >
        </label>
        <label class="admin-settings-switch-row">
          <span class="admin-settings-switch-row__text">
            <span class="admin-settings-switch-row__label">允许导入 tweakcn 主题</span>
            <span class="admin-settings-switch-row__desc">用户本机粘贴 CSS / JSON 自定义</span>
          </span>
          <input
            v-model="allowCustomImport"
            type="checkbox"
            class="admin-settings-switch-row__input"
          >
        </label>
      </div>
    </div>

    <div
      v-if="allowUserPresets"
      class="admin-settings-group"
    >
      <p class="admin-settings-group__title">
        可见内置预设
        <SettingHelpTip content="点击卡片开关对用户可见性；「站点默认」始终保留，不在此列表。" />
      </p>
      <p class="admin-settings-pane-hint">
        已启用 {{ enabledCount }} / {{ presetOptions.length }} · 点击卡片切换 · 预览为演示色板
      </p>
      <div class="admin-preset-gallery">
        <div
          v-for="item in presetOptions"
          :key="item.id"
          class="admin-preset-gallery__item"
          :class="{ 'is-off': !item.enabled }"
        >
          <button
            type="button"
            class="theme-preset-card"
            :aria-pressed="item.enabled"
            @click="togglePreset(item.id)"
          >
            <div
              class="theme-preset-card__frame"
              :class="{ 'is-active': item.enabled }"
              :style="{ backgroundColor: item.background }"
            >
              <span
                class="theme-preset-card__tone"
                :style="{ backgroundColor: item.surface, color: item.text }"
              >
                {{ item.tone }}
              </span>
              <div class="theme-preset-card__swatches">
                <span
                  v-for="(color, index) in item.swatches"
                  :key="`${item.id}-${index}`"
                  class="theme-preset-card__bar"
                  :style="{ backgroundColor: color }"
                />
              </div>
              <div
                class="theme-preset-card__fade"
                :style="{ background: `linear-gradient(to top, ${item.background} 42%, transparent)` }"
              />
              <span
                class="theme-preset-card__name"
                :style="{ color: item.text }"
              >
                {{ item.name }}
              </span>
            </div>
          </button>
          <span class="admin-preset-gallery__badge">
            {{ item.enabled ? '对用户可见' : '已隐藏' }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import SettingHelpTip from './SettingHelpTip.vue'

const SECTION_TIP = [
  '管理用户侧外观能力：内置预设可见性、是否允许本机 tweakcn 导入。',
  '「站点默认」= 站点配色里的全局主题，始终可用。',
].join('\n')

const allowUserPresets = ref(true)
const allowCustomImport = ref(true)

const presetOptions = reactive([
  {
    id: 'midnight',
    name: 'Midnight',
    tone: '深色',
    enabled: true,
    background: '#0f0f12',
    surface: '#1a1b21',
    text: '#f4f4f5',
    swatches: ['#55b8cc', '#f4f4f5', '#111218', '#1a1b21', '#0f0f12'],
  },
  {
    id: 'aurora',
    name: 'Aurora',
    tone: '浅色',
    enabled: true,
    background: '#f8fafc',
    surface: '#ffffff',
    text: '#0f172a',
    swatches: ['#6366f1', '#0f172a', '#e2e8f0', '#ffffff', '#f8fafc'],
  },
  {
    id: 'ember',
    name: 'Ember',
    tone: '深色',
    enabled: false,
    background: '#1a1010',
    surface: '#2a1818',
    text: '#fef2f2',
    swatches: ['#ff7a59', '#fef2f2', '#2a1818', '#3b1f1f', '#1a1010'],
  },
  {
    id: 'forest',
    name: 'Forest',
    tone: '浅色',
    enabled: true,
    background: '#f3f7f4',
    surface: '#ffffff',
    text: '#14532d',
    swatches: ['#18b566', '#14532d', '#dcfce7', '#ffffff', '#f3f7f4'],
  },
  {
    id: 'slate',
    name: 'Slate',
    tone: '深色',
    enabled: false,
    background: '#111827',
    surface: '#1f2937',
    text: '#e5e7eb',
    swatches: ['#94a3b8', '#e5e7eb', '#1f2937', '#374151', '#111827'],
  },
  {
    id: 'sand',
    name: 'Sand',
    tone: '浅色',
    enabled: true,
    background: '#faf7f2',
    surface: '#ffffff',
    text: '#44403c',
    swatches: ['#d97706', '#44403c', '#f5e6d3', '#ffffff', '#faf7f2'],
  },
])

const enabledCount = computed(() => presetOptions.filter(item => item.enabled).length)

const togglePreset = (id: string) => {
  const target = presetOptions.find(item => item.id === id)
  if (target) {
    target.enabled = !target.enabled
  }
}
</script>

<style scoped>
.admin-settings-pane--presets {
  max-width: none;
}

.admin-preset-gallery {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.admin-preset-gallery__item {
  position: relative;
  min-width: 0;
}

.admin-preset-gallery__item.is-off {
  opacity: 0.48;
}

.admin-preset-gallery__item.is-off .theme-preset-card__frame {
  border-style: dashed;
}

.admin-preset-gallery__badge {
  display: block;
  margin-top: 6px;
  padding: 0 2px;
  font-size: 11px;
  line-height: 1.3;
  color: var(--text-secondary, #64748b);
}

.admin-preset-gallery__item:not(.is-off) .admin-preset-gallery__badge {
  color: var(--brand-main-default, #6f35ff);
  font-weight: 600;
}

.theme-preset-card {
  display: block;
  box-sizing: border-box;
  min-width: 0;
  width: 100%;
  padding: 0;
  border: 0;
  border-radius: 0.75rem;
  background: transparent;
  text-align: left;
  cursor: pointer;
}

.theme-preset-card__frame {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  height: 7.5rem;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--stroke-secondary, currentColor) 50%, transparent);
  border-radius: 0.75rem;
  transition: border-color 0.2s ease, transform 0.2s ease;
}

.theme-preset-card:hover .theme-preset-card__frame {
  border-color: color-mix(in srgb, var(--brand-main-default) 60%, transparent);
  transform: scale(1.02);
}

.theme-preset-card__frame.is-active {
  border-color: color-mix(in srgb, var(--brand-main-default) 60%, transparent);
}

.theme-preset-card__tone {
  position: absolute;
  top: 0.625rem;
  left: 0.625rem;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  font-size: 10px;
  font-weight: 500;
  line-height: 1;
}

.theme-preset-card__swatches {
  position: absolute;
  top: 0.625rem;
  right: 0.625rem;
  display: flex;
  gap: 0.25rem;
}

.theme-preset-card__bar {
  width: 0.7rem;
  height: 2.5rem;
  border-radius: 9999px;
}

.theme-preset-card__fade {
  position: absolute;
  inset: auto 0 0;
  height: 55%;
  pointer-events: none;
}

.theme-preset-card__name {
  position: absolute;
  left: 0.75rem;
  bottom: 0.65rem;
  z-index: 1;
  font-size: 1.05rem;
  font-weight: 600;
}

@media (min-width: 720px) {
  .admin-preset-gallery {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
