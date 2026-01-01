/**
 * 网格布局 - 管理图片网格位置计算
 */
import { computed } from 'vue'

export function useGridLayout(images, options = {}) {
  const {
    cols = 4,
    cellWidth = 1728,
    cellHeight = 2304,
    gap = 96,
    padding = 192
  } = options
  
  // 画布帧尺寸
  const frameWidth = computed(() => {
    return padding * 2 + cols * cellWidth + (cols - 1) * gap
  })
  
  const frameHeight = computed(() => {
    const rows = Math.ceil(images.value.length / cols)
    return padding * 2 + rows * cellHeight + (rows - 1) * gap
  })
  
  /**
   * 根据 index 计算网格位置
   */
  function getGridPosition(index) {
    const col = index % cols
    const row = Math.floor(index / cols)
    return {
      x: padding + col * (cellWidth + gap),
      y: padding + row * (cellHeight + gap)
    }
  }
  
  /**
   * 根据画布坐标计算目标 index
   */
  function getTargetIndex(canvasX, canvasY) {
    const col = Math.round((canvasX - padding) / (cellWidth + gap))
    const row = Math.round((canvasY - padding) / (cellHeight + gap))
    const clampedCol = Math.max(0, Math.min(cols - 1, col))
    const clampedRow = Math.max(0, row)
    const maxIndex = images.value.length - 1
    return Math.min(clampedRow * cols + clampedCol, maxIndex)
  }
  
  /**
   * 检查位置是否在视口内
   */
  function isInViewport(index, viewportBounds) {
    const pos = getGridPosition(index)
    const itemRight = pos.x + cellWidth
    const itemBottom = pos.y + cellHeight
    
    return !(
      itemRight < viewportBounds.left ||
      pos.x > viewportBounds.right ||
      itemBottom < viewportBounds.top ||
      pos.y > viewportBounds.bottom
    )
  }
  
  /**
   * 获取视口内可见的图片
   */
  function getVisibleImages(viewportBounds) {
    return images.value.filter(img => isInViewport(img.index, viewportBounds))
  }

  return {
    frameWidth,
    frameHeight,
    cellWidth,
    cellHeight,
    cols,
    gap,
    padding,
    
    getGridPosition,
    getTargetIndex,
    isInViewport,
    getVisibleImages
  }
}
