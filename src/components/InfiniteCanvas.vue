<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { 
  useViewport, 
  useGridLayout, 
  useCanvasState, 
  useDragSort,
  useImageResize,
  useHistory,
  usePointerEvents
} from '@/composables'

const props = defineProps({
  zoom: { type: Number, default: 100 },
  // 网格配置
  gridCols: { type: Number, default: 4 },
  cellWidth: { type: Number, default: 1728 },
  cellHeight: { type: Number, default: 2304 },
  gap: { type: Number, default: 96 },
  padding: { type: Number, default: 192 },
  // 缩放限制
  minZoom: { type: Number, default: 1 },
  maxZoom: { type: Number, default: 200 }
})

const emit = defineEmits(['zoom-change', 'selection-change'])

// ============ 数据 ============
const containerRef = ref(null)

const images = ref([])

// 模拟数据
const mockImages = [
  { id: 1, src: 'https://picsum.photos/seed/a1/1728/2304', w: 1728, h: 2304 },
  { id: 2, src: 'https://picsum.photos/seed/a2/1728/2304', w: 1728, h: 2304 },
  { id: 3, src: 'https://picsum.photos/seed/a3/1728/2304', w: 1728, h: 2304 },
  { id: 4, src: 'https://picsum.photos/seed/a4/1728/2304', w: 1728, h: 2304 },
  { id: 5, src: 'https://picsum.photos/seed/a5/1728/2304', w: 1728, h: 2304 },
  { id: 6, src: 'https://picsum.photos/seed/a6/1728/2304', w: 1728, h: 2304 },
  { id: 7, src: 'https://picsum.photos/seed/a7/1728/2304', w: 1728, h: 2304 },
  { id: 8, src: 'https://picsum.photos/seed/a8/1728/2304', w: 1728, h: 2304 },
  { id: 9, src: 'https://picsum.photos/seed/a9/1728/2304', w: 1728, h: 2304 },
  { id: 10, src: 'https://picsum.photos/seed/a10/1728/2304', w: 1728, h: 2304 },
  { id: 11, src: 'https://picsum.photos/seed/a11/1728/2304', w: 1728, h: 2304 },
  { id: 12, src: 'https://picsum.photos/seed/a12/1728/2304', w: 1728, h: 2304 },
]

let mockIndex = 0
let generating = false

// 模拟生成图片（逐个添加）
async function generateImages() {
  if (generating || mockIndex >= mockImages.length) return
  generating = true
  
  // 每次生成 4 张
  const count = Math.min(4, mockImages.length - mockIndex)
  
  for (let i = 0; i < count; i++) {
    await new Promise(r => setTimeout(r, 300 + Math.random() * 200))
    const img = mockImages[mockIndex]
    images.value.push({ ...img, index: mockIndex })
    mockIndex++
  }
  
  // 生成后居中显示
  setTimeout(() => {
    if (containerRef.value) {
      const rect = containerRef.value.getBoundingClientRect()
      viewport.centerContent(gridLayout.frameWidth.value, gridLayout.frameHeight.value, rect)
    }
  }, 100)
  
  generating = false
}

// 暴露给父组件
defineExpose({ generateImages })

// ============ Composables ============
const viewport = useViewport({
  minScale: props.minZoom / 100,
  maxScale: props.maxZoom / 100
})
const gridLayout = useGridLayout(images, {
  cols: props.gridCols,
  cellWidth: props.cellWidth,
  cellHeight: props.cellHeight,
  gap: props.gap,
  padding: props.padding
})
const canvasState = useCanvasState()
const dragSort = useDragSort(images, gridLayout)
const imageResize = useImageResize(images)
const history = useHistory()
const pointer = usePointerEvents()

// ============ 计算属性 ============
const selectedImage = computed(() => {
  if (!canvasState.selectedId.value) return null
  return images.value.find(img => img.id === canvasState.selectedId.value)
})

const draggingImage = computed(() => {
  if (!canvasState.draggedId.value) return null
  return images.value.find(img => img.id === canvasState.draggedId.value)
})

// 虚拟化：只渲染视口内的图片
// 显式依赖 viewport 状态以确保响应性
const visibleImages = computed(() => {
  // 显式读取 viewport 状态触发响应式更新
  const { x, y, scale } = viewport.viewport
  
  if (!containerRef.value || !scale) return images.value
  
  const rect = containerRef.value.getBoundingClientRect()
  // 手动计算视口边界（避免函数调用丢失响应性）
  const viewportLeft = -x / scale
  const viewportTop = -y / scale
  const viewportRight = (rect.width - x) / scale
  const viewportBottom = (rect.height - y) / scale
  
  // 添加缓冲区（画布坐标系）
  const buffer = 500 / scale
  const bounds = {
    left: viewportLeft - buffer,
    top: viewportTop - buffer,
    right: viewportRight + buffer,
    bottom: viewportBottom + buffer
  }
  
  return images.value.filter(img => {
    const pos = gridLayout.getGridPosition(img.index)
    const imgRight = pos.x + img.w
    const imgBottom = pos.y + img.h
    
    // 检查是否与视口相交
    return !(
      imgRight < bounds.left ||
      pos.x > bounds.right ||
      imgBottom < bounds.top ||
      pos.y > bounds.bottom
    )
  })
})

// 浮动工具栏位置
const floatingToolbarStyle = computed(() => {
  if (!selectedImage.value || !containerRef.value || canvasState.isDragging.value) {
    return { display: 'none' }
  }
  
  const img = selectedImage.value
  if (typeof img.index !== 'number') return { display: 'none' }
  
  const pos = gridLayout.getGridPosition(img.index)
  const screen = viewport.canvasToScreen(pos.x + gridLayout.cellWidth / 2, pos.y)
  
  // 确保位置值有效
  if (!isFinite(screen.x) || !isFinite(screen.y)) {
    return { display: 'none' }
  }
  
  return { 
    left: screen.x + 'px', 
    top: (screen.y - 52) + 'px', 
    transform: 'translateX(-50%)' 
  }
})

// 尺寸标签位置
const sizeLabelStyle = computed(() => {
  if (!selectedImage.value || !containerRef.value) return { display: 'none' }
  
  const img = selectedImage.value
  if (typeof img.index !== 'number') return { display: 'none' }
  
  const scale = viewport.viewport.scale || 1
  
  if (canvasState.isDragging.value) {
    const pos = dragSort.draggingPosition.value
    if (!isFinite(pos.x) || !isFinite(pos.y)) return { display: 'none' }
    return { 
      left: (pos.x + gridLayout.cellWidth * scale / 2) + 'px', 
      top: (pos.y + gridLayout.cellHeight * scale + 8) + 'px', 
      transform: 'translateX(-50%)' 
    }
  }
  
  const pos = gridLayout.getGridPosition(img.index)
  const screen = viewport.canvasToScreen(pos.x + gridLayout.cellWidth / 2, pos.y + gridLayout.cellHeight)
  
  if (!isFinite(screen.x) || !isFinite(screen.y)) return { display: 'none' }
  
  return { 
    left: screen.x + 'px', 
    top: (screen.y + 8) + 'px', 
    transform: 'translateX(-50%)' 
  }
})

// 选中框位置
const selectionOverlayStyle = computed(() => {
  if (!selectedImage.value || !containerRef.value) return { display: 'none' }
  
  const img = selectedImage.value
  if (typeof img.index !== 'number') return { display: 'none' }
  
  const pos = gridLayout.getGridPosition(img.index)
  const screen = viewport.canvasToScreen(pos.x, pos.y)
  const scale = viewport.viewport.scale || 1
  
  // 确保位置值有效
  if (!isFinite(screen.x) || !isFinite(screen.y)) {
    return { display: 'none' }
  }
  
  return { 
    left: screen.x + 'px', 
    top: screen.y + 'px', 
    width: (img.w * scale) + 'px', 
    height: (img.h * scale) + 'px' 
  }
})

// 拖拽中图片样式
const draggingImageStyle = computed(() => {
  if (!canvasState.isDragging.value) return { display: 'none' }
  const pos = dragSort.draggingPosition.value
  return {
    left: pos.x + 'px',
    top: pos.y + 'px',
    width: (gridLayout.cellWidth * viewport.viewport.scale) + 'px',
    height: (gridLayout.cellHeight * viewport.viewport.scale) + 'px'
  }
})

// ============ 事件处理 ============
function handleMouseDown(e) {
  // 检查是否应该平移
  if (e.button === 1 || (e.button === 0 && (canvasState.spacePressed.value || e.altKey))) {
    e.preventDefault()
    canvasState.startPan()
    viewport.startPan(e.clientX, e.clientY)
  }
}

function handleMouseMove(e) {
  // 平移
  if (canvasState.isPanning.value) {
    viewport.updatePan(e.clientX, e.clientY)
    return
  }
  
  // 缩放图片
  if (canvasState.isResizing.value && selectedImage.value) {
    imageResize.updateResize(
      canvasState.selectedId.value,
      e.clientX,
      e.clientY,
      canvasState.resizeHandle.value,
      viewport.viewport.scale
    )
    return
  }
  
  // 拖拽图片
  if (canvasState.draggedId.value) {
    // 检查是否超过阈值
    if (!canvasState.isDragging.value && dragSort.hasMovedBeyondThreshold(e.clientX, e.clientY)) {
      canvasState.markMoved()
      canvasState.startDrag(canvasState.draggedId.value)
    }
    
    if (canvasState.isDragging.value) {
      dragSort.updateDrag(e.clientX, e.clientY, viewport.viewport)
    }
  }
}

function handleMouseUp() {
  // 结束缩放
  if (canvasState.isResizing.value) {
    // 记录缩放历史
    const img = selectedImage.value
    if (img) {
      const oldW = imageResize.resizeState.startWidth
      const oldH = imageResize.resizeState.startHeight
      const newW = img.w
      const newH = img.h
      const imgId = img.id
      
      if (oldW !== newW || oldH !== newH) {
        history.push({
          type: 'resize',
          data: { imgId, oldW, oldH, newW, newH },
          undo: (data) => {
            const target = images.value.find(i => i.id === data.imgId)
            if (target) { target.w = data.oldW; target.h = data.oldH }
          },
          redo: (data) => {
            const target = images.value.find(i => i.id === data.imgId)
            if (target) { target.w = data.newW; target.h = data.newH }
          }
        })
      }
    }
    
    imageResize.endResize()
    canvasState.endResize()
    return
  }
  
  // 结束拖拽
  if (canvasState.draggedId.value) {
    const currentDraggedId = canvasState.draggedId.value
    
    if (canvasState.isDragging.value) {
      // 记录排序前的状态
      const oldIndices = images.value.map(img => ({ id: img.id, index: img.index }))
      
      dragSort.endDrag(currentDraggedId)
      
      // 记录排序后的状态
      const newIndices = images.value.map(img => ({ id: img.id, index: img.index }))
      
      // 检查是否有变化
      const hasChanged = oldIndices.some((old, i) => old.index !== newIndices[i].index)
      
      if (hasChanged) {
        history.push({
          type: 'reorder',
          data: { oldIndices, newIndices },
          undo: (data) => {
            data.oldIndices.forEach(({ id, index }) => {
              const img = images.value.find(i => i.id === id)
              if (img) img.index = index
            })
          },
          redo: (data) => {
            data.newIndices.forEach(({ id, index }) => {
              const img = images.value.find(i => i.id === id)
              if (img) img.index = index
            })
          }
        })
      }
    }
    
    const moved = canvasState.endDrag()
    
    // 如果没有移动过，保持选中状态（点击选中）
    if (!moved) {
      canvasState.select(currentDraggedId)
    }
    return
  }
  
  // 结束平移
  if (canvasState.isPanning.value) {
    canvasState.endPan()
  }
}

function handleWheel(e) {
  e.preventDefault()
  const rect = containerRef.value.getBoundingClientRect()
  
  if (e.metaKey || e.ctrlKey) {
    const newScale = viewport.zoomAt(e.clientX, e.clientY, e.deltaY, rect)
    emit('zoom-change', Math.round(newScale * 100))
  } else {
    viewport.pan(e.deltaX, e.deltaY)
  }
}

function handleKeyDown(e) {
  if (e.code === 'Space' && !e.repeat) {
    e.preventDefault()
    canvasState.setSpacePressed(true)
  }
  if (e.code === 'Escape') {
    // 取消当前操作或取消选中
    if (canvasState.isDragging.value || canvasState.isResizing.value) {
      canvasState.cancel()
    } else {
      canvasState.deselect()
    }
  }
  // Ctrl/Cmd + Z 撤销
  if ((e.metaKey || e.ctrlKey) && e.code === 'KeyZ' && !e.shiftKey) {
    e.preventDefault()
    history.undo()
  }
  // Ctrl/Cmd + Shift + Z 或 Ctrl/Cmd + Y 重做
  if ((e.metaKey || e.ctrlKey) && (e.code === 'KeyZ' && e.shiftKey || e.code === 'KeyY')) {
    e.preventDefault()
    history.redo()
  }
}

function handleKeyUp(e) {
  if (e.code === 'Space') {
    canvasState.setSpacePressed(false)
  }
}

// ============ 触摸事件处理 ============
function handleTouchStart(e) {
  pointer.handleTouchStart(e, {
    onPinchStart: () => {
      // 双指缩放开始
    },
    onPointerDown: (x, y) => {
      // 单指触摸 - 可能是平移或选择
      if (!e.target.closest('.image-item')) {
        canvasState.startPan()
        viewport.startPan(x, y)
      }
    }
  })
}

function handleTouchMove(e) {
  pointer.handleTouchMove(e, {
    onPinch: (centerX, centerY, scale, dx, dy) => {
      // 双指缩放和平移
      const rect = containerRef.value.getBoundingClientRect()
      
      // 应用缩放
      const oldScale = viewport.viewport.scale
      const newScale = Math.max(props.minZoom / 100, Math.min(props.maxZoom / 100, oldScale * scale))
      
      if (newScale !== oldScale) {
        const mouseX = centerX - rect.left
        const mouseY = centerY - rect.top
        const scaleRatio = newScale / oldScale
        
        viewport.viewport.x = mouseX - (mouseX - viewport.viewport.x) * scaleRatio
        viewport.viewport.y = mouseY - (mouseY - viewport.viewport.y) * scaleRatio
        viewport.viewport.scale = newScale
        
        emit('zoom-change', Math.round(newScale * 100))
      }
      
      // 应用平移
      viewport.viewport.x += dx
      viewport.viewport.y += dy
    },
    onPointerMove: (x, y) => {
      if (canvasState.isPanning.value) {
        viewport.updatePan(x, y)
      }
    }
  })
}

function handleTouchEnd(e) {
  pointer.handleTouchEnd(e, {
    onPinchEnd: () => {
      // 双指缩放结束
    },
    onPointerUp: () => {
      if (canvasState.isPanning.value) {
        canvasState.endPan()
      }
    }
  })
}

function handleCanvasClick(e) {
  // 如果点击的是图片，不取消选中
  if (e.target.closest('.image-item')) return
  if (!canvasState.isDragging.value) {
    canvasState.deselect()
  }
}

function handleImageDragStart(e, img) {
  if (e.button !== 0) return
  
  canvasState.select(img.id)
  dragSort.startDrag(img.id, e.clientX, e.clientY, viewport.viewport)
  
  // 先记录 draggedId，等移动超过阈值再真正进入拖拽状态
  canvasState.prepareDrag(img.id)
}

function handleResizeStart(e, handle) {
  if (e.button !== 0 || !selectedImage.value) return
  e.stopPropagation()
  
  imageResize.startResize(canvasState.selectedId.value, e.clientX, e.clientY)
  canvasState.startResize(handle)
}

// ============ 同步外部 zoom ============
watch(() => props.zoom, (newZoom) => {
  if (!containerRef.value) {
    // 初始化时直接设置 scale
    viewport.viewport.scale = newZoom / 100
    return
  }
  const rect = containerRef.value.getBoundingClientRect()
  viewport.setZoom(newZoom, rect)
}, { immediate: true })

// ============ 选中变化通知 ============
watch(() => canvasState.selectedId.value, (newId) => {
  emit('selection-change', newId ? selectedImage.value : null)
})

// ============ 生命周期 ============
function initCanvasPosition() {
  if (containerRef.value) {
    const rect = containerRef.value.getBoundingClientRect()
    // 确保 scale 已正确设置
    viewport.viewport.scale = props.zoom / 100
    viewport.centerContent(gridLayout.frameWidth.value, gridLayout.frameHeight.value, rect)
  }
}

onMounted(() => {
  setTimeout(initCanvasPosition, 100)
  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('mouseup', handleMouseUp)
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
})

onUnmounted(() => {
  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('mouseup', handleMouseUp)
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
})

// 获取显示位置的辅助函数
function getDisplayIndex(img) {
  return dragSort.getDisplayIndex(img, canvasState.draggedId.value, canvasState.isDragging.value)
}
</script>

<template>
  <div 
    ref="containerRef"
    class="canvas-container"
    :class="{ 
      panning: canvasState.isPanning.value, 
      'space-pressed': canvasState.spacePressed.value 
    }"
    @mousedown="handleMouseDown"
    @wheel.prevent="handleWheel"
    @contextmenu.prevent
    @click="handleCanvasClick"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd"
  >
    <div class="main-container">
      <div class="canvas-layer" :style="viewport.transformStyle.value">
        <div 
          class="canvas-frame" 
          :style="{ 
            width: gridLayout.frameWidth.value + 'px', 
            height: gridLayout.frameHeight.value + 'px' 
          }"
        >
          <!-- 网格图片 (虚拟化渲染) -->
          <div 
            v-for="img in visibleImages"
            :key="img.id"
            class="image-item"
            :class="{ hidden: canvasState.isDragging.value && canvasState.draggedId.value === img.id }"
            :style="{ 
              left: gridLayout.getGridPosition(getDisplayIndex(img)).x + 'px', 
              top: gridLayout.getGridPosition(getDisplayIndex(img)).y + 'px', 
              width: img.w + 'px', 
              height: img.h + 'px',
              transition: canvasState.isDragging.value ? 'left 0.2s ease, top 0.2s ease' : 'none',
              visibility: getDisplayIndex(img) === -1 ? 'hidden' : 'visible'
            }"
            @mousedown.stop="handleImageDragStart($event, img)"
          >
            <img :src="img.src" crossorigin="anonymous" loading="lazy" draggable="false" />
            <div class="ai-tag">AI生成</div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 拖拽中的图片 -->
    <div v-if="canvasState.isDragging.value && draggingImage" class="dragging-image" :style="draggingImageStyle">
      <img :src="draggingImage.src" crossorigin="anonymous" draggable="false" />
      <div class="corner-handle top-left"></div>
      <div class="corner-handle top-right"></div>
      <div class="corner-handle bottom-left"></div>
      <div class="corner-handle bottom-right"></div>
    </div>
    
    <!-- 选中框覆盖层 -->
    <div v-if="selectedImage && !canvasState.isDragging.value" class="selection-overlay" :style="selectionOverlayStyle">
      <div class="selection-border"></div>
      <div class="corner-handle top-left" @mousedown="handleResizeStart($event, 'top-left')"></div>
      <div class="corner-handle top-right" @mousedown="handleResizeStart($event, 'top-right')"></div>
      <div class="corner-handle bottom-left" @mousedown="handleResizeStart($event, 'bottom-left')"></div>
      <div class="corner-handle bottom-right" @mousedown="handleResizeStart($event, 'bottom-right')"></div>
    </div>
    
    <!-- 浮动工具栏 -->
    <div v-if="selectedImage && !canvasState.isDragging.value" class="floating-toolbar" :style="floatingToolbarStyle" @click.stop>
      <button class="toolbar-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>
        <span>重新编辑</span>
      </button>
      <button class="toolbar-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 4V2.5a.5.5 0 0 1 .854-.354l2.646 2.647a.5.5 0 0 1 0 .707L12.854 8.146A.5.5 0 0 1 12 7.793V6a6 6 0 1 0 6 6 1 1 0 1 1 2 0 8 8 0 1 1-8-8Z" fill="currentColor"/></svg>
        <span>再次生成</span>
      </button>
      <button class="toolbar-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M17.67 16.55a1 1 0 0 1 1.414 0l2.121 2.12a1.007 1.007 0 0 1 0 1.415l-2.121 2.122a1 1 0 0 1-1.414-1.415l.414-.414h-4.211a1 1 0 0 1 0-2h4.211l-.414-.414a1 1 0 0 1 0-1.414Z" fill="currentColor"/><path d="M16.39 2.607a5 5 0 0 1 5 5v8.421l-.892-.891a2.985 2.985 0 0 0-1.108-.7v-6.83a3 3 0 0 0-3-3H7.604a3 3 0 0 0-3 3v8.786c0 .188.02.372.052.55.143-.418.381-.813.719-1.151l2.797-2.797a3 3 0 0 1 4.092-.14l3.13 2.726c.113.1.215.206.31.314-.08.156-.145.319-.195.484h-1.636a3 3 0 0 0-3 3c0 .776.298 1.481.781 2.014h-4.05l-.256-.007a5 5 0 0 1-4.737-4.737l-.007-.256V7.607a5 5 0 0 1 5-5h8.786Z" fill="currentColor"/></svg>
        <span>添加到对话</span>
      </button>
      <div class="toolbar-divider"></div>
      <button class="toolbar-icon-btn" title="详情">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16ZM2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12Zm9-3a1 1 0 1 1 2 0 1 1 0 0 1-2 0Zm0 4a1 1 0 0 1 2 0v4a1 1 0 1 1-2 0v-4Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"/></svg>
      </button>
      <button class="toolbar-icon-btn" title="下载">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2a1 1 0 0 1 1 1v10.586l2.293-2.293a1 1 0 0 1 1.414 1.414l-4 4a1 1 0 0 1-1.414 0l-4-4a1 1 0 1 1 1.414-1.414L11 13.586V3a1 1 0 0 1 1-1ZM5 17a1 1 0 0 1 1 1v2h12v-2a1 1 0 1 1 2 0v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a1 1 0 0 1 1-1Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"/></svg>
      </button>
    </div>
    
    <!-- 尺寸标签 -->
    <div v-if="selectedImage" class="size-label" :style="sizeLabelStyle">
      {{ selectedImage.w }} × {{ selectedImage.h }}
    </div>
  </div>
</template>

<style scoped>
.canvas-container {
  flex: 1 1;
  height: 100%;
  overflow: hidden;
  position: relative;
  width: 100%;
  z-index: 1;
  background-color: var(--canvas-bg);
  cursor: default;
  touch-action: none;
}
.canvas-container.space-pressed { cursor: grab; }
.canvas-container.panning { cursor: grabbing; }

.main-container {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  overflow: hidden;
  user-select: none;
}

.canvas-layer {
  position: absolute;
  top: 0; left: 0;
  will-change: transform;
}

.canvas-frame {
  position: relative;
  box-sizing: border-box;
  background-color: var(--canvas-frame);
  outline: var(--stroke-secondary) solid 4px;
  outline-offset: -4px;
  border-radius: 16px;
  overflow: visible;
}

.image-item {
  position: absolute;
  box-sizing: border-box;
  pointer-events: auto;
  overflow: visible;
  border-radius: 8px;
  cursor: move;
}
.image-item.hidden { opacity: 0.3; }

.image-item img {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  object-fit: cover;
  display: block;
  pointer-events: none;
  border-radius: 8px;
}

.selection-overlay {
  position: absolute;
  pointer-events: none;
  z-index: 100000;
}

.selection-border {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  border: 3px solid #00cae0;
  border-radius: 8px;
  pointer-events: none;
  box-sizing: border-box;
}

.ai-tag {
  position: absolute;
  top: 8px; left: 8px;
  padding: 2px 6px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 4px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 10px;
  font-weight: 500;
  pointer-events: none;
  z-index: 1;
}

.corner-handle {
  position: absolute;
  width: 14px; height: 14px;
  background: #00cae0;
  border: 3px solid #fff;
  border-radius: 50%;
  pointer-events: auto;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}
.corner-handle.top-left { top: -7px; left: -7px; cursor: nwse-resize; }
.corner-handle.top-right { top: -7px; right: -7px; cursor: nesw-resize; }
.corner-handle.bottom-left { bottom: -7px; left: -7px; cursor: nesw-resize; }
.corner-handle.bottom-right { bottom: -7px; right: -7px; cursor: nwse-resize; }

.dragging-image {
  position: fixed;
  z-index: 100002;
  pointer-events: none;
  border-radius: 8px;
  outline: 3px solid #00cae0;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}
.dragging-image img {
  width: 100%; height: 100%;
  object-fit: cover;
  border-radius: 8px;
}

.floating-toolbar {
  position: absolute;
  z-index: 100001;
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 6px 8px;
  background: var(--canvas-float-block-default);
  backdrop-filter: blur(var(--canvas-float-backdrop-blur));
  border: 0.5px solid var(--stroke-tertiary);
  border-radius: 10px;
  box-shadow: var(--shadow-generator-float-block);
}

.toolbar-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}
.toolbar-btn:hover { background: var(--menu-item-hover); }
.toolbar-btn svg { flex-shrink: 0; }

.toolbar-divider {
  width: 1px; height: 20px;
  background: var(--stroke-tertiary);
  margin: 0 6px;
}

.toolbar-icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px; height: 32px;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s;
}
.toolbar-icon-btn:hover { background: var(--menu-item-hover); }

.size-label {
  position: absolute;
  z-index: 100000;
  padding: 4px 10px;
  background: rgba(0, 0, 0, 0.75);
  border-radius: 4px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  pointer-events: none;
}
</style>
