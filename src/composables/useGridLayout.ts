/**
 * 网格布局 - 管理图片网格位置计算
 */
import { computed, type Ref, type ComputedRef } from 'vue'

/**
 * 网格布局配置选项
 */
export interface GridLayoutOptions {
  /** 列数 */
  cols?: number
  /** 单元格宽度 */
  cellWidth?: number
  /** 单元格高度 */
  cellHeight?: number
  /** 间距 */
  gap?: number
  /** 内边距 */
  padding?: number
}

/**
 * 位置坐标
 */
export interface Position {
  /** X 坐标 */
  x: number
  /** Y 坐标 */
  y: number
}

/**
 * 视口边界
 */
export interface ViewportBounds {
  /** 左边界 */
  left: number
  /** 右边界 */
  right: number
  /** 上边界 */
  top: number
  /** 下边界 */
  bottom: number
}

/**
 * 图片项接口
 */
export interface ImageItem {
  /** 图片索引 */
  index: number
  /** 其他属性 */
  [key: string]: any
}

/**
 * 网格布局返回类型
 */
export interface GridLayout {
  /** 画布帧宽度 */
  frameWidth: ComputedRef<number>
  /** 画布帧高度 */
  frameHeight: ComputedRef<number>
  /** 单元格宽度 */
  cellWidth: number
  /** 单元格高度 */
  cellHeight: number
  /** 列数 */
  cols: number
  /** 间距 */
  gap: number
  /** 内边距 */
  padding: number
  
  /** 根据 index 计算网格位置 */
  getGridPosition: (index: number) => Position
  /** 根据画布坐标计算目标 index */
  getTargetIndex: (canvasX: number, canvasY: number) => number
  /** 检查位置是否在视口内 */
  isInViewport: (index: number, viewportBounds: ViewportBounds) => boolean
  /** 获取视口内可见的图片 */
  getVisibleImages: (viewportBounds: ViewportBounds) => ImageItem[]
}

/**
 * 网格布局管理 Composable
 * @param images 图片列表
 * @param options 配置选项
 */
export function useGridLayout(
  images: Ref<ImageItem[]>,
  options: GridLayoutOptions = {}
): GridLayout {
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
  function getGridPosition(index: number): Position {
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
  function getTargetIndex(canvasX: number, canvasY: number): number {
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
  function isInViewport(index: number, viewportBounds: ViewportBounds): boolean {
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
  function getVisibleImages(viewportBounds: ViewportBounds): ImageItem[] {
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
