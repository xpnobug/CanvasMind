<script setup lang="ts">
/**
 * 画布助手面板（右侧抽屉）
 *
 * 视觉/交互对照 infinite-canvas/canvas-assistant-panel：
 *   - 右侧 flex 子项，width 由 useChatSessions().panelWidth 控制
 *   - 顶栏：会话选择 + 新建 + 折叠
 *   - 中部：消息流（user / assistant 区分）
 *   - 底部：选中节点 chip 引用 + textarea + 发送
 *
 * 当前实现是骨架：发送时只 append 用户消息 + 立即 mock 一条助手回复，
 * 真正的 AI 调用接入留给后续工作（接 ai-gateway）。
 */
import { computed, nextTick, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Close, Plus, ArrowRight, Right, ChatDotRound } from '@element-plus/icons-vue'
import { useChatSessions, type ChatMessage, type ChatReference } from '@/composables/useChatSessions'
import { useCanvasSelection } from '@/composables/useCanvasSelection'
import {
  nodes,
  type WorkflowImageNodeData,
  type WorkflowTextNodeData,
} from '@/views/workflow/composables/useWorkflowCanvas'

const {
  sessions,
  activeSessionId,
  activeSession,
  isPanelCollapsed,
  panelWidth,
  PANEL_WIDTH_MIN,
  PANEL_WIDTH_MAX,
  ensureSession,
  createSession,
  removeSession,
  setActive,
  appendMessage,
  togglePanel,
  setPanelWidth,
} = useChatSessions()

const { selectedNodeIds } = useCanvasSelection()

// 默认确保有 1 个会话
ensureSession()

// === 选中节点 → 引用 chip ===
const removedRefIds = ref<Set<string>>(new Set())

/** 取节点上"可作为引用"的展示信息 */
const buildRefForNode = (nodeId: string): ChatReference | null => {
  const node = nodes.value.find((n) => n.id === nodeId)
  if (!node) return null
  if (node.type === 'image') {
    const data = node.data as WorkflowImageNodeData
    return {
      type: 'node',
      nodeId,
      url: data.url,
      label: data.label || '图片节点',
    }
  }
  if (node.type === 'text') {
    const data = node.data as WorkflowTextNodeData
    return {
      type: 'node',
      nodeId,
      label: data.label || (data.content ? data.content.slice(0, 16) : '文本节点'),
    }
  }
  return { type: 'node', nodeId, label: node.data?.label || `${node.type} 节点` }
}

const currentRefs = computed<ChatReference[]>(() => {
  const refs: ChatReference[] = []
  for (const id of selectedNodeIds.value) {
    if (removedRefIds.value.has(id)) continue
    const ref = buildRefForNode(id)
    if (ref) refs.push(ref)
  }
  return refs
})

const removeRef = (nodeId: string | undefined) => {
  if (!nodeId) return
  removedRefIds.value = new Set([...removedRefIds.value, nodeId])
}

// 选中节点变化时重置移除记录
watch(selectedNodeIds, () => {
  removedRefIds.value = new Set()
})

// === 输入框 + 发送 ===
const input = ref('')
const sending = ref(false)
const inputRef = ref<HTMLTextAreaElement | null>(null)
const messageListRef = ref<HTMLDivElement | null>(null)

const scrollToBottom = async () => {
  await nextTick()
  if (messageListRef.value) {
    messageListRef.value.scrollTop = messageListRef.value.scrollHeight
  }
}

const handleSend = async () => {
  const text = input.value.trim()
  if (!text || sending.value) return
  const sessionId = activeSessionId.value || ensureSession()
  sending.value = true
  try {
    appendMessage(sessionId, {
      role: 'user',
      content: text,
      references: currentRefs.value.length > 0 ? [...currentRefs.value] : undefined,
    })
    input.value = ''
    await scrollToBottom()
    // 真实 AI 调用预留（接 ai-gateway / agent skill），当前 mock 一条回复
    setTimeout(() => {
      appendMessage(sessionId, {
        role: 'assistant',
        content: '助手能力接入中。后续会基于当前选中节点 + 上游节点上下文调用 AI 网关。',
      })
      sending.value = false
      void scrollToBottom()
    }, 300)
  } catch (err) {
    sending.value = false
    ElMessage.error('发送失败')
    // eslint-disable-next-line no-console
    console.error('[CanvasAssistantPanel] send failed', err)
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey && !event.metaKey && !event.ctrlKey && !event.altKey) {
    event.preventDefault()
    void handleSend()
  }
}

// === 会话操作 ===
const handleCreateSession = () => {
  createSession()
  void nextTick(() => inputRef.value?.focus())
}
const handleRemoveSession = (id: string) => {
  removeSession(id)
}

// === 拖拽调宽（左侧 4px 区域） ===
const isResizing = ref(false)
const handleResizeStart = (event: PointerEvent) => {
  if (event.button !== 0) return
  event.preventDefault()
  isResizing.value = true
  const startX = event.clientX
  const startWidth = panelWidth.value
  const onMove = (e: PointerEvent) => {
    const delta = startX - e.clientX
    setPanelWidth(startWidth + delta)
  }
  const onUp = () => {
    isResizing.value = false
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
  }
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
}

// 滚动到最新消息（活动会话切换时）
watch(activeSessionId, () => {
  void scrollToBottom()
})

const formatTime = (ts: number) => {
  const d = new Date(ts)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

const previewMessage = (msg: ChatMessage): string => {
  if (msg.content) return msg.content
  if (msg.images?.length) return `[图片 ×${msg.images.length}]`
  return '(空)'
}
</script>

<template>
  <Transition name="canvas-assistant-panel-collapse">
    <aside
      v-if="!isPanelCollapsed"
      class="canvas-assistant-panel"
      :style="{ width: panelWidth + 'px' }"
    >
      <!-- 拖拽调宽手柄 -->
      <div
        class="canvas-assistant-panel__resizer"
        :class="{ 'is-resizing': isResizing }"
        @pointerdown="handleResizeStart"
        :title="`拖拽调整宽度（${PANEL_WIDTH_MIN}–${PANEL_WIDTH_MAX}px）`"
      />

      <!-- 顶栏：标题 + 会话切换 + 操作 -->
      <header class="canvas-assistant-panel__header">
        <div class="canvas-assistant-panel__title">
          <el-icon><ChatDotRound /></el-icon>
          <span>画布助手</span>
        </div>
        <div class="canvas-assistant-panel__header-actions">
          <button class="canvas-assistant-panel__icon-btn" title="新建会话" @click="handleCreateSession">
            <el-icon><Plus /></el-icon>
          </button>
          <button class="canvas-assistant-panel__icon-btn" title="折叠面板" @click="togglePanel">
            <el-icon><Right /></el-icon>
          </button>
        </div>
      </header>

      <!-- 会话 tabs -->
      <div v-if="sessions.length > 1" class="canvas-assistant-panel__sessions">
        <button
          v-for="s in sessions"
          :key="s.id"
          class="canvas-assistant-panel__session-tab"
          :class="{ 'is-active': s.id === activeSessionId }"
          @click="setActive(s.id)"
        >
          <span class="canvas-assistant-panel__session-title">{{ s.title }}</span>
          <button
            class="canvas-assistant-panel__session-close"
            title="删除会话"
            @click.stop="handleRemoveSession(s.id)"
          >
            <el-icon><Close /></el-icon>
          </button>
        </button>
      </div>

      <!-- 消息流 -->
      <div ref="messageListRef" class="canvas-assistant-panel__messages">
        <div v-if="!activeSession || activeSession.messages.length === 0" class="canvas-assistant-panel__empty">
          <p>选中画布节点后输入想问的，或直接描述新的创作意图。</p>
        </div>
        <template v-else>
          <article
            v-for="msg in activeSession.messages"
            :key="msg.id"
            class="canvas-assistant-panel__message"
            :class="`is-${msg.role}`"
          >
            <div v-if="msg.references && msg.references.length > 0" class="canvas-assistant-panel__msg-refs">
              <span
                v-for="(ref, i) in msg.references"
                :key="i"
                class="canvas-assistant-panel__msg-ref"
              >{{ ref.label || '节点' }}</span>
            </div>
            <div class="canvas-assistant-panel__msg-body">{{ previewMessage(msg) }}</div>
            <div class="canvas-assistant-panel__msg-meta">{{ formatTime(msg.createdAt) }}</div>
          </article>
        </template>
      </div>

      <!-- 选中节点 chip 引用 -->
      <div v-if="currentRefs.length > 0" class="canvas-assistant-panel__refs">
        <span class="canvas-assistant-panel__refs-label">引用：</span>
        <span
          v-for="ref in currentRefs"
          :key="ref.nodeId"
          class="canvas-assistant-panel__ref-chip"
        >
          {{ ref.label }}
          <button
            class="canvas-assistant-panel__ref-remove"
            title="移除引用"
            @click="removeRef(ref.nodeId)"
          >
            <el-icon><Close /></el-icon>
          </button>
        </span>
      </div>

      <!-- 输入框 + 发送 -->
      <footer class="canvas-assistant-panel__composer">
        <textarea
          ref="inputRef"
          v-model="input"
          class="canvas-assistant-panel__textarea"
          placeholder="输入消息，Enter 发送，Shift+Enter 换行"
          rows="3"
          @keydown="handleKeydown"
        />
        <button
          class="canvas-assistant-panel__send"
          :disabled="!input.trim() || sending"
          @click="handleSend"
        >
          <el-icon><ArrowRight /></el-icon>
          <span>{{ sending ? '发送中' : '发送' }}</span>
        </button>
      </footer>
    </aside>
  </Transition>
</template>

<style scoped>
.canvas-assistant-panel {
  position: relative;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  height: 100%;
  background: var(--canvas-bg-block-default);
  border-left: 0.5px solid var(--stroke-secondary);
  overflow: hidden;
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.canvas-assistant-panel__resizer {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  cursor: col-resize;
  background: transparent;
  z-index: 2;
}
.canvas-assistant-panel__resizer:hover,
.canvas-assistant-panel__resizer.is-resizing {
  background: var(--brand-main-default);
  opacity: 0.5;
}

.canvas-assistant-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 0.5px solid var(--stroke-secondary);
  color: var(--text-primary);
}
.canvas-assistant-panel__title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
}
.canvas-assistant-panel__header-actions {
  display: inline-flex;
  gap: 4px;
}
.canvas-assistant-panel__icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: transparent;
  border: 0;
  border-radius: var(--lv-border-radius-medium);
  color: var(--text-secondary);
  cursor: pointer;
  transition: background-color 0.12s, color 0.12s;
}
.canvas-assistant-panel__icon-btn:hover {
  background: var(--canvas-float-block-hover);
  color: var(--text-primary);
}

.canvas-assistant-panel__sessions {
  display: flex;
  gap: 6px;
  padding: 8px 12px;
  border-bottom: 0.5px solid var(--stroke-secondary);
  overflow-x: auto;
}
.canvas-assistant-panel__session-tab {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: transparent;
  border: 0.5px solid var(--stroke-secondary);
  border-radius: var(--lv-border-radius-medium);
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
  flex-shrink: 0;
}
.canvas-assistant-panel__session-tab.is-active {
  background: var(--brand-main-block-default);
  border-color: var(--brand-main-default);
  color: var(--brand-main-default);
}
.canvas-assistant-panel__session-title {
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.canvas-assistant-panel__session-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  background: transparent;
  border: 0;
  color: inherit;
  cursor: pointer;
  opacity: 0.6;
}
.canvas-assistant-panel__session-close:hover {
  opacity: 1;
}

.canvas-assistant-panel__messages {
  flex: 1 1 0;
  overflow-y: auto;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.canvas-assistant-panel__empty {
  margin: auto;
  color: var(--text-tertiary);
  font-size: 12px;
  text-align: center;
}
.canvas-assistant-panel__message {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-width: 85%;
  padding: 8px 12px;
  border-radius: var(--lv-border-radius-large);
  background: var(--canvas-float-block-default);
  color: var(--text-primary);
  font-size: 13px;
  line-height: 1.55;
}
.canvas-assistant-panel__message.is-user {
  align-self: flex-end;
  background: var(--brand-main-block-default);
  color: var(--brand-main-default);
}
.canvas-assistant-panel__msg-refs {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.canvas-assistant-panel__msg-ref {
  padding: 1px 6px;
  background: var(--canvas-bg-block-default);
  border-radius: var(--lv-border-radius-small);
  font-size: 11px;
  color: var(--text-secondary);
}
.canvas-assistant-panel__msg-body {
  white-space: pre-wrap;
  word-break: break-word;
}
.canvas-assistant-panel__msg-meta {
  font-size: 11px;
  color: var(--text-tertiary);
  text-align: right;
}

.canvas-assistant-panel__refs {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  padding: 8px 16px;
  border-top: 0.5px solid var(--stroke-secondary);
}
.canvas-assistant-panel__refs-label {
  font-size: 12px;
  color: var(--text-tertiary);
}
.canvas-assistant-panel__ref-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  background: var(--canvas-float-block-default);
  border: 0.5px solid var(--stroke-secondary);
  border-radius: 999px;
  font-size: 12px;
  color: var(--text-primary);
  max-width: 200px;
}
.canvas-assistant-panel__ref-chip > span,
.canvas-assistant-panel__ref-chip {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.canvas-assistant-panel__ref-remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  background: transparent;
  border: 0;
  color: var(--text-secondary);
  cursor: pointer;
}
.canvas-assistant-panel__ref-remove:hover {
  color: #ef4444;
}

.canvas-assistant-panel__composer {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 16px;
  border-top: 0.5px solid var(--stroke-secondary);
}
.canvas-assistant-panel__textarea {
  width: 100%;
  resize: none;
  padding: 8px 10px;
  background: var(--canvas-float-block-default);
  border: 0.5px solid var(--stroke-secondary);
  border-radius: var(--lv-border-radius-medium);
  color: var(--text-primary);
  font-size: 13px;
  line-height: 1.5;
  outline: none;
}
.canvas-assistant-panel__textarea:focus {
  border-color: var(--brand-main-default);
}
.canvas-assistant-panel__send {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 6px 12px;
  background: var(--brand-main-default);
  border: 0;
  border-radius: var(--lv-border-radius-medium);
  color: #fff;
  font-size: 13px;
  cursor: pointer;
  align-self: flex-end;
  transition: opacity 0.12s;
}
.canvas-assistant-panel__send:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.canvas-assistant-panel-collapse-enter-active,
.canvas-assistant-panel-collapse-leave-active {
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s;
}
.canvas-assistant-panel-collapse-enter-from,
.canvas-assistant-panel-collapse-leave-to {
  width: 0 !important;
  opacity: 0;
}
</style>
