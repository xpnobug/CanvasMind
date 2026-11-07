<script setup lang="ts">
/**
 * Config 节点共享外壳（参照 RunningHUB 样板，给 ImageConfig / VideoConfig /
 * LlmConfig 三类「运行配置」节点统一外形）
 *
 * 提供：
 *   - 节点外置标题（icon + label，hover 高亮）
 *   - 16 圆角卡片 + lv-theme 背景
 *   - 选中态：青绿描边 + 2px box-shadow + 流光边框 + 模糊光晕
 *   - 节点外左右 -56px 圆形"+"按钮（仅 selected 时显示）
 *   - Vue Flow Handle 左右（隐藏视觉但保留连接功能）
 *   - 默认插槽：节点内部表单（textarea / 模型 / 生成按钮等）
 *   - overlay 插槽：节点级浮层（如 hover toolbar / prompt panel）
 */
import type { Component } from 'vue'
import { useNodeTitleEdit } from '@/composables/useNodeTitleEdit'
import CanvasNodeAddHandle from '@/components/canvas/CanvasNodeAddHandle.vue'

const props = withDefaults(
  defineProps<{
    nodeId: string
    label: string
    icon: Component
    selected?: boolean
    /** 节点 type 标识，加到 wrapper 上方便外部覆盖 */
    type?: string
    minWidth?: number
    minHeight?: number
  }>(),
  {
    selected: false,
    type: 'config',
    minWidth: 280,
    minHeight: 200,
  },
)

const emit = defineEmits<{
  (e: 'add-left'): void
  (e: 'add-right'): void
}>()

const titleEdit = useNodeTitleEdit(props.nodeId, () => props.label)
</script>

<template>
  <div class="config-node-wrapper" :data-config-type="type">
    <!-- 节点外置标题 -->
    <div
      class="config-node-title"
      :title="titleEdit.editing.value ? '' : '双击编辑名称'"
      @dblclick.stop="titleEdit.start"
    >
      <el-icon class="config-node-title-icon">
        <component :is="icon" />
      </el-icon>
      <input
        v-if="titleEdit.editing.value"
        :ref="titleEdit.setInputRef"
        v-model="titleEdit.draft.value"
        class="config-node-title-input nodrag"
        :maxlength="40"
        @blur="titleEdit.commit"
        @keydown.enter.prevent="titleEdit.commit"
        @keydown.esc.prevent="titleEdit.cancel"
        @mousedown.stop
        @click.stop
      />
      <span v-else>{{ label }}</span>
    </div>

    <!-- 卡片本体 -->
    <div
      class="config-node-card"
      :class="{ 'is-selected': selected }"
      :style="{ minWidth: minWidth + 'px', minHeight: minHeight + 'px' }"
    >
      <span v-if="selected" class="config-node-flow config-node-flow--ring" aria-hidden="true" />
      <span v-if="selected" class="config-node-flow config-node-flow--glow" aria-hidden="true" />
      <slot />
    </div>

    <!-- 左右 "+" 连接点（CanvasNodeAddHandle 自带 Vue Flow Handle 拖拽连线） -->
    <CanvasNodeAddHandle side="left" :visible="selected" @click.stop="emit('add-left')" />
    <CanvasNodeAddHandle side="right" :visible="selected" @click.stop="emit('add-right')" />

    <!-- overlay 插槽：hover toolbar / prompt panel 等浮层 -->
    <slot name="overlay" />
  </div>
</template>

<style scoped>
.config-node-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

.config-node-title {
  position: absolute;
  bottom: 100%;
  left: 0;
  right: 0;
  margin-bottom: 8px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 22px;
  padding: 0 8px 0 2px;
  border-radius: 4px;
  color: var(--text-secondary);
  font-size: 15px;
  font-weight: 500;
  line-height: 22px;
  cursor: pointer;
  user-select: none;
  transition: background-color 0.2s, color 0.2s;
}
.config-node-title:hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-primary);
}
.config-node-title-icon {
  font-size: 16px;
  color: var(--text-tertiary);
}
.config-node-title-input {
  flex: 1 1 0;
  min-width: 80px;
  max-width: 220px;
  background: transparent;
  border: 1px solid var(--brand-main-default);
  border-radius: 4px;
  padding: 1px 6px;
  color: var(--text-primary);
  font-size: 15px;
  font-weight: 500;
  line-height: 22px;
  outline: none;
  box-sizing: border-box;
}

.config-node-card {
  position: relative;
  width: 100%;
  height: 100%;
  background: var(--canvas-node-bg);
  border: 1px solid var(--canvas-node-border);
  border-radius: 16px;
  padding: 0;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  overflow: hidden;
  transition: border-color 0.16s, box-shadow 0.16s;
}
.config-node-card.is-selected {
  border-color: var(--canvas-selection-border);
  box-shadow: 0 0 0 2px var(--canvas-selection-border);
}

.config-node-flow {
  content: '';
  position: absolute;
  pointer-events: none;
  background-size: 200% 200%;
  animation: config-node-flowing 2.4s linear infinite;
}
.config-node-flow--ring {
  inset: -2px;
  border-radius: 18px;
  background: linear-gradient(
    90deg,
    transparent,
    transparent 20%,
    rgba(2, 219, 163, 0.45) 40%,
    #02dba3 50%,
    rgba(2, 219, 163, 0.45) 60%,
    transparent 80%,
    transparent
  );
  z-index: -1;
}
.config-node-flow--glow {
  inset: -6px;
  border-radius: 22px;
  background: linear-gradient(
    90deg,
    transparent,
    transparent 20%,
    rgba(2, 219, 163, 0.18) 40%,
    rgba(2, 219, 163, 0.42) 50%,
    rgba(2, 219, 163, 0.18) 60%,
    transparent 80%,
    transparent
  );
  filter: blur(8px);
  z-index: -2;
}
@keyframes config-node-flowing {
  0% {
    background-position: 100% 50%;
  }
  100% {
    background-position: -100% 50%;
  }
}

.config-node-handle {
  width: 1px !important;
  height: 1px !important;
  opacity: 0 !important;
  pointer-events: none !important;
  border: 0 !important;
  background: transparent !important;
}

.config-node-add-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 56px;
  height: 56px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 0;
  border-radius: 50%;
  color: var(--text-tertiary);
  cursor: pointer;
  z-index: 10;
  transition: transform 0.2s, color 0.2s;
}
.config-node-add-btn--left {
  left: -56px;
}
.config-node-add-btn--right {
  right: -56px;
}
.config-node-add-btn__icon {
  width: 20px;
  height: 20px;
  padding: 3px;
  border: 1px solid currentColor;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: content-box;
}
.config-node-add-btn:hover {
  color: var(--text-primary);
}
.config-node-add-btn:active {
  transform: translateY(-50%) scale(0.95);
}
</style>
