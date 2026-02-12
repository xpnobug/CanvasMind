/**
 * 指针事件 - 统一处理鼠标和触摸事件
 */
import { reactive } from 'vue'

export function usePointerEvents(options: any = {}) {
  const {
    dragThreshold = 5
  } = options
  
  // 键盘状态
  const keyState = reactive({
    space: false,
    alt: false,
    ctrl: false,
    meta: false,
    shift: false
  })
  
  // 触摸状态
  const touchState = reactive({
    isPinching: false,
    lastDistance: 0,
    lastCenterX: 0,
    lastCenterY: 0,
    startTouches: null
  })
  
  // 指针状态
  const pointerState = reactive({
    isDown: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0
  })
  
  /**
   * 计算两点距离
   */
  function getDistance(touch1: any, touch2: any) {
    const dx = touch1.clientX - touch2.clientX
    const dy = touch1.clientY - touch2.clientY
    return Math.sqrt(dx * dx + dy * dy)
  }
  
  /**
   * 计算两点中心
   */
  function getCenter(touch1: any, touch2: any) {
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2
    }
  }
  
  /**
   * 处理触摸开始
   */
  function handleTouchStart(e: any, callbacks: any = {}) {
    if (e.touches.length === 2) {
      // 双指：开始缩放
      e.preventDefault()
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      
      touchState.isPinching = true
      touchState.lastDistance = getDistance(touch1, touch2)
      const center = getCenter(touch1, touch2)
      touchState.lastCenterX = center.x
      touchState.lastCenterY = center.y
      touchState.startTouches = [
        { x: touch1.clientX, y: touch1.clientY },
        { x: touch2.clientX, y: touch2.clientY }
      ]
      
      callbacks.onPinchStart?.(center.x, center.y)
    } else if (e.touches.length === 1) {
      // 单指
      const touch = e.touches[0]
      pointerState.isDown = true
      pointerState.startX = touch.clientX
      pointerState.startY = touch.clientY
      pointerState.currentX = touch.clientX
      pointerState.currentY = touch.clientY
      
      callbacks.onPointerDown?.(touch.clientX, touch.clientY, e)
    }
  }
  
  /**
   * 处理触摸移动
   */
  function handleTouchMove(e: any, callbacks: any = {}) {
    if (e.touches.length === 2 && touchState.isPinching) {
      e.preventDefault()
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      
      const newDistance = getDistance(touch1, touch2)
      const center = getCenter(touch1, touch2)
      
      // 计算缩放比例
      const scale = newDistance / touchState.lastDistance
      
      // 计算平移
      const dx = center.x - touchState.lastCenterX
      const dy = center.y - touchState.lastCenterY
      
      callbacks.onPinch?.(center.x, center.y, scale, dx, dy)
      
      touchState.lastDistance = newDistance
      touchState.lastCenterX = center.x
      touchState.lastCenterY = center.y
    } else if (e.touches.length === 1 && pointerState.isDown) {
      const touch = e.touches[0]
      pointerState.currentX = touch.clientX
      pointerState.currentY = touch.clientY
      
      callbacks.onPointerMove?.(touch.clientX, touch.clientY, e)
    }
  }
  
  /**
   * 处理触摸结束
   */
  function handleTouchEnd(e: any, callbacks: any = {}) {
    if (e.touches.length < 2 && touchState.isPinching) {
      touchState.isPinching = false
      callbacks.onPinchEnd?.()
    }
    
    if (e.touches.length === 0) {
      pointerState.isDown = false
      callbacks.onPointerUp?.(e)
    }
  }
  
  /**
   * 检查是否超过拖拽阈值
   */
  function hasMovedBeyondThreshold() {
    const dx = pointerState.currentX - pointerState.startX
    const dy = pointerState.currentY - pointerState.startY
    return Math.abs(dx) > dragThreshold || Math.abs(dy) > dragThreshold
  }
  
  /**
   * 检查是否应该平移（空格或 Alt 键按下）
   */
  function shouldPan(e: any) {
    return e?.button === 1 || // 中键
           keyState.space || 
           keyState.alt || 
           e?.altKey
  }
  
  // 键盘事件处理
  function handleKeyDown(e: any) {
    switch (e.code) {
      case 'Space':
        if (!e.repeat) keyState.space = true
        break
      case 'AltLeft':
      case 'AltRight':
        keyState.alt = true
        break
      case 'ControlLeft':
      case 'ControlRight':
        keyState.ctrl = true
        break
      case 'MetaLeft':
      case 'MetaRight':
        keyState.meta = true
        break
      case 'ShiftLeft':
      case 'ShiftRight':
        keyState.shift = true
        break
    }
  }
  
  function handleKeyUp(e: any) {
    switch (e.code) {
      case 'Space':
        keyState.space = false
        break
      case 'AltLeft':
      case 'AltRight':
        keyState.alt = false
        break
      case 'ControlLeft':
      case 'ControlRight':
        keyState.ctrl = false
        break
      case 'MetaLeft':
      case 'MetaRight':
        keyState.meta = false
        break
      case 'ShiftLeft':
      case 'ShiftRight':
        keyState.shift = false
        break
    }
  }
  
  // 窗口失焦时重置键盘状态
  function handleBlur() {
    keyState.space = false
    keyState.alt = false
    keyState.ctrl = false
    keyState.meta = false
    keyState.shift = false
  }

  return {
    keyState,
    touchState,
    pointerState,
    
    shouldPan,
    hasMovedBeyondThreshold,
    getDistance,
    getCenter,
    
    // 事件处理器
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleKeyDown,
    handleKeyUp,
    handleBlur
  }
}
