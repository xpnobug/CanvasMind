<script setup lang="ts">
/**
 * 画布右键上下文菜单
 *
 * 使用 Teleport 到 body，自带边界检测（超出视口时贴边）+ 点击外部/Esc 关闭。
 * 视觉走 lv-theme 毛玻璃风：`--canvas-float-block-default` + backdrop-filter
 * + `--shadow-generator-float-block`。
 *
 * @example
 * <CanvasContextMenu
 *   :visible="ctxMenu.visible"
 *   :position="ctxMenu.position"
 *   :items="ctxMenu.items"
 *   @close="ctxMenu.visible = false"
 * />
 */
import { computed, nextTick, ref, watch } from 'vue'
import type { ContextMenuItem, ContextMenuPosition } from '@/types/canvas-interaction'

const props = defineProps<{
  visible: boolean
  position: ContextMenuPosition
  items: ContextMenuItem[]
}>()

const emit = defineEmits<{
  (event: 'close'): void
}>()

const menuRef = ref<HTMLElement | null>(null)
const placedPosition = ref<ContextMenuPosition>({ x: 0, y: 0 })

const menuStyle = computed(() => ({
  left: `${placedPosition.value.x}px`,
  top: `${placedPosition.value.y}px`,
}))

const placeMenu = () => {
  if (!menuRef.value) return
  const rect = menuRef.value.getBoundingClientRect()
  const vw = window.innerWidth
  const vh = window.innerHeight
  const margin = 8
  let x = props.position.x
  let y = props.position.y
  if (x + rect.width + margin > vw) x = Math.max(margin, vw - rect.width - margin)
  if (y + rect.height + margin > vh) y = Math.max(margin, vh - rect.height - margin)
  placedPosition.value = { x, y }
}

watch(
  () => [props.visible, props.position.x, props.position.y],
  async () => {
    if (props.visible) {
      placedPosition.value = { ...props.position }
      await nextTick()
      placeMenu()
    }
  },
  { immediate: true },
)

const handleDocClick = (event: MouseEvent) => {
  if (!props.visible) return
  if (menuRef.value && menuRef.value.contains(event.target as Node)) return
  emit('close')
}
const handleEsc = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && props.visible) emit('close')
}

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      document.addEventListener('mousedown', handleDocClick)
      document.addEventListener('keydown', handleEsc)
    } else {
      document.removeEventListener('mousedown', handleDocClick)
      document.removeEventListener('keydown', handleEsc)
    }
  },
)

const handleClick = (item: ContextMenuItem) => {
  if (item.disabled || item.type === 'divider') return
  item.onClick?.()
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="canvas-ctx-menu">
      <div
        v-if="visible"
        ref="menuRef"
        class="canvas-context-menu"
        :style="menuStyle"
        role="menu"
        @click.stop
        @contextmenu.prevent
      >
        <template v-for="(item, idx) in items" :key="item.id || `divider-${idx}`">
          <div v-if="item.type === 'divider'" class="canvas-context-menu__divider" />
          <button
            v-else
            type="button"
            class="canvas-context-menu__item"
            :class="{ 'is-danger': item.danger, 'is-disabled': item.disabled }"
            :disabled="item.disabled"
            @click="handleClick(item)"
          >
            <span class="canvas-context-menu__label">{{ item.label }}</span>
            <span v-if="item.shortcut" class="canvas-context-menu__shortcut">{{ item.shortcut }}</span>
          </button>
        </template>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.canvas-context-menu {
  position: fixed;
  z-index: 200;
  min-width: 180px;
  padding: 6px;
  background: var(--canvas-float-block-default);
  backdrop-filter: blur(var(--canvas-float-backdrop-blur));
  -webkit-backdrop-filter: blur(var(--canvas-float-backdrop-blur));
  border: 0.5px solid var(--stroke-secondary);
  border-radius: var(--lv-border-radius-large);
  box-shadow: var(--shadow-generator-float-block);
  user-select: none;
}

.canvas-context-menu__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 6px 10px;
  background: transparent;
  border: 0;
  border-radius: var(--lv-border-radius-small);
  color: var(--text-primary);
  font-size: 13px;
  cursor: pointer;
  transition: background-color 0.12s cubic-bezier(0.4, 0, 0.2, 1);
}

.canvas-context-menu__item:hover:not(.is-disabled) {
  background: var(--canvas-float-block-hover);
}

.canvas-context-menu__item.is-danger {
  color: #ef4444;
}
.canvas-context-menu__item.is-danger:hover:not(.is-disabled) {
  background: rgba(239, 68, 68, 0.08);
}

.canvas-context-menu__item.is-disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.canvas-context-menu__label {
  flex: 1 1 auto;
  text-align: left;
}

.canvas-context-menu__shortcut {
  color: var(--text-tertiary);
  font-size: 12px;
  margin-left: 24px;
}

.canvas-context-menu__divider {
  height: 1px;
  margin: 4px 6px;
  background: var(--stroke-secondary);
}

.canvas-ctx-menu-enter-active,
.canvas-ctx-menu-leave-active {
  transition: opacity 0.12s ease-out, transform 0.12s ease-out;
}
.canvas-ctx-menu-enter-from,
.canvas-ctx-menu-leave-to {
  opacity: 0;
  transform: scale(0.96);
}
</style>
