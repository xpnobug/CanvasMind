<script setup lang="ts">
// 资产选择器组件
// 支持选择图片和视频资产

import { ref, computed, watch, nextTick } from 'vue'

// 资产类型
export type AssetType = 'image' | 'video'

// 资产项接口
export interface AssetItem {
  id: string
  url: string
  thumbnailUrl?: string
  type: AssetType
  name?: string
  width?: number
  height?: number
  duration?: number // 仅视频有
  createdAt?: string
}

// Tab 配置接口
interface TabConfig {
  key: string
  label: string
}

// Props 定义
interface Props {
  // 是否显示弹窗
  visible: boolean
  // 资产类型：image-图片, video-视频
  assetType?: AssetType
  // 是否多选
  multiple?: boolean
  // 最大选择数量（仅多选时有效）
  maxCount?: number
  // 资产列表
  assets?: AssetItem[]
  // 是否加载中
  loading?: boolean
  // 自定义 Tab 配置
  tabs?: TabConfig[]
  // 弹窗标题
  title?: string
  // 空状态图片
  emptyImage?: string
  // 空状态文本
  emptyText?: string
}

const props = withDefaults(defineProps<Props>(), {
  assetType: 'image',
  multiple: true,
  maxCount: 9,
  assets: () => [],
  loading: false,
  tabs: () => [
    { key: 'all', label: '所有图片' },
    { key: 'hd', label: '超清' },
    { key: 'favorite', label: '收藏' }
  ],
  title: '资产选取',
  emptyImage: 'https://lf3-lv-buz.vlabstatic.com/obj/image-lvweb-buz/ies/lvweb/dreamina_cn/static/image/empty-image-dark.6e788cae.png',
  emptyText: '暂未找到相关内容'
})

// 事件定义
const emit = defineEmits<{
  'update:visible': [value: boolean]
  'confirm': [assets: AssetItem[]]
  'cancel': []
  'tabChange': [tabKey: string]
}>()

// 当前激活的 Tab
const activeTab = ref(props.tabs[0]?.key || 'all')

// 已选择的资产 ID 列表
const selectedIds = ref<Set<string>>(new Set())

// 已选择的资产数量
const selectedCount = computed(() => selectedIds.value.size)

// 是否禁用确认按钮
const isConfirmDisabled = computed(() => selectedCount.value === 0)

// 选择提示文本
const selectionTips = computed(() => {
  const unit = props.assetType === 'image' ? '张图片' : '个视频'
  return `已选 ${selectedCount.value} ${unit}`
})

// 将资产按每行5个分组
const assetRows = computed(() => {
  const rows: AssetItem[][] = []
  const itemsPerRow = 5
  for (let i = 0; i < props.assets.length; i += itemsPerRow) {
    rows.push(props.assets.slice(i, i + itemsPerRow))
  }
  return rows
})

// 当前激活的 Tab 索引
const activeTabIndex = computed(() => {
  const index = props.tabs.findIndex(t => t.key === activeTab.value)
  return index >= 0 ? index : 0
})

// Tab 元素引用
const tabRefs = ref<HTMLElement[]>([])

// 指示器样式（动态计算位置和宽度）
const inkStyle = ref({ left: '0px', width: '0px' })

// 更新指示器位置和宽度
const updateInkStyle = () => {
  const index = activeTabIndex.value
  const tabEl = tabRefs.value[index]
  if (tabEl) {
    inkStyle.value = {
      left: `${tabEl.offsetLeft}px`,
      width: `${tabEl.offsetWidth}px`
    }
  }
}

// 设置 Tab 元素引用
const setTabRef = (el: HTMLElement | null, index: number) => {
  if (el) {
    tabRefs.value[index] = el
  }
}

// 切换 Tab
const handleTabChange = (tabKey: string) => {
  activeTab.value = tabKey
  emit('tabChange', tabKey)
  // 更新指示器位置
  nextTick(() => updateInkStyle())
}

// 切换选择状态
const toggleSelect = (asset: AssetItem) => {
  const newSet = new Set(selectedIds.value)

  if (newSet.has(asset.id)) {
    newSet.delete(asset.id)
  } else {
    if (!props.multiple) {
      // 单选模式：清空之前的选择
      newSet.clear()
    } else if (newSet.size >= props.maxCount) {
      // 多选模式：检查是否超过最大数量
      return
    }
    newSet.add(asset.id)
  }

  selectedIds.value = newSet
}

// 判断资产是否被选中
const isSelected = (assetId: string) => selectedIds.value.has(assetId)

// 关闭弹窗
const handleClose = () => {
  emit('update:visible', false)
  emit('cancel')
}

// 确认选择
const handleConfirm = () => {
  const selectedAssets = props.assets.filter(asset => selectedIds.value.has(asset.id))
  emit('confirm', selectedAssets)
  emit('update:visible', false)
}

// 监听 visible 变化，重置选择状态
watch(() => props.visible, (newVal) => {
  if (newVal) {
    selectedIds.value = new Set()
    activeTab.value = props.tabs[0]?.key || 'all'
    // 弹窗显示后初始化指示器位置
    nextTick(() => {
      // 等待 DOM 渲染完成后再更新
      setTimeout(() => updateInkStyle(), 50)
    })
  }
})

// 格式化视频时长
const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// 暴露方法
defineExpose({
  selectedIds,
  toggleSelect,
  clearSelection: () => { selectedIds.value = new Set() }
})
</script>

<template>
  <!-- 弹窗遮罩层 -->
  <Teleport to="body">
    <div v-if="visible" class="lv-modal-wrapper lv-modal-wrapper-align-center modal-wrap-sbjvkE" @click.self="handleClose">
      <!-- 弹窗主体 -->
      <div role="dialog"
           aria-modal="true"
           class="lv-modal modal-M9n5Ob zoomModal-appear-done zoomModal-enter-done">
        <div data-focus-lock-disabled="false" tabindex="-1">
          <!-- 弹窗头部 -->
          <div class="lv-modal-header">
            <div class="lv-modal-title">
              <span>
                <div class="header-V2_qmF">
                  <span class="title-aXluuW">{{ title }}</span>
                  <svg width="1em" height="1em" viewBox="0 0 24 24"
                       preserveAspectRatio="xMidYMid meet" fill="none"
                       role="presentation" xmlns="http://www.w3.org/2000/svg"
                       class="close-icon-k1w3OL"
                       @click="handleClose">
                    <g>
                      <path data-follow-fill="currentColor"
                            d="M19.579 6.119a1.2 1.2 0 0 0-1.697-1.698L12 10.303 6.12 4.422a1.2 1.2 0 1 0-1.697 1.697L10.303 12l-5.881 5.882a1.2 1.2 0 0 0 1.697 1.697L12 13.698l5.882 5.882a1.2 1.2 0 1 0 1.697-1.697L13.697 12l5.882-5.882Z"
                            clip-rule="evenodd" fill-rule="evenodd"
                            fill="currentColor"></path>
                    </g>
                  </svg>
                </div>
              </span>
            </div>
          </div>

          <!-- 弹窗内容 -->
          <div class="lv-modal-content">
            <div class="content-container-G9JqEq">
              <!-- Tab 切换 -->
              <div class="lv-tabs lv-tabs-horizontal lv-tabs-line lv-tabs-top lv-tabs-size-default tabs-container-IBpk72">
                <div class="lv-tabs-header-nav lv-tabs-header-nav-horizontal lv-tabs-header-nav-top lv-tabs-header-size-default lv-tabs-header-nav-line">
                  <div class="lv-tabs-header-scroll">
                    <div class="lv-tabs-header-wrapper">
                      <div class="lv-tabs-header" style="transform: translateX(0px);">
                        <div v-for="(tab, index) in tabs"
                             :key="tab.key"
                             :ref="(el) => setTabRef(el as HTMLElement, index)"
                             :class="['lv-tabs-header-title', { 'lv-tabs-header-title-active': activeTab === tab.key }]"
                             role="tab"
                             :aria-selected="activeTab === tab.key"
                             tabindex="0"
                             :id="`lv-tabs-0-tab-${index}`"
                             :aria-controls="`lv-tabs-0-panel-${index}`"
                             @click="handleTabChange(tab.key)">
                          <span class="lv-tabs-header-title-text">{{ tab.label }}</span>
                        </div>
                        <!-- Tab 指示器 - 自动适应文字宽度 -->
                        <div class="lv-tabs-header-ink" :style="inkStyle"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 资产列表容器 -->
              <div class="asset-list-container-XpxgBw" style="position: relative;">
                <!-- 加载状态 -->
                <div v-if="loading" class="loading-container">
                  <div class="lv-spin lv-spin-loading">
                    <span class="lv-spin-icon">
                      <svg viewBox="0 0 50 50" class="lv-spin-icon-loading">
                        <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" stroke-width="4"></circle>
                      </svg>
                    </span>
                  </div>
                </div>

                <!-- 空状态 -->
                <div v-else-if="assets.length === 0" class="empty-page-Hr0fvP">
                  <img :src="emptyImage" :alt="emptyText" crossorigin="anonymous" class="image-THKG1x">
                  <div class="description-EXt9nY">{{ emptyText }}</div>
                </div>

                <!-- 资产网格 -->
                <div v-else class="asset-grid-wrapper">
                  <div v-for="(row, rowIndex) in assetRows"
                       :key="rowIndex"
                       class="asset-item-tJ77e7"
                       :style="{ height: '168px', left: '0px', position: 'absolute', top: `${rowIndex * 168}px`, width: '100%' }">
                    <div v-for="asset in row"
                         :key="asset.id"
                         :class="['container-IScbK2', { 'selected-bNLd7g': isSelected(asset.id) }]"
                         @click="toggleSelect(asset)">
                      <!-- 复选框 -->
                      <div :class="['checkbox-CGyG08', 'checkbox-fWYWmp', { 'checked-JsXcC3': isSelected(asset.id) }]">
                        <svg width="1em" height="1em" viewBox="0 0 24 24"
                             preserveAspectRatio="xMidYMid meet" fill="none"
                             role="presentation" xmlns="http://www.w3.org/2000/svg">
                          <g>
                            <path data-follow-fill="currentColor"
                                  d="M18.28 7.502a1.25 1.25 0 0 1 0 1.768l-7.2 7.2a1.25 1.25 0 0 1-1.767 0l-3.6-3.6a1.25 1.25 0 1 1 1.767-1.768l2.716 2.717 6.317-6.317a1.25 1.25 0 0 1 1.767 0Z"
                                  clip-rule="evenodd" fill-rule="evenodd"
                                  fill="currentColor"></path>
                          </g>
                        </svg>
                      </div>
                      <!-- 图片 -->
                      <div class="container-bG3PQ9">
                        <img crossorigin="anonymous"
                             draggable="false"
                             loading="eager"
                             class="img-bhyNEQ"
                             :src="asset.thumbnailUrl || asset.url"
                             :alt="asset.name || ''">
                        <!-- 视频时长标记 -->
                        <div v-if="asset.type === 'video' && asset.duration" class="video-duration-badge">
                          {{ formatDuration(asset.duration) }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 底部操作栏 -->
            <div class="footer-xbo3jg">
              <span class="tips-YHTzva">{{ selectionTips }}</span>
              <button :class="['lv-btn', 'lv-btn-primary', 'lv-btn-size-default', 'lv-btn-shape-square', 'confirm-btn-C53dBF', { 'lv-btn-disabled': isConfirmDisabled }]"
                      type="button"
                      :disabled="isConfirmDisabled"
                      @click="handleConfirm">
                <span>确认</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style>
/* 资产选择器样式 */

/* 弹窗遮罩层 */
.modal-wrap-sbjvkE {
    align-items: center;
    background-color: rgba(0, 0, 0, 0.6);
    display: flex;
    height: 100%;
    justify-content: center;
    left: 0;
    position: fixed;
    top: 0;
    width: 100%;
    z-index: 1000
}

.modal-wrap-sbjvkE .lv-modal .lv-modal-content,
.modal-wrap-sbjvkE .lv-modal .lv-modal-header {
    padding: 0
}

.modal-wrap-sbjvkE .modal-M9n5Ob {
    background-color: var(--bg-page-primary);
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    max-height: 90vh;
    overflow: hidden;
    width: 896px
}

.modal-wrap-sbjvkE .modal-M9n5Ob .header-V2_qmF {
    align-items: center;
    display: flex;
    justify-content: space-between;
    padding: 23px 32px
}

.modal-wrap-sbjvkE .modal-M9n5Ob .header-V2_qmF .title-aXluuW {
    color: var(--text-primary);
    font-size: 16px;
    font-weight: 500;
    line-height: 24px
}

.modal-wrap-sbjvkE .modal-M9n5Ob .header-V2_qmF .close-icon-k1w3OL {
    color: var(--text-secondary);
    cursor: pointer;
    height: 20px;
    transition: color 0.2s ease;
    width: 20px
}

.modal-wrap-sbjvkE .modal-M9n5Ob .header-V2_qmF .close-icon-k1w3OL:hover {
    color: var(--text-primary)
}

.modal-wrap-sbjvkE .modal-M9n5Ob .content-container-G9JqEq {
    padding: 0 32px
}

.modal-wrap-sbjvkE .modal-M9n5Ob .asset-list-container-XpxgBw {
    height: 440px;
    overflow-y: auto
}

/* 底部操作栏 */
.footer-xbo3jg {
    align-items: center;
    display: flex;
    justify-content: space-between;
    padding: 24px 32px
}

.footer-xbo3jg .tips-YHTzva {
    color: var(--text-secondary);
    font-size: 14px;
    line-height: 22px
}

.footer-xbo3jg .confirm-btn-C53dBF {
    min-width: 80px
}

/* 资产行布局 */
.asset-item-tJ77e7 {
    display: flex;
    gap: 8px
}

/* 资产网格包装器 */
.asset-grid-wrapper {
    position: relative;
    min-height: 168px
}

/* 资产项容器 */
.container-IScbK2 {
    border-radius: 2px;
    cursor: pointer;
    height: 160px;
    overflow: hidden;
    position: relative;
    width: 160px
}

.container-IScbK2.selected-bNLd7g {
    border-radius: 4px
}

.container-IScbK2.selected-bNLd7g:before {
    border: 3px solid var(--bg-surface);
    border-radius: 4px;
    bottom: 0;
    content: "";
    left: 0;
    position: absolute;
    right: 0;
    top: 0;
    z-index: 1
}

.container-IScbK2.selected-bNLd7g:after {
    border: 2px solid var(--text-primary);
    border-radius: 4px;
    bottom: 0;
    content: "";
    left: 0;
    position: absolute;
    right: 0;
    top: 0;
    z-index: 2
}

.container-IScbK2 .checkbox-CGyG08 {
    left: 8px;
    position: absolute;
    top: 8px;
    z-index: 3
}

.container-IScbK2 .img-bhyNEQ {
    height: 100%;
    left: 0;
    object-fit: cover;
    position: absolute;
    top: 0;
    width: 100%
}

/* 复选框样式 */
.checkbox-fWYWmp {
    align-items: center;
    background: var(--bg-mask-60);
    border-radius: 4px;
    color: var(--onmedia-text-primary);
    cursor: pointer;
    display: flex;
    height: 16px;
    justify-content: center;
    width: 16px
}

.checkbox-fWYWmp:not(.checked-JsXcC3):hover {
    background-color: var(--bg-mask-30)
}

.checkbox-fWYWmp > svg {
    font-size: 12px;
    transform: scale(0)
}

.checkbox-fWYWmp.checked-JsXcC3 > svg {
    transform: scale(1);
    transition: transform 0.3s cubic-bezier(0.3, 1.3, 0.3, 1)
}

/* 图片容器 */
.container-bG3PQ9 {
    position: relative;
    height: 100%;
    width: 100%
}

/* 视频时长标记 */
.video-duration-badge {
    background-color: rgba(0, 0, 0, 0.6);
    border-radius: 4px;
    bottom: 8px;
    color: #fff;
    font-size: 12px;
    padding: 2px 6px;
    position: absolute;
    right: 8px;
    z-index: 1
}

/* 加载状态 */
.loading-container {
    align-items: center;
    display: flex;
    height: 100%;
    justify-content: center;
    width: 100%
}

/* Tab 样式 */
.lv-tabs,
.lv-tabs-header-nav {
    position: relative
}

.lv-tabs-header-wrapper {
    display: flex;
    flex: 1 1;
    overflow: hidden
}

.lv-tabs-header {
    display: flex;
    gap: 8px;
    position: relative;
    transition: transform .2s cubic-bezier(.34, .69, .1, 1);
    white-space: nowrap
}

.lv-tabs-header-scroll {
    align-items: center;
    display: flex;
    height: 36px;
    overflow: hidden
}

.lv-tabs-header-title {
    align-items: center;
    box-sizing: border-box;
    color: var(--text-tertiary);
    cursor: pointer;
    display: flex;
    height: 36px;
    justify-content: center;
    padding: 0 20px;
    position: relative;
    transition: color .2s linear
}

.lv-tabs-header-title:hover {
    background-color: unset
}

.lv-tabs-header-title-text {
    color: var(--text-secondary);
    display: inline-block;
    font-size: 13px;
    font-style: normal;
    font-weight: 500;
    line-height: 100%;
    padding: 1px 0;
    position: relative
}

.lv-tabs-header-title:hover .lv-tabs-header-title-text,
.lv-tabs-header-title.lv-tabs-header-title-active .lv-tabs-header-title-text {
    color: var(--text-primary)
}

.lv-tabs-header-title-active,
.lv-tabs-header-title-active:hover {
    color: var(--text-primary);
    font-weight: 800
}

.lv-tabs-header-ink {
    background-color: var(--bg-block-primary-default);
    border-radius: 8px;
    bottom: 0;
    box-sizing: border-box;
    height: 100%;
    position: absolute;
    right: auto;
    transition: left .2s cubic-bezier(.34, .69, .1, 1), width .2s cubic-bezier(.34, .69, .1, 1);
    z-index: -1
}

.tabs-container-IBpk72 {
    margin-bottom: 16px
}

/* 空状态样式 */
.empty-page-Hr0fvP {
    align-items: center;
    display: flex;
    flex-direction: column;
    height: 100%;
    justify-content: center;
    padding: 40px 0
}

.empty-page-Hr0fvP .image-THKG1x {
    height: 120px;
    margin-bottom: 16px;
    width: 120px
}

.empty-page-Hr0fvP .description-EXt9nY {
    color: var(--text-placeholder);
    font-size: 14px;
    line-height: 22px
}

/* 加载动画 */
.lv-spin-icon-loading {
    animation: spin 1s linear infinite
}

@keyframes spin {
    0% { transform: rotate(0deg) }
    100% { transform: rotate(360deg) }
}
</style>
