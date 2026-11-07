<template>
  <div class="section-generator admin-theme-front-home-preview">
    <div class="home-header admin-theme-front-home-preview__header">
      <div
        class="admin-theme-front-home-preview__block admin-theme-front-home-preview__block--header-bg"
        :class="{
          'is-hidden-block': workbenchSettings.headerBackgroundEnabled === false,
        }"
      >
        <HomeHeaderTopBackground
          v-if="workbenchSettings.headerBackgroundEnabled !== false
            && (workbenchSettings.headerBackgroundGlowEnabled !== false
              || workbenchSettings.headerBackgroundStarEnabled !== false)"
          :image-url="headerBackgroundImageUrl"
          :glow-color="headerBackgroundGlowColor"
          :glow-opacity="headerBackgroundGlowOpacity"
          :glow-enabled="workbenchSettings.headerBackgroundGlowEnabled !== false"
          :star-enabled="workbenchSettings.headerBackgroundStarEnabled !== false"
          :star-color="headerBackgroundStarColor"
        />
        <!-- 常显入口：顶背景层本身 pointer-events 关闭，hover 浮层不易发现 -->
        <div class="admin-theme-front-home-preview__header-bg-toolbar">
          <span class="admin-theme-front-home-preview__header-bg-label">创作区背景</span>
          <AdminThemeWorkbenchItemActions
            :visible="workbenchSettings.headerBackgroundEnabled !== false"
            :action-keys="['edit', 'visible']"
            @action="handleBlockAction($event, 'header-background')"
          />
        </div>
      </div>
      <div
        v-if="showTitleBlock"
        class="admin-theme-front-home-preview__block admin-theme-front-home-preview__block--title"
        :class="{
          'is-hidden-block': !workbenchSettings.titleEnabled,
          'is-theme-linked-active': activeThemeSectionId === 'theme-section-action',
          'is-theme-field-active': activeThemeFieldId === 'accent',
        }"
        @click.stop="emit('theme-section-select', 'theme-section-action')"
      >
        <div class="header-bto0dS">
          <template v-if="showSiteNameInTitle">{{ siteNamePrefix }}</template>
          {{ workbenchPrefixText }}
          <TypeSelector
            v-if="showModeSelectorInTitle"
            :current-label="currentModeLabel"
            :options="modeOptions"
          />
          <span
            v-else-if="currentModeLabel"
            class="admin-theme-front-home-preview__type-chip"
          >
            {{ currentModeLabel }}
          </span>
          {{ workbenchSuffixText }}
        </div>
        <div
          v-if="activeThemeFieldId === 'accent'"
          class="admin-theme-front-home-preview__field-hotspot admin-theme-front-home-preview__field-hotspot--accent"
        ></div>

        <div class="admin-theme-front-home-preview__row-actions">
          <AdminThemeWorkbenchItemActions
            :visible="workbenchSettings.titleEnabled"
            :action-keys="['edit', 'visible']"
            @action="handleBlockAction($event, 'title')"
          />
        </div>
      </div>

      <div
        v-if="showGeneratorBlock"
        class="admin-theme-front-home-preview__block admin-theme-front-home-preview__block--generator"
        :class="{
          'is-hidden-block': !workbenchSettings.generatorEnabled,
          'is-theme-linked-active': activeThemeSectionId === 'theme-section-action',
          'is-theme-field-active': isPrimaryFieldActive,
        }"
        @click.stop="emit('theme-section-select', 'theme-section-action')"
      >
        <div class="admin-theme-front-home-preview__generator-mask">
          <GenerateContentGenerator
            class="home-header-content-generator"
            :collapsible="false"
            :default-expanded="true"
            popup-placement="bottom"
          />
        </div>

        <div
          v-if="showSiteDescription && siteDescription"
          class="home-header-site-description-canana"
        >
          {{ siteDescription }}
        </div>
        <div
          v-if="isPrimaryFieldActive"
          class="admin-theme-front-home-preview__field-hotspot admin-theme-front-home-preview__field-hotspot--primary"
        ></div>

        <div class="admin-theme-front-home-preview__row-actions admin-theme-front-home-preview__row-actions--generator">
          <AdminThemeWorkbenchItemActions
            :visible="workbenchSettings.generatorEnabled"
            :action-keys="['edit', 'visible']"
            @action="handleBlockAction($event, 'generator')"
          />
        </div>
      </div>

      <div
        v-if="showTaskBlock"
        class="admin-theme-front-home-preview__block admin-theme-front-home-preview__block--task"
        :class="{
          'is-hidden-block': !workbenchSettings.taskIndicatorEnabled,
          'is-theme-linked-active': activeThemeSectionId === 'theme-section-status',
          'is-theme-field-active': isStatusFieldActive,
        }"
        @click.stop="emit('theme-section-select', 'theme-section-status')"
      >
        <div class="admin-theme-front-home-preview__task-indicator-mask">
          <TaskIndicator />
        </div>
        <div
          v-if="isStatusFieldActive"
          class="admin-theme-front-home-preview__field-hotspot"
          :class="`admin-theme-front-home-preview__field-hotspot--${activeThemeFieldId}`"
        ></div>

        <div class="admin-theme-front-home-preview__row-actions admin-theme-front-home-preview__row-actions--task">
          <AdminThemeWorkbenchItemActions
            :visible="workbenchSettings.taskIndicatorEnabled"
            :action-keys="['edit', 'visible']"
            @action="handleBlockAction($event, 'task-indicator')"
          />
        </div>
      </div>

      <div
        v-if="showBannerBlock"
        class="admin-theme-front-home-preview__block admin-theme-front-home-preview__block--banner"
        :class="{
          'is-hidden-block': !workbenchSettings.bannerEnabled,
          'is-theme-linked-active': activeThemeSectionId === 'theme-section-banner',
          'is-theme-field-active': isBannerFieldActive,
        }"
        @click.stop="emit('theme-section-select', 'theme-section-banner')"
      >
        <div
          class="admin-theme-front-home-preview__banner-stage"
          :class="{
            'is-gradient-linked': activeThemeFieldId === 'primaryGradient',
            'is-glow-linked': activeThemeFieldId === 'bannerGlow',
          }"
        >
          <HomeBanner
            :banner-items-override="previewBannerItems"
            :disable-navigation="true"
            :preview-show-hidden="true"
          />

          <div
            class="admin-theme-front-home-preview__banner-overlay"
            :style="bannerOverlayStyle"
          >
            <div
              v-for="item in previewBannerItems"
              :key="item.key"
              class="admin-theme-front-home-preview__banner-shell"
              :class="{
                'is-hidden-item': !item.visible,
                'is-drag-armed': dragArmedBannerKey === item.key,
                'is-dragging': draggingBannerKey === item.key,
                'is-drop-target': dropTargetBannerKey === item.key,
                'is-drop-before': dropTargetBannerKey === item.key && dropPosition === 'before',
                'is-drop-after': dropTargetBannerKey === item.key && dropPosition === 'after',
                'is-settling': settlingBannerKey === item.key,
              }"
              :data-banner-key="item.key"
            >
              <div class="admin-theme-front-home-preview__banner-actions">
                <AdminThemeWorkbenchItemActions
                  :visible="item.visible"
                  :sort-armed="dragArmedBannerKey === item.key"
                  :action-keys="['edit', 'visible', 'sort']"
                  @sort-press="handleBannerSortPress($event, item.key)"
                  @action="handleBannerAction($event, item.key)"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="admin-theme-front-home-preview__row-actions admin-theme-front-home-preview__row-actions--banner">
          <AdminThemeWorkbenchItemActions
            :visible="workbenchSettings.bannerEnabled"
            :action-keys="['visible']"
            @action="handleBlockAction($event, 'banner')"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import GenerateContentGenerator from '@/components/generate/ContentGenerator.vue'
import HomeBanner from '@/components/home/components/HomeBanner.vue'
import HomeHeaderTopBackground from '@/components/home/components/HomeHeaderTopBackground.vue'
import TaskIndicator from '@/components/home/components/TaskIndicator.vue'
import TypeSelector from '@/components/home/components/TypeSelector.vue'
import AdminThemeWorkbenchItemActions, { type WorkbenchMenuActionKey } from './AdminThemeWorkbenchItemActions.vue'
import type { SystemConfigPayload, SystemHomeBannerItemConfig } from '@/api/system-config'
import '@/components/home/components/home-header-create-layout.css'

export type WorkbenchContentBlockKey =
  | 'header-background'
  | 'title'
  | 'generator'
  | 'task-indicator'
  | 'banner'

type BannerReorderPayload = {
  sourceBannerKey: string
  targetBannerKey: string
  position: 'before' | 'after'
}

const props = withDefaults(defineProps<{
  systemForm: SystemConfigPayload
  previewBannerItems: SystemHomeBannerItemConfig[]
  /** 工作台画布明暗；优先于 body，避免后台浅色壳把深色预览背景图/文案配错 */
  previewIsLight?: boolean
  activeThemeSectionId: string | null
  activeThemeFieldId: string | null
}>(), {
  previewIsLight: undefined,
})

const emit = defineEmits<{
  'block-action': [payload: { action: WorkbenchMenuActionKey, blockKey: WorkbenchContentBlockKey }]
  'banner-item-action': [payload: { action: WorkbenchMenuActionKey, bannerKey: string }]
  'banner-item-reorder': [payload: BannerReorderPayload]
  'theme-section-select': [sectionId: string]
}>()

const workbenchSettings = computed(() => props.systemForm.conversationSettings.entryDisplay.workbench)

const previewIsLight = computed(() => {
  if (typeof props.previewIsLight === 'boolean') {
    return props.previewIsLight
  }
  if (typeof document === 'undefined') return false
  return document.documentElement.getAttribute('data-theme') === 'light'
    || document.body.getAttribute('lv-theme') === 'light'
})

const headerBackgroundImageUrl = computed(() => (
  previewIsLight.value
    ? String(workbenchSettings.value.headerBackgroundImageUrlLight || '').trim()
    : String(workbenchSettings.value.headerBackgroundImageUrl || '').trim()
))
const headerBackgroundGlowColor = computed(() => (
  previewIsLight.value
    ? workbenchSettings.value.headerBackgroundGlowColorLight
    : workbenchSettings.value.headerBackgroundGlowColor
))
const headerBackgroundGlowOpacity = computed(() => (
  previewIsLight.value
    ? workbenchSettings.value.headerBackgroundGlowOpacityLight
    : workbenchSettings.value.headerBackgroundGlowOpacity
))
const headerBackgroundStarColor = computed(() => (
  previewIsLight.value
    ? workbenchSettings.value.headerBackgroundStarColorLight
    : workbenchSettings.value.headerBackgroundStarColor
))

const siteNamePrefix = computed(() => {
  const siteName = String(props.systemForm.siteInfo.siteName || '').trim()
  return siteName ? `${siteName} · ` : ''
})

const showSiteNameInTitle = computed(() => workbenchSettings.value.showSiteName !== false && !!siteNamePrefix.value)
const workbenchPrefixText = computed(() => String(workbenchSettings.value.prefixText || '').trim() || '开启你的')
const workbenchSuffixText = computed(() => String(workbenchSettings.value.suffixText || '').trim() || '即刻造梦！')
const showModeSelectorInTitle = computed(() => workbenchSettings.value.showModeSelectorInTitle !== false)
const showTitleBlock = computed(() => true)
const showGeneratorBlock = computed(() => true)

const siteDescription = computed(() => String(props.systemForm.siteInfo.siteDescription || '').trim())
const showSiteDescription = computed(() => props.systemForm.homeLayoutSettings.header.showSiteDescription !== false)
const showTaskBlock = computed(() => true)
const showBannerBlock = computed(() => props.previewBannerItems.length > 0)

const modeOptions = computed(() => {
  return (props.systemForm.conversationSettings.entryDisplay.mode.options || [])
    .map(item => String(item.label || '').trim())
    .filter(Boolean)
})

const currentModeLabel = computed(() => {
  const options = props.systemForm.conversationSettings.entryDisplay.mode.options || []
  const defaultMode = String(props.systemForm.conversationSettings.entryDisplay.mode.defaultMode || 'agent').trim()
  return options.find(item => item.value === defaultMode)?.label || options[0]?.label || 'Agent 模式'
})

const isPrimaryFieldActive = computed(() => {
  return ['primary', 'primaryHover', 'primaryActive'].includes(props.activeThemeFieldId || '')
})

const isStatusFieldActive = computed(() => {
  return ['success', 'warning', 'danger'].includes(props.activeThemeFieldId || '')
})

const isBannerFieldActive = computed(() => {
  return ['primaryGradient', 'bannerGlow'].includes(props.activeThemeFieldId || '')
})

const bannerOverlayStyle = computed(() => {
  const itemCount = props.previewBannerItems.length
  return {
    gridTemplateColumns: itemCount <= 1 ? '1fr' : `1.53fr repeat(${Math.max(0, itemCount - 1)}, 1fr)`,
  }
})

const dragArmedBannerKey = ref('')
const draggingBannerKey = ref('')
const dropTargetBannerKey = ref('')
const dropPosition = ref<'before' | 'after'>('before')
const settlingBannerKey = ref('')
const activePointerId = ref<number | null>(null)

const POINTER_DRAG_THRESHOLD = 6

let pointerSession: {
  pointerId: number
  sourceBannerKey: string
  startX: number
  startY: number
  moved: boolean
} | null = null

const clearDropState = () => {
  draggingBannerKey.value = ''
  dropTargetBannerKey.value = ''
  dropPosition.value = 'before'
}

const resetBannerDragState = () => {
  activePointerId.value = null
  pointerSession = null
  dragArmedBannerKey.value = ''
  clearDropState()
}

const handleBlockAction = (action: WorkbenchMenuActionKey, blockKey: WorkbenchContentBlockKey) => {
  emit('block-action', { action, blockKey })
}

const handleBannerAction = (action: WorkbenchMenuActionKey, bannerKey: string) => {
  emit('banner-item-action', { action, bannerKey })
}

const handleBannerSortPress = (event: PointerEvent, bannerKey: string) => {
  event.preventDefault()
  event.stopPropagation()

  if (dragArmedBannerKey.value === bannerKey) {
    finishBannerPointerDrag(false)
    return
  }

  resetBannerDragState()
  dragArmedBannerKey.value = bannerKey
  activePointerId.value = event.pointerId
  pointerSession = {
    pointerId: event.pointerId,
    sourceBannerKey: bannerKey,
    startX: event.clientX,
    startY: event.clientY,
    moved: false,
  }

  window.addEventListener('pointermove', handleBannerPointerMove, true)
  window.addEventListener('pointerup', handleBannerPointerUp, true)
  window.addEventListener('pointercancel', handleBannerPointerCancel, true)
}

const updateBannerDropTarget = (clientX: number, clientY: number) => {
  const target = document.elementFromPoint(clientX, clientY) as HTMLElement | null
  const bannerShell = target?.closest?.('[data-banner-key]') as HTMLElement | null
  if (!bannerShell) {
    dropTargetBannerKey.value = ''
    return
  }

  const targetBannerKey = String(bannerShell.dataset.bannerKey || '').trim()
  if (!targetBannerKey || targetBannerKey === pointerSession?.sourceBannerKey) {
    dropTargetBannerKey.value = ''
    return
  }

  const rect = bannerShell.getBoundingClientRect()
  const isHorizontal = rect.width >= rect.height
  const midpoint = isHorizontal ? rect.left + rect.width / 2 : rect.top + rect.height / 2
  const currentCoord = isHorizontal ? clientX : clientY

  dropTargetBannerKey.value = targetBannerKey
  dropPosition.value = currentCoord < midpoint ? 'before' : 'after'
}

const handleBannerPointerMove = (event: PointerEvent) => {
  if (!pointerSession || event.pointerId !== pointerSession.pointerId) {
    return
  }

  const deltaX = event.clientX - pointerSession.startX
  const deltaY = event.clientY - pointerSession.startY

  if (!pointerSession.moved) {
    if (Math.hypot(deltaX, deltaY) < POINTER_DRAG_THRESHOLD) {
      return
    }
    pointerSession.moved = true
    draggingBannerKey.value = pointerSession.sourceBannerKey
  }

  updateBannerDropTarget(event.clientX, event.clientY)
}

const finishBannerPointerDrag = (shouldCommit: boolean) => {
  const sourceBannerKey = pointerSession?.sourceBannerKey || ''
  const targetBannerKey = dropTargetBannerKey.value
  const position = dropPosition.value

  window.removeEventListener('pointermove', handleBannerPointerMove, true)
  window.removeEventListener('pointerup', handleBannerPointerUp, true)
  window.removeEventListener('pointercancel', handleBannerPointerCancel, true)

  const shouldReorder = Boolean(
    shouldCommit
    && pointerSession?.moved
    && sourceBannerKey
    && targetBannerKey
    && sourceBannerKey !== targetBannerKey,
  )

  if (shouldReorder) {
    settlingBannerKey.value = sourceBannerKey
    emit('banner-item-reorder', {
      sourceBannerKey,
      targetBannerKey,
      position,
    })
    window.setTimeout(() => {
      if (settlingBannerKey.value === sourceBannerKey) {
        settlingBannerKey.value = ''
      }
    }, 240)
  }

  resetBannerDragState()
}

const handleBannerPointerUp = (event: PointerEvent) => {
  if (activePointerId.value !== event.pointerId) {
    return
  }
  finishBannerPointerDrag(true)
}

const handleBannerPointerCancel = (event: PointerEvent) => {
  if (activePointerId.value !== event.pointerId) {
    return
  }
  finishBannerPointerDrag(false)
}

onBeforeUnmount(() => {
  window.removeEventListener('pointermove', handleBannerPointerMove, true)
  window.removeEventListener('pointerup', handleBannerPointerUp, true)
  window.removeEventListener('pointercancel', handleBannerPointerCancel, true)
})
</script>

<style scoped>
.admin-theme-front-home-preview {
  margin-bottom: 0;
}

.admin-theme-front-home-preview__header {
  padding-top: 100px;
}

.admin-theme-front-home-preview__type-chip {
  display: inline-flex;
  align-items: center;
  margin: 0 8px;
}

.admin-theme-front-home-preview__block {
  position: relative;
  transition: box-shadow 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
}

.admin-theme-front-home-preview__block.is-theme-linked-active {
  border-radius: 20px;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.22), 0 16px 32px rgba(79, 70, 229, 0.12);
}

.admin-theme-front-home-preview__block.is-theme-field-active {
  border-radius: 20px;
  box-shadow: 0 0 0 2px rgba(45, 212, 191, 0.22), 0 16px 32px rgba(45, 212, 191, 0.12);
}

.admin-theme-front-home-preview__block:hover .admin-theme-front-home-preview__row-actions,
.admin-theme-front-home-preview__block:focus-within .admin-theme-front-home-preview__row-actions {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

.admin-theme-front-home-preview__block--header-bg {
  position: absolute;
  inset: 0 0 auto 0;
  height: 120px;
  width: 100%;
  pointer-events: none;
  z-index: 6;
}

.admin-theme-front-home-preview__header-bg-toolbar {
  position: absolute;
  top: 10px;
  right: 12px;
  z-index: 12;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px 6px 4px 10px;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--text-primary) 12%, transparent);
  background: color-mix(in srgb, var(--bg-surface, #111) 88%, transparent);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.18);
  pointer-events: auto;
}

.admin-theme-front-home-preview__header-bg-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary, #94a3b8);
  white-space: nowrap;
}

.admin-theme-front-home-preview__block--title {
  display: flex;
  justify-content: center;
  width: 100%;
}

.admin-theme-front-home-preview__block--generator,
.admin-theme-front-home-preview__block--task,
.admin-theme-front-home-preview__block--banner {
  width: 100%;
}

.admin-theme-front-home-preview__generator-mask,
.admin-theme-front-home-preview__task-indicator-mask {
  width: 100%;
  pointer-events: none;
}

.admin-theme-front-home-preview__generator-mask :deep(.content-generator-container),
.admin-theme-front-home-preview__generator-mask :deep(.content-generator-root),
.admin-theme-front-home-preview__generator-mask :deep(.generator-panel),
.admin-theme-front-home-preview__generator-mask :deep(.float-generator),
.admin-theme-front-home-preview__task-indicator-mask :deep(button) {
  pointer-events: none !important;
}

.admin-theme-front-home-preview__banner-stage {
  position: relative;
  isolation: isolate;
}

.admin-theme-front-home-preview__banner-stage.is-gradient-linked {
  border-radius: 22px;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.24), inset 0 0 0 1px rgba(255, 255, 255, 0.12);
}

.admin-theme-front-home-preview__banner-stage.is-glow-linked::after {
  content: '';
  position: absolute;
  inset: -8px;
  border-radius: 28px;
  background: radial-gradient(circle at 30% 40%, rgba(47, 227, 255, 0.28), transparent 60%);
  pointer-events: none;
  z-index: 2;
}

.admin-theme-front-home-preview__banner-overlay {
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-rows: minmax(0, 1fr);
  align-items: stretch;
  gap: 10px;
  pointer-events: none;
  z-index: 8;
}

.admin-theme-front-home-preview__banner-shell {
  position: relative;
  height: 100%;
  min-height: 100%;
  align-self: stretch;
  min-width: 0;
  border-radius: 18px;
  overflow: visible;
  pointer-events: auto;
  transition: transform 0.18s ease, opacity 0.18s ease;
  z-index: 1;
}

.admin-theme-front-home-preview__banner-shell:hover,
.admin-theme-front-home-preview__banner-shell:focus-within {
  transform: translateY(-2px);
}

.admin-theme-front-home-preview__banner-shell.is-hidden-item {
  opacity: 0.58;
}

.admin-theme-front-home-preview__banner-shell.is-drag-armed {
  outline: 1px solid rgba(138, 180, 255, 0.34);
  outline-offset: -1px;
}

.admin-theme-front-home-preview__banner-shell.is-dragging {
  z-index: 5;
  transform: scale(0.985);
  opacity: 0.72;
}

.admin-theme-front-home-preview__banner-shell.is-drop-target.is-drop-before {
  box-shadow: inset 3px 0 0 #8ab4ff;
}

.admin-theme-front-home-preview__banner-shell.is-drop-target.is-drop-after {
  box-shadow: inset -3px 0 0 #8ab4ff;
}

.admin-theme-front-home-preview__banner-shell.is-settling {
  animation: admin-theme-banner-settle 0.24s ease;
}

.admin-theme-front-home-preview__banner-actions {
  position: absolute;
  bottom: 4px;
  left: 50%;
  opacity: 0;
  transform: translate(-50%, -4px);
  pointer-events: none;
  transition: opacity 0.18s ease, transform 0.18s ease;
  z-index: 12;
}

.admin-theme-front-home-preview__banner-shell:hover .admin-theme-front-home-preview__banner-actions,
.admin-theme-front-home-preview__banner-shell:focus-within .admin-theme-front-home-preview__banner-actions,
.admin-theme-front-home-preview__banner-shell.is-drag-armed .admin-theme-front-home-preview__banner-actions {
  opacity: 1;
  transform: translate(-50%, 0);
  pointer-events: auto;
}

.admin-theme-front-home-preview__row-actions {
  position: absolute;
  top: -14px;
  right: 12px;
  opacity: 0;
  transform: translateY(-6px);
  pointer-events: none;
  transition: opacity 0.18s ease, transform 0.18s ease;
  z-index: 8;
}

.admin-theme-front-home-preview__row-actions--generator {
  top: 18px;
}

.admin-theme-front-home-preview__row-actions--task,
.admin-theme-front-home-preview__row-actions--banner {
  top: 8px;
}

.admin-theme-front-home-preview__field-hotspot {
  position: absolute;
  pointer-events: none;
  z-index: 4;
  border-radius: 16px;
  box-shadow: 0 0 0 2px rgba(45, 212, 191, 0.46), 0 10px 22px rgba(45, 212, 191, 0.18);
}

.admin-theme-front-home-preview__field-hotspot--accent {
  top: 4px;
  left: 50%;
  width: 140px;
  height: 42px;
  transform: translateX(-50%);
}

.admin-theme-front-home-preview__field-hotspot--primary {
  left: 50%;
  bottom: 52px;
  width: min(420px, calc(100% - 120px));
  height: 58px;
  transform: translateX(-50%);
}

.admin-theme-front-home-preview__field-hotspot--success,
.admin-theme-front-home-preview__field-hotspot--warning,
.admin-theme-front-home-preview__field-hotspot--danger {
  top: 6px;
  right: 24px;
  width: 160px;
  height: 42px;
}

.admin-theme-front-home-preview__field-hotspot--success {
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.5), 0 10px 22px rgba(16, 185, 129, 0.18);
}

.admin-theme-front-home-preview__field-hotspot--warning {
  box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.5), 0 10px 22px rgba(245, 158, 11, 0.18);
}

.admin-theme-front-home-preview__field-hotspot--danger {
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.5), 0 10px 22px rgba(239, 68, 68, 0.18);
}

.is-hidden-block {
  opacity: 0.58;
}

@keyframes admin-theme-banner-settle {
  0% {
    transform: scale(0.97);
  }
  100% {
    transform: scale(1);
  }
}
</style>
