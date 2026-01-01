/**
 * 拖拽排序 - 管理图片拖拽和重排逻辑
 */
import { reactive, computed } from 'vue'

export function useDragSort(images, gridLayout) {
  // 拖拽状态
  const dragState = reactive({
    originalIndex: null,
    hoverIndex: null,
    startMouseX: 0,
    startMouseY: 0,
    offsetX: 0,
    offsetY: 0,
    currentX: 0,
    currentY: 0
  })
  
  // 拖拽中图片的屏幕位置
  const draggingPosition = computed(() => ({
    x: dragState.currentX,
    y: dragState.currentY
  }))
  
  /**
   * 开始拖拽
   */
  function startDrag(imageId, mouseX, mouseY, viewport) {
    const image = images.value.find(img => img.id === imageId)
    if (!image) return
    
    dragState.originalIndex = image.index
    dragState.hoverIndex = image.index
    dragState.startMouseX = mouseX
    dragState.startMouseY = mouseY
    
    // 计算图片在屏幕上的位置
    const pos = gridLayout.getGridPosition(image.index)
    const screenX = viewport.x + pos.x * viewport.scale
    const screenY = viewport.y + pos.y * viewport.scale
    
    dragState.offsetX = mouseX - screenX
    dragState.offsetY = mouseY - screenY
    dragState.currentX = screenX
    dragState.currentY = screenY
  }
  
  /**
   * 更新拖拽位置
   */
  function updateDrag(mouseX, mouseY, viewport) {
    dragState.currentX = mouseX - dragState.offsetX
    dragState.currentY = mouseY - dragState.offsetY
    
    // 计算当前悬停的目标位置
    const canvasX = (dragState.currentX - viewport.x) / viewport.scale + gridLayout.cellWidth / 2
    const canvasY = (dragState.currentY - viewport.y) / viewport.scale + gridLayout.cellHeight / 2
    const newHoverIndex = gridLayout.getTargetIndex(canvasX, canvasY)
    
    if (newHoverIndex !== dragState.hoverIndex) {
      dragState.hoverIndex = newHoverIndex
    }
  }
  
  /**
   * 结束拖拽并应用排序
   */
  function endDrag(draggedId) {
    const targetIndex = dragState.hoverIndex
    const currentIndex = dragState.originalIndex
    
    if (targetIndex !== null && targetIndex !== currentIndex) {
      const draggedItem = images.value.find(img => img.id === draggedId)
      
      if (draggedItem) {
        if (targetIndex < currentIndex) {
          // 向前移动：中间的元素后移
          images.value.forEach(img => {
            if (img.id !== draggedId && img.index >= targetIndex && img.index < currentIndex) {
              img.index++
            }
          })
        } else {
          // 向后移动：中间的元素前移
          images.value.forEach(img => {
            if (img.id !== draggedId && img.index > currentIndex && img.index <= targetIndex) {
              img.index--
            }
          })
        }
        draggedItem.index = targetIndex
      }
    }
    
    // 重置状态
    dragState.originalIndex = null
    dragState.hoverIndex = null
  }
  
  /**
   * 计算拖拽时的显示位置（避让效果）
   */
  function getDisplayIndex(image, draggedId, isDragging) {
    if (!isDragging || dragState.hoverIndex === null) {
      return image.index
    }
    
    // 被拖拽的图片不显示在网格中
    if (image.id === draggedId) {
      return -1
    }
    
    const originalIdx = dragState.originalIndex
    const hoverIdx = dragState.hoverIndex
    
    // 计算避让位置
    if (hoverIdx < originalIdx) {
      if (image.index >= hoverIdx && image.index < originalIdx) {
        return image.index + 1
      }
    } else if (hoverIdx > originalIdx) {
      if (image.index > originalIdx && image.index <= hoverIdx) {
        return image.index - 1
      }
    }
    
    return image.index
  }
  
  /**
   * 检查是否真正移动了（超过阈值）
   */
  function hasMovedBeyondThreshold(mouseX, mouseY, threshold = 5) {
    const dx = mouseX - dragState.startMouseX
    const dy = mouseY - dragState.startMouseY
    return Math.abs(dx) > threshold || Math.abs(dy) > threshold
  }

  return {
    dragState,
    draggingPosition,
    
    startDrag,
    updateDrag,
    endDrag,
    getDisplayIndex,
    hasMovedBeyondThreshold
  }
}
