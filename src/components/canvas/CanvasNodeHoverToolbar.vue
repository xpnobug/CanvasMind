<script setup lang="ts">
/**
 * 节点 hover 工具栏
 *
 * 浮在节点上方居中显示，由节点组件内部根据自身 hover 状态控制。
 * 每个节点（Text/Image/Video/Config 系）按 type 传入不同 actions 列表。
 *
 * 视觉与 CanvasDockToolbar 一致（毛玻璃 + 阴影 + lv-theme 配色），
 * 但尺寸更小（按钮 26×26）。
 *
 * @example
 * <CanvasNodeHoverToolbar
 *   :visible="isHover"
 *   :actions="[
 *     { id: 'edit', label: '编辑', icon: EditPen, onClick: handleEdit },
 *     { id: 'delete', label: '删除', icon: Delete, danger: true, onClick: handleDelete },
 *   ]"
 * />
 */
import type { Component } from 'vue'

export interface NodeToolbarAction {
  id: string
  label: string
  icon: Component
  danger?: boolean
  disabled?: boolean
  /** 激活态（如"图片信息可见"）显示高亮 */
  active?: boolean
  onClick: () => void
}

defineProps<{
  visible?: boolean
  actions: NodeToolbarAction[]
}>()
</script>

<template>
  <Transition name="canvas-node-hover-toolbar">
    <div
      v-if="visible && actions.length > 0"
      class="canvas-node-hover-toolbar nodrag nopan"
      @mousedown.stop
      @click.stop
    >
      <button
        v-for="action in actions"
        :key="action.id"
        type="button"
        class="canvas-node-hover-toolbar__btn"
        :class="{
          'is-danger': action.danger,
          'is-disabled': action.disabled,
          'is-active': action.active,
        }"
        :disabled="action.disabled"
        :title="action.label"
        @click.stop="action.onClick"
      >
        <el-icon class="canvas-node-hover-toolbar__icon">
          <component :is="action.icon" />
        </el-icon>
      </button>
    </div>
  </Transition>
</template>

<style scoped>
.canvas-node-hover-toolbar {
  position: absolute;
  top: 50%;
  left: calc(100% + 50px);
  transform: translateY(-50%);
  display: inline-flex;
  flex-direction: column;
  gap: 2px;
  padding: 4px;
  background: var(--canvas-float-block-default);
  backdrop-filter: blur(var(--canvas-float-backdrop-blur));
  -webkit-backdrop-filter: blur(var(--canvas-float-backdrop-blur));
  border: 0.5px solid var(--stroke-secondary);
  border-radius: var(--lv-border-radius-large);
  box-shadow: var(--shadow-generator-float-block);
  z-index: 10;
  pointer-events: auto;
  white-space: nowrap;
}

.canvas-node-hover-toolbar__btn {
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
  font-size: 14px;
  transition: background-color 0.12s, color 0.12s;
}
.canvas-node-hover-toolbar__btn:hover:not(.is-disabled) {
  background: var(--canvas-float-block-hover);
  color: var(--text-primary);
}
.canvas-node-hover-toolbar__btn.is-active {
  background: var(--brand-main-block-default);
  color: var(--brand-main-default);
}
.canvas-node-hover-toolbar__btn.is-danger {
  color: #ef4444;
}
.canvas-node-hover-toolbar__btn.is-danger:hover:not(.is-disabled) {
  background: rgba(239, 68, 68, 0.08);
}
.canvas-node-hover-toolbar__btn.is-disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.canvas-node-hover-toolbar__icon {
  font-size: 14px;
}

.canvas-node-hover-toolbar-enter-active,
.canvas-node-hover-toolbar-leave-active {
  transition: opacity 0.12s ease-out, transform 0.12s ease-out;
}
.canvas-node-hover-toolbar-enter-from,
.canvas-node-hover-toolbar-leave-to {
  opacity: 0;
  transform: translateY(-50%) translateX(-4px);
}
</style>
