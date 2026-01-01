<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps({
  zoom: { type: Number, default: 100 }
})

const emit = defineEmits(['zoom-change', 'selection-change'])

// 画布状态
const containerRef = ref(null)
const isPanning = ref(false)
const spacePressed = ref(false)

// 选中和拖拽状态
const selectedImageId = ref(null)
const isDraggingImage = ref(false)
const draggedImageId = ref(null)
const dragOriginalIndex = ref(null)
const currentHoverIndex = ref(null)
const hasMoved = ref(false) // 是否真正移动过

// 缩放状态
const isResizing = ref(false)
const resizeHandle = ref(null)
const resizeStart = reactive({ mouseX: 0, mouseY: 0, width: 0, height: 0 })

// 网格配置
const GRID_COLS = 4
const CELL_WIDTH = 1728
const CELL_HEIGHT = 2304
const GAP = 96
const PADDING = 192

// 视口变换状态
const viewport = reactive({ x: 0, y: 0, scale: 1 })
const dragStart = reactive({ x: 0, y: 0, viewportX: 0, viewportY: 0 })
const imageDragStart = reactive({ mouseX: 0, mouseY: 0, offsetX: 0, offsetY: 0 })

// 拖拽中的图片位置（屏幕坐标）
const draggingPosition = reactive({ x: 0, y: 0 })

// 图片数据 - 使用 index 来确定网格位置，添加宽高属性
const images = ref([
  { id: 1, src: 'https://picsum.photos/seed/a1/1728/2304', index: 0, w: 1728, h: 2304 },
  { id: 2, src: 'https://picsum.photos/seed/a2/1728/2304', index: 1, w: 1728, h: 2304 },
  { id: 3, src: 'https://picsum.photos/seed/a3/1728/2304', index: 2, w: 1728, h: 2304 },
  { id: 4, src: 'https://picsum.photos/seed/a4/1728/2304', index: 3, w: 1728, h: 2304 },
  { id: 5, src: 'https://picsum.photos/seed/a5/1728/2304', index: 4, w: 1728, h: 2304 },
  { id: 6, src: 'https://picsum.photos/seed/a6/1728/2304', index: 5, w: 1728, h: 2304 },
  { id: 7, src: 'https://picsum.photos/seed/a7/1728/2304', index: 6, w: 1728, h: 2304 },
  { id: 8, src: 'https://picsum.photos/seed/a8/1728/2304', index: 7, w: 1728, h: 2304 },
  { id: 9, src: 'https://picsum.photos/seed/a9/1728/2304', index: 8, w: 1728, h: 2304 },
  { id: 10, src: 'https://picsum.photos/seed/a10/1728/2304', index: 9, w: 1728, h: 2304 },
  { id: 11, src: 'https://picsum.photos/seed/a11/1728/2304', index: 10, w: 1728, h: 2304 },
  { id: 12, src: 'https://picsum.photos/seed/a12/1728/2304', index: 11, w: 1728, h: 2304 },
])

// 根据 index 计算网格位置
const getGridPosition = (index) => {
  const col = index % GRID_COLS
  const row = Math.floor(index / GRID_COLS)
  return {
    x: PADDING + col * (CELL_WIDTH + GAP),
    y: PADDING + row * (CELL_HEIGHT + GAP)
  }
}

// 根据坐标计算目标 index
const getTargetIndex = (canvasX, canvasY) => {
  const col = Math.round((canvasX - PADDING) / (CELL_WIDTH + GAP))
  const row = Math.round((canvasY - PADDING) / (CELL_HEIGHT + GAP))
  const clampedCol = Math.max(0, Math.min(GRID_COLS - 1, col))
  const clampedRow = Math.max(0, row)
  const maxIndex = images.value.length - 1
  return Math.min(clampedRow * GRID_COLS + clampedCol, maxIndex)
}

// 计算拖拽时的显示位置（考虑避让）
const getDisplayIndex = (img) => {
  if (!isDraggingImage.value || currentHoverIndex.value === null) {
    return img.index
  }
  
  const draggedImg = images.value.find(i => i.id === draggedImageId.value)
  if (!draggedImg) return img.index
  
  const originalIdx = dragOriginalIndex.value
  const hoverIdx = currentHoverIndex.value
  
  // 被拖拽的图片不显示在网格中
  if (img.id === draggedImageId.value) {
    return -1
  }
  
  // 计算其他图片的避让位置
  if (hoverIdx < originalIdx) {
    // 向前拖拽
    if (img.index >= hoverIdx && img.index < originalIdx) {
      return img.index + 1
    }
  } else if (hoverIdx > originalIdx) {
    // 向后拖拽
    if (img.index > originalIdx && img.index <= hoverIdx) {
      return img.index - 1
    }
  }
  
  return img.index
}

// 获取选中的图片
const selectedImage = computed(() => {
  if (!selectedImageId.value) return null
  return images.value.find(img => img.id === selectedImageId.value)
})

// 计算画布帧尺寸
const frameWidth = computed(() => {
  const cols = GRID_COLS
  return PADDING * 2 + cols * CELL_WIDTH + (cols - 1) * GAP
})

const frameHeight = computed(() => {
  const rows = Math.ceil(images.value.length / GRID_COLS)
  return PADDING * 2 + rows * CELL_HEIGHT + (rows - 1) * GAP
})

// 同步外部 zoom
watch(() => props.zoom, (newZoom) => {
  const newScale = newZoom / 100
  if (Math.abs(newScale - viewport.scale) > 0.001) {
    if (containerRef.value) {
      const rect = containerRef.value.getBoundingClientRect()
      const centerX = rect.width / 2
      const centerY = rect.height / 2
      const oldScale = viewport.scale
      const scaleRatio = newScale / oldScale
      viewport.x = centerX - (centerX - viewport.x) * scaleRatio
      viewport.y = centerY - (centerY - viewport.y) * scaleRatio
    }
    viewport.scale = newScale
  }
}, { immediate: true })

watch(selectedImageId, (newId) => {
  emit('selection-change', newId ? selectedImage.value : null)
})

// 画布层样式
const canvasLayerStyle = computed(() => ({
  transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})`,
  transformOrigin: 'left top'
}))

// 计算浮动工具栏位置
const floatingToolbarStyle = computed(() => {
  if (!selectedImage.value || !containerRef.value || isDraggingImage.value) return { display: 'none' }
  const pos = getGridPosition(selectedImage.value.index)
  const imgCenterX = viewport.x + (pos.x + CELL_WIDTH / 2) * viewport.scale
  const imgTopY = viewport.y + pos.y * viewport.scale
  return { left: imgCenterX + 'px', top: (imgTopY - 52) + 'px', transform: 'translateX(-50%)' }
})

// 计算尺寸标签位置
const sizeLabelStyle = computed(() => {
  if (!selectedImage.value || !containerRef.value) return { display: 'none' }
  if (isDraggingImage.value) {
    return { left: (draggingPosition.x + CELL_WIDTH * viewport.scale / 2) + 'px', top: (draggingPosition.y + CELL_HEIGHT * viewport.scale + 8) + 'px', transform: 'translateX(-50%)' }
  }
  const pos = getGridPosition(selectedImage.value.index)
  const imgCenterX = viewport.x + (pos.x + CELL_WIDTH / 2) * viewport.scale
  const imgBottomY = viewport.y + (pos.y + CELL_HEIGHT) * viewport.scale
  return { left: imgCenterX + 'px', top: (imgBottomY + 8) + 'px', transform: 'translateX(-50%)' }
})

// 计算选中框覆盖层位置（屏幕坐标系）
const selectionOverlayStyle = computed(() => {
  if (!selectedImage.value || !containerRef.value) return { display: 'none' }
  const pos = getGridPosition(selectedImage.value.index)
  const left = viewport.x + pos.x * viewport.scale
  const top = viewport.y + pos.y * viewport.scale
  const width = selectedImage.value.w * viewport.scale
  const height = selectedImage.value.h * viewport.scale
  return { left: left + 'px', top: top + 'px', width: width + 'px', height: height + 'px' }
})

// 拖拽中图片的样式
const draggingImageStyle = computed(() => {
  if (!isDraggingImage.value) return { display: 'none' }
  return {
    left: draggingPosition.x + 'px',
    top: draggingPosition.y + 'px',
    width: (CELL_WIDTH * viewport.scale) + 'px',
    height: (CELL_HEIGHT * viewport.scale) + 'px'
  }
})

// 获取正在拖拽的图片
const draggingImage = computed(() => {
  if (!draggedImageId.value) return null
  return images.value.find(img => img.id === draggedImageId.value)
})

// 点击图片选中
const handleImageClick = (e, img) => {
  e.stopPropagation()
  // 点击选中由 mouseup 处理
}

// 开始缩放图片
const handleResizeStart = (e, handle) => {
  if (e.button !== 0 || !selectedImage.value) return
  e.stopPropagation()
  
  isResizing.value = true
  resizeHandle.value = handle
  resizeStart.mouseX = e.clientX
  resizeStart.mouseY = e.clientY
  resizeStart.width = selectedImage.value.w
  resizeStart.height = selectedImage.value.h
}

// 开始拖拽图片
const handleImageDragStart = (e, img) => {
  if (e.button !== 0) return
  e.stopPropagation()
  
  selectedImageId.value = img.id
  draggedImageId.value = img.id
  dragOriginalIndex.value = img.index
  currentHoverIndex.value = img.index
  hasMoved.value = false
  
  const pos = getGridPosition(img.index)
  const screenX = viewport.x + pos.x * viewport.scale
  const screenY = viewport.y + pos.y * viewport.scale
  
  imageDragStart.mouseX = e.clientX
  imageDragStart.mouseY = e.clientY
  imageDragStart.offsetX = e.clientX - screenX
  imageDragStart.offsetY = e.clientY - screenY
  
  draggingPosition.x = screenX
  draggingPosition.y = screenY
}

// 点击画布空白处取消选中
const handleCanvasClick = () => {
  if (!isDraggingImage.value) {
    selectedImageId.value = null
  }
}

// 鼠标按下 - 画布拖拽
const handleMouseDown = (e) => {
  if (e.button === 1 || (e.button === 0 && (spacePressed.value || e.altKey))) {
    e.preventDefault()
    isPanning.value = true
    dragStart.x = e.clientX
    dragStart.y = e.clientY
    dragStart.viewportX = viewport.x
    dragStart.viewportY = viewport.y
  }
}

// 鼠标移动
const handleMouseMove = (e) => {
  if (isPanning.value) {
    viewport.x = dragStart.viewportX + (e.clientX - dragStart.x)
    viewport.y = dragStart.viewportY + (e.clientY - dragStart.y)
    return
  }
  
  // 缩放图片
  if (isResizing.value && selectedImage.value) {
    const dx = (e.clientX - resizeStart.mouseX) / viewport.scale
    const dy = (e.clientY - resizeStart.mouseY) / viewport.scale
    const aspectRatio = resizeStart.width / resizeStart.height
    
    let newW = resizeStart.width
    let newH = resizeStart.height
    
    // 根据拖拽的角计算新尺寸，保持宽高比
    if (resizeHandle.value === 'bottom-right') {
      newW = Math.max(200, resizeStart.width + dx)
    } else if (resizeHandle.value === 'bottom-left') {
      newW = Math.max(200, resizeStart.width - dx)
    } else if (resizeHandle.value === 'top-right') {
      newW = Math.max(200, resizeStart.width + dx)
    } else if (resizeHandle.value === 'top-left') {
      newW = Math.max(200, resizeStart.width - dx)
    }
    
    newH = newW / aspectRatio
    selectedImage.value.w = Math.round(newW)
    selectedImage.value.h = Math.round(newH)
    return
  }
  
  if (draggedImageId.value) {
    const dx = e.clientX - imageDragStart.mouseX
    const dy = e.clientY - imageDragStart.mouseY
    
    // 移动超过 5px 才算真正开始拖拽
    if (!isDraggingImage.value && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
      isDraggingImage.value = true
      hasMoved.value = true
    }
    
    if (isDraggingImage.value) {
      draggingPosition.x = e.clientX - imageDragStart.offsetX
      draggingPosition.y = e.clientY - imageDragStart.offsetY
      
      // 实时计算当前悬停位置，触发避让效果
      const canvasX = (draggingPosition.x - viewport.x) / viewport.scale + CELL_WIDTH / 2
      const canvasY = (draggingPosition.y - viewport.y) / viewport.scale + CELL_HEIGHT / 2
      const newHoverIndex = getTargetIndex(canvasX, canvasY)
      
      if (newHoverIndex !== currentHoverIndex.value) {
        currentHoverIndex.value = newHoverIndex
      }
    }
  }
}

// 鼠标松开
const handleMouseUp = (e) => {
  // 结束缩放
  if (isResizing.value) {
    isResizing.value = false
    resizeHandle.value = null
    return
  }
  
  if (draggedImageId.value) {
    if (isDraggingImage.value && currentHoverIndex.value !== null) {
      const targetIndex = currentHoverIndex.value
      const currentIndex = dragOriginalIndex.value
      
      if (targetIndex !== currentIndex) {
        // 重新排列图片 - 更新实际的 index 值
        const draggedItem = images.value.find(img => img.id === draggedImageId.value)
        
        if (targetIndex < currentIndex) {
          // 向前移动
          images.value.forEach(img => {
            if (img.id !== draggedImageId.value && img.index >= targetIndex && img.index < currentIndex) {
              img.index++
            }
          })
        } else {
          // 向后移动
          images.value.forEach(img => {
            if (img.id !== draggedImageId.value && img.index > currentIndex && img.index <= targetIndex) {
              img.index--
            }
          })
        }
        draggedItem.index = targetIndex
      }
    }
    
    // 如果没有移动过，保持选中状态
    if (!hasMoved.value) {
      selectedImageId.value = draggedImageId.value
    }
  }
  
  isPanning.value = false
  isDraggingImage.value = false
  draggedImageId.value = null
  dragOriginalIndex.value = null
  currentHoverIndex.value = null
  hasMoved.value = false
}

// 滚轮事件
const handleWheel = (e) => {
  e.preventDefault()
  if (e.metaKey || e.ctrlKey) {
    const rect = containerRef.value.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    const delta = -e.deltaY * 0.010
    const oldScale = viewport.scale
    let newScale = Math.max(0.01, Math.min(2, oldScale * (1 + delta)))
    const scaleRatio = newScale / oldScale
    viewport.x = mouseX - (mouseX - viewport.x) * scaleRatio
    viewport.y = mouseY - (mouseY - viewport.y) * scaleRatio
    viewport.scale = newScale
    emit('zoom-change', Math.round(newScale * 100))
  } else {
    viewport.x -= e.deltaX
    viewport.y -= e.deltaY
  }
}

// 键盘事件
const handleKeyDown = (e) => {
  if (e.code === 'Space' && !e.repeat) { e.preventDefault(); spacePressed.value = true }
  if (e.code === 'Escape') { selectedImageId.value = null }
}
const handleKeyUp = (e) => { if (e.code === 'Space') spacePressed.value = false }
const handleContextMenu = (e) => { e.preventDefault() }

const initCanvasPosition = () => {
  if (containerRef.value) {
    const rect = containerRef.value.getBoundingClientRect()
    viewport.x = (rect.width - frameWidth.value * viewport.scale) / 2
    viewport.y = (rect.height - frameHeight.value * viewport.scale) / 2
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
</script>

<template>
  <div 
    ref="containerRef"
    class="canvas-container"
    :class="{ panning: isPanning, 'space-pressed': spacePressed }"
    @mousedown="handleMouseDown"
    @wheel.prevent="handleWheel"
    @contextmenu="handleContextMenu"
    @click="handleCanvasClick"
  >
    <div class="main-container">
      <div class="canvas-layer" :style="canvasLayerStyle">
        <div class="canvas-frame" :style="{ width: frameWidth + 'px', height: frameHeight + 'px' }">
          <!-- 网格图片 -->
          <div 
            v-for="img in images"
            :key="img.id"
            class="image-item"
            :class="{ hidden: isDraggingImage && draggedImageId === img.id }"
            :style="{ 
              left: getGridPosition(getDisplayIndex(img)).x + 'px', 
              top: getGridPosition(getDisplayIndex(img)).y + 'px', 
              width: img.w + 'px', 
              height: img.h + 'px',
              transition: isDraggingImage ? 'left 0.2s ease, top 0.2s ease' : 'none',
              visibility: getDisplayIndex(img) === -1 ? 'hidden' : 'visible'
            }"
            @click="handleImageClick($event, img)"
            @mousedown="handleImageDragStart($event, img)"
          >
            <img :src="img.src" crossorigin="anonymous" loading="lazy" />
            <div class="ai-tag">AI生成</div>
          </div>
          
          <div v-if="images.length === 0" class="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" class="empty-icon">
              <path d="M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16ZM2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" opacity="0.3"/>
              <path d="M11 8a1 1 0 0 1 2 0v3h3a1 1 0 1 1 0 2h-3v3a1 1 0 1 1-2 0v-3H8a1 1 0 1 1 0-2h3V8Z" fill="currentColor"/>
            </svg>
            <p class="empty-text">在下方输入提示词开始创作</p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 拖拽中的图片 -->
    <div v-if="isDraggingImage && draggingImage" class="dragging-image" :style="draggingImageStyle">
      <img :src="draggingImage.src" crossorigin="anonymous" />
      <div class="corner-handle top-left"></div>
      <div class="corner-handle top-right"></div>
      <div class="corner-handle bottom-left"></div>
      <div class="corner-handle bottom-right"></div>
    </div>
    
    <!-- 选中框覆盖层（屏幕坐标系） -->
    <div v-if="selectedImage && !isDraggingImage" class="selection-overlay" :style="selectionOverlayStyle">
      <div class="selection-border"></div>
      <div class="corner-handle top-left" @mousedown="handleResizeStart($event, 'top-left')"></div>
      <div class="corner-handle top-right" @mousedown="handleResizeStart($event, 'top-right')"></div>
      <div class="corner-handle bottom-left" @mousedown="handleResizeStart($event, 'bottom-left')"></div>
      <div class="corner-handle bottom-right" @mousedown="handleResizeStart($event, 'bottom-right')"></div>
    </div>
    
    <!-- 浮动工具栏 -->
    <div v-if="selectedImage && !isDraggingImage" class="floating-toolbar" :style="floatingToolbarStyle" @click.stop>
      <button class="toolbar-btn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg><span>重新编辑</span></button>
      <button class="toolbar-btn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 4V2.5a.5.5 0 0 1 .854-.354l2.646 2.647a.5.5 0 0 1 0 .707L12.854 8.146A.5.5 0 0 1 12 7.793V6a6 6 0 1 0 6 6 1 1 0 1 1 2 0 8 8 0 1 1-8-8Z" fill="currentColor"/></svg><span>再次生成</span></button>
      <button class="toolbar-btn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M17.67 16.55a1 1 0 0 1 1.414 0l2.121 2.12a1.007 1.007 0 0 1 0 1.415l-2.121 2.122a1 1 0 0 1-1.414-1.415l.414-.414h-4.211a1 1 0 0 1 0-2h4.211l-.414-.414a1 1 0 0 1 0-1.414Z" fill="currentColor"/><path d="M16.39 2.607a5 5 0 0 1 5 5v8.421l-.892-.891a2.985 2.985 0 0 0-1.108-.7v-6.83a3 3 0 0 0-3-3H7.604a3 3 0 0 0-3 3v8.786c0 .188.02.372.052.55.143-.418.381-.813.719-1.151l2.797-2.797a3 3 0 0 1 4.092-.14l3.13 2.726c.113.1.215.206.31.314-.08.156-.145.319-.195.484h-1.636a3 3 0 0 0-3 3c0 .776.298 1.481.781 2.014h-4.05l-.256-.007a5 5 0 0 1-4.737-4.737l-.007-.256V7.607a5 5 0 0 1 5-5h8.786Z" fill="currentColor"/></svg><span>添加到对话</span></button>
      <div class="toolbar-divider"></div>
      <button class="toolbar-icon-btn" title="详情"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16ZM2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12Zm9-3a1 1 0 1 1 2 0 1 1 0 0 1-2 0Zm0 4a1 1 0 0 1 2 0v4a1 1 0 1 1-2 0v-4Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"/></svg></button>
      <button class="toolbar-icon-btn" title="下载"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2a1 1 0 0 1 1 1v10.586l2.293-2.293a1 1 0 0 1 1.414 1.414l-4 4a1 1 0 0 1-1.414 0l-4-4a1 1 0 1 1 1.414-1.414L11 13.586V3a1 1 0 0 1 1-1ZM5 17a1 1 0 0 1 1 1v2h12v-2a1 1 0 1 1 2 0v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a1 1 0 0 1 1-1Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"/></svg></button>
    </div>
    
    <!-- 尺寸标签 -->
    <div v-if="selectedImage" class="size-label" :style="sizeLabelStyle">{{ selectedImage.w }} × {{ selectedImage.h }}</div>
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
  outline: rgba(204, 221, 255, 0.12) solid 4px;
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

/* 选中框覆盖层 */
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

.empty-state {
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}
.empty-icon { color: var(--text-tertiary); }
.empty-text { color: var(--text-tertiary); font-size: 14px; white-space: nowrap; }

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
.toolbar-btn:hover { background: rgba(255, 255, 255, 0.1); }
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
.toolbar-icon-btn:hover { background: rgba(255, 255, 255, 0.1); }

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
