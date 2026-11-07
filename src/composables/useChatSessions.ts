/**
 * 画布助手会话状态（多会话 + 消息流）
 *
 * 单例 store（模块级 ref），同 useWorkflowCanvas 风格。
 * 目前会话只在内存中维护，关闭画布后丢失；P3 后续接入 useWorkflowCanvas
 * 的快照机制（canvasChatSessions / canvasActiveChatId）实现撤销/重做。
 */
import { computed, ref } from 'vue'
import { nanoid } from 'nanoid'

export type ChatRole = 'user' | 'assistant'

export interface ChatReference {
  /** 引用类型 */
  type: 'node' | 'image'
  /** 引用的画布节点 id（type='node' 时） */
  nodeId?: string
  /** 引用的图片地址（type='image' 时） */
  url?: string
  /** 显示文案 */
  label?: string
}

export interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  /** 助手回复中附带的图片 url 列表 */
  images?: string[]
  /** 用户消息引用的节点/图片 */
  references?: ChatReference[]
  createdAt: number
}

export interface ChatSession {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: number
  updatedAt: number
}

const sessions = ref<ChatSession[]>([])
const activeSessionId = ref<string | null>(null)
const isPanelCollapsed = ref(true)
const panelWidth = ref(440)

const PANEL_WIDTH_MIN = 320
const PANEL_WIDTH_MAX = 760

export function useChatSessions() {
  const activeSession = computed<ChatSession | null>(() =>
    sessions.value.find((s) => s.id === activeSessionId.value) || null,
  )

  const ensureSession = (): string => {
    if (sessions.value.length === 0 || !activeSessionId.value) {
      return createSession('新会话')
    }
    return activeSessionId.value
  }

  const createSession = (title = '新会话'): string => {
    const now = Date.now()
    const session: ChatSession = {
      id: nanoid(),
      title,
      messages: [],
      createdAt: now,
      updatedAt: now,
    }
    sessions.value = [session, ...sessions.value]
    activeSessionId.value = session.id
    return session.id
  }

  const removeSession = (id: string) => {
    sessions.value = sessions.value.filter((s) => s.id !== id)
    if (activeSessionId.value === id) {
      activeSessionId.value = sessions.value[0]?.id || null
    }
  }

  const removeSessions = (ids: string[]) => {
    const removeSet = new Set(ids)
    sessions.value = sessions.value.filter((s) => !removeSet.has(s.id))
    if (activeSessionId.value && removeSet.has(activeSessionId.value)) {
      activeSessionId.value = sessions.value[0]?.id || null
    }
  }

  const renameSession = (id: string, title: string) => {
    const s = sessions.value.find((x) => x.id === id)
    if (s) {
      const trimmed = title.trim()
      if (trimmed) s.title = trimmed
      s.updatedAt = Date.now()
    }
  }

  const setActive = (id: string) => {
    if (sessions.value.some((s) => s.id === id)) {
      activeSessionId.value = id
    }
  }

  const appendMessage = (sessionId: string, message: Omit<ChatMessage, 'id' | 'createdAt'>): ChatMessage => {
    const s = sessions.value.find((x) => x.id === sessionId)
    if (!s) throw new Error(`session ${sessionId} not found`)
    const msg: ChatMessage = {
      id: nanoid(),
      createdAt: Date.now(),
      ...message,
    }
    s.messages = [...s.messages, msg]
    s.updatedAt = Date.now()
    return msg
  }

  const removeMessage = (sessionId: string, messageId: string) => {
    const s = sessions.value.find((x) => x.id === sessionId)
    if (!s) return
    s.messages = s.messages.filter((m) => m.id !== messageId)
    s.updatedAt = Date.now()
  }

  const clearMessages = (sessionId: string) => {
    const s = sessions.value.find((x) => x.id === sessionId)
    if (!s) return
    s.messages = []
    s.updatedAt = Date.now()
  }

  const togglePanel = () => {
    isPanelCollapsed.value = !isPanelCollapsed.value
  }

  const setPanelWidth = (width: number) => {
    panelWidth.value = Math.max(PANEL_WIDTH_MIN, Math.min(PANEL_WIDTH_MAX, width))
  }

  return {
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
    removeSessions,
    renameSession,
    setActive,
    appendMessage,
    removeMessage,
    clearMessages,
    togglePanel,
    setPanelWidth,
  }
}
