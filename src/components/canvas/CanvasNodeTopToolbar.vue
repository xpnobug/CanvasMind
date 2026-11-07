<script setup lang="ts">
/**
 * 节点顶部悬浮工具栏（参照 RunningHUB .image-toolbar）
 *
 * 浮在节点上方居中，bottom: calc(100% + 36px)；
 * 黑色半透明胶囊 + 圆角 26 + 边 + 阴影；
 * 按钮 6×10 padding，hover 灰 bg；支持 divider / icon-only / has-dropdown。
 *
 * @example
 * <CanvasNodeTopToolbar :visible="isSelected" :items="[
 *   { id: 'panorama', label: '全景图', icon: Aim, hasDropdown: true, onClick: ... },
 *   { type: 'divider' },
 *   { id: 'crop', label: '裁剪', icon: Crop, iconOnly: true, onClick: ... },
 * ]" />
 */
import type { Component } from 'vue'

export interface NodeTopToolbarItem {
  /** 'divider' 时只渲染竖线 */
  type?: 'item' | 'divider'
  id?: string
  label?: string
  icon?: Component
  /** true 时不渲染 label，仅 icon */
  iconOnly?: boolean
  /** true 时尾部加 ▾ 下拉箭头 */
  hasDropdown?: boolean
  /** 自定义文字标记（如 "R"，代替 icon） */
  textMark?: string
  disabled?: boolean
  onClick?: () => void
}

defineProps<{
  visible?: boolean
  items: NodeTopToolbarItem[]
}>()
</script>

<template>
  <Transition name="canvas-node-top-toolbar">
    <div
      v-if="visible && items.length > 0"
      class="canvas-node-top-toolbar nodrag nopan"
      @mousedown.stop
      @click.stop
    >
      <template v-for="(item, idx) in items" :key="item.id || `divider-${idx}`">
        <div v-if="item.type === 'divider'" class="canvas-node-top-toolbar__divider" />
        <button
          v-else
          type="button"
          class="canvas-node-top-toolbar__btn"
          :class="{
            'is-icon-only': item.iconOnly,
            'has-dropdown': item.hasDropdown,
            'is-disabled': item.disabled,
          }"
          :disabled="item.disabled"
          :title="item.label"
          @click.stop="item.onClick && item.onClick()"
        >
          <el-icon v-if="item.icon" class="canvas-node-top-toolbar__icon">
            <component :is="item.icon" />
          </el-icon>
          <span v-else-if="item.textMark" class="canvas-node-top-toolbar__text-mark">{{ item.textMark }}</span>
          <span v-if="!item.iconOnly && item.label" class="canvas-node-top-toolbar__label">{{ item.label }}</span>
          <svg
            v-if="item.hasDropdown"
            class="canvas-node-top-toolbar__chevron"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
          >
            <path d="M3 5l3 3 3-3" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
      </template>
    </div>
  </Transition>
</template>

<style scoped>
.canvas-node-top-toolbar {
  position: absolute;
  bottom: calc(100% + 36px);
  left: 50%;
  transform: translateX(-50%);
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 6px 12px;
  background: var(--canvas-float-block-default, rgba(38, 38, 38, 0.8));
  border: 1px solid var(--stroke-secondary, rgba(255, 255, 255, 0.08));
  border-radius: 26px;
  box-shadow: var(--shadow-generator-float-block, 0 4px 12px rgba(0, 0, 0, 0.5));
  color: var(--text-secondary, #ccc);
  z-index: 50;
  pointer-events: auto;
  white-space: nowrap;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.canvas-node-top-toolbar__btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  background: transparent;
  border: 0;
  border-radius: 8px;
  color: var(--text-secondary, #ccc);
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
  transition: background-color 0.15s, color 0.15s;
}
.canvas-node-top-toolbar__btn:hover:not(.is-disabled) {
  background: var(--bg-block-primary-hover, rgba(255, 255, 255, 0.08));
  color: var(--text-primary, #fff);
}
.canvas-node-top-toolbar__btn.is-icon-only {
  padding: 6px;
}
.canvas-node-top-toolbar__btn.is-disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.canvas-node-top-toolbar__icon {
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.canvas-node-top-toolbar__text-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  font-size: 12px;
  font-weight: 700;
  font-family: serif;
  font-style: italic;
}

.canvas-node-top-toolbar__chevron {
  width: 10px;
  height: 10px;
  opacity: 0.6;
  margin-left: -2px;
}

.canvas-node-top-toolbar__divider {
  width: 1px;
  height: 20px;
  background: var(--stroke-tertiary, rgba(255, 255, 255, 0.1));
  margin: 0 6px;
}

.canvas-node-top-toolbar-enter-active,
.canvas-node-top-toolbar-leave-active {
  transition: opacity 0.16s, transform 0.16s;
}
.canvas-node-top-toolbar-enter-from,
.canvas-node-top-toolbar-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(4px);
}
</style>
