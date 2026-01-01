/**
 * 图片缩放 - 管理图片尺寸调整
 */
import { reactive } from 'vue'

export function useImageResize(images) {
  // 缩放起始状态
  const resizeState = reactive({
    startMouseX: 0,
    startMouseY: 0,
    startWidth: 0,
    startHeight: 0,
    startX: 0,
    startY: 0
  })
  
  /**
   * 开始缩放
   */
  function startResize(imageId, mouseX, mouseY) {
    const image = images.value.find(img => img.id === imageId)
    if (!image) return
    
    resizeState.startMouseX = mouseX
    resizeState.startMouseY = mouseY
    resizeState.startWidth = image.w
    resizeState.startHeight = image.h
  }
  
  /**
   * 更新缩放
   * @param {string} handle - 拖拽的角: top-left, top-right, bottom-left, bottom-right
   */
  function updateResize(imageId, mouseX, mouseY, handle, viewportScale) {
    const image = images.value.find(img => img.id === imageId)
    if (!image) return
    
    const dx = (mouseX - resizeState.startMouseX) / viewportScale
    const dy = (mouseY - resizeState.startMouseY) / viewportScale
    const aspectRatio = resizeState.startWidth / resizeState.startHeight
    
    let newW = resizeState.startWidth
    
    // 根据拖拽的角计算新尺寸
    switch (handle) {
      case 'bottom-right':
      case 'top-right':
        newW = Math.max(200, resizeState.startWidth + dx)
        break
      case 'bottom-left':
      case 'top-left':
        newW = Math.max(200, resizeState.startWidth - dx)
        break
    }
    
    // 保持宽高比
    const newH = newW / aspectRatio
    
    image.w = Math.round(newW)
    image.h = Math.round(newH)
  }
  
  /**
   * 结束缩放
   */
  function endResize() {
    resizeState.startMouseX = 0
    resizeState.startMouseY = 0
    resizeState.startWidth = 0
    resizeState.startHeight = 0
  }

  return {
    resizeState,
    startResize,
    updateResize,
    endResize
  }
}
