<script setup lang="ts">
import { ref, computed } from 'vue'

// 导入子组件
import { TypeSelector, type CreationType } from './selectors'
import { AgentToolbar, ImageToolbar, VideoToolbar, DigitalHumanToolbar } from './toolbars'

// 弹出方向类型
type Placement = 'top' | 'bottom' | 'auto'

// 布局模式类型
type LayoutMode = 'default' | 'sidebar'

// Props 定义
interface Props {
  // 布局模式：default-画布中央, sidebar-侧边栏
  layout?: LayoutMode
  // 是否可折叠（默认 true）
  collapsible?: boolean
  // 默认是否展开（默认 false，即折叠状态）
  defaultExpanded?: boolean
  // 弹窗弹出方向：top-向上, bottom-向下, auto-自动计算
  popupPlacement?: Placement
}

const props = withDefaults(defineProps<Props>(), {
  layout: 'default',
  collapsible: true,
  defaultExpanded: false,
  popupPlacement: 'auto'
})

// 事件定义
const emit = defineEmits<{
  // 发送消息事件
  send: [message: string, type: CreationType]
}>()

// 输入内容
const inputValue = ref('')

// 当前创作类型
const currentType = ref<CreationType>('agent')

// 组件引用（用于弹窗互斥）
const typeSelectorRef = ref<InstanceType<typeof TypeSelector> | null>(null)
const typeSelectorExpandRef = ref<InstanceType<typeof TypeSelector> | null>(null)
const agentToolbarRef = ref<InstanceType<typeof AgentToolbar> | null>(null)
const agentToolbarExpandRef = ref<InstanceType<typeof AgentToolbar> | null>(null)

// 当 TypeSelector 弹窗打开时，关闭 AgentToolbar 的面板
const handleTypeSelectorOpen = () => {
  agentToolbarRef.value?.closePanel()
  agentToolbarExpandRef.value?.closePanel()
}

// 当 AgentToolbar 面板打开时，关闭 TypeSelector 的下拉框
const handleAgentToolbarPanelOpen = () => {
  typeSelectorRef.value?.close()
  typeSelectorExpandRef.value?.close()
}

// 内部折叠状态（根据 defaultExpanded 初始化）
const isCollapsed = ref(!props.defaultExpanded)

// 展开输入框
const expand = () => {
  isCollapsed.value = false
}

// 折叠输入框（仅当 collapsible 为 true 时生效）
const collapse = () => {
  if (props.collapsible) {
    isCollapsed.value = true
  }
}

// 切换折叠状态（仅当 collapsible 为 true 时生效）
const toggle = () => {
  if (props.collapsible) {
    isCollapsed.value = !isCollapsed.value
  }
}

// 点击输入框区域时展开（仅当 collapsible 为 true 时响应）
const handleClick = () => {
  if (props.collapsible && isCollapsed.value) {
    expand()
  }
}

// 处理输入
const handleInput = (e: Event) => {
  const target = e.target as HTMLInputElement | HTMLTextAreaElement
  inputValue.value = target.value
}

// 处理键盘事件（回车发送）
const handleKeydown = (e: KeyboardEvent) => {
  // Enter 发送，Shift+Enter 换行
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSubmit()
  }
}

// 提交消息
const handleSubmit = () => {
  const message = inputValue.value.trim()
  if (!message) return

  // 触发发送事件
  emit('send', message, currentType.value)

  // 清空输入
  inputValue.value = ''

  // 如果可折叠，提交后折叠
  if (props.collapsible) {
    collapse()
  }
}

// 是否禁用提交按钮
const isSubmitDisabled = computed(() => !inputValue.value.trim())

// 暴露方法供父组件调用
defineExpose({
  expand,
  collapse,
  toggle,
  isCollapsed,
  currentType,
  inputValue,
  handleSubmit
})

// 根据创作类型返回不同的 placeholder
const placeholder = computed(() => {
  if (isCollapsed.value) {
    return '说说今天想做点什么'
  }
  switch (currentType.value) {
    case 'agent':
      return '说说今天想做点什么'
    case 'image':
      return '请描述你想生成的图片'
    case 'video':
      return '输入文字，描述你想创作的画面内容、运动方式等。例如：一个3D形象的小男孩，在公园滑滑板。'
    case 'digital-human':
      return '请描述数字人内容'
    case 'motion':
      return '请描述动作模仿内容'
    default:
      return '请描述你想生成的内容'
  }
})

// 是否为侧边栏模式
const isSidebar = computed(() => props.layout === 'sidebar')

// 根据折叠状态和布局模式返回不同的高度
const promptControlHeight = computed(() => {
  if (isSidebar.value) {
    return '24px'
  }
  return isCollapsed.value ? '42px' : '96px'
})

// 判断是否显示价格信息
const showPrice = computed(() => {
  return !isCollapsed.value && (currentType.value === 'image' || currentType.value === 'video')
})

// 获取价格文本
const priceText = computed(() => {
  switch (currentType.value) {
    case 'image':
      return '1 / 张'
    case 'video':
      return '10'
    default:
      return ''
  }
})

// 外层容器布局类名
const layoutClass = computed(() =>
  isSidebar.value ? 'canvas-layout-blZ0JP' : 'default-layout-bOIxyJ'
)

// 提交按钮容器类名
const submitButtonContainerClass = computed(() =>
  isSidebar.value ? 'collapsed-submit-button-container-jhILhg' : 'collapsed-submit-button-container-Xdi8Y7'
)

// 折叠状态提交按钮类名
const collapsedSubmitButtonClass = computed(() =>
  isSidebar.value ? 'collapsed-submit-button-RE6ufv' : 'collapsed-submit-button-o26OIS'
)
</script>

<template>
  <div :class="['dimension-layout-FUl4Nj', layoutClass, { 'collapsed-WjKggt': isCollapsed }]"
       style="--content-generator-collapse-transition-duration:350ms;--content-generator-collapse-transition-timing-function:cubic-bezier(0.15,0.75,0.3,1)"
       @click="handleClick">
    <div class="layout-KSckhZ">
      <div class="content-oZ2zsI">
        <!-- 参考图上传区域（侧边栏模式下隐藏） -->
        <div v-if="!isSidebar" :class="['references-vWIzeo', { 'collapsed-_VpN2b': isCollapsed }]">
          <div :class="['reference-group-_DAGw1', { 'collapsed-J9LsWu': isCollapsed }]"
               style="--reference-count:1;--reference-item-width:48px;--reference-item-gap:4px">
            <div class="reference-group-background-f6pFpT"></div>
            <div class="reference-group-hover-trigger-YTDCQf"></div>
            <div class="reference-group-content-ztz9q2 expanded-hIAQK3">
              <div class="reference-item-aI97LK expanded-fVSy9S"
                   data-index="0"
                   style="--index-in-group:0;--rotate:8deg">
                <div class="reference-upload-h7tmnr light-Bis76t"
                     style="--rotate:-8deg">
                  <svg class="icon-TrJRuq" fill="none" height="1em"
                       preserveAspectRatio="xMidYMid meet"
                       role="presentation"
                       viewBox="0 0 24 24"
                       width="1em"
                       xmlns="http://www.w3.org/2000/svg">
                    <g>
                      <path clip-rule="evenodd"
                            d="M10.8 20a1.2 1.2 0 0 0 2.4 0v-6.8H20a1.2 1.2 0 1 0 0-2.4h-6.8V4a1.2 1.2 0 0 0-2.4 0v6.8H4a1.2 1.2 0 0 0 0 2.4h6.8V20Z"
                            data-follow-fill="currentColor"
                            fill="currentColor"
                            fill-rule="evenodd"></path>
                    </g>
                  </svg>
                  <input accept="image/jpeg,.jpeg,image/jpg,.jpg,image/png,.png,image/webp,.webp,image/bmp,.bmp"
                         class="file-input-OfqonL sf-hidden"
                         multiple type="file"
                         value="">
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 主内容区域 -->
        <div :class="['main-content-pao8ef', { 'main-content-MTw5sD': isCollapsed || isSidebar, 'collapsed-SD4UgZ': isCollapsed }]">
          <!-- 折叠状态下的引用记录文本区域 -->
          <div v-if="isCollapsed" class="reference-record-text-container-UOUXv6 collapsed-SgPm0K hidden-FI_sis">
            <div class="reference-record-text-YzRnHL">
              <div class="icon-TICgEz">
                <svg width="1em" height="1em" viewBox="0 0 24 24"
                     preserveAspectRatio="xMidYMid meet" fill="none"
                     role="presentation" xmlns="http://www.w3.org/2000/svg">
                  <g>
                    <path data-follow-fill="currentColor"
                          d="M7.06 10.154c-.2 0-.392.03-.583.059.062-.209.126-.42.228-.61.102-.277.262-.517.42-.758.134-.261.368-.438.54-.661.18-.217.426-.362.621-.542.191-.189.442-.283.64-.416.209-.12.39-.251.584-.314l.484-.199a.535.535 0 0 0 .313-.624l-.19-.757a.556.556 0 0 0-.669-.406l-.618.154c-.243.045-.503.168-.792.28-.285.127-.615.213-.922.418-.309.196-.665.359-.979.62-.304.271-.671.505-.942.849-.296.321-.589.659-.816 1.043-.263.366-.441.768-.63 1.165-.17.398-.308.804-.42 1.199a10.833 10.833 0 0 0-.344 2.187c-.03.644-.013 1.18.025 1.568.013.182.038.36.056.483l.023.15.023-.005a4.038 4.038 0 1 0 3.948-4.883Zm9.871 0c-.2 0-.392.03-.583.059.062-.209.125-.42.228-.61.102-.277.262-.517.42-.758.133-.261.367-.438.54-.661.18-.217.426-.362.62-.542.192-.189.442-.283.641-.416.209-.12.39-.251.584-.314l.483-.199a.535.535 0 0 0 .314-.624l-.19-.757a.556.556 0 0 0-.67-.406l-.617.154c-.244.045-.503.168-.792.28-.284.128-.615.213-.922.419-.31.195-.665.359-.98.62-.304.27-.67.505-.942.848-.296.321-.588.659-.815 1.043-.263.366-.442.768-.63 1.165-.17.398-.308.804-.42 1.199a10.832 10.832 0 0 0-.345 2.187c-.03.644-.012 1.18.025 1.568.014.182.039.36.057.483l.022.15.024-.005a4.038 4.038 0 1 0 3.948-4.883Z"
                          fill="currentColor"></path>
                  </g>
                </svg>
              </div>
              <span class="divider-GjrSf1"></span>
              <span class="content-lZaX5g"></span>
              <span class="divider-GjrSf1"></span>
              <div class="icon-TICgEz icon-close-_TmiMV">
                <svg width="1em" height="1em" viewBox="0 0 24 24"
                     preserveAspectRatio="xMidYMid meet" fill="none"
                     role="presentation" xmlns="http://www.w3.org/2000/svg">
                  <g>
                    <path data-follow-fill="currentColor"
                          d="M19.579 6.119a1.2 1.2 0 0 0-1.697-1.698L12 10.303 6.12 4.422a1.2 1.2 0 1 0-1.697 1.697L10.303 12l-5.881 5.882a1.2 1.2 0 0 0 1.697 1.697L12 13.698l5.882 5.882a1.2 1.2 0 1 0 1.697-1.697L13.697 12l5.882-5.882Z"
                          clip-rule="evenodd" fill-rule="evenodd"
                          fill="currentColor"></path>
                  </g>
                </svg>
              </div>
            </div>
          </div>

          <!-- 提示词输入区域 -->
          <div class="prompt-container-SvZ73x"
               :style="`--content-generator-prompt-control-height:${promptControlHeight};--content-generator-prompt-control-line-height:24px`">
            <div class="prompt-textarea-sizer-KvlV5P"></div>
            <textarea
                v-model="inputValue"
                :class="['lv-textarea', 'textarea-rfj34A', 'prompt-textarea-l5tJNE', { 'collapsed-l8bAEB': isCollapsed, 'collapse-transition-start-AXNjML': isCollapsed }]"
                :placeholder="placeholder"
                translate="no"
                @input="handleInput"
                @keydown="handleKeydown"></textarea>
            <input
                v-model="inputValue"
                :class="['lv-input', 'lv-input-size-default', 'input-JjM14b', 'prompt-input-w0wBdF', { 'collapsed-l8bAEB': isCollapsed, 'collapse-transition-start-AXNjML': isCollapsed }]"
                :placeholder="placeholder"
                translate="no"
                @input="handleInput"
                @keydown="handleKeydown">
          </div>
        </div>

        <!-- 折叠状态下的提交按钮 -->
        <div :class="[submitButtonContainerClass, { 'collapsed-WjKggt': isCollapsed, 'has-references-rI7rW7': !isSidebar }]">
          <!-- 根据创作类型显示价格信息（仅图片和视频类型显示） -->
          <div v-if="showPrice" class="commercial-button-content-WWEPba">
            <svg fill="none" height="1em" preserveAspectRatio="xMidYMid meet"
                 role="presentation" viewBox="0 0 25 24"
                 width="1em" xmlns="http://www.w3.org/2000/svg">
              <g>
                <path d="M22.044 12.695a.77.77 0 0 0-.596-.734c-4.688-1.152-7.18-3.92-7.986-9.924a.358.358 0 0 0-.006-.033.573.573 0 0 0-1.137 0l-.007.033c-.805 6.004-3.298 8.772-7.986 9.924a.77.77 0 0 0-.596.734v.033a.82.82 0 0 0 .625.796c3.3.859 6.851 2.872 7.9 6.022.086.26.332.443.613.454h.037a.673.673 0 0 0 .614-.454c1.048-3.15 4.598-5.163 7.9-6.021a.82.82 0 0 0 .625-.797v-.033Z"
                      data-follow-fill="currentColor"
                      fill="currentColor"></path>
              </g>
            </svg>
            {{ priceText }}
          </div>
          <div>
            <button :class="['lv-btn', 'lv-btn-primary', 'lv-btn-size-default', 'lv-btn-shape-circle', 'lv-btn-icon-only', 'button-lc3WzE', 'submit-button-KJTUYS', collapsedSubmitButtonClass, { 'collapsed-WjKggt': isCollapsed, 'expand-transition-start-ejnjPm': !isCollapsed, 'lv-btn-disabled': isSubmitDisabled }]"
                    :disabled="isSubmitDisabled"
                    type="button"
                    @click.stop="handleSubmit">
              <svg fill="none" height="1em"
                   preserveAspectRatio="xMidYMid meet"
                   role="presentation" viewBox="0 0 24 24"
                   width="1em" xmlns="http://www.w3.org/2000/svg">
                <g>
                  <path d="M12.002 3c.424 0 .806.177 1.079.46l5.98 5.98.103.114a1.5 1.5 0 0 1-2.225 2.006l-3.437-3.436V19.5l-.008.153a1.5 1.5 0 0 1-2.985 0l-.007-.153V8.122l-3.44 3.438a1.5 1.5 0 0 1-2.225-2.006l.103-.115 6-5.999.025-.025.059-.052.044-.037c.029-.023.06-.044.09-.065l.014-.01a1.43 1.43 0 0 1 .101-.062l.03-.017c.209-.11.447-.172.699-.172Z"
                        data-follow-fill="currentColor"
                        fill="currentColor"></path>
                </g>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- 工具栏 -->
      <div :class="['toolbar-tBNbB3', { 'collapsed-fUbQ9y': isCollapsed && !isSidebar }]">
        <div class="container-yMr4oW toolbar-settings-YNMCja">
          <div class="content-BF8rbZ toolbar-settings-content-uImXGN">
            <!-- 折叠状态：创作类型选择 + Agent 工具栏 -->
            <template v-if="isCollapsed && !isSidebar">
              <!-- 类型选择器 -->
              <TypeSelector ref="typeSelectorRef" v-model="currentType" :placement="popupPlacement" @open="handleTypeSelectorOpen" />

              <!-- Agent 工具栏（折叠状态下显示） -->
              <AgentToolbar ref="agentToolbarRef" :placement="popupPlacement" @panelOpen="handleAgentToolbarPanelOpen" />
            </template>

            <!-- 展开状态或侧边栏模式：根据创作类型显示不同工具栏 -->
            <template v-else>
              <!-- 类型选择器（侧边栏模式使用紧凑模式） -->
              <TypeSelector ref="typeSelectorExpandRef" v-model="currentType" :placement="popupPlacement" :compact="isSidebar" @open="handleTypeSelectorOpen" />

              <!-- 附件按钮（仅侧边栏 Agent 模式显示） -->
              <button v-if="isSidebar && currentType === 'agent'"
                      class="lv-btn lv-btn-secondary lv-btn-size-default lv-btn-shape-square lv-btn-icon-only button-lc3WzE toolbar-button-FhFnQ_"
                      type="button"
                      title="添加附件">
                <svg width="1em" height="1em" viewBox="0 0 24 24"
                     preserveAspectRatio="xMidYMid meet" fill="none"
                     role="presentation" xmlns="http://www.w3.org/2000/svg">
                  <g>
                    <path data-follow-fill="currentColor"
                          d="M15.145 2.492a4.481 4.481 0 0 1 3.137 1.316c.805.8 1.323 1.91 1.329 3.133.006 1.237-.512 2.503-1.617 3.608l-6.24 6.24c-.611.611-1.358.884-2.101.839a2.85 2.85 0 0 1-1.826-.844 2.849 2.849 0 0 1-.842-1.824c-.046-.744.226-1.491.837-2.102L13.03 7.65a1 1 0 0 1 1.414 1.415l-5.21 5.207c-.224.225-.263.42-.254.566.01.17.097.366.261.53a.853.853 0 0 0 .533.263c.145.008.34-.031.564-.255l6.241-6.241c.773-.773 1.034-1.542 1.03-2.184a2.456 2.456 0 0 0-.739-1.725 2.482 2.482 0 0 0-1.734-.734c-.645-.002-1.412.258-2.177 1.022l-6.241 6.24c-1.163 1.164-1.571 2.38-1.54 3.458.032 1.095.52 2.136 1.303 2.916.782.78 1.826 1.266 2.925 1.298 1.079.03 2.294-.377 3.45-1.533l6.462-6.462a1 1 0 0 1 1.414 1.416l-6.462 6.46c-1.512 1.512-3.247 2.166-4.921 2.119-1.656-.047-3.172-.776-4.28-1.881-1.109-1.105-1.842-2.62-1.89-4.276-.048-1.675.608-3.411 2.125-4.928l6.241-6.242c1.1-1.099 2.364-1.612 3.599-1.607Z"
                          fill="currentColor"></path>
                  </g>
                </svg>
              </button>

              <!-- Agent 模式工具栏 -->
              <AgentToolbar v-if="currentType === 'agent'" ref="agentToolbarExpandRef" :placement="popupPlacement" :icon-only="isSidebar" @panelOpen="handleAgentToolbarPanelOpen" />

              <!-- 图片生成工具栏 -->
              <ImageToolbar v-else-if="currentType === 'image'" :placement="popupPlacement" :icon-only="isSidebar" />

              <!-- 视频生成工具栏 -->
              <VideoToolbar v-else-if="currentType === 'video'" :placement="popupPlacement" :icon-only="isSidebar" />

              <!-- 数字人/动作模仿工具栏 -->
              <DigitalHumanToolbar v-else :placement="popupPlacement" :icon-only="isSidebar" />
            </template>
          </div>
        </div>

        <!-- 提交按钮区域 -->
        <div class="toolbar-actions-DsJHmQ">
          <!-- 根据创作类型显示价格信息（仅图片和视频类型显示） -->
          <div v-if="showPrice" class="commercial-button-content-WWEPba">
            <svg fill="none" height="1em" preserveAspectRatio="xMidYMid meet"
                 role="presentation" viewBox="0 0 25 24"
                 width="1em" xmlns="http://www.w3.org/2000/svg">
              <g>
                <path d="M22.044 12.695a.77.77 0 0 0-.596-.734c-4.688-1.152-7.18-3.92-7.986-9.924a.358.358 0 0 0-.006-.033.573.573 0 0 0-1.137 0l-.007.033c-.805 6.004-3.298 8.772-7.986 9.924a.77.77 0 0 0-.596.734v.033a.82.82 0 0 0 .625.796c3.3.859 6.851 2.872 7.9 6.022.086.26.332.443.613.454h.037a.673.673 0 0 0 .614-.454c1.048-3.15 4.598-5.163 7.9-6.021a.82.82 0 0 0 .625-.797v-.033Z"
                      data-follow-fill="currentColor" fill="currentColor"></path>
              </g>
            </svg>
            {{ priceText }}
          </div>
          <div>
            <button :class="['lv-btn', 'lv-btn-primary', 'lv-btn-size-default', 'lv-btn-shape-circle', 'lv-btn-icon-only', 'button-lc3WzE', 'submit-button-KJTUYS', isSidebar ? 'submit-button-qiVtq5' : 'submit-button-CpjScj', { 'collapsed-WjKggt': isCollapsed, 'expand-transition-start-ejnjPm': !isCollapsed, 'lv-btn-disabled': isSubmitDisabled }]"
                    :disabled="isSubmitDisabled"
                    type="button"
                    @click.stop="handleSubmit">
              <svg fill="none" height="1em"
                   preserveAspectRatio="xMidYMid meet"
                   role="presentation" viewBox="0 0 24 24"
                   width="1em" xmlns="http://www.w3.org/2000/svg">
                <g>
                  <path d="M12.002 3c.424 0 .806.177 1.079.46l5.98 5.98.103.114a1.5 1.5 0 0 1-2.225 2.006l-3.437-3.436V19.5l-.008.153a1.5 1.5 0 0 1-2.985 0l-.007-.153V8.122l-3.44 3.438a1.5 1.5 0 0 1-2.225-2.006l.103-.115 6-5.999.025-.025.059-.052.044-.037c.029-.023.06-.044.09-.065l.014-.01a1.43 1.43 0 0 1 .101-.062l.03-.017c.209-.11.447-.172.699-.172Z"
                        data-follow-fill="currentColor" fill="currentColor"></path>
                </g>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
/* 引入全局样式，不使用 scoped */
@import "../../views/generate/generate.css";
</style>
