/**
 * 视口控制 - 管理画布平移和缩放
 */
import { reactive, computed } from 'vue'

export function useViewport(options: any = {}) {
  const {
    minScale = 0.01,
    maxScale = 2,
    zoomSensitivity = 0.01
  } = options
  
  // 视口状态
  const viewport = reactive({
    x: 0,
    y: 0,
    scale: 1
  })
  
  // 拖拽起始状态
  const panStart = reactive({
    x: 0,
    y: 0,
    viewportX: 0,
    viewportY: 0
  })
  
  // 视口变换样式
  const transformStyle = computed(() => ({
    transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})`,
    transformOrigin: 'left top'
  }))
  
  // 缩放百分比
  const zoomPercent = computed(() => Math.round(viewport.scale * 100))
  
  /**
   * 开始平移
   */
  function startPan(clientX: number, clientY: number) {
    panStart.x = clientX
    panStart.y = clientY
    panStart.viewportX = viewport.x
    panStart.viewportY = viewport.y
  }
  
  /**
   * 更新平移
   */
  function updatePan(clientX: number, clientY: number) {
    viewport.x = panStart.viewportX + (clientX - panStart.x)
    viewport.y = panStart.viewportY + (clientY - panStart.y)
  }
  
  /**
   * 直接平移
   */
  function pan(deltaX: number, deltaY: number) {
    viewport.x -= deltaX
    viewport.y -= deltaY
  }
  
  /**
   * 限制视口在合理范围内（防止画布拖出视口太远）
   */
  function clampViewport(containerRect: any, contentWidth: number, contentHeight: number, margin = 200) {
    const scaledWidth = contentWidth * viewport.scale
    const scaledHeight = contentHeight * viewport.scale
    
    // 计算允许的范围
    const minX = Math.min(margin, containerRect.width - scaledWidth - margin)
    const maxX = Math.max(containerRect.width - scaledWidth - margin, margin)
    const minY = Math.min(margin, containerRect.height - scaledHeight - margin)
    const maxY = Math.max(containerRect.height - scaledHeight - margin, margin)
    
    // 只在内容比视口大时限制
    if (scaledWidth > containerRect.width - margin * 2) {
      viewport.x = Math.max(minX, Math.min(maxX, viewport.x))
    }
    if (scaledHeight > containerRect.height - margin * 2) {
      viewport.y = Math.max(minY, Math.min(maxY, viewport.y))
    }
  }
  
  /**
   * 以指定点为中心缩放
   */
  function zoomAt(clientX: number, clientY: number, delta: number, containerRect: any) {
    const mouseX = clientX - containerRect.left
    const mouseY = clientY - containerRect.top
    
    const oldScale = viewport.scale
    const scaleDelta = -delta * zoomSensitivity
    const newScale = clampScale(oldScale * (1 + scaleDelta))
    
    if (newScale === oldScale) return oldScale
    
    const scaleRatio = newScale / oldScale
    viewport.x = mouseX - (mouseX - viewport.x) * scaleRatio
    viewport.y = mouseY - (mouseY - viewport.y) * scaleRatio
    viewport.scale = newScale
    
    return newScale
  }
  
  /**
   * 设置缩放（以视口中心为基准）
   */
  function setZoom(newZoom: number, containerRect: any) {
    const newScale = clampScale(newZoom / 100)
    if (Math.abs(newScale - viewport.scale) < 0.001) return
    
    const centerX = containerRect.width / 2
    const centerY = containerRect.height / 2
    const oldScale = viewport.scale
    const scaleRatio = newScale / oldScale
    
    viewport.x = centerX - (centerX - viewport.x) * scaleRatio
    viewport.y = centerY - (centerY - viewport.y) * scaleRatio
    viewport.scale = newScale
  }
  
  /**
   * 居中显示内容
   */
  function centerContent(contentWidth: number, contentHeight: number, containerRect: any) {
    viewport.x = (containerRect.width - contentWidth * viewport.scale) / 2
    viewport.y = (containerRect.height - contentHeight * viewport.scale) / 2
  }
  
  /**
   * 屏幕坐标转画布坐标
   */
  function screenToCanvas(screenX: number, screenY: number) {
    return {
      x: (screenX - viewport.x) / viewport.scale,
      y: (screenY - viewport.y) / viewport.scale
    }
  }
  
  /**
   * 画布坐标转屏幕坐标
   */
  function canvasToScreen(canvasX: number, canvasY: number) {
    return {
      x: viewport.x + canvasX * viewport.scale,
      y: viewport.y + canvasY * viewport.scale
    }
  }
  
  /**
   * 获取视口边界（画布坐标系）
   */
  function getViewportBounds(containerRect: any) {
    const topLeft = screenToCanvas(0, 0)
    const bottomRight = screenToCanvas(containerRect.width, containerRect.height)
    return {
      left: topLeft.x,
      top: topLeft.y,
      right: bottomRight.x,
      bottom: bottomRight.y,
      width: bottomRight.x - topLeft.x,
      height: bottomRight.y - topLeft.y
    }
  }
  
  function clampScale(scale: number) {
    return Math.max(minScale, Math.min(maxScale, scale))
  }

  return {
    viewport,
    transformStyle,
    zoomPercent,
    
    startPan,
    updatePan,
    pan,
    clampViewport,
    zoomAt,
    setZoom,
    centerContent,
    screenToCanvas,
    canvasToScreen,
    getViewportBounds
  }
}
