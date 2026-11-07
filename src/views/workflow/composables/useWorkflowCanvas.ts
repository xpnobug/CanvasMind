/**
 * 画布状态管理
 *
 * 管理节点、边、视口、背景、助手会话等所有"画布项目级"状态，
 * 并维护一份扩展过的撤销/重做历史栈：
 *
 *   - 快照单元覆盖 nodes / edges / viewport / backgroundMode / showImageInfo
 *     / chatSessions / activeChatId（与 infinite-canvas 对齐）
 *   - 通过 watch + 180ms 防抖自动入栈，所有 mutator 不必显式调用
 *   - 拖拽期间通过 pauseHistory / resumeHistory 暂停入栈，
 *     避免连续位置变化把历史撑满
 *   - 最大 50 条；序列化比对避免无意义重复入栈
 *   - canUndo / canRedo 暴露为 computed，模板里直接 :disabled="!canUndo"
 *
 * API 兼容性：addNode / addEdge / updateNode / updateEdge / removeNode / removeEdge /
 *   duplicateNode / undo / redo / applyCanvasSnapshot / manualSaveHistory /
 *   initHistory / initSampleData / updateViewport / clearCanvas 签名保持不变。
 *   新增：pauseHistory / resumeHistory / canvasBackgroundMode / canvasShowImageInfo /
 *   canvasChatSessions / canvasActiveChatId。
 */
import { computed, ref, watch } from 'vue'
import { getDefaultChatModelKey, getDefaultImageModelKey, getDefaultVideoModelKey, getModelByName } from '@/config/models'
import type { WorkflowCanvasPosition } from './workflow-orchestrator-types'

export type WorkflowNodeType = 'text' | 'imageConfig' | 'videoConfig' | 'image' | 'video' | 'llmConfig'

export interface WorkflowNodeDataBase {
  label?: string
  createdAt?: number
  updatedAt?: number
  loading?: boolean
  error?: string
  taskRecordId?: string
  autoExecute?: boolean
  executed?: boolean
  outputNodeId?: string
}

export interface WorkflowTextNodeData extends WorkflowNodeDataBase {
  content: string
  polishModel?: string
  /** 文本字号，px。hover toolbar 通过 +/- 调节，默认 14 */
  fontSize?: number
}

export interface WorkflowImageConfigNodeData extends WorkflowNodeDataBase {
  prompt?: string
  model?: string
  size?: string
  quality?: string
}

export interface WorkflowVideoConfigNodeData extends WorkflowNodeDataBase {
  prompt?: string
  ratio?: string
  duration?: number
  model?: string
}

export interface WorkflowImageNodeData extends WorkflowNodeDataBase {
  url: string
  base64?: string
  duration?: number
  /** 批量生图组首标记（节点内自渲染叠卡） */
  isBatchRoot?: boolean
  /** 组内子图列表（包含主图副本） */
  batchChildren?: Array<{ id: string; url: string }>
  /** 当前显示为主图的子图 id（指向 batchChildren 中的某项） */
  primaryImageId?: string
  /** 是否展开为网格视图（false=叠卡折叠，true=网格展开） */
  batchExpanded?: boolean
}

export interface WorkflowVideoNodeData extends WorkflowNodeDataBase {
  url: string
  duration: number
}

export interface WorkflowLlmConfigNodeData extends WorkflowNodeDataBase {
  systemPrompt?: string
  model?: string
  outputFormat?: string
  outputContent?: string
}

export interface WorkflowNodeDataMap {
  text: WorkflowTextNodeData
  imageConfig: WorkflowImageConfigNodeData
  videoConfig: WorkflowVideoConfigNodeData
  image: WorkflowImageNodeData
  video: WorkflowVideoNodeData
  llmConfig: WorkflowLlmConfigNodeData
}

export type WorkflowNodeData = WorkflowNodeDataMap[WorkflowNodeType]

export interface WorkflowCanvasNode<T extends WorkflowNodeType = WorkflowNodeType> {
  id: string
  type: T
  position: WorkflowCanvasPosition
  data: WorkflowNodeDataMap[T]
  zIndex?: number
  selected?: boolean
}

export type WorkflowEdgeType = 'promptOrder' | 'imageOrder' | 'imageRole'

export interface WorkflowPromptOrderEdgeData {
  promptOrder: number
}

export interface WorkflowImageOrderEdgeData {
  imageOrder: number
}

export interface WorkflowImageRoleEdgeData {
  imageRole: string
}

export type WorkflowEdgeData =
  | WorkflowPromptOrderEdgeData
  | WorkflowImageOrderEdgeData
  | WorkflowImageRoleEdgeData
  | Record<string, unknown>
  | undefined

export interface WorkflowCanvasEdge {
  id: string
  source: string
  target: string
  sourceHandle?: string
  targetHandle?: string
  type?: WorkflowEdgeType
  data?: WorkflowEdgeData
}

/** 画布背景模式（dots / lines / blank） */
export type WorkflowBackgroundMode = 'dots' | 'lines' | 'blank'

/** 助手会话快照（详细消息结构在 P3 useChatSessions 中定义，此处先用 unknown 保留位） */
export interface WorkflowAssistantSessionSnapshot {
  id: string
  title: string
  messages: unknown[]
  createdAt: number
  updatedAt: number
}

export interface WorkflowCanvasViewportSnapshot {
  x: number
  y: number
  zoom: number
}

/**
 * 画布快照单元（撤销/重做的最小颗粒）
 * viewport / backgroundMode / showImageInfo / chatSessions / activeChatId 都纳入历史。
 */
export interface WorkflowCanvasStateSnapshot {
  nodes: WorkflowCanvasNode[]
  edges: WorkflowCanvasEdge[]
  viewport?: WorkflowCanvasViewportSnapshot
  backgroundMode?: WorkflowBackgroundMode
  showImageInfo?: boolean
  chatSessions?: WorkflowAssistantSessionSnapshot[]
  activeChatId?: string | null
}

type WorkflowNodeUpdatePayload = Partial<WorkflowNodeData> & {
  position?: WorkflowCanvasPosition
  zIndex?: number
}

export interface WorkflowEdgePatch {
  data?: WorkflowEdgeData
}

export interface WorkflowAddEdgeParams {
  source: string
  target: string
  sourceHandle?: string
  targetHandle?: string
  type?: WorkflowEdgeType
  data?: WorkflowEdgeData
}

// 节点 ID 计数器
let nodeId = 0
const getNodeId = () => `node_${nodeId++}`

// === 画布数据状态 ===
export const nodes = ref<WorkflowCanvasNode[]>([])
export const edges = ref<WorkflowCanvasEdge[]>([])
export const canvasViewport = ref<WorkflowCanvasViewportSnapshot>({ x: 100, y: 50, zoom: 0.8 })

// 画布外观（迁移自 infinite-canvas，纳入历史快照）
export const canvasBackgroundMode = ref<WorkflowBackgroundMode>('dots')
export const canvasShowImageInfo = ref<boolean>(false)

// 助手会话（P3 实现 useChatSessions 时会读写这两个字段，先建好位）
export const canvasChatSessions = ref<WorkflowAssistantSessionSnapshot[]>([])
export const canvasActiveChatId = ref<string | null>(null)

// === 撤销/重做历史栈 ===
const history = ref<WorkflowCanvasStateSnapshot[]>([])
const historyIndex = ref(-1)
const MAX_HISTORY = 50
const HISTORY_DEBOUNCE_MS = 180

let isRestoring = false
let historyPaused = false
let pendingHistoryTimer: ReturnType<typeof setTimeout> | null = null
// 缓存上次入栈的序列化结果，跳过完全相同的"无意义入栈"
let lastSerializedSnapshot = ''

const cloneCanvasState = (state: WorkflowCanvasStateSnapshot): WorkflowCanvasStateSnapshot => {
  return JSON.parse(JSON.stringify(state)) as WorkflowCanvasStateSnapshot
}

const captureSnapshot = (): WorkflowCanvasStateSnapshot => ({
  nodes: nodes.value,
  edges: edges.value,
  viewport: { ...canvasViewport.value },
  backgroundMode: canvasBackgroundMode.value,
  showImageInfo: canvasShowImageInfo.value,
  chatSessions: canvasChatSessions.value,
  activeChatId: canvasActiveChatId.value,
})

const commitHistory = () => {
  pendingHistoryTimer = null
  if (isRestoring || historyPaused) return

  const raw = captureSnapshot()
  const serialized = JSON.stringify(raw)
  if (serialized === lastSerializedSnapshot) return
  lastSerializedSnapshot = serialized

  const state = cloneCanvasState(raw)

  // 用户在中段 undo 后再做新操作 → 截断 future
  if (historyIndex.value < history.value.length - 1) {
    history.value = history.value.slice(0, historyIndex.value + 1)
  }

  history.value.push(state)

  if (history.value.length > MAX_HISTORY) {
    history.value.splice(0, history.value.length - MAX_HISTORY)
  }
  historyIndex.value = history.value.length - 1
}

/** 入栈（带 180ms 防抖；拖拽期间被 pause 时跳过） */
const saveToHistory = () => {
  if (isRestoring || historyPaused) return
  if (pendingHistoryTimer) clearTimeout(pendingHistoryTimer)
  pendingHistoryTimer = setTimeout(commitHistory, HISTORY_DEBOUNCE_MS)
}

/**
 * 暂停入栈（典型用法：节点拖拽 onNodeDragStart 时调用）
 * 暂停期间所有变化都不会入栈；与 resumeHistory 配对使用。
 */
export const pauseHistory = () => {
  historyPaused = true
  if (pendingHistoryTimer) {
    clearTimeout(pendingHistoryTimer)
    pendingHistoryTimer = null
  }
}

/**
 * 恢复入栈
 * @param commitNow 默认 true，恢复时立即提交一次（典型：拖拽结束把最终位置作为 1 条历史）
 */
export const resumeHistory = (commitNow = true) => {
  historyPaused = false
  if (commitNow) commitHistory()
}

// 监听所有纳入快照的字段，自动防抖入栈（mutator 不必再显式调用 saveToHistory）
watch(
  [nodes, edges, canvasViewport, canvasBackgroundMode, canvasShowImageInfo, canvasChatSessions, canvasActiveChatId],
  () => saveToHistory(),
  { deep: true },
)

/**
 * 获取节点类型的默认数据
 */
const getDefaultNodeData = <T extends WorkflowNodeType>(type: T): WorkflowNodeDataMap[T] => {
  switch (type) {
    case 'text':
      return { content: '', label: '文本输入' } as WorkflowNodeDataMap[T]
    case 'imageConfig': {
      const model = getModelByName(getDefaultImageModelKey())
      return {
        prompt: '',
        model: getDefaultImageModelKey(),
        size: model?.defaultParams?.size || '1x1',
        quality: model?.defaultParams?.quality || 'standard',
        label: '文生图'
      } as WorkflowNodeDataMap[T]
    }
    case 'videoConfig': {
      const model = getModelByName(getDefaultVideoModelKey())
      return {
        prompt: '',
        ratio: model?.defaultParams?.ratio || '16x9',
        duration: model?.defaultParams?.duration || 5,
        model: getDefaultVideoModelKey(),
        label: '图生视频'
      } as WorkflowNodeDataMap[T]
    }
    case 'video':
      return { url: '', duration: 0, label: '视频节点' } as WorkflowNodeDataMap[T]
    case 'image':
      return { url: '', label: '图片节点' } as WorkflowNodeDataMap[T]
    case 'llmConfig':
      return {
        systemPrompt: '',
        model: getDefaultChatModelKey(),
        outputFormat: 'text',
        outputContent: '',
        label: 'LLM文本生成'
      } as WorkflowNodeDataMap[T]
    default:
      throw new Error(`不支持的节点类型: ${String(type)}`)
  }
}

// 添加节点
export const addNode = <T extends WorkflowNodeType>(
  type: T,
  position: WorkflowCanvasPosition = { x: 100, y: 100 },
  data: Partial<WorkflowNodeDataMap[T]> = {},
) => {
  const id = getNodeId()
  const now = Date.now()
  const nextNode: WorkflowCanvasNode<T> = {
    id,
    type,
    position,
    data: {
      ...getDefaultNodeData(type),
      ...data,
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now,
    } as WorkflowNodeDataMap[T],
  }
  nodes.value = [...nodes.value, nextNode]
  // 入栈由全局 watch 防抖触发，无需显式调用
  return id
}

// 更新节点数据
export const updateNode = (id: string, patch: WorkflowNodeUpdatePayload) => {
  const { position, zIndex, ...dataPatch } = patch
  nodes.value = nodes.value.map(node =>
    node.id === id ? {
      ...node,
      position: position || node.position,
      zIndex: zIndex ?? node.zIndex,
      data: {
        ...node.data,
        ...dataPatch,
      },
    } : node,
  )
  // 拖拽位置变更也通过 watch 入栈（拖拽中由调用方 pauseHistory，结束 resumeHistory）
}

// 删除节点
export const removeNode = (id: string) => {
  nodes.value = nodes.value.filter(node => node.id !== id)
  edges.value = edges.value.filter(edge => edge.source !== id && edge.target !== id)
}

// 复制节点
export const duplicateNode = (id: string) => {
  const source = nodes.value.find(node => node.id === id)
  if (!source) return null

  const newId = getNodeId()
  const maxZ = Math.max(0, ...nodes.value.map(n => n.zIndex || 0))

  nodes.value = [...nodes.value, {
    id: newId,
    type: source.type,
    position: { x: source.position.x + 50, y: source.position.y + 50 },
    data: { ...source.data },
    zIndex: maxZ + 1
  }]
  return newId
}

export const addEdge = (params: WorkflowAddEdgeParams) => {
  const nextEdge: WorkflowCanvasEdge = {
    id: `edge_${params.source}_${params.target}`,
    ...params,
  }
  edges.value = [...edges.value, nextEdge]
}

// 更新边数据
export const updateEdge = (id: string, patch: WorkflowEdgePatch) => {
  edges.value = edges.value.map(edge =>
    edge.id === id ? {
      ...edge,
      data: {
        ...(edge.data && typeof edge.data === 'object' ? edge.data : {}),
        ...(patch.data && typeof patch.data === 'object' ? patch.data : {}),
      },
    } : edge,
  )
}

// 删除边
export const removeEdge = (id: string) => {
  edges.value = edges.value.filter(edge => edge.id !== id)
}

// 清空画布
export const clearCanvas = () => {
  nodes.value = []
  edges.value = []
  nodeId = 0
}

// 更新视口（频繁触发，依赖防抖合并）
export const updateViewport = (viewport: WorkflowCanvasViewportSnapshot) => {
  canvasViewport.value = viewport
}

// 撤销
export const undo = (): boolean => {
  if (historyIndex.value <= 0) return false
  historyIndex.value--
  restoreState(history.value[historyIndex.value])
  return true
}

// 重做
export const redo = (): boolean => {
  if (historyIndex.value >= history.value.length - 1) return false
  historyIndex.value++
  restoreState(history.value[historyIndex.value])
  return true
}

const restoreState = (state: WorkflowCanvasStateSnapshot) => {
  isRestoring = true
  const nextState = cloneCanvasState(state)
  nodes.value = nextState.nodes
  edges.value = nextState.edges
  if (nextState.viewport) canvasViewport.value = { ...nextState.viewport }
  if (nextState.backgroundMode !== undefined) canvasBackgroundMode.value = nextState.backgroundMode
  if (nextState.showImageInfo !== undefined) canvasShowImageInfo.value = nextState.showImageInfo
  if (nextState.chatSessions !== undefined) canvasChatSessions.value = nextState.chatSessions
  if (nextState.activeChatId !== undefined) canvasActiveChatId.value = nextState.activeChatId
  // 同步 lastSerialized，避免 restore 后 watch 把同一状态再入一次栈
  lastSerializedSnapshot = JSON.stringify(captureSnapshot())
  // 等 watch microtask 跑完再解锁
  setTimeout(() => { isRestoring = false }, 100)
}

const syncNodeIdCounter = (canvasNodes: WorkflowCanvasNode[]) => {
  const maxNodeIndex = canvasNodes.reduce((maxValue, node) => {
    const matched = String(node.id || '').match(/^node_(\d+)$/)
    if (!matched) {
      return maxValue
    }

    const nextValue = Number(matched[1])
    return Number.isFinite(nextValue) ? Math.max(maxValue, nextValue) : maxValue
  }, -1)

  nodeId = maxNodeIndex + 1
}

// 直接应用外部读取到的画布快照，供工作流持久化加载使用。
export const applyCanvasSnapshot = (
  state: WorkflowCanvasStateSnapshot,
  viewportState?: WorkflowCanvasViewportSnapshot | null,
) => {
  const nextState = cloneCanvasState(state)
  isRestoring = true
  nodes.value = nextState.nodes
  edges.value = nextState.edges
  syncNodeIdCounter(nextState.nodes)

  if (viewportState) {
    canvasViewport.value = {
      x: Number(viewportState.x || 0),
      y: Number(viewportState.y || 0),
      zoom: Number(viewportState.zoom || 1) || 1,
    }
  } else if (nextState.viewport) {
    canvasViewport.value = { ...nextState.viewport }
  }

  if (nextState.backgroundMode !== undefined) canvasBackgroundMode.value = nextState.backgroundMode
  if (nextState.showImageInfo !== undefined) canvasShowImageInfo.value = nextState.showImageInfo
  if (nextState.chatSessions !== undefined) canvasChatSessions.value = nextState.chatSessions
  if (nextState.activeChatId !== undefined) canvasActiveChatId.value = nextState.activeChatId

  setTimeout(() => { isRestoring = false }, 100)
  initHistory()
}

/** 撤销可用性（响应式 computed，模板用 :disabled="!canUndo"） */
export const canUndo = computed(() => historyIndex.value > 0)
/** 重做可用性（响应式 computed） */
export const canRedo = computed(() => historyIndex.value < history.value.length - 1)

/** 手动立即入栈（不防抖），用于显式提交场景 */
export const manualSaveHistory = () => {
  if (isRestoring || historyPaused) return
  if (pendingHistoryTimer) {
    clearTimeout(pendingHistoryTimer)
    pendingHistoryTimer = null
  }
  commitHistory()
}

/**
 * 初始化画布（带示例数据）
 */
export const initSampleData = () => {
  clearCanvas()
  addNode('text', { x: 150, y: 150 }, {
    content: '一只金毛寻回犬在草地上奔跑，摇着尾巴，脸上带着快乐的表情。',
    label: '文本输入'
  })
  addNode('imageConfig', { x: 500, y: 150 }, { label: '文生图' })
  addEdge({
    source: 'node_0',
    target: 'node_1',
    sourceHandle: 'right',
    targetHandle: 'left'
  })
}

/**
 * 初始化历史（页面加载/重置时调用，把当前状态作为唯一基线）
 */
export const initHistory = () => {
  // 取消潜在的 pending 入栈
  if (pendingHistoryTimer) {
    clearTimeout(pendingHistoryTimer)
    pendingHistoryTimer = null
  }
  const baseline = cloneCanvasState(captureSnapshot())
  history.value = [baseline]
  historyIndex.value = 0
  lastSerializedSnapshot = JSON.stringify(baseline)
}
