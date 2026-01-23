/**
 * 画布状态机 - 管理所有交互状态
 */
import { ref, computed, readonly, type Ref, type ComputedRef } from 'vue'

/**
 * 交互状态枚举
 */
export enum InteractionState {
  IDLE = 'idle',
  READY_TO_PAN = 'ready_to_pan',
  PANNING = 'panning',
  DRAGGING_IMAGE = 'dragging_image',
  RESIZING = 'resizing',
  SELECTING = 'selecting'
}

/**
 * 状态转换上下文
 */
interface TransitionContext {
  /** 空格键是否按下 */
  spacePressed: boolean
  /** 其他上下文数据 */
  [key: string]: any
}

/**
 * 状态转换函数类型
 */
type TransitionFunction = (ctx: TransitionContext) => InteractionState

/**
 * 状态转换映射类型
 */
type StateTransitions = {
  [key: string]: InteractionState | TransitionFunction
}

/**
 * 画布状态返回类型
 */
export interface CanvasState {
  // 状态 (只读)
  state: Readonly<Ref<InteractionState>>
  selectedId: Ref<string | null>
  draggedId: Readonly<Ref<string | null>>
  resizeHandle: Readonly<Ref<string | null>>
  spacePressed: Readonly<Ref<boolean>>
  hasMoved: Readonly<Ref<boolean>>
  
  // 计算属性
  isIdle: ComputedRef<boolean>
  isPanning: ComputedRef<boolean>
  isDragging: ComputedRef<boolean>
  isResizing: ComputedRef<boolean>
  isReadyToPan: ComputedRef<boolean>
  
  // 动作
  select: (id: string) => void
  deselect: () => void
  prepareDrag: (id: string) => void
  startDrag: (id: string) => void
  endDrag: () => boolean
  startResize: (handle: string) => void
  endResize: () => void
  startPan: () => void
  endPan: () => void
  setSpacePressed: (pressed: boolean) => void
  markMoved: () => void
  reset: () => void
  cancel: () => void
}

/**
 * 画布状态管理 Composable
 */
export function useCanvasState(): CanvasState {
  // 核心状态
  const state = ref<InteractionState>(InteractionState.IDLE)
  const selectedId = ref<string | null>(null)
  const draggedId = ref<string | null>(null)
  const resizeHandle = ref<string | null>(null)
  
  // 辅助状态
  const spacePressed = ref<boolean>(false)
  const hasMoved = ref<boolean>(false)
  
  // 状态检查
  const isIdle = computed(() => state.value === InteractionState.IDLE)
  const isPanning = computed(() => state.value === InteractionState.PANNING)
  const isDragging = computed(() => state.value === InteractionState.DRAGGING_IMAGE)
  const isResizing = computed(() => state.value === InteractionState.RESIZING)
  const isReadyToPan = computed(() => state.value === InteractionState.READY_TO_PAN)
  
  // 状态转换
  const transitions: Record<InteractionState, StateTransitions> = {
    [InteractionState.IDLE]: {
      SPACE_DOWN: InteractionState.READY_TO_PAN,
      START_DRAG: InteractionState.DRAGGING_IMAGE,
      START_RESIZE: InteractionState.RESIZING,
      START_PAN: InteractionState.PANNING
    },
    [InteractionState.READY_TO_PAN]: {
      SPACE_UP: InteractionState.IDLE,
      START_PAN: InteractionState.PANNING,
      START_DRAG: InteractionState.DRAGGING_IMAGE,
      START_RESIZE: InteractionState.RESIZING
    },
    [InteractionState.PANNING]: {
      END_PAN: (ctx: TransitionContext) => ctx.spacePressed ? InteractionState.READY_TO_PAN : InteractionState.IDLE,
      SPACE_UP: InteractionState.PANNING // 保持平移直到松开鼠标
    },
    [InteractionState.DRAGGING_IMAGE]: {
      END_DRAG: InteractionState.IDLE,
      CANCEL: InteractionState.IDLE,
      SPACE_DOWN: InteractionState.DRAGGING_IMAGE, // 拖拽中按空格不切换
      SPACE_UP: InteractionState.DRAGGING_IMAGE
    },
    [InteractionState.RESIZING]: {
      END_RESIZE: InteractionState.IDLE,
      CANCEL: InteractionState.IDLE
    },
    [InteractionState.SELECTING]: {
      END_SELECT: InteractionState.IDLE,
      CANCEL: InteractionState.IDLE
    }
  }
  
  /**
   * 发送事件
   */
  function send(event: string, payload: Partial<TransitionContext> = {}): boolean {
    const currentTransitions = transitions[state.value]
    if (!currentTransitions) return false
    
    const nextState = currentTransitions[event]
    if (!nextState) return false
    
    // 处理动态转换
    const newState = typeof nextState === 'function' 
      ? nextState({ spacePressed: spacePressed.value, ...payload })
      : nextState
    
    state.value = newState
    return true
  }
  
  /**
   * 选择元素
   */
  function select(id: string): void {
    selectedId.value = id
  }
  
  /**
   * 取消选择
   */
  function deselect(): void {
    selectedId.value = null
  }
  
  /**
   * 开始拖拽
   */
  function startDrag(id: string): void {
    draggedId.value = id
    hasMoved.value = false
    send('START_DRAG')
  }
  
  /**
   * 准备拖拽
   */
  function prepareDrag(id: string): void {
    draggedId.value = id
    hasMoved.value = false
  }
  
  /**
   * 结束拖拽
   */
  function endDrag(): boolean {
    const moved = hasMoved.value
    draggedId.value = null
    hasMoved.value = false
    send('END_DRAG')
    return moved
  }
  
  /**
   * 开始调整大小
   */
  function startResize(handle: string): void {
    resizeHandle.value = handle
    send('START_RESIZE')
  }
  
  /**
   * 结束调整大小
   */
  function endResize(): void {
    resizeHandle.value = null
    send('END_RESIZE')
  }
  
  /**
   * 开始平移
   */
  function startPan(): void {
    send('START_PAN')
  }
  
  /**
   * 结束平移
   */
  function endPan(): void {
    send('END_PAN')
  }
  
  /**
   * 设置空格键状态
   */
  function setSpacePressed(pressed: boolean): void {
    spacePressed.value = pressed
    if (pressed) {
      send('SPACE_DOWN')
    } else {
      send('SPACE_UP')
    }
  }
  
  /**
   * 标记已移动
   */
  function markMoved(): void {
    hasMoved.value = true
  }
  
  /**
   * 重置状态
   */
  function reset(): void {
    state.value = InteractionState.IDLE
    draggedId.value = null
    resizeHandle.value = null
    hasMoved.value = false
  }
  
  /**
   * 取消操作
   */
  function cancel(): void {
    send('CANCEL')
    draggedId.value = null
    resizeHandle.value = null
    hasMoved.value = false
  }

  return {
    // 状态 (只读)
    state: readonly(state),
    selectedId,
    draggedId: readonly(draggedId),
    resizeHandle: readonly(resizeHandle),
    spacePressed: readonly(spacePressed),
    hasMoved: readonly(hasMoved),
    
    // 计算属性
    isIdle,
    isPanning,
    isDragging,
    isResizing,
    isReadyToPan,
    
    // 动作
    select,
    deselect,
    prepareDrag,
    startDrag,
    endDrag,
    startResize,
    endResize,
    startPan,
    endPan,
    setSpacePressed,
    markMoved,
    reset,
    cancel
  }
}
