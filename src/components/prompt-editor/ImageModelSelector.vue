<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    required: true
  },
  options: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue'])

const showMenu = ref(false)
const menuRef = ref(null)

// 获取当前选中的模型
const currentModel = computed(() => {
  return props.options.find(m => m.id === props.modelValue)
})

// 切换菜单
const toggleMenu = (e) => {
  e.stopPropagation()
  showMenu.value = !showMenu.value
}

// 选择模型
const selectModel = (modelId) => {
  emit('update:modelValue', modelId)
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
  <div class="model-select" ref="menuRef">
    <button 
      class="toolbar-button with-text with-icon model-trigger" 
      :class="{ active: showMenu }" 
      type="button" 
      @click.stop="toggleMenu"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <span>{{ currentModel?.label }}</span>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" class="dropdown-arrow" :class="{ rotated: showMenu }">
        <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
    
    <!-- 模型选择下拉菜单 -->
    <Transition name="model-menu">
      <div v-if="showMenu" class="model-dropdown">
        <div class="model-dropdown-header">
          选择模型：{{ currentModel?.label }} by {{ currentModel?.seedreamVersion }}
        </div>
        <div class="model-list">
          <div 
            v-for="model in options" 
            :key="model.id"
            class="model-option"
            :class="{ selected: modelValue === model.id }"
            @mousedown.prevent="selectModel(model.id)"
          >
            <div class="model-thumbnail">
              <img :src="model.thumbnail" :alt="model.label" />
              <div class="model-version-wrapper">
                <span class="model-version">{{ model.displayVersion }}</span>
                <span v-if="model.versionSuffix" class="model-version-suffix">{{ model.versionSuffix }}</span>
              </div>
            </div>
            <div class="model-info">
              <div class="model-name">
                {{ model.label }}
                <span v-if="model.isNew" class="model-badge">New</span>
              </div>
              <div class="model-description">{{ model.description }}</div>
            </div>
            <svg v-if="modelValue === model.id" class="model-check" width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M5 12l5 5L20 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* 模型选择器 */
.model-select {
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

.model-trigger.active {
  background: var(--bg-block-primary-pressed, rgba(255, 255, 255, 0.12));
}

.dropdown-arrow {
  margin-left: 2px;
  opacity: 0.6;
  transition: transform 0.2s ease;
}

.dropdown-arrow.rotated {
  transform: rotate(180deg);
}

/* 模型下拉菜单 */
.model-dropdown {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 0;
  min-width: 520px;
  background: var(--bg-float, #1a1a1a);
  border: 1px solid var(--stroke-tertiary, rgba(255, 255, 255, 0.08));
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  z-index: 1000;
  overflow: hidden;
}

.model-dropdown-header {
  padding: 16px 20px;
  color: var(--text-secondary);
  font-size: 13px;
  border-bottom: 1px solid var(--stroke-tertiary, rgba(255, 255, 255, 0.06));
}

.model-list {
  max-height: 420px;
  overflow-y: auto;
  padding: 8px;
}

.model-option {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px;
  border-radius: 12px;
  cursor: pointer;
  transition: background-color 0.15s;
  border: 1px solid transparent;
}

.model-option:hover {
  background: var(--bg-block-primary-hover, rgba(255, 255, 255, 0.06));
}

.model-option.selected {
  background: transparent;
}

.model-thumbnail {
  position: relative;
  width: 64px;
  height: 64px;
  border-radius: 14px;
  overflow: hidden;
  flex-shrink: 0;
  background: linear-gradient(135deg, #0d6b7a 0%, #0a4650 100%);
}

.model-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.model-version-wrapper {
  position: absolute;
  bottom: 6px;
  left: 8px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0;
}

.model-version {
  font-size: 24px;
  font-weight: 700;
  color: white;
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.6);
  line-height: 1;
}

.model-version-suffix {
  font-size: 10px;
  font-weight: 600;
  color: white;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.model-info {
  flex: 1;
  min-width: 0;
}

.model-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.model-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 6px;
  border-radius: 4px;
  background: linear-gradient(90deg, #00b8d4 0%, #26c6da 100%);
  color: white;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
}

.model-description {
  font-size: 13px;
  color: var(--text-tertiary);
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.model-check {
  flex-shrink: 0;
  color: var(--text-primary);
}

/* 模型菜单动画 */
.model-menu-enter-active,
.model-menu-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.model-menu-enter-from,
.model-menu-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
