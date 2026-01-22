<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    required: true
  },
  options: {
    type: Array,
    default: () => [
      { id: 'agent', label: 'Agent 模式', icon: 'agent' },
      { id: 'image', label: '图片生成', icon: 'image' },
      { id: 'video', label: '视频生成', icon: 'video' }
    ]
  }
})

const emit = defineEmits(['update:modelValue'])

const showMenu = ref(false)
const menuRef = ref(null)

// 获取当前模式
const currentMode = computed(() => {
  return props.options.find(m => m.id === props.modelValue)
})

// 切换菜单
const toggleMenu = (e) => {
  e.stopPropagation()
  showMenu.value = !showMenu.value
}

// 选择模式
const selectMode = (modeId) => {
  emit('update:modelValue', modeId)
  showMenu.value = false
}

// 关闭菜单
const closeMenu = (e) => {
  if (!showMenu.value) return
  if (menuRef.value && menuRef.value.contains(e.target)) return
  showMenu.value = false
}

onMounted(() => {
  document.addEventListener('click', closeMenu)
})

onUnmounted(() => {
  document.removeEventListener('click', closeMenu)
})
</script>

<template>
  <div class="mode-select" ref="menuRef">
    <div class="select-trigger" :class="{ active: showMenu }" @click.stop="toggleMenu">
      <span class="select-option-icon">
        <svg v-if="modelValue === 'agent'" width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M11.805 5.786c1.25-.926 2.193-1.373 2.471-1.096.489.488-1.261 3.03-3.909 5.677-4.33 4.331-6.715 8.968-5.326 10.358.29.29.723.416 1.264.394.421.017.92-.07 1.48-.249-2.117.9-3.859 1.005-4.76.104-1.874-1.874.61-7.402 5.553-12.353l.022-.02c.03-.032.062-.063.093-.094l.065-.064.11-.108c.97-.95 1.96-1.804 2.937-2.549Zm5.55 11.57c1.532-1.531 3.2-2.347 3.725-1.822.525.525-.29 2.192-1.822 3.724-1.532 1.531-3.2 2.347-3.725 1.822-.524-.525.291-2.192 1.822-3.724ZM16.217 3.13c2.116-.9 3.858-1.005 4.759-.105 1.874 1.875-.612 7.402-5.554 12.353l-.022.021c-.03.032-.062.062-.093.093l-.064.065-.11.108c-.97.949-1.96 1.803-2.938 2.548-1.25.926-2.193 1.374-2.471 1.096-.489-.487 1.262-3.029 3.91-5.676 4.331-4.332 6.715-8.97 5.325-10.36-.29-.29-.722-.414-1.263-.392-.421-.017-.92.069-1.48.249ZM4.742 4.74C6.274 3.21 7.94 2.394 8.466 2.92c.525.525-.29 2.193-1.822 3.724C5.112 8.175 3.445 8.99 2.92 8.466c-.525-.525.29-2.193 1.822-3.725Z" fill="currentColor"/></svg>
        <svg v-else-if="modelValue === 'image'" width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M16.326 2.75a4.924 4.924 0 0 1 4.924 4.924v8.652a4.924 4.924 0 0 1-4.924 4.924H7.674a4.924 4.924 0 0 1-4.924-4.924V7.674A4.924 4.924 0 0 1 7.674 2.75h8.652Zm0 1.97H7.674A2.954 2.954 0 0 0 4.72 7.674v8.652c0 .055 0 .109.004.162l3.508-3.508a2.955 2.955 0 0 1 4.178 0l3.508 3.508c.004-.053.004-.107.004-.162V7.674a2.954 2.954 0 0 0-2.954-2.954h.358ZM15.61 6.87a1.533 1.533 0 1 1 0 3.064 1.533 1.533 0 0 1 0-3.065Z" fill="currentColor"/></svg>
        <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M17.611 3.5A4.89 4.89 0 0 1 22.5 8.389v7.222a4.889 4.889 0 0 1-4.889 4.889H6.39a4.889 4.889 0 0 1-4.889-4.889V8.389A4.89 4.89 0 0 1 6.39 3.5h11.22Zm0 2H6.39A2.889 2.889 0 0 0 3.5 8.389v7.222A2.89 2.89 0 0 0 6.389 18.5h11.222a2.889 2.889 0 0 0 2.889-2.889V8.389A2.889 2.889 0 0 0 17.611 5.5Zm-6.857 3.697c.32-.036.712.183 1.495.621l1.28.717c.815.456 1.222.684 1.358.985a1 1 0 0 1 0 .823c-.136.301-.543.529-1.358.985l-1.28.717c-.783.438-1.175.657-1.495.621a1.002 1.002 0 0 1-.698-.41c-.189-.261-.189-.71-.189-1.607v-1.434c0-.897 0-1.346.189-1.608a1 1 0 0 1 .698-.409Z" fill="currentColor"/></svg>
      </span>
      <span class="select-value">{{ currentMode?.label }}</span>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" class="select-arrow" :class="{ rotated: showMenu }"><path d="M21.01 7.982A1.2 1.2 0 0 1 21 9.679l-8.156 8.06a1.2 1.2 0 0 1-1.688 0L3 9.68a1.2 1.2 0 0 1 1.687-1.707L12 15.199l7.313-7.227a1.2 1.2 0 0 1 1.697.01Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"/></svg>
    </div>
    
    <Transition name="mode-menu">
      <div v-if="showMenu" class="mode-dropdown">
        <div class="mode-dropdown-header">创作类型</div>
        <div 
          v-for="mode in options" 
          :key="mode.id" 
          class="mode-option" 
          :class="{ selected: modelValue === mode.id }" 
          @mousedown.prevent="selectMode(mode.id)"
        >
          <span class="mode-option-icon">
            <svg v-if="mode.icon === 'agent'" width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M11.805 5.786c1.25-.926 2.193-1.373 2.471-1.096.489.488-1.261 3.03-3.909 5.677-4.33 4.331-6.715 8.968-5.326 10.358.29.29.723.416 1.264.394.421.017.92-.07 1.48-.249-2.117.9-3.859 1.005-4.76.104-1.874-1.874.61-7.402 5.553-12.353l.022-.02c.03-.032.062-.063.093-.094l.065-.064.11-.108c.97-.95 1.96-1.804 2.937-2.549Zm5.55 11.57c1.532-1.531 3.2-2.347 3.725-1.822.525.525-.29 2.192-1.822 3.724-1.532 1.531-3.2 2.347-3.725 1.822-.524-.525.291-2.192 1.822-3.724ZM16.217 3.13c2.116-.9 3.858-1.005 4.759-.105 1.874 1.875-.612 7.402-5.554 12.353l-.022.021c-.03.032-.062.062-.093.093l-.064.065-.11.108c-.97.949-1.96 1.803-2.938 2.548-1.25.926-2.193 1.374-2.471 1.096-.489-.487 1.262-3.029 3.91-5.676 4.331-4.332 6.715-8.97 5.325-10.36-.29-.29-.722-.414-1.263-.392-.421-.017-.92.069-1.48.249ZM4.742 4.74C6.274 3.21 7.94 2.394 8.466 2.92c.525.525-.29 2.193-1.822 3.724C5.112 8.175 3.445 8.99 2.92 8.466c-.525-.525.29-2.193 1.822-3.725Z" fill="currentColor"/></svg>
            <svg v-else-if="mode.icon === 'image'" width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M16.326 2.75a4.924 4.924 0 0 1 4.924 4.924v8.652a4.924 4.924 0 0 1-4.924 4.924H7.674a4.924 4.924 0 0 1-4.924-4.924V7.674A4.924 4.924 0 0 1 7.674 2.75h8.652Zm0 1.97H7.674A2.954 2.954 0 0 0 4.72 7.674v8.652c0 .055 0 .109.004.162l3.508-3.508a2.955 2.955 0 0 1 4.178 0l3.508 3.508c.004-.053.004-.107.004-.162V7.674a2.954 2.954 0 0 0-2.954-2.954h.358ZM15.61 6.87a1.533 1.533 0 1 1 0 3.064 1.533 1.533 0 0 1 0-3.065Z" fill="currentColor"/></svg>
            <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M17.611 3.5A4.89 4.89 0 0 1 22.5 8.389v7.222a4.889 4.889 0 0 1-4.889 4.889H6.39a4.889 4.889 0 0 1-4.889-4.889V8.389A4.89 4.89 0 0 1 6.39 3.5h11.22Zm0 2H6.39A2.889 2.889 0 0 0 3.5 8.389v7.222A2.89 2.89 0 0 0 6.389 18.5h11.222a2.889 2.889 0 0 0 2.889-2.889V8.389A2.889 2.889 0 0 0 17.611 5.5Zm-6.857 3.697c.32-.036.712.183 1.495.621l1.28.717c.815.456 1.222.684 1.358.985a1 1 0 0 1 0 .823c-.136.301-.543.529-1.358.985l-1.28.717c-.783.438-1.175.657-1.495.621a1.002 1.002 0 0 1-.698-.41c-.189-.261-.189-.71-.189-1.607v-1.434c0-.897 0-1.346.189-1.608a1 1 0 0 1 .698-.409Z" fill="currentColor"/></svg>
          </span>
          <span class="mode-option-label">{{ mode.label }}</span>
          <svg v-if="modelValue === mode.id" class="mode-check" width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5L20 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.mode-select {
  position: relative;
}

.select-trigger {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 10px;
  border-radius: 8px;
  background: var(--bg-block-primary-default);
  border: none;
  color: var(--text-primary);
  font-size: 13px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.select-trigger:hover,
.select-trigger.active {
  background: var(--bg-block-primary-hover);
}

.select-option-icon {
  display: flex;
  align-items: center;
  color: var(--brand-main-default);
}

.select-value {
  font-weight: 400;
  white-space: nowrap;
}

.select-arrow {
  color: var(--text-tertiary);
  margin-left: 2px;
  transition: transform 0.2s;
}

.select-arrow.rotated {
  transform: rotate(180deg);
}

/* 模式下拉菜单 */
.mode-dropdown {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 0;
  min-width: 180px;
  padding: 8px;
  background: var(--menu-bg, #1a1a1a);
  border: 1px solid var(--menu-border, rgba(255, 255, 255, 0.08));
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  z-index: 1001;
  -webkit-backdrop-filter: blur(60px);
  backdrop-filter: blur(60px);
}

.mode-dropdown-header {
  padding: 8px 12px 12px;
  font-size: 12px;
  color: var(--text-tertiary);
}

.mode-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.15s;
}

.mode-option:hover {
  background: var(--menu-item-hover, rgba(255, 255, 255, 0.06));
}

.mode-option-icon {
  display: flex;
  align-items: center;
  color: var(--text-primary);
}

.mode-option.selected .mode-option-icon {
  color: var(--brand-main-default);
}

.mode-option-label {
  flex: 1;
}

.mode-check {
  color: var(--text-primary);
  flex-shrink: 0;
}

/* 模式菜单动画 */
.mode-menu-enter-active {
  animation: mode-menu-in 0.2s ease-out;
}

.mode-menu-leave-active {
  animation: mode-menu-in 0.15s ease-in reverse;
}

@keyframes mode-menu-in {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
