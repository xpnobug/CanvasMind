/**
 * 画布状态机 - 管理所有交互状态
 */
import { ref, computed, readonly } from 'vue'

// 交互状态枚举
export const InteractionState = {
  IDLE: 'idle',
  READY_TO_PAN: 'ready_to_pan',
  PANNING: 'panning',
  DRAGGING_IMAGE: 'dragging_image',
  RESIZING: 'resizing',
  SELECTING: 'selecting'
}

export function useCanvasState() {
  // 核心状态
  const state = ref(InteractionState.IDLE)
  const selectedId = ref(null)
  const draggedId = ref(null)
  const resizeHandle = ref(null)
  
  // 辅助状态
  const spacePressed = ref(false)
  const hasMoved = ref(false)
  
  // 状态检查
  const isIdle = computed(() => state.value === InteractionState.IDLE)
  const isPanning = computed(() => state.value === InteractionState.PANNING)
  const isDragging = computed(() => state.value === InteractionState.DRAGGING_IMAGE)
  const isResizing = computed(() => state.value === InteractionState.RESIZING)
  const isReadyToPan = computed(() => state.value === InteractionState.READY_TO_PAN)
  
  // 状态转换
  const transitions = {
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
      END_PAN: (ctx) => ctx.spacePressed ? InteractionState.READY_TO_PAN : InteractionState.IDLE,
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
    }
  }
  
  // 发送事件
  function send(event, payload = {}) {
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
  
  // 动作
  function select(id) {
    selectedId.value = id
  }
  
  function deselect() {
    selectedId.value = null
  }
  
  function startDrag(id) {
    draggedId.value = id
    hasMoved.value = false
    send('START_DRAG')
  }
  
  function prepareDrag(id) {
    draggedId.value = id
    hasMoved.value = false
  }
  
  function endDrag() {
    const moved = hasMoved.value
    draggedId.value = null
    hasMoved.value = false
    send('END_DRAG')
    return moved
  }
  
  function startResize(handle) {
    resizeHandle.value = handle
    send('START_RESIZE')
  }
  
  function endResize() {
    resizeHandle.value = null
    send('END_RESIZE')
  }
  
  function startPan() {
    send('START_PAN')
  }
  
  function endPan() {
    send('END_PAN')
  }
  
  function setSpacePressed(pressed) {
    spacePressed.value = pressed
    if (pressed) {
      send('SPACE_DOWN')
    } else {
      send('SPACE_UP')
    }
  }
  
  function markMoved() {
    hasMoved.value = true
  }
  
  function reset() {
    state.value = InteractionState.IDLE
    draggedId.value = null
    resizeHandle.value = null
    hasMoved.value = false
  }
  
  function cancel() {
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
