<script setup lang="ts">
import { ref, computed, nextTick, onUnmounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useLoginModalStore } from '@/stores/login-modal'
import { useSystemSettingsStore } from '@/stores/system-settings'
import { getModelByName } from '@/config/models'
import type { ModelCapabilityFlags } from '@/shared/provider-capability'

// 导入子组件
import { TypeSelector, type CreationType } from './selectors'
import { AgentToolbar, ImageToolbar, VideoToolbar, DigitalHumanToolbar } from './toolbars'

// 弹出方向类型
type Placement = 'top' | 'bottom' | 'auto'

// 布局模式类型
type LayoutMode = 'default' | 'sidebar'
type SurfaceVariant = 'default' | 'home'

const GENERATOR_CREATION_TYPE_STORAGE_KEY = 'canana:generator:creation-type'

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
  // 是否显示调整大小手柄（仅侧边栏模式有效）
  showResizeHandle?: boolean
  // 当前面板宽度（用于设置 CSS 变量）
  panelWidth?: number
  /** 外部同步的提示词（如作品详情当前条目）；与 promptSyncKey 一起变化时写入输入框 */
  externalPrompt?: string
  /** 同步键（如当前大图 URL）；变化时用 externalPrompt 覆盖输入，避免与画廊不一致 */
  promptSyncKey?: string | number
  /** 初始创作类型（如作品详情内默认「图片生成」） */
  initialCreationType?: CreationType
  /** 展示变体：首页可使用差异化按钮样式 */
  variant?: SurfaceVariant
  /** 隐藏顶部创作类型切换器（节点下方场景常用：节点已锁定类型，不允许切换） */
  hideTypeSelector?: boolean
  /** 自定义输入框 placeholder，覆盖按类型推断的默认文案 */
  placeholderOverride?: string
  /** 隐藏 Agent 工具栏内的技能（"使用技能"）下拉，节点下方场景默认隐藏 */
  hideSkillSelector?: boolean
  /** 隐藏 Sidebar Agent 模式的附件按钮 + 参考图上传/缩略图区，避免在不需要图上下文的节点（如 TextNode）露出 */
  hideImageUpload?: boolean
  /** 由外部塞入的参考图（如 ImageNode 把上游连线的图作为参考图），会同步进 imageReferenceImages */
  externalReferenceImages?: string[]
  /** 强制工具栏显示文字（默认 sidebar 走 icon-only=true，节点下方传 true 时还原为带文字模式） */
  verboseToolbar?: boolean
}

interface GeneratorSendOptions {
  model?: string
  modelKey?: string
  ratio?: string
  resolution?: string
  duration?: string
  feature?: string
  skill?: string
  referenceImages?: string[]
  /** 文生图/图生图的生成数量，对应上游 n 参数。仅图片模式有意义 */
  count?: number
  /** Agent 模式下当前模型支持的扩展能力开关（联网搜索 / 深度思考） */
  capabilityFlags?: ModelCapabilityFlags
}

interface GeneratorDraftPayload {
  type?: CreationType
  prompt?: string
  modelKey?: string
  ratio?: string
  resolution?: string
  duration?: string
  feature?: string
  skill?: string
  referenceImages?: string[]
}

interface ExposedImageToolbarInstance {
  currentModelVersion: string
  currentSize: string
  currentCount: number
}

interface ExposedVideoToolbarInstance {
  currentModelVersion: string
  currentSize: string
  currentDuration: string
  currentFeature: string
}

interface ExposedAgentToolbarInstance {
  currentSkill: string
}

const props = withDefaults(defineProps<Props>(), {
  layout: 'default',
  collapsible: true,
  defaultExpanded: false,
  popupPlacement: 'auto',
  showResizeHandle: false,
  panelWidth: 400,
  externalPrompt: undefined,
  promptSyncKey: undefined,
  initialCreationType: undefined,
  variant: 'home',
  hideTypeSelector: false,
  placeholderOverride: '',
  hideSkillSelector: false,
  hideImageUpload: false,
  externalReferenceImages: () => [],
  verboseToolbar: false,
})

// 事件定义
const emit = defineEmits<{
  // 发送消息事件
  send: [message: string, type: CreationType, options?: GeneratorSendOptions]
  // 面板宽度调整事件
  resize: [width: number]
  /** 展开状态变化（true=展开），供父级调整预览区留白等 */
  expandedChange: [expanded: boolean]
}>()

// 输入内容
const inputValue = ref('')
const imageReferenceImages = ref<string[]>([])
const videoFirstFrameImage = ref('')
const videoLastFrameImage = ref('')
const imageReferenceInputRef = ref<HTMLInputElement | null>(null)
const videoFirstFrameInputRef = ref<HTMLInputElement | null>(null)
const videoLastFrameInputRef = ref<HTMLInputElement | null>(null)
const IMAGE_REFERENCE_LIMIT = 9

// 外部塞入的参考图（如节点画布把上游连线的图作为参考图）→ 同步进 imageReferenceImages
// 用 deep 监听，让 ImageNode 切换上游连线时实时反映到输入框
watch(
  () => props.externalReferenceImages,
  (urls) => {
    if (!Array.isArray(urls)) return
    const normalized = urls.filter(Boolean).slice(0, IMAGE_REFERENCE_LIMIT)
    // 仅在差异时写入，避免循环
    const same =
      normalized.length === imageReferenceImages.value.length &&
      normalized.every((u, i) => u === imageReferenceImages.value[i])
    if (!same) {
      imageReferenceImages.value = normalized
    }
  },
  { immediate: true, deep: true },
)

// 登录态与全局登录弹窗。
const authStore = useAuthStore()
const { openLoginModal } = useLoginModalStore()
const { publicSystemSettings } = useSystemSettingsStore()

// 从本地恢复最近一次创作类型，详情页等显式传入初始值时优先使用外部值。
const readStoredCreationType = (): CreationType | null => {
  if (typeof window === 'undefined') return null

  const rawValue = String(window.localStorage.getItem(GENERATOR_CREATION_TYPE_STORAGE_KEY) || '').trim()
  return ['agent', 'image', 'video', 'digital-human', 'motion'].includes(rawValue)
    ? rawValue as CreationType
    : null
}

// 当前创作类型（有 initialCreationType 时与之一致，避免先闪默认 Agent）
const conversationEntrySettings = computed(() => publicSystemSettings.value.conversationSettings.entryDisplay)
const inputSettings = computed(() => conversationEntrySettings.value.input)
const workbenchSettings = computed(() => conversationEntrySettings.value.workbench)
const availableModeOptions = computed(() => {
  const options = Array.isArray(conversationEntrySettings.value?.mode?.options)
    ? conversationEntrySettings.value.mode.options
    : []

  const nextOptions = options
    .map(item => ({
      value: String(item.value || '').trim() as CreationType,
      label: String(item.label || '').trim(),
    }))
    .filter(item => ['agent', 'image', 'video', 'digital-human', 'motion'].includes(item.value) && item.label)

  return nextOptions.length
    ? nextOptions
    : [{ value: 'agent' as CreationType, label: 'Agent 模式' }]
})

const readDefaultCreationType = () => {
  const configuredMode = String(conversationEntrySettings.value?.mode?.defaultMode || '').trim()
  if (['agent', 'image', 'video', 'digital-human', 'motion'].includes(configuredMode)) {
    return configuredMode as CreationType
  }

  return 'agent' as CreationType
}

const storedCreationType = readStoredCreationType()
const currentType = ref<CreationType>(props.initialCreationType ?? storedCreationType ?? readDefaultCreationType())

// 组件引用（用于弹窗互斥）
const typeSelectorRef = ref<InstanceType<typeof TypeSelector> | null>(null)
const typeSelectorExpandRef = ref<InstanceType<typeof TypeSelector> | null>(null)
const agentToolbarRef = ref<InstanceType<typeof AgentToolbar> | null>(null)
const agentToolbarExpandRef = ref<InstanceType<typeof AgentToolbar> | null>(null)
const imageToolbarRef = ref<InstanceType<typeof ImageToolbar> | null>(null)
const videoToolbarRef = ref<InstanceType<typeof VideoToolbar> | null>(null)

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

watch(
  () => [props.promptSyncKey, props.externalPrompt] as const,
  () => {
    if (props.promptSyncKey === undefined && props.externalPrompt === undefined) return
    inputValue.value = props.externalPrompt ?? ''
  },
  { immediate: true }
)

watch(
  () => props.initialCreationType,
  (t) => {
    if (t) currentType.value = t
  }
)

watch(
  currentType,
  (type) => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(GENERATOR_CREATION_TYPE_STORAGE_KEY, type)
  },
  { immediate: true }
)

watch(
  availableModeOptions,
  (options) => {
    if (!options.some(item => item.value === currentType.value)) {
      currentType.value = options[0]?.value || 'agent'
    }
  },
  { immediate: true },
)

watch(
  () => conversationEntrySettings.value.mode.defaultMode,
  (value) => {
    if (props.initialCreationType || storedCreationType) {
      return
    }

    const normalizedValue = String(value || '').trim()
    if (['agent', 'image', 'video', 'digital-human', 'motion'].includes(normalizedValue)) {
      currentType.value = normalizedValue as CreationType
    }
  },
  { immediate: true },
)

watch(
  isCollapsed,
  (c) => {
    emit('expandedChange', !c)
  },
  { immediate: true }
)

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

  // 未登录时直接弹出登录框，并保留当前输入内容。
  if (!authStore.isLoggedIn.value) {
    openLoginModal('content-generator-submit')
    return
  }

  // 触发发送事件
  if (currentType.value === 'image') {
    const toolbar = imageToolbarRef.value
    const sizeConfig = toolbar?.currentSizeConfig?.()
    const sendOptions = {
      model: toolbar?.currentModelLabel || '',
      modelKey: toolbar?.currentModelVersion || '',
      ratio: toolbar?.currentSize || '',
      resolution: sizeConfig?.quality || '',
      referenceImages: [...imageReferenceImages.value],
      count: toolbar?.currentCount || 1,
    }
    emit('send', message, currentType.value, sendOptions)
  } else if (currentType.value === 'video' && videoToolbarRef.value) {
    const toolbar = videoToolbarRef.value
    const sizeConfig = toolbar.getCurrentSizeConfig()
    emit('send', message, currentType.value, {
      model: toolbar.getCurrentModelLabel(),
      ratio: toolbar.currentSize,
      resolution: sizeConfig.quality,
      duration: toolbar.currentDuration,
      feature: toolbar.currentFeature
    })
  } else if (currentType.value === 'agent') {
    const toolbar = agentToolbarExpandRef.value || agentToolbarRef.value
    emit('send', message, currentType.value, {
      model: toolbar?.currentModelLabel || '',
      modelKey: toolbar?.currentModel || '',
      skill: toolbar?.currentSkill || 'general',
      referenceImages: [...imageReferenceImages.value],
      capabilityFlags: toolbar?.currentCapabilityFlags || {},
    })
  } else {
    emit('send', message, currentType.value)
  }

  // 清空输入
  inputValue.value = ''
}

// 是否禁用提交按钮
const isSubmitDisabled = computed(() => !inputValue.value.trim())

const getActiveAgentToolbar = () =>
  (agentToolbarExpandRef.value || agentToolbarRef.value) as ExposedAgentToolbarInstance | null

// 将外部记录草稿回填到生成器，供重新编辑和再次生成复用。
const applyDraft = async (payload: GeneratorDraftPayload) => {
  const nextType = payload.type || currentType.value
  currentType.value = nextType
  expand()

  inputValue.value = String(payload.prompt || '')

  if (nextType === 'image' || nextType === 'agent') {
    imageReferenceImages.value = Array.isArray(payload.referenceImages)
      ? payload.referenceImages.filter(Boolean).slice(0, IMAGE_REFERENCE_LIMIT)
      : []
    videoFirstFrameImage.value = ''
    videoLastFrameImage.value = ''
  } else if (nextType === 'video') {
    imageReferenceImages.value = []
    videoFirstFrameImage.value = String(payload.referenceImages?.[0] || '')
    videoLastFrameImage.value = String(payload.referenceImages?.[1] || '')
  } else {
    imageReferenceImages.value = []
    videoFirstFrameImage.value = ''
    videoLastFrameImage.value = ''
  }

  await nextTick()

  if (nextType === 'image') {
    const toolbar = imageToolbarRef.value as ExposedImageToolbarInstance | null
    if (toolbar) {
      if (payload.modelKey) {
        toolbar.currentModelVersion = payload.modelKey
      }
      if (payload.ratio) {
        toolbar.currentSize = payload.ratio
      }
    }
    return
  }

  if (nextType === 'video') {
    const toolbar = videoToolbarRef.value as ExposedVideoToolbarInstance | null
    if (toolbar) {
      if (payload.modelKey) {
        toolbar.currentModelVersion = payload.modelKey
      }
      if (payload.ratio) {
        toolbar.currentSize = payload.ratio
      }
      if (payload.duration) {
        toolbar.currentDuration = payload.duration
      }
      if (payload.feature) {
        toolbar.currentFeature = payload.feature
      }
    }
    return
  }

  if (nextType === 'agent' && payload.skill) {
    const toolbar = getActiveAgentToolbar()
    if (toolbar) {
      toolbar.currentSkill = payload.skill
    }
  }
}

// 直接提交外部草稿，保持走组件内部已有发送装配逻辑。
const submitDraft = async (payload: GeneratorDraftPayload) => {
  await applyDraft(payload)
  handleSubmit()
}

// 暴露方法供父组件调用
defineExpose({
  expand,
  collapse,
  toggle,
  isCollapsed,
  currentType,
  inputValue,
  handleSubmit,
  applyDraft,
  submitDraft,
})

// 根据创作类型返回不同的 placeholder
const placeholder = computed(() => {
  // 外部强制覆盖（节点下方等场景）优先级最高
  const overrideText = String(props.placeholderOverride || '').trim()
  if (overrideText) return overrideText
  const configuredPlaceholder = String(inputSettings.value?.placeholder || '').trim()
  if (isCollapsed.value) {
    return configuredPlaceholder || '说说今天想做点什么'
  }
  switch (currentType.value) {
    case 'agent':
      return configuredPlaceholder || '说说今天想做点什么'
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
// 默认将非侧边栏场景统一成新版样式，侧边栏仍保留紧凑布局
const isHomeVariant = computed(() => !isSidebar.value && props.variant === 'home')

// 根据折叠状态和布局模式返回不同的高度
const promptControlHeight = computed(() => {
  if (isSidebar.value) {
    return '96px'
  }
  return isCollapsed.value ? '42px' : '96px'
})

// 判断是否显示价格信息
const showPrice = computed(() => {
  return !isCollapsed.value && (currentType.value === 'image' || currentType.value === 'video')
})

// 获取价格文本
const readCurrentModelPointCost = () => {
  const currentModelKey = currentType.value === 'image'
    ? imageToolbarRef.value?.currentModelVersion
    : currentType.value === 'video'
      ? videoToolbarRef.value?.currentModelVersion
      : ''

  if (!currentModelKey) return 0

  const model = getModelByName(currentModelKey) as { defaultParams?: Record<string, any> } | null
  return Math.max(0, Number(model?.defaultParams?.billingRule?.power || 0))
}

const priceText = computed(() => {
  const pointCost = readCurrentModelPointCost()

  switch (currentType.value) {
    case 'image':
      return `${pointCost || 0} / 张`
    case 'video':
      return String(pointCost || 0)
    default:
      return ''
  }
})

// 外层容器布局类名
const layoutClass = computed(() =>
  isSidebar.value ? 'canvas-layout' : 'default-layout-bOIxyJ default-layout-eH8Zi1 dimension-layout-IIVEBh'
)

// 提交按钮容器类名
const submitButtonContainerClass = computed(() =>
  isSidebar.value ? 'collapsed-submit-button-container-jhILhg' : 'collapsed-submit-button-container-Xdi8Y7 collapsed-submit-button-container-mpqEwH'
)

// 折叠状态提交按钮类名
const collapsedSubmitButtonClass = computed(() =>
  isSidebar.value ? 'collapsed-submit-button-RE6ufv' : 'collapsed-submit-button-o26OIS collapsed-submit-button-CfMOHV submit-button-z7zxBM'
)

// 是否有参考图（图片、视频和 Agent 模式有参考图上传）
const hasReferences = computed(() =>
  currentType.value === 'image' || currentType.value === 'video' || currentType.value === 'agent'
)

// 参考图容器类名（侧边栏和默认模式使用不同类名）
const hasReferencesClass = computed(() =>
  isSidebar.value ? 'has-references-LZsWsN' : 'has-references-rI7rW7'
)

const imageReferenceCount = computed(() => imageReferenceImages.value.length)
const collapsedReferenceRecordText = computed(() => {
  if ((currentType.value === 'image' || currentType.value === 'agent') && imageReferenceImages.value.length) {
    return `参考图片 ${imageReferenceImages.value.length} 张`
  }

  if (currentType.value === 'video') {
    const parts: string[] = []
    if (videoFirstFrameImage.value) {
      parts.push('首帧')
    }
    if (videoLastFrameImage.value) {
      parts.push('尾帧')
    }
    if (parts.length) {
      return `参考画面 ${parts.join(' / ')}`
    }
  }

  return ''
})
const imageReferenceGroupStyle = computed(() => {
  const referenceCount = imageReferenceImages.value.length > 0
    ? imageReferenceImages.value.length + 1
    : 1

  return {
    '--reference-count': String(referenceCount),
    '--reference-item-width': '48px',
    '--reference-item-gap': '4px',
    '--reference-group-content-horizontal-padding': '8px',
    '--reference-group-content-horizontal-total-padding': '16px',
    '--reference-group-collapsed-scale': '0.65625',
    '--reference-group-collapsed-margin-compensation-factor': '-0.34375',
    '--reference-item-rotation-compensation-width': '12px',
  }
})

type ReferenceStackOffset = {
  x: number
  y: number
}

type ReferenceStackCardConfig = {
  outerRotate: number
  innerRotate: number
  collapsedOffset: ReferenceStackOffset
}

type ReferenceStackLayoutConfig = {
  cards: ReferenceStackCardConfig[]
  uploadOuterRotate: number
  uploadCollapsedOffset: ReferenceStackOffset
}

const imageReferenceStackLayoutMap: Record<number, ReferenceStackLayoutConfig> = {
  1: {
    cards: [
      { outerRotate: 8, innerRotate: -8, collapsedOffset: { x: 0, y: 2 } },
    ],
    uploadOuterRotate: 22,
    uploadCollapsedOffset: { x: 18, y: 35 },
  },
  2: {
    cards: [
      { outerRotate: 8, innerRotate: -8, collapsedOffset: { x: 0, y: 3 } },
      { outerRotate: -4, innerRotate: 4, collapsedOffset: { x: 6, y: 1 } },
    ],
    uploadOuterRotate: 22,
    uploadCollapsedOffset: { x: 21, y: 35 },
  },
  3: {
    cards: [
      { outerRotate: 8, innerRotate: -8, collapsedOffset: { x: -1, y: 5 } },
      { outerRotate: -4, innerRotate: 4, collapsedOffset: { x: 7, y: 1 } },
      { outerRotate: -12, innerRotate: 12, collapsedOffset: { x: 16, y: -3 } },
    ],
    uploadOuterRotate: 22,
    uploadCollapsedOffset: { x: 25, y: 35 },
  },
  4: {
    cards: [
      { outerRotate: 8, innerRotate: -8, collapsedOffset: { x: -1, y: 5 } },
      { outerRotate: -4, innerRotate: 4, collapsedOffset: { x: 7, y: 1 } },
      { outerRotate: -12, innerRotate: 12, collapsedOffset: { x: 16, y: -3 } },
      { outerRotate: -18, innerRotate: 18, collapsedOffset: { x: 22, y: -5 } },
    ],
    uploadOuterRotate: 22,
    uploadCollapsedOffset: { x: 27, y: 35 },
  },
}

const getImageReferenceLayoutKey = () => {
  const count = imageReferenceImages.value.length
  if (count <= 1) {
    return 1
  }
  if (count >= 4) {
    return 4
  }
  return count
}

const getImageReferenceLayoutConfig = (): ReferenceStackLayoutConfig =>
  imageReferenceStackLayoutMap[getImageReferenceLayoutKey()]

const getImageReferenceCardConfig = (index: number): ReferenceStackCardConfig => {
  const layoutConfig = getImageReferenceLayoutConfig()
  return layoutConfig.cards[index] ?? layoutConfig.cards[layoutConfig.cards.length - 1]
}

const getImageReferenceOuterRotate = (index: number) =>
  `${getImageReferenceCardConfig(index).outerRotate}deg`

const getImageReferenceCardRotate = (index: number) =>
  `${getImageReferenceCardConfig(index).innerRotate}deg`

const getImageReferenceUploadRotate = () =>
  `${getImageReferenceLayoutConfig().uploadOuterRotate}deg`

const getImageReferenceCollapsedOffset = (index: number) =>
  getImageReferenceCardConfig(index).collapsedOffset

const getImageReferenceUploadCollapsedOffset = () =>
  getImageReferenceLayoutConfig().uploadCollapsedOffset

const readFileAsDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => resolve(String(reader.result || ''))
  reader.onerror = () => reject(new Error('读取参考图失败'))
  reader.readAsDataURL(file)
})

const resolveSelectedImageDataList = async (event: Event) => {
  const input = event.target as HTMLInputElement | null
  const files = Array.from(input?.files || [])
  if (!files.length) {
    return [] as string[]
  }

  try {
    return (await Promise.all(files.map(file => readFileAsDataUrl(file)))).filter(Boolean)
  } finally {
    if (input) {
      input.value = ''
    }
  }
}

const handleImageReferenceChange = async (event: Event) => {
  const imageDataList = await resolveSelectedImageDataList(event)
  if (!imageDataList.length) {
    return
  }

  imageReferenceImages.value = [...imageReferenceImages.value, ...imageDataList].slice(0, IMAGE_REFERENCE_LIMIT)
}

const removeImageReference = (index: number) => {
  imageReferenceImages.value = imageReferenceImages.value.filter((_, currentIndex) => currentIndex !== index)
}

const handleVideoFirstFrameChange = async (event: Event) => {
  const imageDataList = await resolveSelectedImageDataList(event)
  videoFirstFrameImage.value = imageDataList[0] || ''
}

const handleVideoLastFrameChange = async (event: Event) => {
  const imageDataList = await resolveSelectedImageDataList(event)
  videoLastFrameImage.value = imageDataList[0] || ''
}

const clearVideoFirstFrame = () => {
  videoFirstFrameImage.value = ''
}

const clearVideoLastFrame = () => {
  videoLastFrameImage.value = ''
}

const clearCollapsedReferences = () => {
  if (currentType.value === 'image' || currentType.value === 'agent') {
    imageReferenceImages.value = []
    return
  }

  if (currentType.value === 'video') {
    videoFirstFrameImage.value = ''
    videoLastFrameImage.value = ''
  }
}

const openImageReferencePicker = () => {
  imageReferenceInputRef.value?.click()
}

const openVideoFirstFramePicker = () => {
  videoFirstFrameInputRef.value?.click()
}

const openVideoLastFramePicker = () => {
  videoLastFrameInputRef.value?.click()
}

// ========== 调整大小手柄逻辑 ==========

// 是否正在拖拽调整大小
const isResizing = ref(false)

// 最小和最大面板宽度
const MIN_PANEL_WIDTH = 320
const MAX_PANEL_WIDTH = 800

// 调整大小中
const handleResizeMove = (e: MouseEvent) => {
  if (!isResizing.value) return

  // 计算新的宽度（从窗口右边缘到鼠标位置）
  const newWidth = window.innerWidth - e.clientX

  // 限制在最小和最大宽度之间
  const clampedWidth = Math.max(MIN_PANEL_WIDTH, Math.min(MAX_PANEL_WIDTH, newWidth))

  // 触发 resize 事件
  emit('resize', clampedWidth)
}

// 结束调整大小
const handleResizeEnd = () => {
  isResizing.value = false
  document.removeEventListener('mousemove', handleResizeMove)
  document.removeEventListener('mouseup', handleResizeEnd)
  // 恢复样式
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
}

// 组件卸载时清理事件监听
onUnmounted(() => {
  if (isResizing.value) {
    handleResizeEnd()
  }
})

</script>

<template>
  <div :class="['dimension-layout-FUl4Nj', layoutClass, { 'collapsed-WjKggt': isCollapsed }]"
       style="--content-generator-collapse-transition-duration:350ms;--content-generator-collapse-transition-timing-function:cubic-bezier(0.15,0.75,0.3,1)"
       @click="handleClick">
    <div class="layout-KSckhZ">
      <div class="content-oZ2zsI">
        <!-- 参考图上传区域 -->
        <!-- 图片模式：上传前保持原单卡布局，上传后切多图编排 -->
        <div v-if="(currentType === 'image' || currentType === 'agent') && !(currentType === 'agent' && hideImageUpload)" :class="['references-vWIzeo', 'references-Gf5d1P', { 'collapsed-_VpN2b collapsed-IXfvom': isCollapsed && !isSidebar }]">
          <div :class="['reference-group-_DAGw1', 'reference-group-c2buvf', { 'collapsed-J9LsWu collapsed-GMNiSS': isCollapsed && !isSidebar, 'generator-reference-group--multi': imageReferenceImages.length > 0 }]"
               :style="imageReferenceGroupStyle">
            <div class="reference-group-background-f6pFpT reference-group-background-cr79bH"></div>
            <div class="reference-group-hover-trigger-YTDCQf reference-group-hover-trigger-PWvSPa"></div>
            <div
              v-if="imageReferenceImages.length"
              class="reference-group-content-ztz9q2 reference-group-content-QdAV7x expanded-hIAQK3 generator-reference-group-content generator-reference-group-content--multi"
            >
              <div
                v-for="(imageUrl, imageIndex) in imageReferenceImages"
                :key="`${imageIndex}-${imageUrl.slice(0, 24)}`"
                class="reference-item-aI97LK reference-item-9l_dgA expanded-fVSy9S expanded-KysGyy generator-reference-item-card"
                :data-index="imageIndex"
                :style="{
                  '--index-in-group': imageIndex,
                  '--rotate': getImageReferenceOuterRotate(imageIndex),
                  '--reference-collapsed-offset-x': `${getImageReferenceCollapsedOffset(imageIndex).x}px`,
                  '--reference-collapsed-offset-y': `${getImageReferenceCollapsedOffset(imageIndex).y}px`,
                  '--reference-hover-z-index': imageReferenceImages.length + 4,
                  zIndex: imageIndex + 1,
                }"
              >
                <div
                  role="button"
                  tabindex="0"
                  aria-disabled="false"
                  aria-roledescription="sortable"
                  style="transition:none;opacity:1;width:100%;height:100%"
                >
                  <div
                    class="reference generator-reference-card"
                    :style="{ '--rotate': getImageReferenceCardRotate(imageIndex) }"
                  >
                    <img :src="imageUrl" alt="参考图" class="image-iZ3_fA reference-image-FbuFFj generator-reference-preview-image"  draggable="false">
                    <div class="remove-button-container">
                      <button type="button" class="remove-button generator-reference-clear-btn" @click.stop="removeImageReference(imageIndex)">
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M19.579 6.119a1.2 1.2 0 0 0-1.697-1.698L12 10.303 6.12 4.422a1.2 1.2 0 1 0-1.697 1.697L10.303 12l-5.881 5.882a1.2 1.2 0 0 0 1.697 1.697L12 13.698l5.882 5.882a1.2 1.2 0 1 0 1.697-1.697L13.697 12l5.882-5.882Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div
                class="reference-item-aI97LK reference-item-9l_dgA expanded-fVSy9S expanded-KysGyy generator-reference-item-card generator-reference-item-card--upload"
                :data-index="imageReferenceImages.length"
                :style="{
                  '--index-in-group': imageReferenceImages.length,
                  '--rotate': getImageReferenceUploadRotate(),
                  '--reference-collapsed-offset-x': `${getImageReferenceUploadCollapsedOffset().x}px`,
                  '--reference-collapsed-offset-y': `${getImageReferenceUploadCollapsedOffset().y}px`,
                  '--reference-hover-z-index': imageReferenceImages.length + 5,
                  zIndex: imageReferenceImages.length + 1,
                }"
              >
                <div style="transition:none;opacity:1;width:100%;height:100%">
                  <div
                    class="reference-upload-Yi4KkS mini-tVZaR4 generator-reference-upload-mini"
                    :class="{ 'generator-reference-upload-mini--disabled disabled-wEh7Oq': imageReferenceCount >= IMAGE_REFERENCE_LIMIT }"
                    :style="{ '--rotate': '0deg' }"
                    @click.stop="imageReferenceCount < IMAGE_REFERENCE_LIMIT && openImageReferencePicker()"
                  >
                    <svg class="icon-cWdiC3 generator-reference-upload-mini__icon" fill="none" height="1em"
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
                           class="file-input file-input-sQ_uuS sf-hidden"
                           ref="imageReferenceInputRef"
                           type="file"
                           multiple
                           @change="handleImageReferenceChange">
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="reference-group-content-ztz9q2 expanded-hIAQK3">
              <div class="reference-item-aI97LK expanded-fVSy9S"
                   data-index="0"
                   style="--index-in-group:0;--rotate:8deg">
                <div class="reference-upload-h7tmnr light-Bis76t"
                     @click.stop="openImageReferencePicker"
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
                         class="file-input sf-hidden"
                         ref="imageReferenceInputRef"
                         type="file"
                         multiple
                         @change="handleImageReferenceChange">
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 视频模式：首尾帧上传 -->
        <div v-else-if="currentType === 'video'" :class="['references-vWIzeo', { 'collapsed-_VpN2b': isCollapsed && !isSidebar }]">
          <!-- 首帧上传 -->
          <div :class="['reference-group-_DAGw1', { 'collapsed-J9LsWu': isCollapsed && !isSidebar }]"
               style="--reference-count:1;--reference-item-width:48px;--reference-item-gap:4px">
            <div class="reference-group-background-f6pFpT"></div>
            <div class="reference-group-hover-trigger-YTDCQf"></div>
            <div class="reference-group-content-ztz9q2 expanded-hIAQK3">
              <div class="reference-item-aI97LK expanded-fVSy9S"
                   data-index="0"
                   style="--index-in-group:0;--rotate:8deg">
                <div class="reference-upload-h7tmnr light-Bis76t"
                     @click.stop="openVideoFirstFramePicker"
                     style="--rotate:-8deg">
                  <template v-if="videoFirstFrameImage">
                    <img :src="videoFirstFrameImage" alt="首帧参考图" class="generator-reference-preview-image">
                    <button type="button" class="generator-reference-clear-btn" @click.stop="clearVideoFirstFrame">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path>
                      </svg>
                    </button>
                  </template>
                  <svg v-else class="icon-TrJRuq" fill="none" height="1em"
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
                  <div class="label-O_5YLx">首帧</div>
                  <input accept="image/jpeg,.jpeg,image/jpg,.jpg,image/png,.png,image/webp,.webp,image/bmp,.bmp"
                         class="file-input sf-hidden"
                         ref="videoFirstFrameInputRef"
                         type="file"
                         @change="handleVideoFirstFrameChange">
                </div>
              </div>
            </div>
          </div>

          <!-- 交换按钮 -->
          <button class="lv-btn lv-btn-secondary lv-btn-size-default lv-btn-shape-square lv-btn-icon-only button-c41WFq swap-button"
                  type="button">
            <svg width="1em" height="1em" viewBox="0 0 24 24"
                 preserveAspectRatio="xMidYMid meet"
                 fill="none" role="presentation"
                 xmlns="http://www.w3.org/2000/svg">
              <g>
                <path data-follow-fill="currentColor"
                      d="M8.5 5.5a1 1 0 0 0-1.707-.707l-3 3A1 1 0 0 0 4.5 9.5h15a1 1 0 0 0 0-2h-11v-2Zm7 13a1 1 0 0 0 1.707.707l3-3A1 1 0 0 0 19.5 14.5h-15a1 1 0 1 0 0 2h11v2Z"
                      clip-rule="evenodd"
                      fill-rule="evenodd"
                      fill="currentColor"></path>
              </g>
            </svg>
          </button>

          <!-- 尾帧上传 -->
          <div :class="['reference-group-_DAGw1', 'last-frame', { 'collapsed-J9LsWu': isCollapsed && !isSidebar }]"
               style="--reference-count:1;--reference-item-width:48px;--reference-item-gap:4px">
            <div class="reference-group-background-f6pFpT"></div>
            <div class="reference-group-hover-trigger-YTDCQf"></div>
            <div class="reference-group-content-ztz9q2 expanded-hIAQK3">
              <div class="reference-item-aI97LK expanded-fVSy9S"
                   data-index="0"
                   style="--index-in-group:0;--rotate:-5deg">
                <div class="reference-upload-h7tmnr light-Bis76t"
                     @click.stop="openVideoLastFramePicker"
                     style="--rotate:5deg">
                  <template v-if="videoLastFrameImage">
                    <img :src="videoLastFrameImage" alt="尾帧参考图" class="generator-reference-preview-image">
                    <button type="button" class="generator-reference-clear-btn" @click.stop="clearVideoLastFrame">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path>
                      </svg>
                    </button>
                  </template>
                  <svg v-else class="icon-TrJRuq" fill="none" height="1em"
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
                  <div class="label-O_5YLx">尾帧</div>
                  <input accept="image/jpeg,.jpeg,image/jpg,.jpg,image/png,.png,image/webp,.webp,image/bmp,.bmp"
                         class="file-input sf-hidden"
                         ref="videoLastFrameInputRef"
                         type="file"
                         @change="handleVideoLastFrameChange">
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 主内容区域 -->
        <div :class="['main-content-pao8ef', 'main-content-eTfdBT', { 'main-content-MTw5sD': isCollapsed || isSidebar, 'collapsed-SD4UgZ': isCollapsed }]">
          <!-- 折叠状态下的引用记录文本区域 -->
          <div
            v-if="isCollapsed && collapsedReferenceRecordText"
            class="reference-record-text-container collapsed-SgPm0K"
          >
            <div class="reference-record-text">
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
              <span class="content-lZaX5g">{{ collapsedReferenceRecordText }}</span>
              <span class="divider-GjrSf1"></span>
              <button type="button" class="icon-TICgEz icon-close" @click.stop="clearCollapsedReferences">
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
              </button>
            </div>
          </div>

          <!-- 提示词输入区域 -->
          <div :class="['prompt-container', 'prompt-editor-container-HRhsP7', { 'collapsed-L4sRxQ': isCollapsed && !isSidebar }]"
               :style="`--content-generator-prompt-control-height:${promptControlHeight};--content-generator-prompt-control-line-height:24px`">
            <div :class="['prompt-editor-aDwTfA', { 'collapsed-L4sRxQ': isCollapsed && !isSidebar }]">
              <textarea
                  v-model="inputValue"
                  :class="['lv-textarea', 'textarea-rfj34A', 'prompt-textarea', { 'collapsed-l8bAEB': isCollapsed, 'collapse-transition-start': isCollapsed }]"
                  :placeholder="placeholder"
                  translate="no"
                  @input="handleInput"
                  @keydown="handleKeydown"></textarea>
            </div>
            <div class="prompt-textarea-sizer prompt-editor-sizer-S4F9P4">
              <input
                  v-model="inputValue"
                  :class="['lv-input', 'lv-input-size-default', 'input-JjM14b', 'prompt-input', { 'collapsed-l8bAEB': isCollapsed, 'collapse-transition-start': isCollapsed }]"
                  :placeholder="placeholder"
                  translate="no"
                  @input="handleInput"
                  @keydown="handleKeydown">
            </div>
          </div>
        </div>

        <!-- 折叠状态下的提交按钮 -->
        <div
          v-if="workbenchSettings.showSubmitButton !== false"
          :class="[submitButtonContainerClass, { 'collapsed-WjKggt collapsed-HnZBhi': isCollapsed, [hasReferencesClass]: hasReferences }]"
        >
          <!-- 根据创作类型显示价格信息（仅图片和视频类型显示） -->
          <div v-if="showPrice" class="commercial-button-content commercial-button-content-jVIddd">
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
            <button :class="['lv-btn', 'lv-btn-primary', 'lv-btn-size-default', 'lv-btn-shape-circle', 'lv-btn-icon-only', 'button-lc3WzE', 'submit-button-KJTUYS', collapsedSubmitButtonClass, { 'collapsed-WjKggt': isCollapsed, 'expand-transition-start': !isCollapsed, 'lv-btn-disabled': isSubmitDisabled, 'home-submit-button': isHomeVariant }]"
                    :disabled="isSubmitDisabled"
                    type="button"
                    @click.stop="handleSubmit">
              <svg v-if="isHomeVariant"
                   fill="none"
                   height="20"
                   preserveAspectRatio="xMidYMid meet"
                   role="presentation"
                   viewBox="0 0 24 24"
                   width="20"
                   xmlns="http://www.w3.org/2000/svg">
                <path d="M12 15.6V8.9"
                      stroke="currentColor"
                      stroke-linecap="round"
                      stroke-width="2"></path>
                <path d="M9.35 11.55 12 8.9l2.65 2.65"
                      stroke="currentColor"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"></path>
              </svg>
              <svg v-else
                   fill="none" height="1em"
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
      <div :class="['toolbar-tBNbB3', 'toolbar-k7Mdy_', { 'collapsed-fUbQ9y collapsed-jPdgrA': isCollapsed && !isSidebar }]">
        <div class="container-yMr4oW container-vUEhlb toolbar-settings-YNMCja toolbar-settings-hsPiGw">
          <div class="content-BF8rbZ content-Rvn0mS toolbar-settings-content-uImXGN toolbar-settings-content-AqQb52">
            <!-- 折叠状态：创作类型选择 + Agent 工具栏 -->
            <template v-if="isCollapsed && !isSidebar">
              <!-- 类型选择器 -->
              <TypeSelector
                v-if="conversationEntrySettings.mode.enabled && !hideTypeSelector"
                ref="typeSelectorRef"
                v-model="currentType"
                :options="availableModeOptions"
                :placement="popupPlacement"
                @open="handleTypeSelectorOpen"
              />

              <!-- Agent 工具栏（折叠状态下显示） -->
              <AgentToolbar
                ref="agentToolbarRef"
                :placement="popupPlacement"
                :show-model-selector="conversationEntrySettings.modelSelector.enabled"
                :show-assistant-selector="!hideSkillSelector && conversationEntrySettings.assistantSelector.enabled"
                :default-model-key="conversationEntrySettings.modelSelector.defaultModelKey"
                :allowed-model-keys="conversationEntrySettings.modelSelector.allowedModelKeys"
                :default-assistant-key="conversationEntrySettings.assistantSelector.defaultAssistantKey"
                :allowed-assistant-keys="conversationEntrySettings.assistantSelector.allowedAssistantKeys"
                :show-auto-action="conversationEntrySettings.actions.auto.visible"
                :auto-action-enabled="conversationEntrySettings.actions.auto.defaultEnabled"
                :show-inspiration-action="conversationEntrySettings.actions.inspiration.visible"
                :inspiration-action-enabled="conversationEntrySettings.actions.inspiration.defaultEnabled"
                :show-creative-design-action="conversationEntrySettings.actions.creativeDesign.visible"
                :creative-design-action-enabled="conversationEntrySettings.actions.creativeDesign.defaultEnabled"
                @panelOpen="handleAgentToolbarPanelOpen"
              />
            </template>

            <!-- 展开状态或侧边栏模式：根据创作类型显示不同工具栏 -->
            <template v-else>
              <!-- 类型选择器（侧边栏模式使用紧凑模式） -->
              <TypeSelector
                v-if="conversationEntrySettings.mode.enabled && !hideTypeSelector"
                ref="typeSelectorExpandRef"
                v-model="currentType"
                :options="availableModeOptions"
                :placement="popupPlacement"
                :compact="isSidebar"
                @open="handleTypeSelectorOpen"
              />

              <!-- 附件按钮（仅侧边栏 Agent 模式显示） -->
              <button v-if="isSidebar && currentType === 'agent' && !hideImageUpload"
                      class="lv-btn lv-btn-secondary lv-btn-size-default lv-btn-shape-square lv-btn-icon-only button-lc3WzE toolbar-button-FhFnQ_"
                      type="button"
                      :title="imageReferenceCount ? `参考图片 ${imageReferenceCount} 张` : '添加参考图片'"
                      @click.stop="openImageReferencePicker">
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
              <AgentToolbar
                v-if="currentType === 'agent'"
                ref="agentToolbarExpandRef"
                :placement="popupPlacement"
                :icon-only="isSidebar && !verboseToolbar"
                :show-model-selector="conversationEntrySettings.modelSelector.enabled"
                :show-assistant-selector="!hideSkillSelector && conversationEntrySettings.assistantSelector.enabled"
                :default-model-key="conversationEntrySettings.modelSelector.defaultModelKey"
                :allowed-model-keys="conversationEntrySettings.modelSelector.allowedModelKeys"
                :default-assistant-key="conversationEntrySettings.assistantSelector.defaultAssistantKey"
                :allowed-assistant-keys="conversationEntrySettings.assistantSelector.allowedAssistantKeys"
                :show-auto-action="conversationEntrySettings.actions.auto.visible"
                :auto-action-enabled="conversationEntrySettings.actions.auto.defaultEnabled"
                :show-inspiration-action="conversationEntrySettings.actions.inspiration.visible"
                :inspiration-action-enabled="conversationEntrySettings.actions.inspiration.defaultEnabled"
                :show-creative-design-action="conversationEntrySettings.actions.creativeDesign.visible"
                :creative-design-action-enabled="conversationEntrySettings.actions.creativeDesign.defaultEnabled"
                @panelOpen="handleAgentToolbarPanelOpen"
              />

              <!-- 图片生成工具栏 -->
              <ImageToolbar v-else-if="currentType === 'image'" ref="imageToolbarRef" :placement="popupPlacement" :icon-only="isSidebar && !verboseToolbar" />

              <!-- 视频生成工具栏 -->
              <VideoToolbar v-else-if="currentType === 'video'" ref="videoToolbarRef" :placement="popupPlacement" :icon-only="isSidebar && !verboseToolbar" />

              <!-- 数字人/动作模仿工具栏 -->
              <DigitalHumanToolbar v-else :placement="popupPlacement" :icon-only="isSidebar && !verboseToolbar" />
            </template>
          </div>
        </div>

        <!-- 提交按钮区域 -->
        <div class="toolbar-actions-DsJHmQ toolbar-actions-pDJQS6">
          <!-- 根据创作类型显示价格信息（仅图片和视频类型显示） -->
          <div v-if="showPrice" class="commercial-button-content commercial-button-content-jVIddd">
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
            <button :class="['lv-btn', 'lv-btn-primary', 'lv-btn-size-default', 'lv-btn-shape-circle', 'lv-btn-icon-only', 'button-lc3WzE', 'submit-button-KJTUYS', 'submit-button-z7zxBM', isSidebar ? 'submit-button-qiVtq5' : 'submit-button-CpjScj submit-button-wD1gIc', { 'collapsed-WjKggt': isCollapsed, 'expand-transition-start': !isCollapsed, 'lv-btn-disabled': isSubmitDisabled, 'home-submit-button': isHomeVariant }]"
                    :disabled="isSubmitDisabled"
                    type="button"
                    @click.stop="handleSubmit">
              <!-- 首页按钮使用更接近参考图的直箭头图标 -->
              <svg v-if="isHomeVariant"
                   fill="none"
                   height="20"
                   preserveAspectRatio="xMidYMid meet"
                   role="presentation"
                   viewBox="0 0 24 24"
                   width="20"
                   xmlns="http://www.w3.org/2000/svg">
                <path d="M12 15.6V8.9"
                      stroke="currentColor"
                      stroke-linecap="round"
                      stroke-width="2"></path>
                <path d="M9.35 11.55 12 8.9l2.65 2.65"
                      stroke="currentColor"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"></path>
              </svg>
              <svg v-else
                   fill="none" height="1em"
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

/* 统一新版发送按钮样式：普通布局走反转圆钮，侧边栏保持原样 */
.dimension-layout-FUl4Nj .home-submit-button.lv-btn.lv-btn-primary {
  width: 40px;
  height: 40px;
  border: none;
  background: var(--text-primary);
  color: var(--inverse-text-primary);
  box-shadow: none;
}

.dimension-layout-FUl4Nj .home-submit-button.lv-btn.lv-btn-primary:not(.lv-btn-disabled):hover {
  background: color-mix(in srgb, var(--text-primary) 92%, var(--bg-body));
  color: var(--inverse-text-primary);
}

.dimension-layout-FUl4Nj .home-submit-button.lv-btn.lv-btn-primary:not(.lv-btn-disabled):active {
  background: color-mix(in srgb, var(--text-primary) 84%, var(--bg-body));
}

.dimension-layout-FUl4Nj .home-submit-button.lv-btn.lv-btn-primary.lv-btn-disabled {
  background: color-mix(in srgb, var(--text-primary) 28%, transparent);
  color: color-mix(in srgb, var(--inverse-text-primary) 72%, transparent);
}

.dimension-layout-FUl4Nj .home-submit-button > svg {
  width: 20px;
  height: 20px;
}

.dimension-layout-FUl4Nj.default-layout-eH8Zi1,
.dimension-layout-FUl4Nj .default-layout-eH8Zi1 {
  margin: 0 auto;
  max-width: 924px;
  min-width: 622px;
  /*position: sticky;*/
  width: 100%;
}

@media screen and (max-width: 1920px) {
  .dimension-layout-FUl4Nj.default-layout-eH8Zi1:not(.collapsed-WjKggt),
  .task-indicator-container-flqXza:not(.collapsed-WjKggt) {
    max-width: 800px;
  }
}

@media screen and (max-width: 1280px) {
  .dimension-layout-FUl4Nj.default-layout-eH8Zi1:not(.collapsed-WjKggt),
  .task-indicator-container-flqXza:not(.collapsed-WjKggt) {
    max-width: 700px;
  }
}

.dimension-layout-FUl4Nj .main-content-eTfdBT {
  flex: 1 1;
  margin-right: -8px;
  position: relative;
}

.dimension-layout-FUl4Nj .prompt-editor-container-HRhsP7 {
  overflow: hidden;
  position: relative;
}

.dimension-layout-FUl4Nj .prompt-editor-aDwTfA.collapsed-L4sRxQ,
.dimension-layout-FUl4Nj .prompt-editor-container-HRhsP7.collapsed-L4sRxQ {
  transition: opacity var(--content-generator-collapse-transition-duration) var(--content-generator-collapse-transition-timing-function),
    transform var(--content-generator-collapse-transition-duration) var(--content-generator-collapse-transition-timing-function);
  will-change: opacity, transform;
}

.dimension-layout-FUl4Nj .prompt-editor-container-HRhsP7.collapsed-L4sRxQ {
  opacity: 0.98;
}

.dimension-layout-FUl4Nj .prompt-editor-aDwTfA {
  transition: opacity var(--content-generator-collapse-transition-duration) var(--content-generator-collapse-transition-timing-function),
    transform var(--content-generator-collapse-transition-duration) var(--content-generator-collapse-transition-timing-function);
  will-change: opacity, transform;
}

.dimension-layout-FUl4Nj .prompt-editor-aDwTfA.collapsed-L4sRxQ {
  transform: translateY(1px);
}

.dimension-layout-FUl4Nj .collapsed-submit-button-container-mpqEwH {
  bottom: 16px;
  display: flex;
  gap: 12px;
  position: absolute;
  right: 16px;
  transition: transform var(--content-generator-collapse-transition-duration) var(--content-generator-collapse-transition-timing-function),
    opacity var(--content-generator-collapse-transition-duration) var(--content-generator-collapse-transition-timing-function);
  visibility: hidden;
  will-change: transform, opacity;
}

.dimension-layout-FUl4Nj .collapsed-submit-button-container-mpqEwH.collapsed-HnZBhi {
  visibility: visible;
}

.dimension-layout-FUl4Nj .collapsed-submit-button-container-mpqEwH.collapsed-HnZBhi.has-references-rI7rW7 {
  transform: translateY(-4px);
}

.dimension-layout-FUl4Nj .submit-button-z7zxBM.collapsed-submit-button-CfMOHV.lv-btn-size-default.lv-btn-icon-only {
  font-size: 20px;
}

.dimension-layout-FUl4Nj .collapsed-submit-button-container-mpqEwH.collapsed-HnZBhi .submit-button-z7zxBM.collapsed-submit-button-CfMOHV.lv-btn-size-default.lv-btn-icon-only {
  width: 32px;
  height: 32px;
  font-size: 16px;
}

.dimension-layout-FUl4Nj .toolbar-k7Mdy_ {
  align-items: center;
  display: flex;
  gap: 12px;
  height: 36px;
  justify-content: space-between;
  margin-top: 0;
  max-width: 100%;
  transition: margin-top var(--content-generator-collapse-transition-duration) var(--content-generator-collapse-transition-timing-function),
    opacity var(--content-generator-collapse-transition-duration) var(--content-generator-collapse-transition-timing-function),
    transform var(--content-generator-collapse-transition-duration) var(--content-generator-collapse-transition-timing-function);
  width: 100%;
  will-change: margin-top, opacity, transform;
}

.dimension-layout-FUl4Nj .toolbar-k7Mdy_.collapsed-jPdgrA {
  margin-top: -48px;
  opacity: 0;
  transform: translateY(60px);
}

.dimension-layout-FUl4Nj .container-vUEhlb.toolbar-settings-hsPiGw {
  flex: 1 1;
  overflow: hidden;
  position: relative;
}

.dimension-layout-FUl4Nj .container-vUEhlb.toolbar-settings-hsPiGw::before,
.dimension-layout-FUl4Nj .container-vUEhlb.toolbar-settings-hsPiGw::after {
  display: none;
}

.dimension-layout-FUl4Nj .content-Rvn0mS.toolbar-settings-content-AqQb52 {
  display: flex;
  gap: 4px;
  min-width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 8px 0;
  scrollbar-width: none;
  -webkit-mask-image: none;
  mask-image: none;
}

.dimension-layout-FUl4Nj .content-Rvn0mS.toolbar-settings-content-AqQb52::-webkit-scrollbar {
  display: none;
}

.dimension-layout-FUl4Nj .toolbar-k7Mdy_.collapsed-jPdgrA .container-vUEhlb.toolbar-settings-hsPiGw::before,
.dimension-layout-FUl4Nj .toolbar-k7Mdy_.collapsed-jPdgrA .container-vUEhlb.toolbar-settings-hsPiGw::after {
  opacity: 0;
}

.dimension-layout-FUl4Nj .toolbar-actions-pDJQS6 {
  align-items: center;
  display: flex;
  flex-shrink: 0;
  gap: 12px;
}

.dimension-layout-FUl4Nj .toolbar-k7Mdy_ .select-NNOj5P {
  font-family: var(--alphanumeric-font-family);
  font-weight: 400;
  width: auto;
}

.dimension-layout-FUl4Nj .toolbar-k7Mdy_ .select-NNOj5P.lv-select .lv-select-suffix:has(svg) {
  margin-left: 4px;
}

.dimension-layout-FUl4Nj .toolbar-k7Mdy_ .select-NNOj5P.lv-select .lv-select-view {
  background-color: transparent;
  border: 1px solid var(--stroke-secondary);
  border-radius: 8px;
  box-shadow: none;
  min-height: 32px;
}

.dimension-layout-FUl4Nj .toolbar-k7Mdy_ .select-NNOj5P.lv-select:focus-visible .lv-select-view,
.dimension-layout-FUl4Nj .toolbar-k7Mdy_ .select-NNOj5P.lv-select:hover .lv-select-view {
  background-color: var(--bg-block-secondary-hover);
}

.dimension-layout-FUl4Nj .toolbar-k7Mdy_ .select-NNOj5P.lv-select:active .lv-select-view {
  background-color: var(--bg-block-secondary-pressed);
}

.dimension-layout-FUl4Nj .toolbar-k7Mdy_ .select-NNOj5P.lv-select-size-default.lv-select-single .lv-select-view {
  font-size: 12px;
  font-weight: 450;
  padding: 0 14px;
}

.dimension-layout-FUl4Nj .toolbar-k7Mdy_ .select-NNOj5P.lv-select-size-default.lv-select-single .lv-select-view:has(.lv-select-suffix svg) {
  padding-right: 12px;
}

.dimension-layout-FUl4Nj .toolbar-k7Mdy_ .select-NNOj5P.lv-select-size-default.lv-select-single .lv-select-view:has(.lv-select-view-value svg) {
  padding-left: 12px;
}

.dimension-layout-FUl4Nj .toolbar-k7Mdy_ .select-NNOj5P.lv-select-single .lv-select-view-selector {
  overflow: visible;
}

.dimension-layout-FUl4Nj .toolbar-k7Mdy_ .select-NNOj5P.lv-select-single .lv-select-view-value {
  gap: 4px;
}

.dimension-layout-FUl4Nj .toolbar-k7Mdy_ .select-NNOj5P.lv-select-single .lv-select-view-value::after {
  display: none;
}

.dimension-layout-FUl4Nj .toolbar-k7Mdy_ .select-NNOj5P .lv-select-arrow-icon {
  align-items: center;
  display: flex;
  font-size: inherit;
  justify-content: center;
}

.dimension-layout-FUl4Nj .toolbar-k7Mdy_ .toolbar-button-pEFNv9.lv-btn.lv-btn-secondary {
  font-weight: 450;
}

.dimension-layout-FUl4Nj .toolbar-k7Mdy_ .toolbar-button-pEFNv9.lv-btn.lv-btn-secondary:not(.lv-btn-disabled) {
  background: transparent;
}

.dimension-layout-FUl4Nj .toolbar-k7Mdy_ .toolbar-button-pEFNv9.lv-btn.lv-btn-secondary:not(.lv-btn-disabled):not(.lv-btn-loading):not(.lv-btn-loading-XPGaZg) {
  border: 1px solid var(--stroke-secondary);
}

.dimension-layout-FUl4Nj .toolbar-k7Mdy_ .toolbar-button-pEFNv9.lv-btn.lv-btn-secondary:not(.lv-btn-disabled):not(.lv-btn-loading):not(.lv-btn-loading-XPGaZg):focus-visible,
.dimension-layout-FUl4Nj .toolbar-k7Mdy_ .toolbar-button-pEFNv9.lv-btn.lv-btn-secondary:not(.lv-btn-disabled):not(.lv-btn-loading):not(.lv-btn-loading-XPGaZg):hover {
  background: var(--bg-block-secondary-hover);
}

.dimension-layout-FUl4Nj .toolbar-k7Mdy_ .toolbar-button-pEFNv9.lv-btn.lv-btn-secondary:not(.lv-btn-disabled):not(.lv-btn-loading):not(.lv-btn-loading-XPGaZg):active {
  background: var(--bg-block-secondary-pressed);
}

.dimension-layout-FUl4Nj .toolbar-button-FhFnQ_.lv-btn.lv-btn-secondary {
  background: transparent;
  border: 1px solid var(--stroke-secondary);
  border-radius: 10px;
  font-weight: 450;
  transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease, transform 0.2s ease;
}

.dimension-layout-FUl4Nj .toolbar-button-FhFnQ_.lv-btn.lv-btn-secondary:not(.lv-btn-disabled):hover {
  background: var(--bg-block-secondary-hover);
}

.dimension-layout-FUl4Nj .toolbar-button-FhFnQ_.lv-btn.lv-btn-secondary:not(.lv-btn-disabled):active {
  background: var(--bg-block-secondary-pressed);
  transform: translateY(0.5px);
}

.dimension-layout-FUl4Nj .commercial-button-content-jVIddd {
  align-items: center;
  color: var(--component-secondary-text-button-default);
  display: flex;
  font-family: var(--alphanumeric-font-family);
  font-size: 12px;
  font-weight: 500;
  gap: 4px;
  justify-content: center;
  transition: opacity var(--content-generator-collapse-transition-duration) var(--content-generator-collapse-transition-timing-function),
    transform var(--content-generator-collapse-transition-duration) var(--content-generator-collapse-transition-timing-function);
  will-change: opacity, transform;
}

.dimension-layout-FUl4Nj .generator-reference-preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: inherit;
}

.dimension-layout-FUl4Nj .references-Gf5d1P {
  align-items: center;
  display: flex;
  gap: 8px;
  height: 80px;
  margin-bottom: 16px;
  max-width: 100%;
  position: relative;
  transition: height var(--content-generator-collapse-transition-duration) var(--content-generator-collapse-transition-timing-function);
  will-change: height;
}

.dimension-layout-FUl4Nj .references-vWIzeo.references-Gf5d1P.collapsed-_VpN2b,
.dimension-layout-FUl4Nj .references-Gf5d1P.collapsed-IXfvom {
  height: 42px;
  margin-bottom: 0;
  max-width: calc(100% - 60px);
}

.dimension-layout-FUl4Nj .main-content-eTfdBT.collapsed-SD4UgZ .commercial-button-content-jVIddd,
.dimension-layout-FUl4Nj .toolbar-k7Mdy_.collapsed-jPdgrA .commercial-button-content-jVIddd {
  opacity: 0;
  transform: translateY(6px);
}

.dimension-layout-FUl4Nj .reference-record-text-container.collapsed-SgPm0K {
  display: block;
  margin-bottom: 8px;
}

.dimension-layout-FUl4Nj .reference-record-text {
  align-items: center;
  background: var(--bg-block-primary-default);
  border-radius: 8px;
  box-sizing: border-box;
  color: var(--text-placeholder);
  display: flex;
  height: 30px;
  padding: 0 8px;
  width: 100%;
}

.dimension-layout-FUl4Nj .reference-record-text .icon-TICgEz {
  align-items: center;
  color: var(--text-tertiary);
  display: flex;
  font-size: 16px;
  height: 16px;
  justify-content: center;
  width: 16px;
}

.dimension-layout-FUl4Nj .reference-record-text .icon-close {
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  padding: 0;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.dimension-layout-FUl4Nj .reference-record-text .icon-close:hover {
  background: var(--bg-block-primary-hover);
  color: var(--text-primary);
}

.dimension-layout-FUl4Nj .reference-record-text .icon-close:active {
  background: var(--bg-block-primary-pressed);
}

.dimension-layout-FUl4Nj .reference-record-text .divider-GjrSf1 {
  background: var(--text-disabled);
  border-radius: 0.5px;
  height: 8px;
  margin: 0 8px;
  width: 1px;
}

.dimension-layout-FUl4Nj .reference-record-text .content-lZaX5g {
  color: var(--text-secondary);
  flex: 1 1;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dimension-layout-FUl4Nj .reference-group-content-ztz9q2.reference-group-content-QdAV7x.generator-reference-group-content--multi {
  height: 64px;
  margin: -12px 0;
  overflow: visible;
  padding: 22px var(--reference-group-content-horizontal-padding);
  position: relative;
  pointer-events: none;
  width: var(--reference-item-width);
}

.dimension-layout-FUl4Nj .reference-group-c2buvf.generator-reference-group--multi {
  position: relative;
  z-index: 1;
}

.dimension-layout-FUl4Nj .reference-group-c2buvf:not(.tiled-afeZsr) {
  transition: margin var(--content-generator-collapse-transition-duration) var(--content-generator-collapse-transition-timing-function),
    transform var(--content-generator-collapse-transition-duration) var(--content-generator-collapse-transition-timing-function);
  will-change: margin, transform;
}

.dimension-layout-FUl4Nj .reference-group-c2buvf.generator-reference-group--multi.collapsed-J9LsWu,
.dimension-layout-FUl4Nj .reference-group-c2buvf.collapsed-GMNiSS {
  margin: 0 calc((var(--reference-item-width) + var(--reference-group-content-horizontal-total-padding)) * var(--reference-group-collapsed-margin-compensation-factor) / 2);
  transform: scale(var(--reference-group-collapsed-scale));
  transform-origin: left center;
  transition: margin var(--content-generator-collapse-transition-duration) var(--content-generator-collapse-transition-timing-function),
    transform var(--content-generator-collapse-transition-duration) var(--content-generator-collapse-transition-timing-function);
  will-change: margin, transform;
}

.dimension-layout-FUl4Nj .generator-reference-group--multi .reference-group-background-f6pFpT {
  position: absolute;
  top: 4px;
  left: 8px;
  width: 48px;
  height: 64px;
  opacity: 0;
  pointer-events: none;
  background: linear-gradient(90deg, rgba(37, 38, 46, 0.6) 82.41%, rgba(37, 38, 46, 0) 98.03%);
  filter: blur(12px);
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1), height 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: width, height, opacity, transform;
}

.dimension-layout-FUl4Nj .generator-reference-group--multi .reference-group-hover-trigger-YTDCQf {
  position: absolute;
  top: -12px;
  left: 0;
  width: 64px;
  height: 92px;
}

.dimension-layout-FUl4Nj .reference-item-aI97LK.generator-reference-item-card {
  transform: translate(var(--reference-collapsed-offset-x, 0px), var(--reference-collapsed-offset-y, 0px));
  transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.24s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: opacity, transform;
  pointer-events: auto;
  transform-origin: left center;
}

.dimension-layout-FUl4Nj .generator-reference-group--multi:has(.generator-reference-item-card:not(.generator-reference-item-card--upload):hover) .reference-item-aI97LK.generator-reference-item-card,
.dimension-layout-FUl4Nj .generator-reference-group--multi:has(.generator-reference-item-card:not(.generator-reference-item-card--upload):focus-within) .reference-item-aI97LK.generator-reference-item-card {
  transform: translateX(calc((var(--reference-item-width) + var(--reference-item-gap)) * var(--index-in-group)));
}

.dimension-layout-FUl4Nj .generator-reference-group--multi:has(.generator-reference-item-card:not(.generator-reference-item-card--upload):hover) .reference-item-aI97LK.generator-reference-item-card[data-index="0"],
.dimension-layout-FUl4Nj .generator-reference-group--multi:has(.generator-reference-item-card:not(.generator-reference-item-card--upload):focus-within) .reference-item-aI97LK.generator-reference-item-card[data-index="0"] {
  z-index: 1;
}

.dimension-layout-FUl4Nj .generator-reference-group--multi:has(.generator-reference-item-card:not(.generator-reference-item-card--upload):hover) .reference-item-aI97LK.generator-reference-item-card[data-index="1"],
.dimension-layout-FUl4Nj .generator-reference-group--multi:has(.generator-reference-item-card:not(.generator-reference-item-card--upload):focus-within) .reference-item-aI97LK.generator-reference-item-card[data-index="1"] {
  z-index: 2;
}

.dimension-layout-FUl4Nj .reference.active-vsfmXd:not(:hover):not(:active) {
  transform: translateY(-8px) scale(1.125) rotate(var(--rotate));
}

.dimension-layout-FUl4Nj .reference-item-aI97LK.generator-reference-item-card:not(.generator-reference-item-card--upload):hover,
.dimension-layout-FUl4Nj .reference-item-aI97LK.generator-reference-item-card:not(.generator-reference-item-card--upload):focus-within {
  transform: translateX(calc((var(--reference-item-width) + var(--reference-item-gap)) * var(--index-in-group))) translateY(-8px) scale(1.125);
  z-index: var(--reference-hover-z-index, 8);
}

.dimension-layout-FUl4Nj .reference-item-aI97LK.generator-reference-item-card:not(.generator-reference-item-card--upload):active {
  transform: translateX(calc((var(--reference-item-width) + var(--reference-item-gap)) * var(--index-in-group))) translateY(-8px) scale(0.98);
  z-index: var(--reference-hover-z-index, 8);
}

.dimension-layout-FUl4Nj .reference-item-aI97LK.generator-reference-item-card--upload {
  z-index: 2;
}

.dimension-layout-FUl4Nj .reference-item-aI97LK.generator-reference-item-card--upload:hover,
.dimension-layout-FUl4Nj .reference-item-aI97LK.generator-reference-item-card--upload:focus-within {
  transform: translate(var(--reference-collapsed-offset-x, 0px), var(--reference-collapsed-offset-y, 0px)) !important;
  z-index: var(--reference-hover-z-index, 9);
}

.dimension-layout-FUl4Nj .reference-item-aI97LK.generator-reference-item-card--upload:active {
  transform: translate(var(--reference-collapsed-offset-x, 0px), var(--reference-collapsed-offset-y, 0px)) !important;
  z-index: var(--reference-hover-z-index, 9);
}

.dimension-layout-FUl4Nj .generator-reference-group--multi:has(.generator-reference-item-card:not(.generator-reference-item-card--upload):hover) .reference-group-background-f6pFpT,
.dimension-layout-FUl4Nj .generator-reference-group--multi:has(.generator-reference-item-card:not(.generator-reference-item-card--upload):focus-within) .reference-group-background-f6pFpT {
  opacity: 1;
  transform: scaleX(calc(1 + var(--reference-count) * 0.28));
  transform-origin: left center;
}

.dimension-layout-FUl4Nj .reference.generator-reference-card {
  align-items: center;
  box-sizing: border-box;
  color: var(--text-placeholder);
  cursor: pointer;
  display: flex;
  justify-content: center;
  overflow: hidden;
  border-radius: 2px;
  border: 1.5px solid var(--onmedia-text-primary, var(--stroke-primary));
  background: var(--bg-block-primary-default);
  transform: rotate(var(--rotate));
  transition: opacity 0.24s cubic-bezier(0.4, 0, 0.2, 1), transform 0.28s cubic-bezier(0.22, 1, 0.36, 1), background-color 0.2s ease, box-shadow 0.24s ease;
  position: relative;
  width: 100%;
  height: 100%;
  will-change: opacity, transform;
}

.dimension-layout-FUl4Nj .reference-item-aI97LK.generator-reference-item-card:hover .reference.generator-reference-card,
.dimension-layout-FUl4Nj .reference-item-aI97LK.generator-reference-item-card:focus-within .reference.generator-reference-card {
  background: var(--bg-block-primary-hover);
}

.dimension-layout-FUl4Nj .reference.generator-reference-card::after {
  content: "";
  position: absolute;
  top: -450%;
  left: -50%;
  width: 200%;
  height: 1000%;
  pointer-events: none;
  opacity: 0;
  background: linear-gradient(90deg, rgba(204, 221, 255, 0), rgba(221, 234, 240, 0.04) 54.57%, rgba(221, 234, 240, 0));
  background-repeat: no-repeat;
  background-size: 50% 100%;
  transform: rotate(22.5deg);
  transform-origin: center;
  transition: opacity 0.25s ease;
}

.dimension-layout-FUl4Nj .reference-item-aI97LK.generator-reference-item-card:hover .reference.generator-reference-card::after,
.dimension-layout-FUl4Nj .reference-item-aI97LK.generator-reference-item-card:focus-within .reference.generator-reference-card::after {
  opacity: 1;
}

.dimension-layout-FUl4Nj .reference-upload-Yi4KkS.generator-reference-upload-mini {
  align-items: center;
  background-color: var(--component-upload-button-default);
  color: var(--text-primary);
  border: 0.5px solid var(--stroke-tertiary);
  display: flex;
  height: 28px;
  justify-content: center;
  border-radius: 14px;
  right: auto;
  left: 50%;
  bottom: auto;
  top: 50%;
  transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1),
    background-color 0.2s ease;
  transform: rotate(var(--rotate)) translate(50%, 50%) translate(-6px, -6px);
  width: 28px;
}

.dimension-layout-FUl4Nj .reference-upload-Yi4KkS.active-N56cta:not(:hover):not(:active) {
  transform: translateY(-8px) scale(1.125) rotate(var(--rotate));
}

.dimension-layout-FUl4Nj .reference-upload-Yi4KkS.generator-reference-upload-mini:hover {
  background-color: var(--component-upload-button-hover);
}

.dimension-layout-FUl4Nj .reference-upload-Yi4KkS.generator-reference-upload-mini:active {
  transform: rotate(var(--rotate)) translate(50%, 50%) translate(-6px, -6px) scale(0.9);
}

.dimension-layout-FUl4Nj .reference-upload-Yi4KkS.generator-reference-upload-mini--disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.dimension-layout-FUl4Nj .reference-upload-Yi4KkS.generator-reference-upload-mini--disabled:active {
  transform: none;
}

.dimension-layout-FUl4Nj .icon-cWdiC3.generator-reference-upload-mini__icon {
  transform: scale(0.75);
}

.dimension-layout-FUl4Nj .remove-button-container {
  align-items: center;
  cursor: pointer;
  display: flex;
  justify-content: center;
  position: absolute;
  top: -3px;
  right: -3px;
  width: 22px;
  height: 22px;
  opacity: 0;
  pointer-events: none;
  transform: rotate(calc(var(--rotate) * -1));
  transition: transform 0.22s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.18s ease;
  z-index: 2;
  will-change: transform, opacity;
}

.dimension-layout-FUl4Nj .remove-button.generator-reference-clear-btn {
  align-items: center;
  box-sizing: border-box;
  display: flex;
  justify-content: center;
  width: 16px;
  height: 16px;
  border: none;
  border-radius: 50%;
  background-color: var(--component-reference-remove-default, rgba(15, 23, 42, 0.78));
  border: 0.5px solid var(--component-reference-remove-border, transparent);
  color: var(--onmedia-text-primary, #fff);
  cursor: pointer;
  padding: 0;
  transform: none;
  transition: background-color 0.22s ease;
}

.dimension-layout-FUl4Nj .reference.generator-reference-card:hover .remove-button-container,
.dimension-layout-FUl4Nj .reference.generator-reference-card:focus-within .remove-button-container,
.dimension-layout-FUl4Nj .reference-item-aI97LK.generator-reference-item-card:active .remove-button-container {
  opacity: 1;
  pointer-events: auto;
}

.dimension-layout-FUl4Nj .reference.generator-reference-card:hover .remove-button.generator-reference-clear-btn,
.dimension-layout-FUl4Nj .reference.generator-reference-card:focus-within .remove-button.generator-reference-clear-btn,
.dimension-layout-FUl4Nj .reference-item-aI97LK.generator-reference-item-card:active .remove-button.generator-reference-clear-btn {
  transform: none;
}

.dimension-layout-FUl4Nj .remove-button-container:hover .remove-button.generator-reference-clear-btn {
  background: var(--component-reference-remove-hover, rgba(15, 23, 42, 0.92));
}

.dimension-layout-FUl4Nj .remove-button-container:active .remove-button.generator-reference-clear-btn {
  background: var(--component-reference-remove-pressed, rgba(15, 23, 42, 0.98));
}
</style>
