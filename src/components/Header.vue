<script setup>
import { ref, watch, onMounted, onUnmounted, computed } from 'vue'
import SettingsModal from './SettingsModal.vue'

const props = defineProps({
  title: {
    type: String,
    default: '未命名项目'
  }
})

const emit = defineEmits(['update:title', 'toggle-panel'])

const isEditing = ref(false)
const editTitle = ref(props.title)
const showMenu = ref(false)
const menuRef = ref(null)
const showSettingsModal = ref(false)
const projectDescription = ref('')

// 主题模式: 'light' | 'dark' | 'system'
const themeMode = ref(localStorage.getItem('theme-mode') || 'dark')
const showThemeSubmenu = ref(false)

// 获取系统主题
const getSystemTheme = () => {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

// 当前实际主题
const currentTheme = computed(() => {
  if (themeMode.value === 'system') {
    return getSystemTheme()
  }
  return themeMode.value
})

// 主题显示文本
const themeLabel = computed(() => {
  const labels = { light: '浅色模式', dark: '深色模式', system: '跟随系统' }
  return labels[themeMode.value]
})

// 应用主题
const applyTheme = (theme) => {
  document.documentElement.setAttribute('data-theme', theme)
}

// 切换主题
const setTheme = (mode) => {
  themeMode.value = mode
  localStorage.setItem('theme-mode', mode)
  applyTheme(currentTheme.value)
  showThemeSubmenu.value = false
  showMenu.value = false
}

// 监听系统主题变化
const handleSystemThemeChange = (e) => {
  if (themeMode.value === 'system') {
    applyTheme(e.matches ? 'dark' : 'light')
  }
}

watch(() => props.title, (val) => {
  editTitle.value = val
})

const startEdit = () => {
  isEditing.value = true
}

const saveTitle = () => {
  isEditing.value = false
  if (editTitle.value.trim()) {
    emit('update:title', editTitle.value.trim())
  } else {
    editTitle.value = props.title
  }
}

const handleKeydown = (e) => {
  if (e.key === 'Enter') saveTitle()
  else if (e.key === 'Escape') {
    editTitle.value = props.title
    isEditing.value = false
  }
}

const toggleMenu = () => {
  showMenu.value = !showMenu.value
}

const closeMenu = (e) => {
  if (showMenu.value && menuRef.value && !menuRef.value.contains(e.target)) {
    showMenu.value = false
  }
}

const handleMenuClick = (action) => {
  showMenu.value = false
  if (action === 'settings') {
    showSettingsModal.value = true
  } else {
    console.log('Menu action:', action)
  }
}

const handleSettingsSave = (data) => {
  if (data.title.trim()) {
    emit('update:title', data.title.trim())
  }
  projectDescription.value = data.description
}

onMounted(() => {
  document.addEventListener('mousedown', closeMenu)
  // 初始化主题
  applyTheme(currentTheme.value)
  // 监听系统主题变化
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', handleSystemThemeChange)
})

onUnmounted(() => {
  document.removeEventListener('mousedown', closeMenu)
  window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', handleSystemThemeChange)
})
</script>

<template>
  <header class="header">
    <!-- 左侧 -->
    <div class="top-bar-left">
      <div class="top-bar-left-inner">
        <button class="back-button" type="button">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M18.104 14.462c-1.359 2.008-2.203 4.3-1.87 6.566a.723.723 0 0 1-.397.76.747.747 0 0 1-.852-.162c-1.603-1.683-3.903-2.463-6.301-2.643a26.536 26.536 0 0 0 5.107-1.877 26.004 26.004 0 0 0 4.316-2.647l-.003.003ZM6.339 2.258a.575.575 0 0 1 .732.202c3.953 5.991 8.172 7.646 13.622 6.642a.931.931 0 0 1 .997.496c.415.832-.438 1.344-.964 1.832-1.485 1.198-4.25 2.932-7.573 4.553-3.326 1.621-6.397 2.734-8.251 3.166-.402.063-.808.188-1.216.202-.81-.054-1.2-1.119-.583-1.669C7.235 14.016 8.323 9.77 6.047 2.96a.574.574 0 0 1 .292-.701Z" fill="currentColor"/>
          </svg>
        </button>
        
        <div class="title-container">
          <div v-if="!isEditing" class="title" @click="startEdit" :title="title">{{ title }}</div>
          <input
            v-else
            v-model="editTitle"
            class="title-input"
            @blur="saveTitle"
            @keydown="handleKeydown"
            autofocus
          />
        </div>
        
        <div class="menu-trigger" ref="menuRef">
          <button class="back-button" type="button" @click.stop="toggleMenu">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M5 6.3a1.2 1.2 0 0 0 0 2.4h14a1.2 1.2 0 1 0 0-2.4H5Zm0 9a1.2 1.2 0 0 0 0 2.4h8a1.2 1.2 0 1 0 0-2.4H5Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"/>
            </svg>
          </button>
          
          <!-- 下拉菜单 -->
          <Transition name="menu">
            <div v-if="showMenu" class="dropdown-menu">
              <!-- 项目设定 -->
              <div class="menu-item" @click="handleMenuClick('settings')">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="currentColor" stroke-width="2"/>
                  <path d="M12 4v1m0 14v1m8-8h-1M5 12H4m15.07-5.07-.707.707M5.636 18.364l-.707.707m14.142 0-.707-.707M5.636 5.636l-.707-.707" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
                <span>项目设定</span>
              </div>
              <div class="menu-divider"></div>
              <!-- 新建项目 -->
              <div class="menu-item" @click="handleMenuClick('new')">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M4 5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5Zm10 0a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1V5ZM4 15a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-4Zm13-1a1 1 0 0 1 1 1v2h2a1 1 0 1 1 0 2h-2v2a1 1 0 1 1-2 0v-2h-2a1 1 0 1 1 0-2h2v-2a1 1 0 0 1 1-1Z" fill="currentColor"/>
                </svg>
                <span>新建项目</span>
              </div>
              <!-- 深色模式 -->
              <div 
                class="menu-item has-submenu" 
                @mouseenter="showThemeSubmenu = true"
                @mouseleave="showThemeSubmenu = false"
              >
                <!-- 根据当前主题显示不同图标 -->
                <svg v-if="themeMode === 'light'" width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="2"/>
                  <path d="M12 2v2m0 16v2M4 12H2m20 0h-2m-2.93-7.07l-1.41 1.41m-9.32 9.32l-1.41 1.41m0-12.14l1.41 1.41m9.32 9.32l1.41 1.41" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
                <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span>{{ themeLabel }}</span>
                <svg class="chevron" width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                
                <!-- 主题子菜单 -->
                <Transition name="submenu">
                  <div v-if="showThemeSubmenu" class="theme-submenu" @click.stop>
                    <!-- 浅色模式 -->
                    <div class="menu-item" @click="setTheme('light')">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="2"/>
                        <path d="M12 2v2m0 16v2M4 12H2m20 0h-2m-2.93-7.07l-1.41 1.41m-9.32 9.32l-1.41 1.41m0-12.14l1.41 1.41m9.32 9.32l1.41 1.41" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                      </svg>
                      <span>浅色模式</span>
                      <svg v-if="themeMode === 'light'" class="check" width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M5 12l5 5L20 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </div>
                    <!-- 深色模式 -->
                    <div class="menu-item" @click="setTheme('dark')">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                      <span>深色模式</span>
                      <svg v-if="themeMode === 'dark'" class="check" width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M5 12l5 5L20 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </div>
                    <!-- 跟随系统 -->
                    <div class="menu-item" @click="setTheme('system')">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <rect x="2" y="4" width="20" height="14" rx="2" stroke="currentColor" stroke-width="2"/>
                        <path d="M8 21h8m-4-3v3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                      </svg>
                      <span>跟随系统 · {{ getSystemTheme() === 'dark' ? '深色' : '浅色' }}</span>
                      <svg v-if="themeMode === 'system'" class="check" width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M5 12l5 5L20 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </div>
                  </div>
                </Transition>
              </div>
              <!-- 回到画布首页 -->
              <!-- <div class="menu-item" @click="handleMenuClick('home')">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M9 14L4 9l5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v.5a5.5 5.5 0 0 1-5.5 5.5H12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span>回到画布首页</span>
              </div> -->
            </div>
          </Transition>
        </div>
      </div>
    </div>
    
    <!-- 右侧 -->
    <div class="top-bar-right">
      <div class="top-bar-right-inner">
        <!-- 积分显示 -->
        <div class="credit-display">
          <div class="credit-display-container">
            <div class="credit-amount-container">
              <svg width="12" height="12" viewBox="0 0 25 24" fill="none">
                <path fill="currentColor" d="M22.044 12.695a.77.77 0 0 0-.596-.734c-4.688-1.152-7.18-3.92-7.986-9.924l-.006-.033a.573.573 0 0 0-1.137 0l-.007.033c-.805 6.004-3.298 8.772-7.986 9.924a.77.77 0 0 0-.596.734v.033a.82.82 0 0 0 .625.796c3.3.859 6.851 2.872 7.9 6.022.086.26.332.443.613.454h.037a.67.67 0 0 0 .614-.454c1.048-3.15 4.598-5.163 7.9-6.021a.82.82 0 0 0 .625-.797z"/>
              </svg>
              <div class="credit-amount-text">48</div>
            </div>
            <div class="divider"></div>
            <div class="upgrade-text">1元会员</div>
          </div>
        </div>
        
        <!-- 分享按钮 -->
        <button class="share-button" type="button">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M10.537 4.875c0-1.62 1.92-2.475 3.124-1.391l7.493 6.744c.806.725.806 1.99 0 2.715l-7.493 6.743c-1.205 1.084-3.123.23-3.123-1.39v-2.04a8.023 8.023 0 0 0-5.349 2.633 1.833 1.833 0 0 1-1.971.505A1.794 1.794 0 0 1 2 17.69v-.101c0-5.242 3.644-9.63 8.537-10.773V4.875Zm2.28.467a.2.2 0 0 0-.334.148v1.96a1.17 1.17 0 0 1-.973 1.153 9.12 9.12 0 0 0-7.562 8.762 9.969 9.969 0 0 1 7.397-3.076 1.164 1.164 0 0 1 1.138 1.165v2.226a.2.2 0 0 0 .334.149l6.937-6.244-6.937-6.243Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"/>
          </svg>
        </button>
        
        <!-- 对话按钮 -->
        <div class="open-conversation">
          <button class="conversation-button" type="button" @click="emit('toggle-panel')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M17.5 3A4.5 4.5 0 0 1 22 7.5v7a4.5 4.5 0 0 1-4.5 4.5h-5.028a1 1 0 0 0-.542.16l-4.152 2.68A1 1 0 0 1 6.236 21v-2.009A4.5 4.5 0 0 1 2 14.5v-7A4.5 4.5 0 0 1 6.5 3h11Zm-11 2A2.5 2.5 0 0 0 4 7.5v7A2.5 2.5 0 0 0 6.5 17h.736a1 1 0 0 1 1 1v1.163l2.609-1.683a3 3 0 0 1 1.627-.48H17.5a2.5 2.5 0 0 0 2.5-2.5v-7A2.5 2.5 0 0 0 17.5 5h-11Z" fill="currentColor"/>
            </svg>
            <span>对话</span>
          </button>
        </div>
      </div>
    </div>
  </header>
  
  <!-- 项目设定弹窗 -->
  <SettingsModal 
    v-model:visible="showSettingsModal"
    :title="title"
    :description="projectDescription"
    @save="handleSettingsSave"
  />
</template>

<style scoped>
.header {
  height: 60px;
  justify-content: space-between;
  left: 0;
  padding: 0 12px;
  pointer-events: none;
  right: 0;
  top: 0;
  z-index: 100;
  align-items: center;
  display: flex;
  position: absolute;
}

.top-bar-left {
  align-items: center;
  display: flex;
  position: absolute;
  -webkit-backdrop-filter: blur(var(--canvas-float-backdrop-blur));
  backdrop-filter: blur(var(--canvas-float-backdrop-blur));
  background: var(--canvas-bg-block-default);
  border-radius: 8px;
  height: 36px;
  left: 12px;
  pointer-events: auto;
}

.top-bar-left-inner {
  display: flex;
  align-items: center;
  padding: 0 4px;
  gap: 4px;
}

.back-button {
  align-items: center;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: var(--text-primary);
  cursor: pointer;
  display: flex;
  height: 28px;
  justify-content: center;
  padding: 6px;
  transition: background-color 0.2s;
  width: 28px;
}

.back-button:hover {
  background: var(--bg-block-primary-hover);
}

.menu-trigger {
  position: relative;
}

.title-container {
  max-width: 200px;
}

.title {
  color: var(--text-primary);
  cursor: pointer;
  font-size: 13px;
  font-weight: 400;
  line-height: 20px;
  overflow: hidden;
  padding: 0 8px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.title-input {
  background: var(--bg-block-primary-default);
  border: 1px solid var(--stroke-focus);
  border-radius: 4px;
  color: var(--text-primary);
  font-size: 13px;
  padding: 4px 8px;
  width: 180px;
}

.top-bar-right {
  align-items: center;
  display: flex;
  pointer-events: auto;
  position: absolute;
  right: 12px;
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.top-bar-right-inner {
  display: flex;
  align-items: center;
  gap: 8px;
}

.credit-display {
  -webkit-backdrop-filter: blur(var(--canvas-float-backdrop-blur));
  backdrop-filter: blur(var(--canvas-float-backdrop-blur));
  background: var(--canvas-bg-block-default);
  border-radius: 8px;
}

.credit-display-container {
  align-items: center;
  display: flex;
  padding: 8px 12px;
  gap: 8px;
}

.credit-amount-container {
  align-items: center;
  display: flex;
  gap: 4px;
  color: var(--text-primary);
}

.credit-amount-text {
  font-family: Montserrat, sans-serif;
  font-size: 13px;
  font-weight: 500;
}

.divider {
  background: var(--stroke-secondary);
  height: 12px;
  width: 1px;
}

.upgrade-text {
  color: var(--brand-main-default);
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
}

.share-button {
  -webkit-backdrop-filter: blur(var(--canvas-float-backdrop-blur));
  backdrop-filter: blur(var(--canvas-float-backdrop-blur));
  align-items: center;
  background: var(--canvas-bg-block-default);
  border: none;
  border-radius: 8px;
  color: var(--text-primary);
  cursor: pointer;
  display: flex;
  height: 36px;
  justify-content: center;
  padding: 0 12px;
  transition: background-color 0.2s;
}

.share-button:hover {
  background: var(--bg-block-primary-hover);
}

.conversation-button {
  -webkit-backdrop-filter: blur(var(--canvas-float-backdrop-blur));
  backdrop-filter: blur(var(--canvas-float-backdrop-blur));
  align-items: center;
  background: var(--canvas-bg-block-default);
  border: none;
  border-radius: 8px;
  color: var(--text-primary);
  cursor: pointer;
  display: flex;
  font-size: 13px;
  gap: 6px;
  height: 36px;
  padding: 0 12px;
  transition: background-color 0.2s;
}

.conversation-button:hover {
  background: var(--bg-block-primary-hover);
}

/* 下拉菜单 */
.dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  left: -120px;
  min-width: 180px;
  padding: 8px;
  background: var(--menu-bg);
  backdrop-filter: blur(20px);
  border: 1px solid var(--menu-border);
  border-radius: 12px;
  box-shadow: var(--menu-shadow);
  z-index: 1000;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.15s;
  position: relative;
}

.menu-item:hover {
  background: var(--menu-item-hover);
}

.menu-item svg {
  flex-shrink: 0;
  opacity: 0.9;
}

.menu-item.has-submenu {
  justify-content: flex-start;
}

.menu-item .chevron {
  margin-left: auto;
  opacity: 0.4;
}

.menu-item .check {
  margin-left: auto;
  color: var(--brand-main-default);
}

.menu-divider {
  height: 1px;
  margin: 6px 12px;
  background: var(--menu-border);
}

/* 主题子菜单 */
.theme-submenu {
  position: absolute;
  left: calc(100% + 8px);
  top: -8px;
  min-width: 200px;
  padding: 8px;
  background: var(--menu-bg);
  backdrop-filter: blur(20px);
  border: 1px solid var(--menu-border);
  border-radius: 12px;
  box-shadow: var(--menu-shadow);
}

/* 子菜单动画 */
.submenu-enter-active {
  animation: submenu-in 0.15s ease-out;
}

.submenu-leave-active {
  animation: submenu-in 0.1s ease-in reverse;
}

@keyframes submenu-in {
  from {
    opacity: 0;
    transform: translateX(-8px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* 菜单动画 */
.menu-enter-active {
  animation: menu-in 0.2s ease-out;
}

.menu-leave-active {
  animation: menu-in 0.15s ease-in reverse;
}

@keyframes menu-in {
  from {
    opacity: 0;
    transform: translateY(-8px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
