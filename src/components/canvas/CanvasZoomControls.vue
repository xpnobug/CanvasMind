<script setup lang="ts">
/**
 * 画布左下角缩放控件
 *
 * 来自 infinite-canvas/CanvasZoomControls：
 *   小地图开关 / 重置视图 / 缩放滑杆 5–500 / 数字百分比 / 快捷键弹窗
 * 追加：画布外观（弹出 CanvasAppearancePanel） / 清空画布
 */
import { computed, ref } from 'vue'
import { Compass, Aim, MagicStick, Brush } from '@element-plus/icons-vue'
import { useVueFlow } from '@vue-flow/core'
import CanvasAppearancePanel from './CanvasAppearancePanel.vue'

defineProps<{ miniMapOpen: boolean }>()
const emit = defineEmits<{
  (e: 'toggleMiniMap'): void
  (e: 'clear'): void
}>()

const { viewport, zoomTo, fitView } = useVueFlow()

const zoomPercent = computed(() => Math.round(viewport.value.zoom * 100))

const handleSliderInput = (event: Event) => {
  const val = Number((event.target as HTMLInputElement).value)
  zoomTo(val / 100, { duration: 0 })
}

const handleReset = () => {
  fitView({ duration: 200 })
}

const appearanceOpen = ref(false)
</script>

<template>
  <div class="canvas-zoom-controls" data-canvas-no-zoom @click.stop>
    <button
      type="button"
      class="canvas-zoom-controls__btn"
      :class="{ 'is-active': miniMapOpen }"
      title="小地图"
      @click="emit('toggleMiniMap')"
    >
      <el-icon><Compass /></el-icon>
    </button>
    <button type="button" class="canvas-zoom-controls__btn" title="重置视图" @click="handleReset">
      <el-icon><Aim /></el-icon>
    </button>
    <input
      type="range"
      min="5"
      max="500"
      :value="zoomPercent"
      class="canvas-zoom-controls__slider"
      @input="handleSliderInput"
    />
    <span class="canvas-zoom-controls__percent">{{ zoomPercent }}%</span>

    <!-- 分隔线 -->
    <span class="canvas-zoom-controls__divider" aria-hidden="true" />

    <!-- 画布外观（弹出 CanvasAppearancePanel） -->
    <button
      type="button"
      class="canvas-zoom-controls__btn"
      :class="{ 'is-active': appearanceOpen }"
      title="画布外观"
      @click="appearanceOpen = !appearanceOpen"
    >
      <el-icon><MagicStick /></el-icon>
    </button>
    <Transition name="canvas-appearance-pop">
      <div
        v-if="appearanceOpen"
        class="canvas-zoom-controls__appearance"
        @click.stop
      >
        <CanvasAppearancePanel />
      </div>
    </Transition>

    <!-- 清空画布 -->
    <button
      type="button"
      class="canvas-zoom-controls__btn canvas-zoom-controls__btn--danger"
      title="清空画布"
      @click="emit('clear')"
    >
      <el-icon><Brush /></el-icon>
    </button>

    <!-- 快捷键弹窗 -->
<!--    <button type="button" class="canvas-zoom-controls__btn" title="快捷键" @click="showHelp = true">-->
<!--      <el-icon><QuestionFilled /></el-icon>-->
<!--    </button>-->

<!--    <ElDialog-->
<!--      v-model="showHelp"-->
<!--      title="画布快捷键"-->
<!--      width="420px"-->
<!--      align-center-->
<!--      destroy-on-close-->
<!--    >-->
<!--      <div class="canvas-zoom-controls__help">-->
<!--        <div v-for="row in shortcutRows" :key="row[0]" class="canvas-zoom-controls__help-row">-->
<!--          <span class="canvas-zoom-controls__help-key">{{ row[0] }}</span>-->
<!--          <span class="canvas-zoom-controls__help-desc">{{ row[1] }}</span>-->
<!--        </div>-->
<!--      </div>-->
<!--    </ElDialog>-->
  </div>
</template>

<style scoped>
.canvas-zoom-controls {
  position: absolute;
  bottom: 20px;
  left: 20px;
  z-index: 50;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  padding: 0 10px;
  background: var(--canvas-float-block-default);
  backdrop-filter: blur(var(--canvas-float-backdrop-blur));
  -webkit-backdrop-filter: blur(var(--canvas-float-backdrop-blur));
  border: 0.5px solid var(--stroke-secondary);
  border-radius: var(--lv-border-radius-large);
  box-shadow: var(--shadow-generator-float-block);
  color: var(--text-primary);
  user-select: none;
}

.canvas-zoom-controls__btn {
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
  font-size: 16px;
  transition: background-color 0.12s, color 0.12s;
}
.canvas-zoom-controls__btn:hover {
  background: var(--canvas-float-block-hover);
  color: var(--text-primary);
}
.canvas-zoom-controls__btn.is-active {
  background: var(--brand-main-block-default);
  color: var(--brand-main-default);
}
.canvas-zoom-controls__btn--danger {
  color: var(--text-secondary);
}
.canvas-zoom-controls__btn--danger:hover {
  background: rgba(239, 68, 68, 0.12);
  color: #ef4444;
}

.canvas-zoom-controls__divider {
  width: 1px;
  height: 20px;
  background: var(--stroke-tertiary);
  margin: 0 2px;
}

.canvas-zoom-controls__slider {
  width: 96px;
  height: 4px;
  accent-color: var(--brand-main-default);
  background: var(--canvas-bg-block-default);
  border-radius: 2px;
  cursor: pointer;
}

.canvas-zoom-controls__percent {
  min-width: 38px;
  text-align: right;
  font-variant-numeric: tabular-nums;
  font-size: 12px;
  color: var(--text-secondary);
}

.canvas-zoom-controls__appearance {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 0;
  z-index: 60;
}

.canvas-appearance-pop-enter-active,
.canvas-appearance-pop-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.canvas-appearance-pop-enter-from,
.canvas-appearance-pop-leave-to {
  opacity: 0;
  transform: translateY(4px);
}

.canvas-zoom-controls__help {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 16px;
}
.canvas-zoom-controls__help-row {
  display: contents;
}
.canvas-zoom-controls__help-key {
  font-size: 13px;
  color: var(--text-secondary);
}
.canvas-zoom-controls__help-desc {
  font-size: 13px;
  color: var(--text-primary);
}
</style>
