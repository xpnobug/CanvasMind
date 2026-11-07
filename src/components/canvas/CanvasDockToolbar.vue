<script setup lang="ts">
/**
 * 画布底部 Dock 工具栏
 *
 * 视觉布局复用 infinite-canvas（CanvasToolbar），配色全部走 lv-theme 变量：
 *   - 浮动定位：absolute bottom-5 left-[300px] right-4
 *   - 高度 h-14，圆角 rounded-xl，毛玻璃 + 边框 + 阴影
 *   - 按钮顺序：Hand / Undo / Redo | Text / Image / Video / Config / Upload | Library / Folder / Palette | Trash(条件) | Eraser
 *   - DockTip 跟随 hover 鼠标水平定位
 *   - "外观"按钮悬浮 CanvasAppearancePanel
 */
import { computed, ref } from 'vue'
import type { Component } from 'vue'
import {
  Pointer,
  RefreshLeft,
  RefreshRight,
  EditPen,
  Picture,
  VideoCamera,
  Setting,
  Upload,
  Files,
  FolderOpened,
  MagicStick,
  Delete,
  Brush,
} from '@element-plus/icons-vue'
import CanvasDockTip from './CanvasDockTip.vue'
import CanvasAppearancePanel from './CanvasAppearancePanel.vue'

interface ToolButton {
  id: string
  label: string
  icon: Component
  click: () => void
  active?: boolean
  danger?: boolean
  disabled?: boolean
}

const props = defineProps<{
  selectedCount: number
  canUndo: boolean
  canRedo: boolean
}>()

const emit = defineEmits<{
  (e: 'deselect'): void
  (e: 'undo'): void
  (e: 'redo'): void
  (e: 'addText'): void
  (e: 'addImage'): void
  (e: 'addVideo'): void
  (e: 'addConfig'): void
  (e: 'upload'): void
  (e: 'openAssetLibrary'): void
  (e: 'openMyAssets'): void
  (e: 'delete'): void
  (e: 'clear'): void
}>()

const wrapRef = ref<HTMLDivElement | null>(null)
const hoveredId = ref<string | null>(null)
const hoveredX = ref(0)
const appearanceOpen = ref(false)

const handleHover = (id: string | null, event?: MouseEvent) => {
  hoveredId.value = id
  if (id && event?.currentTarget instanceof HTMLElement && wrapRef.value) {
    const wrapRect = wrapRef.value.getBoundingClientRect()
    const tRect = event.currentTarget.getBoundingClientRect()
    hoveredX.value = tRect.left + tRect.width / 2 - wrapRect.left
  }
}

const tools = computed<ToolButton[][]>(() => [
  [
    { id: 'hand', label: '移动/选择', icon: Pointer, active: props.selectedCount === 0, click: () => emit('deselect') },
    { id: 'undo', label: '撤销', icon: RefreshLeft, disabled: !props.canUndo, click: () => emit('undo') },
    { id: 'redo', label: '重做', icon: RefreshRight, disabled: !props.canRedo, click: () => emit('redo') },
  ],
  [
    { id: 'text', label: '文本', icon: EditPen, click: () => emit('addText') },
    { id: 'image', label: '图片', icon: Picture, click: () => emit('addImage') },
    { id: 'video', label: '视频', icon: VideoCamera, click: () => emit('addVideo') },
    { id: 'config', label: '生成配置', icon: Setting, click: () => emit('addConfig') },
    { id: 'upload', label: '上传文件', icon: Upload, click: () => emit('upload') },
  ],
  [
    { id: 'library', label: '素材库', icon: Files, click: () => emit('openAssetLibrary') },
    { id: 'myAssets', label: '我的素材', icon: FolderOpened, click: () => emit('openMyAssets') },
    { id: 'palette', label: '画布外观', icon: MagicStick, active: appearanceOpen.value, click: () => (appearanceOpen.value = !appearanceOpen.value) },
  ],
  props.selectedCount > 0
    ? [{ id: 'delete', label: '删除选中', icon: Delete, danger: true, click: () => emit('delete') }]
    : [],
  [{ id: 'clear', label: '清空画布', icon: Brush, danger: true, click: () => emit('clear') }],
])

const tipLabel = computed(() => {
  if (!hoveredId.value) return ''
  for (const group of tools.value) {
    for (const t of group) {
      if (t.id === hoveredId.value) return t.label
    }
  }
  return ''
})
</script>

<template>
  <div
    class="canvas-dock-toolbar"
    data-canvas-no-zoom
    @click.stop
  >
    <CanvasDockTip :label="tipLabel" :x="hoveredX" :visible="!!tipLabel" />
    <Transition name="canvas-appearance-pop">
      <div
        v-if="appearanceOpen"
        class="canvas-dock-toolbar__appearance"
        @click.stop
      >
        <CanvasAppearancePanel />
      </div>
    </Transition>
    <div ref="wrapRef" class="canvas-dock-toolbar__inner">
      <template v-for="(group, gIdx) in tools" :key="gIdx">
        <template v-for="tool in group" :key="tool.id">
          <button
            type="button"
            class="canvas-dock-toolbar__btn"
            :class="{
              'is-active': tool.active,
              'is-danger': tool.danger,
              'is-disabled': tool.disabled,
            }"
            :disabled="tool.disabled"
            @mouseenter="(e) => handleHover(tool.id, e)"
            @mouseleave="handleHover(null)"
            @click="tool.click"
          >
            <el-icon class="canvas-dock-toolbar__icon">
              <component :is="tool.icon" />
            </el-icon>
          </button>
        </template>
        <div
          v-if="group.length > 0 && gIdx < tools.length - 1 && tools[gIdx + 1].length > 0"
          class="canvas-dock-toolbar__divider"
        />
      </template>
    </div>
  </div>
</template>

<style scoped>
.canvas-dock-toolbar {
  position: absolute;
  bottom: 20px;
  left: 300px;
  right: 16px;
  display: flex;
  justify-content: center;
  z-index: 50;
  pointer-events: none;
}

.canvas-dock-toolbar__inner {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 56px;
  max-width: 100%;
  padding: 0 8px;
  background: var(--canvas-float-block-default);
  backdrop-filter: blur(var(--canvas-float-backdrop-blur));
  -webkit-backdrop-filter: blur(var(--canvas-float-backdrop-blur));
  border: 0.5px solid var(--stroke-secondary);
  border-radius: var(--lv-border-radius-large);
  box-shadow: var(--shadow-generator-float-block);
  overflow-x: auto;
  pointer-events: auto;
  scrollbar-width: thin;
}

.canvas-dock-toolbar__inner::-webkit-scrollbar {
  height: 4px;
}
.canvas-dock-toolbar__inner::-webkit-scrollbar-thumb {
  background: var(--stroke-secondary);
  border-radius: 2px;
}

.canvas-dock-toolbar__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 36px;
  height: 36px;
  background: transparent;
  border: 0;
  border-radius: var(--lv-border-radius-medium);
  color: var(--text-secondary);
  cursor: pointer;
  transition: background-color 0.12s, color 0.12s;
}
.canvas-dock-toolbar__btn:hover:not(.is-disabled) {
  background: var(--canvas-float-block-hover);
  color: var(--text-primary);
}
.canvas-dock-toolbar__btn.is-active {
  background: var(--brand-main-block-default);
  color: var(--brand-main-default);
}
.canvas-dock-toolbar__btn.is-danger {
  color: #ef4444;
}
.canvas-dock-toolbar__btn.is-danger:hover {
  background: rgba(239, 68, 68, 0.08);
}
.canvas-dock-toolbar__btn.is-disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.canvas-dock-toolbar__icon {
  font-size: 18px;
}

.canvas-dock-toolbar__divider {
  flex: 0 0 auto;
  width: 1px;
  height: 22px;
  background: var(--stroke-secondary);
  margin: 0 2px;
}

.canvas-dock-toolbar__appearance {
  position: absolute;
  bottom: 72px;
  pointer-events: auto;
}

.canvas-appearance-pop-enter-active,
.canvas-appearance-pop-leave-active {
  transition: opacity 0.16s, transform 0.16s;
}
.canvas-appearance-pop-enter-from,
.canvas-appearance-pop-leave-to {
  opacity: 0;
  transform: translateY(4px) scale(0.98);
}
</style>
