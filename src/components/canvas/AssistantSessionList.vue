<script setup lang="ts">
/**
 * 画布助手会话列表浮层
 *
 * 在 RightPanel 头部 trigger-container 点击后弹出。
 * 支持：+ 新建对话 / 切换选中会话 / hover 重命名 / hover 删除
 * 不使用 Element Plus el-popover：用纯 Teleport + fixed 定位贴合 anchor 的 bottom-left。
 */
import { computed, nextTick, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import type { PersistedGenerationSession } from '@/api/generation-sessions'

const props = defineProps<{
  visible: boolean
  sessions: PersistedGenerationSession[]
  activeId: string
  anchor: HTMLElement | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'create'): void
  (e: 'select', id: string): void
  (e: 'rename', id: string, title: string): void
  (e: 'delete', id: string): void
}>()

const popupRef = ref<HTMLDivElement | null>(null)
const renamingId = ref<string>('')
const renameDraft = ref<string>('')
const renameInputRef = ref<HTMLInputElement | null>(null)
// v-for + ref="" 在 Vue 3 里会把绑定值变成数组（即使只渲染一个）。
// 用函数 ref 直接拿到当前生效那一个 input 元素。
const setRenameInputRef = (el: unknown) => {
  renameInputRef.value = el && typeof (el as HTMLInputElement).focus === 'function'
    ? (el as HTMLInputElement)
    : null
}

const position = ref({ top: 0, left: 0, width: 320 })

const updatePosition = () => {
  if (!props.anchor) return
  const rect = props.anchor.getBoundingClientRect()
  position.value = {
    top: rect.bottom + 4,
    left: rect.left,
    width: Math.max(280, Math.min(360, rect.width || 320)),
  }
}

const sortedSessions = computed(() => {
  const list = [...props.sessions]
  list.sort((a, b) => {
    if (a.isDefault && !b.isDefault) return -1
    if (!a.isDefault && b.isDefault) return 1
    const aTime = new Date(a.lastRecordAt || a.updatedAt || a.createdAt).getTime()
    const bTime = new Date(b.lastRecordAt || b.updatedAt || b.createdAt).getTime()
    return bTime - aTime
  })
  return list
})

const handleDocumentMouseDown = (event: MouseEvent) => {
  if (!props.visible) return
  const target = event.target as Node | null
  if (!target) return
  if (popupRef.value?.contains(target)) return
  if (props.anchor?.contains(target)) return
  emit('close')
}

const handleEsc = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && props.visible) {
    if (renamingId.value) {
      cancelRename()
    } else {
      emit('close')
    }
  }
}

const handleResize = () => updatePosition()

onMounted(() => {
  document.addEventListener('mousedown', handleDocumentMouseDown)
  document.addEventListener('keydown', handleEsc)
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleDocumentMouseDown)
  document.removeEventListener('keydown', handleEsc)
  window.removeEventListener('resize', handleResize)
})

watch(
  () => props.visible,
  async (visible) => {
    if (visible) {
      await nextTick()
      updatePosition()
    } else {
      renamingId.value = ''
    }
  },
)

const startRename = (session: PersistedGenerationSession) => {
  renamingId.value = session.id
  renameDraft.value = session.title || ''
  nextTick(() => renameInputRef.value?.focus())
}

const commitRename = (id: string) => {
  const title = renameDraft.value.trim()
  if (title && title !== props.sessions.find((s) => s.id === id)?.title) {
    emit('rename', id, title)
  }
  renamingId.value = ''
}

const cancelRename = () => {
  renamingId.value = ''
  renameDraft.value = ''
}

const handleSelect = (session: PersistedGenerationSession) => {
  if (renamingId.value === session.id) return
  emit('select', session.id)
}

const handleDelete = (event: MouseEvent, session: PersistedGenerationSession) => {
  event.stopPropagation()
  if (session.isDefault) return
  emit('delete', session.id)
}

const handleRenameClick = (event: MouseEvent, session: PersistedGenerationSession) => {
  event.stopPropagation()
  startRename(session)
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible"
      ref="popupRef"
      class="assistant-session-list"
      :style="{ top: `${position.top}px`, left: `${position.left}px`, width: `${position.width}px` }"
    >
      <button class="assistant-session-list__new" type="button" @click="emit('create')">
        <span class="assistant-session-list__new-icon">+</span>
        <span>新建对话</span>
      </button>

      <div class="assistant-session-list__divider" />

      <div class="assistant-session-list__items">
        <div
          v-for="session in sortedSessions"
          :key="session.id"
          class="assistant-session-list__item"
          :class="{ 'is-active': session.id === activeId }"
          @click="handleSelect(session)"
        >
          <div class="assistant-session-list__item-main">
            <input
              v-if="renamingId === session.id"
              :ref="setRenameInputRef"
              v-model="renameDraft"
              class="assistant-session-list__item-input"
              :maxlength="40"
              @blur="commitRename(session.id)"
              @keydown.enter.prevent="commitRename(session.id)"
              @keydown.esc.prevent="cancelRename"
              @click.stop
            />
            <span v-else class="assistant-session-list__item-title">
              {{ session.title || '未命名对话' }}
            </span>
            <span class="assistant-session-list__item-meta">
              {{ session.recordCount || 0 }} 条
            </span>
          </div>

          <div v-if="renamingId !== session.id" class="assistant-session-list__item-actions">
            <button
              v-if="!session.isDefault"
              class="assistant-session-list__item-btn"
              title="重命名"
              type="button"
              @click="handleRenameClick($event, session)"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M14.82 3.18a3.41 3.41 0 0 1 4.82 4.82l-8.95 8.95a1.5 1.5 0 0 1-.64.39l-3.21.96a.75.75 0 0 1-.93-.93l.96-3.21a1.5 1.5 0 0 1 .39-.64l8.95-8.95Z" fill="currentColor"/>
              </svg>
            </button>
            <button
              v-if="!session.isDefault"
              class="assistant-session-list__item-btn assistant-session-list__item-btn--danger"
              title="删除"
              type="button"
              @click="handleDelete($event, session)"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M9 3h6v2H9V3Zm-4 4h14l-1 13a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 7Zm4 3v9h2v-9H9Zm4 0v9h2v-9h-2Z" fill="currentColor"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.assistant-session-list {
  background: var(--canvas-float-block-default, var(--bg-block-secondary, rgba(20, 20, 22, 0.96)));
  border: 1px solid var(--stroke-secondary, rgba(255, 255, 255, 0.08));
  border-radius: 12px;
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.32);
  color: var(--text-primary);
  display: flex;
  flex-direction: column;
  max-height: 60vh;
  padding: 8px;
  position: fixed;
  z-index: 2000;
}

.assistant-session-list__new {
  align-items: center;
  background: transparent;
  border: 0;
  border-radius: 8px;
  color: var(--text-primary);
  cursor: pointer;
  display: inline-flex;
  font-size: 14px;
  gap: 8px;
  padding: 8px 10px;
  transition: background-color 0.15s ease;
  width: 100%;
}
.assistant-session-list__new:hover {
  background: var(--bg-block-primary-hover, rgba(255, 255, 255, 0.06));
}
.assistant-session-list__new-icon {
  align-items: center;
  border: 1px solid var(--stroke-secondary, rgba(255, 255, 255, 0.16));
  border-radius: 50%;
  display: inline-flex;
  font-size: 14px;
  height: 18px;
  justify-content: center;
  width: 18px;
}

.assistant-session-list__divider {
  background: var(--stroke-tertiary, rgba(255, 255, 255, 0.06));
  height: 1px;
  margin: 6px 0;
}

.assistant-session-list__items {
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow-y: auto;
}

.assistant-session-list__item {
  align-items: center;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  gap: 8px;
  padding: 8px 10px;
  transition: background-color 0.15s ease;
}
.assistant-session-list__item:hover {
  background: var(--bg-block-primary-hover, rgba(255, 255, 255, 0.05));
}
.assistant-session-list__item.is-active {
  background: var(--bg-block-primary-pressed, rgba(255, 255, 255, 0.08));
}
.assistant-session-list__item-main {
  align-items: baseline;
  display: flex;
  flex: 1 1 0;
  gap: 8px;
  min-width: 0;
}
.assistant-session-list__item-title {
  color: var(--text-primary);
  flex: 1 1 0;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.assistant-session-list__item-input {
  background: transparent;
  border: 1px solid var(--brand-main-default, #02dba3);
  border-radius: 4px;
  color: var(--text-primary);
  flex: 1 1 0;
  font-size: 14px;
  outline: none;
  padding: 2px 6px;
}
.assistant-session-list__item-meta {
  color: var(--text-tertiary);
  flex-shrink: 0;
  font-size: 12px;
}

.assistant-session-list__item-actions {
  display: none;
  gap: 4px;
}
.assistant-session-list__item:hover .assistant-session-list__item-actions {
  display: inline-flex;
}
.assistant-session-list__item-btn {
  align-items: center;
  background: transparent;
  border: 0;
  border-radius: 6px;
  color: var(--text-tertiary);
  cursor: pointer;
  display: inline-flex;
  height: 24px;
  justify-content: center;
  padding: 0;
  transition: background-color 0.15s ease, color 0.15s ease;
  width: 24px;
}
.assistant-session-list__item-btn:hover {
  background: var(--bg-block-primary-hover, rgba(255, 255, 255, 0.08));
  color: var(--text-primary);
}
.assistant-session-list__item-btn--danger:hover {
  color: #ef4444;
}
</style>
