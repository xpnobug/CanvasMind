<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  ratio: {
    type: String,
    required: true
  },
  resolution: {
    type: String,
    required: true
  },
  width: {
    type: Number,
    required: true
  },
  height: {
    type: Number,
    required: true
  },
  locked: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits([
  'update:ratio', 
  'update:resolution', 
  'update:width', 
  'update:height', 
  'update:locked'
])

// 比例选项
const ratioOptions = [
  { id: 'smart', label: '智能', icon: 'smart', width: null, height: null },
  { id: '21:9', label: '21:9', width: 21, height: 9 },
  { id: '16:9', label: '16:9', width: 16, height: 9 },
  { id: '3:2', label: '3:2', width: 3, height: 2 },
  { id: '4:3', label: '4:3', width: 4, height: 3 },
  { id: '1:1', label: '1:1', width: 1, height: 1 },
  { id: '3:4', label: '3:4', width: 3, height: 4 },
  { id: '2:3', label: '2:3', width: 2, height: 3 },
  { id: '9:16', label: '9:16', width: 9, height: 16 }
]

// 分辨率选项
const resolutionOptions = [
  { id: '2k', label: '高清 2K', baseSize: 2048 },
  { id: '4k', label: '超清 4K', baseSize: 4096, isPremium: true }
]

const showMenu = ref(false)
const menuRef = ref(null)

// 获取当前比例显示文本
const currentRatioLabel = computed(() => {
  const r = ratioOptions.find(r => r.id === props.ratio)
  return r?.id === 'smart' ? '智能比例' : r?.label
})

// 获取当前分辨率显示文本
const currentResolutionLabel = computed(() => {
  return resolutionOptions.find(r => r.id === props.resolution)?.label
})

// 获取比例图标盒子样式
const getRatioBoxStyle = (ratio) => {
  if (!ratio.width || !ratio.height) return {}
  const maxSize = 20
  let width, height
  if (ratio.width >= ratio.height) {
    width = maxSize
    height = Math.round(maxSize * (ratio.height / ratio.width))
  } else {
    height = maxSize
    width = Math.round(maxSize * (ratio.width / ratio.height))
  }
  return {
    width: `${width}px`,
    height: `${height}px`
  }
}

// 计算尺寸
const calculateSize = (ratioId, resolutionId) => {
  const resolution = resolutionOptions.find(r => r.id === resolutionId)
  const ratio = ratioOptions.find(r => r.id === ratioId)
  const baseSize = resolution?.baseSize || 2048
  
  let newWidth, newHeight
  if (ratio && ratio.width && ratio.height) {
    if (ratio.width >= ratio.height) {
      newWidth = baseSize
      newHeight = Math.round(baseSize * (ratio.height / ratio.width))
    } else {
      newHeight = baseSize
      newWidth = Math.round(baseSize * (ratio.width / ratio.height))
    }
  } else {
    newWidth = baseSize
    newHeight = baseSize
  }
  return { width: newWidth, height: newHeight }
}

// 切换菜单
const toggleMenu = (e) => {
  e.stopPropagation()
  showMenu.value = !showMenu.value
}

// 关闭菜单
const closeMenu = (e) => {
  if (!showMenu.value) return
  if (menuRef.value && menuRef.value.contains(e.target)) return
  showMenu.value = false
}

// 选择比例
const selectRatio = (ratioId) => {
  emit('update:ratio', ratioId)
  const { width, height } = calculateSize(ratioId, props.resolution)
  emit('update:width', width)
  emit('update:height', height)
}

// 选择分辨率
const selectResolution = (resId) => {
  emit('update:resolution', resId)
  const { width, height } = calculateSize(props.ratio, resId)
  emit('update:width', width)
  emit('update:height', height)
}

// 切换锁定
const toggleLock = () => {
  emit('update:locked', !props.locked)
}

onMounted(() => {
  document.addEventListener('click', closeMenu)
})

onUnmounted(() => {
  document.removeEventListener('click', closeMenu)
})
</script>

<template>
  <div class="ratio-select" ref="menuRef">
    <button 
      class="toolbar-button with-text with-icon ratio-trigger" 
      :class="{ active: showMenu }" 
      type="button" 
      @click.stop="toggleMenu"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" stroke-width="2"/>
        <path d="M3 12h18" stroke="currentColor" stroke-width="1.5" opacity="0.5"/>
        <path d="M12 3v18" stroke="currentColor" stroke-width="1.5" opacity="0.5"/>
      </svg>
      <span>{{ currentRatioLabel }}</span>
      <span class="resolution-tag">{{ currentResolutionLabel }}</span>
    </button>
    
    <!-- 比例/分辨率下拉菜单 -->
    <Transition name="ratio-menu">
      <div v-if="showMenu" class="ratio-dropdown">
        <!-- 选择比例 -->
        <div class="ratio-section">
          <div class="ratio-section-title">选择比例</div>
          <div class="ratio-grid">
            <div 
              v-for="r in ratioOptions" 
              :key="r.id"
              class="ratio-item"
              :class="{ selected: ratio === r.id }"
              @mousedown.prevent="selectRatio(r.id)"
            >
              <div class="ratio-icon" :class="r.id === 'smart' ? 'smart-icon' : ''">
                <template v-if="r.id === 'smart'">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" stroke-width="2"/>
                    <path d="M8 8h8M8 12h8M8 16h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                  </svg>
                </template>
                <template v-else>
                  <div class="ratio-box" :style="getRatioBoxStyle(r)"></div>
                </template>
              </div>
              <span class="ratio-label">{{ r.label }}</span>
            </div>
          </div>
        </div>

        <!-- 选择分辨率 -->
        <div class="resolution-section">
          <div class="ratio-section-title">选择分辨率</div>
          <div class="resolution-toggle">
            <button 
              v-for="res in resolutionOptions" 
              :key="res.id"
              class="resolution-option"
              :class="{ selected: resolution === res.id }"
              @mousedown.prevent="selectResolution(res.id)"
            >
              {{ res.label }}
              <span v-if="res.isPremium" class="premium-icon">✦</span>
            </button>
          </div>
        </div>

        <!-- 尺寸 -->
        <div class="size-section">
          <div class="ratio-section-title">尺寸</div>
          <div class="size-inputs">
            <div class="size-input-group">
              <span class="size-label">W</span>
              <input 
                type="number" 
                :value="width" 
                @input="$emit('update:width', parseInt($event.target.value) || 0)" 
                class="size-input" 
              />
            </div>
            <button class="size-lock" :class="{ locked: locked }" @click="toggleLock">
              <svg v-if="locked" width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M8 12h8M12 8v8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M8 12h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
            <div class="size-input-group">
              <span class="size-label">H</span>
              <input 
                type="number" 
                :value="height" 
                @input="$emit('update:height', parseInt($event.target.value) || 0)" 
                class="size-input" 
              />
            </div>
            <span class="size-unit">PX</span>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* 比例选择器 */
.ratio-select {
  position: relative;
}

.toolbar-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px;
  border-radius: 8px;
  background: transparent;
  border: 1px solid var(--stroke-secondary, rgba(255, 255, 255, 0.08));
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 450;
  cursor: pointer;
  transition: background-color 0.2s, border-color 0.2s;
  white-space: nowrap;
}

.toolbar-button:hover {
  background: var(--bg-block-secondary-hover, rgba(255, 255, 255, 0.08));
}

.toolbar-button.with-icon {
  gap: 6px;
}

.toolbar-button.with-text {
  padding: 8px 12px;
}

.ratio-trigger.active {
  background: var(--bg-block-primary-pressed, rgba(255, 255, 255, 0.12));
}

.resolution-tag {
  margin-left: 4px;
  padding: 2px 8px;
  background: var(--bg-block-primary-default, rgba(255, 255, 255, 0.08));
  border-radius: 4px;
  font-size: 12px;
}

/* 比例下拉菜单 */
.ratio-dropdown {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 0;
  min-width: 480px;
  background: var(--bg-float, #1a1a1a);
  border: 1px solid var(--stroke-tertiary, rgba(255, 255, 255, 0.08));
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  z-index: 1000;
  padding: 20px;
}

.ratio-section,
.resolution-section,
.size-section {
  margin-bottom: 20px;
}

.ratio-section:last-child,
.resolution-section:last-child,
.size-section:last-child {
  margin-bottom: 0;
}

.ratio-section-title {
  color: var(--text-secondary);
  font-size: 13px;
  margin-bottom: 12px;
}

/* 比例网格 */
.ratio-grid {
  display: flex;
  gap: 4px;
  background: var(--bg-block-primary-default, rgba(255, 255, 255, 0.04));
  border-radius: 12px;
  padding: 4px;
}

.ratio-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.15s;
  min-width: 44px;
}

.ratio-item:hover {
  background: var(--bg-block-primary-hover, rgba(255, 255, 255, 0.08));
}

.ratio-item.selected {
  background: var(--bg-block-primary-pressed, rgba(255, 255, 255, 0.12));
}

.ratio-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  color: var(--text-secondary);
}

.ratio-item.selected .ratio-icon {
  color: var(--text-primary);
}

.ratio-box {
  border: 1.5px solid currentColor;
  border-radius: 2px;
}

.ratio-label {
  font-size: 11px;
  color: var(--text-tertiary);
}

.ratio-item.selected .ratio-label {
  color: var(--text-primary);
}

/* 分辨率切换 */
.resolution-toggle {
  display: flex;
  background: var(--bg-block-primary-default, rgba(255, 255, 255, 0.04));
  border-radius: 12px;
  padding: 4px;
  gap: 4px;
}

.resolution-option {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 12px 24px;
  border-radius: 8px;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.15s, color 0.15s;
}

.resolution-option:hover {
  background: var(--bg-block-primary-hover, rgba(255, 255, 255, 0.06));
}

.resolution-option.selected {
  background: var(--bg-block-secondary-default, rgba(255, 255, 255, 0.1));
  color: var(--text-primary);
}

.premium-icon {
  color: #00b8d4;
}

/* 尺寸输入 */
.size-inputs {
  display: flex;
  align-items: center;
  gap: 8px;
}

.size-input-group {
  display: flex;
  align-items: center;
  background: var(--bg-block-primary-default, rgba(255, 255, 255, 0.04));
  border-radius: 8px;
  padding: 8px 12px;
  gap: 8px;
}

.size-label {
  color: var(--text-tertiary);
  font-size: 13px;
  min-width: 16px;
}

.size-input {
  width: 80px;
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 500;
  text-align: right;
  outline: none;
}

.size-input::-webkit-outer-spin-button,
.size-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.size-lock {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: transparent;
  border: none;
  color: var(--text-tertiary);
  cursor: pointer;
  border-radius: 6px;
  transition: background-color 0.15s, color 0.15s;
}

.size-lock:hover {
  background: var(--bg-block-primary-hover, rgba(255, 255, 255, 0.08));
  color: var(--text-secondary);
}

.size-lock.locked {
  color: var(--brand-main-default, #00b8d4);
}

.size-unit {
  color: var(--text-tertiary);
  font-size: 13px;
  margin-left: 4px;
}

/* 比例菜单动画 */
.ratio-menu-enter-active,
.ratio-menu-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.ratio-menu-enter-from,
.ratio-menu-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
