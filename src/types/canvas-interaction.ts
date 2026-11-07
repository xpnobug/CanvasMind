/**
 * 画布交互运行时类型
 *
 * 这里只放"画布层交互过程中"用到的瞬时/工具类型：
 *   - 剪贴板载荷
 *   - 右键上下文菜单菜单项
 *   - 批量生图组运行时状态（节点内自渲染叠卡所需）
 *   - 拖入文件分类
 *   - 选择/连接交互的瞬时态
 *
 * 不放在 useWorkflowCanvas.ts 里是因为这些类型不属于"画布项目数据快照"，
 * 不进历史栈、不进 workflow-definition 持久化。
 *
 * 节点/边的数据结构定义见 useWorkflowCanvas.ts；本文件只引用、不重复定义。
 */
import type {
  WorkflowCanvasNode,
  WorkflowCanvasEdge,
  WorkflowNodeType,
} from '@/views/workflow/composables/useWorkflowCanvas'
import type { WorkflowCanvasPosition } from '@/views/workflow/composables/workflow-orchestrator-types'

// ============================================================
// 剪贴板（Cmd+C / Cmd+V）
// ============================================================

/** 画布剪贴板的格式版本号，便于以后扩展时做兼容判断 */
export const CANVAS_CLIPBOARD_VERSION = 1

/**
 * 剪贴板载荷：保存选中的一组节点 + 它们内部的连线
 * 不保存到其他节点的连线（粘贴时也无法保证目标存在）
 */
export interface CanvasClipboardPayload {
  version: typeof CANVAS_CLIPBOARD_VERSION
  /** 节点列表（已经按"以中心为原点"做过坐标归一化） */
  nodes: WorkflowCanvasNode[]
  /** 节点之间的连线（仅 source、target 都在 nodes 中的连线才会收纳） */
  edges: WorkflowCanvasEdge[]
  /** 拷贝瞬间的画布中心，用于粘贴时做相对偏移 */
  origin: WorkflowCanvasPosition
}

// ============================================================
// 右键上下文菜单
// ============================================================

/** 上下文菜单触发场景 */
export type ContextMenuScene = 'pane' | 'node' | 'edge'

/** 单个菜单项 */
export interface ContextMenuItem {
  /** 菜单 ID，建议用稳定字符串，便于埋点 */
  id: string
  /** 显示文案（中文） */
  label: string
  /** 可选图标名（lucide-react / Element Plus icon name） */
  icon?: string
  /** 是否禁用 */
  disabled?: boolean
  /** 是否为危险操作（红色显示） */
  danger?: boolean
  /** 右侧快捷键提示（仅用于显示，不用于绑定） */
  shortcut?: string
  /** 子菜单 */
  children?: ContextMenuItem[]
  /** 分隔线（type=divider 时其他字段都忽略） */
  type?: 'item' | 'divider'
  /** 点击 handler；不传则视为禁用 */
  onClick?: () => void
}

/** 上下文菜单运行时位置（屏幕坐标） */
export interface ContextMenuPosition {
  x: number
  y: number
}

/** 上下文菜单当前打开状态 */
export interface ContextMenuState {
  visible: boolean
  scene: ContextMenuScene
  position: ContextMenuPosition
  /** scene='node' / 'edge' 时附带目标 id */
  targetId?: string
  items: ContextMenuItem[]
}

// ============================================================
// 批量生图组（仅 ImageNode 内部渲染用）
// ============================================================

/**
 * 单张子图（不是 Vue Flow 真节点，只是节点内部的渲染单元）
 *
 * 对应 infinite-canvas types.ts:41-46 中的 batchChildIds 元素，
 * 但在 canana-vue 这边走"节点内自渲染"路线，不暴露给 Vue Flow。
 */
export interface BatchChildImage {
  /** 子图自己的 ID（生成后用于"设为主图"/删除/重试） */
  id: string
  /** 图片 URL（已上传后的 publicUrl） */
  url: string
  /** 原图宽（可选，用于等比展示） */
  naturalWidth?: number
  naturalHeight?: number
  /** 该子图的生成元信息（提示词/模型/质量等，用于重试） */
  metadata?: Record<string, unknown>
  /** 是否生成失败 */
  error?: string
  /** 是否还在生成中 */
  loading?: boolean
}

/**
 * 批量组在 ImageNode.data 上挂的额外字段（命名与 infinite-canvas 对齐）
 *
 * 使用时把这些字段并入 WorkflowImageNodeData。
 */
export interface ImageNodeBatchExtension {
  /** 是否为组首；true 表示该节点显示多图叠卡 */
  isBatchRoot?: boolean
  /** 组内所有子图列表（包含主图自身的副本，且 primaryImageId 指向其中一个） */
  batchChildren?: BatchChildImage[]
  /** 当前显示为主图的子图 ID（指向 batchChildren 中的某个 id） */
  primaryImageId?: string
  /** 是否展开为子图网格（false=叠卡视图，true=展开网格） */
  batchExpanded?: boolean
}

// ============================================================
// 拖入文件分类
// ============================================================

/** 拖入文件落点 → 创建哪种节点 */
export type DroppedFileKind = 'image' | 'video' | 'unsupported'

export interface DroppedFileDescriptor {
  file: File
  kind: DroppedFileKind
  /** 命中画布的世界坐标（已通过 screenToFlowCoordinates 换算） */
  position: WorkflowCanvasPosition
}

// ============================================================
// 选择 / 连接交互的瞬时态
// ============================================================

/**
 * 当前正在拖出新连线的瞬时态
 * 由 Vue Flow 内部维护时无需手动管理，但临时连线视觉/Pane 上的 connection menu 需要时可读
 */
export interface ConnectionDragState {
  /** 起点节点 ID */
  fromNodeId: string
  /** 起点 handle ('source' / 'target') */
  fromHandleType: 'source' | 'target'
  /** 起点 handle ID（如果节点有多个 handle） */
  fromHandleId?: string
  /** 当前鼠标位置（世界坐标） */
  pointerWorld: WorkflowCanvasPosition
}

/**
 * 节点选择运行时态（覆盖于 Vue Flow 内部 selected 字段之上的扩展）
 *
 * Vue Flow 的 selected 在节点对象上是布尔，不便集中读取；
 * 这里给出"集合视图"，方便快捷键/复制粘贴/助手引用等场景。
 */
export interface CanvasSelectionState {
  /** 选中的节点 ID 集合 */
  nodeIds: Set<string>
  /** 选中的连线 ID（连线只能单选）  */
  edgeId: string | null
}

// ============================================================
// 节点类型 → 默认尺寸（resize 的 min/max 用）
// ============================================================

export interface NodeSizeConstraint {
  minWidth: number
  minHeight: number
  /** 是否强制等比（视频 = true，图片可切换） */
  keepRatio?: boolean
  /** 等比时的初始比例（仅 keepRatio=true 时使用） */
  aspectRatio?: number
}

export const NODE_SIZE_DEFAULTS: Record<WorkflowNodeType, NodeSizeConstraint> = {
  text: { minWidth: 220, minHeight: 120 },
  image: { minWidth: 220, minHeight: 160 },
  video: { minWidth: 240, minHeight: 160, keepRatio: true, aspectRatio: 16 / 9 },
  imageConfig: { minWidth: 280, minHeight: 200 },
  videoConfig: { minWidth: 280, minHeight: 200 },
  llmConfig: { minWidth: 320, minHeight: 220 },
}
