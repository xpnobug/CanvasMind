<script setup lang="ts">
/**
 * 工作流主页面
 * 基于 Vue Flow 的节点连线工作流画布
 */
import { computed, ref, watch, onMounted, onUnmounted, nextTick, markRaw } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import { ElMessage } from 'element-plus'
import { VueFlow, useVueFlow, SelectionMode, type Connection, type NodeMouseEvent } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { useAsyncAction, useShortcut } from '@/composables'
import { useLoadingStore } from '@/stores/loading'
import {
  nodes, edges, addNode, addEdge, updateNode, applyCanvasSnapshot,
  canvasViewport, updateViewport,
  undo, redo, canUndo, canRedo, manualSaveHistory, initSampleData, initHistory,
  pauseHistory, resumeHistory,
  type WorkflowAddEdgeParams,
  type WorkflowCanvasEdge,
  type WorkflowNodeType,
} from './composables/useWorkflowCanvas'
import { WORKFLOW_TEMPLATES } from './config/workflows'
import { useWorkflowPersistence } from './composables/useWorkflowPersistence'
import type { WorkflowDefinitionSummary } from './api/definitions'
import { updateWorkflowDefinition } from './api/definitions'
import type { WorkflowCanvasPosition } from './composables/workflow-orchestrator-types'

// 节点组件
import TextNode from './components/nodes/TextNode.vue'
import ImageConfigNode from './components/nodes/ImageConfigNode.vue'
import ImageNode from './components/nodes/ImageNode.vue'
import VideoConfigNode from './components/nodes/VideoConfigNode.vue'
import VideoNode from './components/nodes/VideoNode.vue'
import LlmConfigNode from './components/nodes/LlmConfigNode.vue'

// 边组件
import ImageRoleEdge from './components/edges/ImageRoleEdge.vue'
import PromptOrderEdge from './components/edges/PromptOrderEdge.vue'
import ImageOrderEdge from './components/edges/ImageOrderEdge.vue'
import CanvasDefaultEdge from '@/components/canvas/CanvasDefaultEdge.vue'

// 画布壳（infinite-canvas → canana-vue 迁移产物）
import CanvasContextMenu from '@/components/canvas/CanvasContextMenu.vue'
import CanvasZoomControls from '@/components/canvas/CanvasZoomControls.vue'
import CanvasMiniMap from '@/components/canvas/CanvasMiniMap.vue'
import CanvasConnectionLine from '@/components/canvas/CanvasConnectionLine.vue'
import RightPanel from '@components/canana/RightPanel.vue'
import { useChatSessions } from '@/composables/useChatSessions'
import { useCanvasSelection } from '@/composables/useCanvasSelection'
import { useCanvasClipboard } from '@/composables/useCanvasClipboard'
import { useCanvasDrop } from '@/composables/useCanvasDrop'
import {
  canvasBackgroundMode,
  removeNode,
  duplicateNode,
  clearCanvas,
} from './composables/useWorkflowCanvas'
import type { ContextMenuItem, ContextMenuPosition } from '@/types/canvas-interaction'

const router = useRouter()
const route = useRoute()
const { viewport, zoomIn, zoomOut, fitView, updateNodeInternals, screenToFlowCoordinate } = useVueFlow()

// 注册自定义节点类型
const nodeTypes = {
  text: markRaw(TextNode),
  imageConfig: markRaw(ImageConfigNode),
  image: markRaw(ImageNode),
  videoConfig: markRaw(VideoConfigNode),
  video: markRaw(VideoNode),
  llmConfig: markRaw(LlmConfigNode),
} as any

// 注册自定义边类型
const edgeTypes = {
  default: markRaw(CanvasDefaultEdge),
  imageRole: markRaw(ImageRoleEdge),
  promptOrder: markRaw(PromptOrderEdge),
  imageOrder: markRaw(ImageOrderEdge),
} as any

// 工作流持久化
const {
  currentWorkflowId,
  currentWorkflowDetail,
  workflowList,
  reloadWorkflowList,
  fetchWorkflowDetail,
  loadWorkflowDetail,
  applyWorkflowVersionToCanvas,
  autosaveWorkflow,
  resetCurrentWorkflowState,
} = useWorkflowPersistence()

// UI 状态
const showNodeMenu = ref(false)
const showTemplatePanel = ref(false)
const showWorkflowLibraryPanel = ref(false)
const workflowName = ref('')
const workflowCode = ref('')
const workflowDescription = ref('')
const workflowCategory = ref('')
const workflowListKeyword = ref('')
const workflowLoadingByRoute = ref(false)
const initialCanvasBaselineSnapshot = ref('')
const selectedWorkflowVersionId = ref('')
const selectedLibraryWorkflowId = ref('')
const selectedLibraryWorkflowDetail = ref<null | {
  definition: WorkflowDefinitionSummary
  versions: Array<{
    id: string
    workflowId: string
    createdBy: string | null
    versionNo: number
    versionName: string | null
    changeSummary: string | null
    status: string
    definitionJson: unknown
    nodesJson: unknown
    edgesJson: unknown
    viewportJson: unknown
    inputSchemaJson: unknown
    outputSchemaJson: unknown
    runtimeConfigJson: unknown
    publishedAt: string | null
    createdAt: string
    updatedAt: string
  }>
}>(null)
const autosaveTimer = ref<ReturnType<typeof setTimeout> | null>(null)
const autosaveState = ref<'idle' | 'saving' | 'saved' | 'error'>('idle')
const autosaveErrorMessage = ref('')
const autosaveReady = ref(false)
const autosaveInFlight = ref<Promise<void> | null>(null)

// 头部标题重命名
const renamingTitle = ref(false)
const renameTitleInput = ref('')

interface WorkflowTemplateNode {
  id: string
  type: WorkflowNodeType
  position: WorkflowCanvasPosition
  data: Record<string, unknown>
  newId?: string
}

interface WorkflowTemplateDefinition {
  createNodes: (startPosition: WorkflowCanvasPosition) => {
    nodes: WorkflowTemplateNode[]
    edges: WorkflowCanvasEdge[]
  }
}

interface WorkflowNodeOption {
  type: WorkflowNodeType
  name: string
  color: string
  icon: string
}

const currentWorkflowTitle = computed(() => {
  return currentWorkflowDetail.value?.definition?.name || workflowName.value || '未命名工作流'
})

const currentWorkflowStatusText = computed(() => {
  return currentWorkflowDetail.value?.definition?.status === 'ACTIVE' ? '已发布' : '草稿'
})

const autosaveStatusText = computed(() => {
  if (autosaveState.value === 'saving') {
    return '保存中'
  }

  if (autosaveState.value === 'saved') {
    return '已自动保存'
  }

  if (autosaveState.value === 'error') {
    return autosaveErrorMessage.value || '保存失败'
  }

  return currentWorkflowId.value ? '实时保存已开启' : '准备自动保存'
})

const startRenameTitle = () => {
  renameTitleInput.value = currentWorkflowTitle.value
  renamingTitle.value = true
  nextTick(() => {
    const el = document.querySelector<HTMLInputElement>('.wf-header-meta__title-input')
    el?.focus()
    el?.select()
  })
}

const cancelRenameTitle = () => {
  renamingTitle.value = false
}

const submitRenameTitle = async () => {
  const nextTitle = renameTitleInput.value.trim()
  if (!nextTitle) {
    renamingTitle.value = false
    return
  }

  // 未保存的新工作流：只改本地 name，后续保存/自动保存时带上
  if (!currentWorkflowId.value) {
    workflowName.value = nextTitle
    renamingTitle.value = false
    return
  }

  try {
    const detail = await updateWorkflowDefinition(currentWorkflowId.value, { name: nextTitle })
    currentWorkflowDetail.value = detail
    workflowName.value = detail.definition.name
  } catch (error) {
    console.error('重命名工作流失败', error)
    ElMessage.error('重命名失败，请稍后重试')
  } finally {
    renamingTitle.value = false
  }
}

const buildComparableCanvasSnapshot = (input: {
  nodesJson: unknown
  edgesJson: unknown
  viewportJson: unknown
}) => {
  return JSON.stringify({
    nodesJson: Array.isArray(input.nodesJson) ? input.nodesJson : [],
    edgesJson: Array.isArray(input.edgesJson) ? input.edgesJson : [],
    viewportJson: input.viewportJson && typeof input.viewportJson === 'object'
      ? {
        x: Number((input.viewportJson as { x?: number }).x || 0),
        y: Number((input.viewportJson as { y?: number }).y || 0),
        zoom: Number((input.viewportJson as { zoom?: number }).zoom || 1) || 1,
      }
      : {
        x: 0,
        y: 0,
        zoom: 1,
      },
  })
}

const savedCanvasSnapshot = computed(() => {
  const currentVersion = selectedWorkflowVersionId.value
    ? currentWorkflowDetail.value?.versions?.find(item => item.id === selectedWorkflowVersionId.value)
    : currentWorkflowDetail.value?.definition?.currentVersion
      || currentWorkflowDetail.value?.definition?.latestVersion
      || currentWorkflowDetail.value?.versions?.[0]

  return buildComparableCanvasSnapshot({
    nodesJson: currentVersion?.nodesJson,
    edgesJson: currentVersion?.edgesJson,
    viewportJson: currentVersion?.viewportJson,
  })
})

const currentCanvasSnapshot = computed(() => {
  return buildComparableCanvasSnapshot({
    nodesJson: nodes.value,
    edgesJson: edges.value,
    viewportJson: canvasViewport.value,
  })
})

const isCanvasDirty = computed(() => {
  if (!currentWorkflowId.value) {
    return currentCanvasSnapshot.value !== initialCanvasBaselineSnapshot.value
  }

  return currentCanvasSnapshot.value !== savedCanvasSnapshot.value
})

const syncWorkflowFormFromDetail = () => {
  const definition = currentWorkflowDetail.value?.definition
  workflowName.value = definition?.name || ''
  workflowCode.value = definition?.code || ''
  workflowDescription.value = definition?.description || ''
  workflowCategory.value = definition?.category || ''
}

const clearAutosaveTimer = () => {
  if (autosaveTimer.value) {
    clearTimeout(autosaveTimer.value)
    autosaveTimer.value = null
  }
}

const syncWorkflowRouteQuery = async (workflowId?: string) => {
  const nextWorkflowId = String(workflowId || '').trim()
  const currentQueryWorkflowId = String(route.query.workflowId || '').trim()
  const nextVersionId = String(selectedWorkflowVersionId.value || '').trim()
  const currentQueryVersionId = String(route.query.versionId || '').trim()

  if (nextWorkflowId === currentQueryWorkflowId && nextVersionId === currentQueryVersionId) {
    return
  }

  const nextQuery = { ...route.query }
  if (nextWorkflowId) {
    nextQuery.workflowId = nextWorkflowId
  } else {
    delete nextQuery.workflowId
  }

  if (nextVersionId) {
    nextQuery.versionId = nextVersionId
  } else {
    delete nextQuery.versionId
  }

  await router.replace({
    path: route.path,
    query: nextQuery,
  })
}

const tryLoadWorkflowByRoute = async (
  workflowId: string,
  options: { versionId?: string | null } = {},
) => {
  const normalizedWorkflowId = String(workflowId || '').trim()
  const normalizedVersionId = String(options.versionId || '').trim()
  if (!normalizedWorkflowId) {
    return
  }

  if (normalizedWorkflowId === currentWorkflowId.value && normalizedVersionId === selectedWorkflowVersionId.value) {
    return
  }

  workflowLoadingByRoute.value = true
  try {
    await flushAutosave()
    const detail = await loadWorkflowDetail(normalizedWorkflowId)
    selectedWorkflowVersionId.value = normalizedVersionId
    applyWorkflowVersionToCanvas(detail, normalizedVersionId || undefined)
    syncWorkflowFormFromDetail()
    await nextTick()
    fitView({ padding: 0.24 })
  } catch (error: any) {
    ElMessage.error(error?.message || '打开工作流失败')
    await syncWorkflowRouteQuery(currentWorkflowId.value || undefined)
  } finally {
    workflowLoadingByRoute.value = false
  }
}

const resetWorkflowDraftForm = () => {
  workflowName.value = ''
  workflowCode.value = ''
  workflowDescription.value = ''
  workflowCategory.value = ''
}

const createWorkflowAction = useAsyncAction(async () => {
  await flushAutosave()

  resetCurrentWorkflowState()
  selectedWorkflowVersionId.value = ''
  selectedLibraryWorkflowId.value = ''
  selectedLibraryWorkflowDetail.value = null
  resetWorkflowDraftForm()
  applyCanvasSnapshot({
    nodes: [],
    edges: [],
  }, {
    x: 100,
    y: 50,
    zoom: 0.8,
  })
  initialCanvasBaselineSnapshot.value = currentCanvasSnapshot.value
  await syncWorkflowRouteQuery(undefined)
  autosaveState.value = 'idle'
  autosaveErrorMessage.value = ''
  await nextTick()
  fitView({ padding: 0.24 })
  ElMessage.success('已新建空白工作流')
}, { globalKey: 'blocking', globalText: '正在新建工作流…' })

const handleCreateWorkflow = () => {
  void createWorkflowAction.run()
}

// 添加工作流模板
const handleAddWorkflow = (workflow: WorkflowTemplateDefinition) => {
  const cx = -viewport.value.x / viewport.value.zoom + (window.innerWidth / 2) / viewport.value.zoom
  const cy = -viewport.value.y / viewport.value.zoom + (window.innerHeight / 2) / viewport.value.zoom
  const start = { x: cx - 300, y: cy - 200 }
  const { nodes: newNodes, edges: newEdges } = workflow.createNodes(start)

  newNodes.forEach((node) => {
    const id = addNode(node.type, node.position, node.data)
    newEdges.forEach((edge) => {
      if (edge.source === node.id) edge.source = id
      if (edge.target === node.id) edge.target = id
    })
    node.newId = id
  })

  setTimeout(() => {
    newEdges.forEach(edge => {
      addEdge({
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle || 'right',
        targetHandle: edge.targetHandle || 'left',
        type: edge.type,
        data: edge.data,
      })
    })
    newNodes.forEach(node => {
      if (node.newId) {
        updateNodeInternals([node.newId])
      }
    })
  }, 100)

  showTemplatePanel.value = false
}

// 节点类型菜单选项
const nodeTypeOptions: WorkflowNodeOption[] = [
  { type: 'text', name: '文本节点', color: '#3b82f6', icon: 'M4 6h16M4 12h8m-8 6h16' },
  { type: 'imageConfig', name: '文生图配置', color: '#22c55e', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { type: 'videoConfig', name: '视频生成配置', color: '#f59e0b', icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' },
  { type: 'llmConfig', name: 'LLM 文本生成', color: '#a855f7', icon: 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z' },
  { type: 'image', name: '图片节点', color: '#8b5cf6', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { type: 'video', name: '视频节点', color: '#ef4444', icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' },
]

// 工具栏按钮
const tools = [
  { id: 'text', name: '文本', icon: 'M4 6h16M4 12h8m-8 6h16', action: () => addNewNode('text') },
  { id: 'imageConfig', name: '文生图', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z', action: () => addNewNode('imageConfig') },
  { id: 'videoConfig', name: '视频生成', icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z', action: () => addNewNode('videoConfig') },
]

// 添加新节点
const addNewNode = (type: WorkflowNodeType) => {
  const cx = -viewport.value.x / viewport.value.zoom + (window.innerWidth / 2) / viewport.value.zoom
  const cy = -viewport.value.y / viewport.value.zoom + (window.innerHeight / 2) / viewport.value.zoom
  const id = addNode(type, { x: cx - 140, y: cy - 100 })
  const maxZ = Math.max(0, ...nodes.value.map(n => n.zIndex || 0))
  updateNode(id, { zIndex: maxZ + 1 })
  setTimeout(() => updateNodeInternals([id]), 50)
  showNodeMenu.value = false
}

// 快速连线（Dify 同款）：按住 Shift 点击节点 A，再按住 Shift 点击节点 B，自动连线。
const quickLinkSourceId = ref<string | null>(null)

// 把"按节点类型推断 edge type"的逻辑抽出来，拖拽连线（onConnect）与快速连线共用。
const applyTypedEdgeConnection = (params: WorkflowAddEdgeParams) => {
  const sourceNode = nodes.value.find(n => n.id === params.source)
  const targetNode = nodes.value.find(n => n.id === params.target)

  if (sourceNode?.type === 'text' && targetNode?.type === 'imageConfig') {
    const existing = edges.value.filter(e => e.target === params.target && e.type === 'promptOrder')
    addEdge({ ...params, type: 'promptOrder', data: { promptOrder: existing.length + 1 } })
  } else if (sourceNode?.type === 'image' && targetNode?.type === 'imageConfig') {
    const existing = edges.value.filter(e => e.target === params.target && e.type === 'imageOrder')
    addEdge({ ...params, type: 'imageOrder', data: { imageOrder: existing.length + 1 } })
  } else if (sourceNode?.type === 'image' && targetNode?.type === 'videoConfig') {
    addEdge({ ...params, type: 'imageRole', data: { imageRole: 'first_frame_image' } })
  } else if (sourceNode?.type === 'text' && targetNode?.type === 'videoConfig') {
    addEdge({ ...params, type: 'promptOrder', data: { promptOrder: 1 } })
  } else {
    addEdge(params)
  }
}

// 处理连接
const onConnect = (params: Connection) => {
  if (!params.source || !params.target) return

  applyTypedEdgeConnection({
    source: params.source,
    target: params.target,
    sourceHandle: params.sourceHandle ?? undefined,
    targetHandle: params.targetHandle ?? undefined,
  })
}

const hasExistingEdge = (source: string, target: string, sourceHandle?: string, targetHandle?: string) => {
  return edges.value.some(edge =>
    edge.source === source
    && edge.target === target
    && (edge.sourceHandle || undefined) === sourceHandle
    && (edge.targetHandle || undefined) === targetHandle,
  )
}

const handleNodeClick = (payload: { event: MouseEvent | TouchEvent; node: { id: string } }) => {
  const originalEvent = payload.event as MouseEvent
  // 只在按住 Shift 时介入；其他点击一律交回 vue-flow 默认行为。
  if (!(originalEvent && 'shiftKey' in originalEvent && originalEvent.shiftKey)) {
    return
  }

  const targetNodeId = payload.node?.id
  if (!targetNodeId) return

  if (!quickLinkSourceId.value) {
    quickLinkSourceId.value = targetNodeId
    return
  }

  if (quickLinkSourceId.value === targetNodeId) {
    quickLinkSourceId.value = null
    return
  }

  // 沿用 vue-flow 默认 handle 命名（与拖拽连线一致）：右出左入。
  const sourceHandle = 'right'
  const targetHandle = 'left'
  if (!hasExistingEdge(quickLinkSourceId.value, targetNodeId, sourceHandle, targetHandle)) {
    applyTypedEdgeConnection({
      source: quickLinkSourceId.value,
      target: targetNodeId,
      sourceHandle,
      targetHandle,
    })
  }
  quickLinkSourceId.value = null
  originalEvent.preventDefault?.()
  originalEvent.stopPropagation?.()
}

// 给挂起源节点动态打 .wf-quick-link-source class，提示"A 已选中，下一次 Shift+点击的节点为目标"。
// 这是整个快速连线流程仅保留的视觉反馈，跟挂起状态同生同灭。
const resolveNodeClass = (node: { id: string }) => {
  return node.id === quickLinkSourceId.value ? 'wf-quick-link-source' : undefined
}

// 顶部提示横幅用：挂起源节点的可读名称
const quickLinkSourceLabel = computed(() => {
  const sourceId = quickLinkSourceId.value
  if (!sourceId) return ''
  const node = nodes.value.find(n => n.id === sourceId)
  if (!node) return ''
  const label = (node.data as { label?: string })?.label
  if (label) return label
  const typeOption = nodeTypeOptions.find(opt => opt.type === node.type)
  const idSuffix = sourceId.replace(/^node_/, '')
  return `${typeOption?.name || node.type} #${idSuffix}`
})

const cancelQuickLink = () => {
  quickLinkSourceId.value = null
}

// 处理视口变化
const handleViewportChange = (v: typeof canvasViewport.value) => updateViewport(v)

// 处理边变化
const onEdgesChange = (changes: Array<{ type?: string }>) => {
  if (changes.some(c => c.type === 'remove')) {
    nextTick(() => manualSaveHistory())
  }
}

// 处理画布点击
const onPaneClick = () => {
  showNodeMenu.value = false
}

// 返回首页：保存草稿 → 跳转。globalKey:'blocking' 期间会弹遮罩"正在保存草稿…"，
// 避免用户感觉点了没反应。useAsyncAction 自身防止重复点击。
const goBackAction = useAsyncAction(async () => {
  await flushAutosave()

  const returnTo = String(route.query.returnTo || '').trim()
  if (returnTo) {
    await router.push(returnTo)
    return
  }

  await router.push('/')
}, { globalKey: 'blocking', globalText: '正在保存草稿…' })

const goBackLoading = goBackAction.loading

const goBack = () => {
  void goBackAction.run()
}

const {
  run: handleRefreshWorkflowList,
  loading: workflowListLoading,
} = useAsyncAction(async () => {
  await reloadWorkflowList({
    scene: 'WORKFLOW_CANVAS',
    keyword: workflowListKeyword.value || undefined,
  })
})

const loadWorkflowAction = useAsyncAction(async (workflow: WorkflowDefinitionSummary) => {
  const versionId = selectedLibraryWorkflowId.value === workflow.id
    ? selectedWorkflowVersionId.value || selectedLibraryWorkflowDetail.value?.definition.currentVersionId || ''
    : ''
  await tryLoadWorkflowByRoute(workflow.id, { versionId })
  await syncWorkflowRouteQuery(workflow.id)
  showWorkflowLibraryPanel.value = false
  ElMessage.success(`已打开工作流：${workflow.name}`)
}, { globalKey: 'blocking', globalText: '正在加载工作流…' })

const handleLoadWorkflow = (workflow: WorkflowDefinitionSummary) => {
  void loadWorkflowAction.run(workflow)
}

const selectLibraryAction = useAsyncAction(async (workflow: WorkflowDefinitionSummary) => {
  selectedLibraryWorkflowDetail.value = await fetchWorkflowDetail(workflow.id)
})
const libraryDetailLoading = selectLibraryAction.loading

const handleSelectLibraryWorkflow = (workflow: WorkflowDefinitionSummary) => {
  selectedLibraryWorkflowId.value = workflow.id
  selectedLibraryWorkflowDetail.value = null
  void selectLibraryAction.run(workflow)
}

const loadWorkflowVersionAction = useAsyncAction(async (workflow: WorkflowDefinitionSummary, versionId: string) => {
  await tryLoadWorkflowByRoute(workflow.id, { versionId })
  await syncWorkflowRouteQuery(workflow.id)
  showWorkflowLibraryPanel.value = false
  ElMessage.success(`已打开 ${workflow.name} 的指定版本`)
}, { globalKey: 'blocking', globalText: '正在加载版本…' })

const handleLoadWorkflowVersion = (workflow: WorkflowDefinitionSummary, versionId: string) => {
  void loadWorkflowVersionAction.run(workflow, versionId)
}

const performAutosave = async () => {
  autosaveState.value = 'saving'
  autosaveErrorMessage.value = ''

  const detail = await autosaveWorkflow({
    workflowId: currentWorkflowId.value || undefined,
    name: workflowName.value || `未命名工作流 ${new Date().toLocaleTimeString('zh-CN', { hour12: false })}`,
    code: workflowCode.value || undefined,
    description: workflowDescription.value || null,
    category: workflowCategory.value || null,
    scene: 'WORKFLOW_CANVAS',
  })

  currentWorkflowDetail.value = detail
  currentWorkflowId.value = detail.definition.id
  selectedWorkflowVersionId.value = detail.definition.currentVersionId || detail.definition.latestVersion?.id || ''
  syncWorkflowFormFromDetail()
  await syncWorkflowRouteQuery(detail.definition.id)
  autosaveState.value = 'saved'
}

const scheduleAutosave = () => {
  if (!autosaveReady.value || workflowLoadingByRoute.value || !isCanvasDirty.value) {
    return
  }

  clearAutosaveTimer()
  autosaveTimer.value = setTimeout(() => {
    void flushAutosave()
  }, 1500)
}

const flushAutosave = async () => {
  clearAutosaveTimer()

  if (!autosaveReady.value || workflowLoadingByRoute.value || !isCanvasDirty.value) {
    return
  }

  if (autosaveInFlight.value) {
    await autosaveInFlight.value
    return
  }

  autosaveInFlight.value = (async () => {
    try {
      await performAutosave()
    } catch (error: any) {
      autosaveState.value = 'error'
      autosaveErrorMessage.value = error?.message || '自动保存失败'
    } finally {
      autosaveInFlight.value = null
    }
  })()

  await autosaveInFlight.value
}

// 键盘快捷键（统一走 useShortcut 注册，自动管理生命周期 + 输入框焦点屏蔽）
useShortcut(
  'Escape',
  () => {
    if (quickLinkSourceId.value) {
      quickLinkSourceId.value = null
    }
  },
  // Esc 不阻止默认，让 el-dialog / el-popover 等浮层也能关闭
  { preventDefault: false },
)
useShortcut('CmdOrCtrl+Z', () => undo())
useShortcut(['CmdOrCtrl+Shift+Z', 'CmdOrCtrl+Y'], () => redo())
useShortcut('CmdOrCtrl+N', () => {
  void handleCreateWorkflow()
})

// 空格临时平移：按住 Space 时禁用节点拖拽，左键也加入 panOnDrag
const isSpacePressed = ref(false)
const panOnDragValue = computed<true | number[]>(() => (isSpacePressed.value ? [0, 1, 2] : true))

const isEditableSpaceTarget = (el: EventTarget | null): boolean => {
  if (!(el instanceof HTMLElement)) return false
  const tag = el.tagName.toLowerCase()
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true
  return el.isContentEditable
}

const handleSpaceDown = (event: KeyboardEvent) => {
  if (event.code !== 'Space' || event.repeat) return
  if (isEditableSpaceTarget(event.target)) return
  event.preventDefault()
  isSpacePressed.value = true
}
const handleSpaceUp = (event: KeyboardEvent) => {
  if (event.code === 'Space') {
    isSpacePressed.value = false
  }
}

// 节点拖拽期间暂停历史入栈，拖拽结束统一作为 1 条历史记录
const onNodeDragStart = () => {
  pauseHistory()
}
const onNodeDragStop = () => {
  resumeHistory()
}

// === 选择 / 剪贴板 / 拖入 / 右键菜单 ===
const { selectAll } = useCanvasSelection()
const { copySelected, pasteFromSlot, hasClipboard } = useCanvasClipboard()
const { onDrop: onCanvasFileDrop, onDragOver: onCanvasFileDragOver } = useCanvasDrop()

// 小地图开关
const isMiniMapOpen = ref(true)
const toggleMiniMap = () => {
  isMiniMapOpen.value = !isMiniMapOpen.value
}

// 右键上下文菜单
const contextMenuVisible = ref(false)
const contextMenuPosition = ref<ContextMenuPosition>({ x: 0, y: 0 })
const contextMenuItems = ref<ContextMenuItem[]>([])
const closeContextMenu = () => {
  contextMenuVisible.value = false
}
const openPaneContextMenu = (event: MouseEvent) => {
  event.preventDefault()
  const flowPos = screenToFlowCoordinate({ x: event.clientX, y: event.clientY })
  contextMenuItems.value = [
    { id: 'add-text', label: '新建文本', onClick: () => addNode('text', flowPos) },
    { id: 'add-image', label: '新建图片', onClick: () => addNode('image', flowPos) },
    { id: 'add-video', label: '新建视频', onClick: () => addNode('video', flowPos) },
    { id: 'add-image-config', label: '新建文生图配置', onClick: () => addNode('imageConfig', flowPos) },
    { id: 'divider', label: '', type: 'divider' },
    {
      id: 'paste',
      label: '粘贴',
      shortcut: 'Cmd+V',
      disabled: !hasClipboard(),
      onClick: () => pasteFromSlot(),
    },
  ]
  contextMenuPosition.value = { x: event.clientX, y: event.clientY }
  contextMenuVisible.value = true
}
const openNodeContextMenu = (payload: NodeMouseEvent) => {
  payload.event.preventDefault()
  const e = payload.event as unknown as MouseEvent
  contextMenuItems.value = [
    { id: 'duplicate', label: '复制', shortcut: 'Cmd+C', onClick: () => duplicateNode(payload.node.id) },
    { id: 'delete', label: '删除', shortcut: 'Del', danger: true, onClick: () => removeNode(payload.node.id) },
  ]
  contextMenuPosition.value = { x: e.clientX, y: e.clientY }
  contextMenuVisible.value = true
}

// 清空画布（带确认）
const clearCanvasWithConfirm = () => {
  if (typeof window === 'undefined') return
  if (window.confirm('确定要清空画布吗？此操作不可撤销。')) {
    clearCanvas()
  }
}

// 扩展快捷键
useShortcut('CmdOrCtrl+A', () => selectAll())
useShortcut('CmdOrCtrl+C', () => {
  copySelected()
})
useShortcut('CmdOrCtrl+V', () => {
  pasteFromSlot()
})

// 助手面板（复用 canana 视图的 RightPanel）
const { isPanelCollapsed: isAssistantCollapsed, togglePanel: toggleAssistantPanel } = useChatSessions()
const pendingAssistantMessage = ref('')

// 助手生成的图片落到画布：在视口中心创建 image 节点
const handleAssistantAddImage = ({ url }: { url: string }) => {
  if (!url) return
  const center = screenToFlowCoordinate({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
  addNode('image', center, { url, label: '助手生成' })
}

onMounted(() => {
  initSampleData()
  initHistory()
  initialCanvasBaselineSnapshot.value = currentCanvasSnapshot.value

  window.addEventListener('keydown', handleSpaceDown)
  window.addEventListener('keyup', handleSpaceUp)

  const initialWorkflowId = String(route.query.workflowId || '').trim()
  const initialVersionId = String(route.query.versionId || '').trim()
  if (initialWorkflowId) {
    void tryLoadWorkflowByRoute(initialWorkflowId, {
      versionId: initialVersionId || undefined,
    })
  }

  autosaveReady.value = true
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleSpaceDown)
  window.removeEventListener('keyup', handleSpaceUp)
  clearAutosaveTimer()
})

watch(() => route.query.workflowId, (workflowId) => {
  const normalizedWorkflowId = String(workflowId || '').trim()
  const normalizedVersionId = String(route.query.versionId || '').trim()

  if (!normalizedWorkflowId) {
    if (currentWorkflowId.value) {
      void handleCreateWorkflow()
    }
    return
  }

  if (!normalizedWorkflowId || workflowLoadingByRoute.value) {
    return
  }

  void tryLoadWorkflowByRoute(normalizedWorkflowId, {
    versionId: normalizedVersionId || undefined,
  })
})

// 浏览器后退、地址栏跳走等场景：同样让用户看到"正在保存草稿…"，
// 避免脏 canvas 触发 flushAutosave 时几秒无反馈
const loadingStore = useLoadingStore()
onBeforeRouteLeave(async (_to, _from, next) => {
  loadingStore.start('blocking', '正在保存草稿…')
  try {
    await flushAutosave()
  } finally {
    loadingStore.stop('blocking')
  }
  next()
})

watch(currentCanvasSnapshot, () => {
  scheduleAutosave()
})
</script>

<template>
  <div class="workflow-container" :class="{ 'workflow-right-panel-open': !isAssistantCollapsed }">
    <div class="workflow-workbench">
      <div class="workflow-main">
        <div
          class="workflow-canvas-wrap"
          @dragover="onCanvasFileDragOver"
          @drop="onCanvasFileDrop"
        >
          <VueFlow
            v-model:nodes="nodes"
            v-model:edges="edges"
            v-model:viewport="viewport"
            :node-types="nodeTypes"
            :edge-types="edgeTypes"
            :default-viewport="canvasViewport"
            :min-zoom="0.1"
            :max-zoom="2"
            :snap-to-grid="true"
            :snap-grid="[20, 20]"
            :delete-key-code="['Delete', 'Backspace']"
            :selection-key-code="'Meta'"
            :multi-selection-key-code="'Shift'"
            :selection-mode="SelectionMode.Partial"
            :pan-on-drag="panOnDragValue"
            :nodes-draggable="!isSpacePressed"
            :pan-on-scroll="false"
            :connect-on-click="false"
            :connection-line-component="CanvasConnectionLine"
            :node-class-name="resolveNodeClass"
            @connect="onConnect"
            @node-click="handleNodeClick"
            @pane-click="onPaneClick"
            @viewport-change="handleViewportChange"
            @edges-change="onEdgesChange"
            @node-drag-start="onNodeDragStart"
            @node-drag-stop="onNodeDragStop"
            @pane-context-menu="openPaneContextMenu"
            @node-context-menu="openNodeContextMenu"
            class="workflow-canvas"
            :class="{ 'workflow-canvas--space-panning': isSpacePressed }"
          >
            <Background
              v-if="canvasBackgroundMode !== 'blank'"
              :gap="canvasBackgroundMode === 'dots' ? 24 : 20"
              :size="canvasBackgroundMode === 'dots' ? 1.2 : 1"
              :variant="canvasBackgroundMode === 'dots' ? 'dots' : 'lines'"
            />
          </VueFlow>

          <CanvasMiniMap :visible="isMiniMapOpen" />
          <CanvasZoomControls
            :mini-map-open="isMiniMapOpen"
            @toggle-mini-map="toggleMiniMap"
            @clear="clearCanvasWithConfirm"
          />
          <CanvasContextMenu
            :visible="contextMenuVisible"
            :position="contextMenuPosition"
            :items="contextMenuItems"
            @close="closeContextMenu"
          />
        </div>

        <header class="workflow-header">
          <div class="workflow-header-left">
            <button class="wf-btn wf-btn-sm" :disabled="goBackLoading" @click="goBack" title="返回">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M15 19l-7-7 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <span style="font-size: 13px; color: var(--text-primary); padding: 0 8px;">工作流</span>
          </div>

          <div class="workflow-header-right">
            <div class="wf-header-meta">
              <input
                v-if="renamingTitle"
                v-model="renameTitleInput"
                class="wf-header-meta__title wf-header-meta__title-input"
                type="text"
                maxlength="80"
                @blur="submitRenameTitle"
                @keyup.enter.prevent="submitRenameTitle"
                @keyup.esc.prevent="cancelRenameTitle"
              />
              <span
                v-else
                class="wf-header-meta__title"
                title="点击重命名工作流"
                @click="startRenameTitle"
              >
                {{ currentWorkflowTitle }}
              </span>
              <span class="wf-header-meta__status">{{ currentWorkflowStatusText }} · {{ autosaveStatusText }}</span>
            </div>
          </div>
        </header>

        <!-- 快速连线状态横幅：Shift+点击挂起源节点后顶部提示 -->
        <Transition name="wf-quick-link-banner">
          <div v-if="quickLinkSourceId" class="wf-quick-link-banner" role="status" aria-live="polite">
            <span class="wf-quick-link-banner__dot" aria-hidden="true"></span>
            <span class="wf-quick-link-banner__text">
              正在连线：<strong>{{ quickLinkSourceLabel }}</strong> → 按住 Shift 点击目标节点完成
            </span>
            <span class="wf-quick-link-banner__hint">Esc 取消</span>
            <button
              class="wf-quick-link-banner__close"
              type="button"
              aria-label="取消快速连线"
              @click="cancelQuickLink"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
        </Transition>

        <nav class="workflow-left-toolbar">
          <div class="workflow-left-toolbar-container">
            <button
              class="wf-btn wf-btn-icon"
              :class="{ active: showNodeMenu }"
              @click="showNodeMenu = !showNodeMenu"
              title="添加节点"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14m-7-7h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>

            <button
              class="wf-btn wf-btn-icon"
              :class="{ active: showTemplatePanel }"
              @click="showTemplatePanel = !showTemplatePanel"
              title="工作流模板"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/>
                <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/>
                <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/>
                <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/>
              </svg>
            </button>

            <div class="wf-divider"></div>

            <button
              v-for="tool in tools"
              :key="tool.id"
              class="wf-btn wf-btn-icon"
              @click="tool.action"
              :title="tool.name"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path :d="tool.icon" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>

            <div class="wf-divider"></div>

            <button class="wf-btn wf-btn-icon" :disabled="!canUndo" @click="undo()" title="撤销">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M3 10h10a5 5 0 015 5v0a5 5 0 01-5 5H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M7 14l-4-4 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <button class="wf-btn wf-btn-icon" :disabled="!canRedo" @click="redo()" title="重做">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M21 10H11a5 5 0 00-5 5v0a5 5 0 005 5h5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M17 14l4-4-4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
        </nav>

        <div v-if="showNodeMenu" class="wf-node-menu">
          <button
            v-for="opt in nodeTypeOptions"
            :key="opt.type"
            class="wf-node-menu-item"
            @click="addNewNode(opt.type)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path :d="opt.icon" :stroke="opt.color" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>{{ opt.name }}</span>
          </button>
        </div>

        <div class="workflow-bottom-toolbar" v-if="false">
          <div class="workflow-bottom-toolbar-container">
            <button class="wf-btn wf-btn-sm" @click="fitView({ padding: 0.2 })" title="适应视图">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <button class="wf-btn wf-btn-sm" @click="zoomOut()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
            <span class="wf-zoom-text">{{ Math.round(viewport.zoom * 100) }}%</span>
            <button class="wf-btn wf-btn-sm" @click="zoomIn()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14m-7-7h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        <Transition name="wf-panel">
          <div v-if="showTemplatePanel" class="wf-template-panel" @click.self="showTemplatePanel = false">
            <div class="wf-template-panel-inner">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                <span style="font-size: 14px; font-weight: 500; color: var(--text-primary);">工作流模板</span>
                <button class="wf-btn wf-btn-sm" @click="showTemplatePanel = false">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                </button>
              </div>
              <div class="wf-template-list">
                <div
                  v-for="tpl in WORKFLOW_TEMPLATES"
                  :key="tpl.id"
                  class="wf-template-card"
                  @click="handleAddWorkflow(tpl)"
                >
                  <div class="wf-template-card-title">{{ tpl.name }}</div>
                  <div class="wf-template-card-desc">{{ tpl.description }}</div>
                </div>
              </div>
            </div>
          </div>
        </Transition>

        <Transition name="wf-panel">
          <div v-if="showWorkflowLibraryPanel" class="wf-template-panel" @click.self="showWorkflowLibraryPanel = false">
            <div class="wf-template-panel-inner wf-persistence-panel">
              <div class="wf-persistence-panel__header">
                <div>
                  <div class="wf-persistence-panel__title">打开工作流</div>
                  <div class="wf-persistence-panel__desc">查看保存过的工作流定义，并把版本快照恢复到当前画布。</div>
                </div>
                <button class="wf-btn wf-btn-sm" @click="showWorkflowLibraryPanel = false">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                </button>
              </div>

              <div class="wf-persistence-toolbar">
                <input v-model="workflowListKeyword" class="wf-persistence-input" placeholder="按名称、编码、分类搜索" @keyup.enter="handleRefreshWorkflowList" />
                <button class="wf-btn wf-btn-md" :disabled="workflowListLoading" @click="handleRefreshWorkflowList">
                  {{ workflowListLoading ? '加载中...' : '刷新' }}
                </button>
              </div>

              <div class="wf-workflow-list">
                <div
                  v-for="workflow in workflowList"
                  :key="workflow.id"
                  class="wf-workflow-list__group"
                >
                  <button
                    class="wf-workflow-list__item"
                    :class="{ 'is-active': workflow.id === currentWorkflowId || workflow.id === selectedLibraryWorkflowId }"
                    @click="handleSelectLibraryWorkflow(workflow)"
                  >
                    <div class="wf-workflow-list__main">
                      <div class="wf-workflow-list__title-row">
                        <span class="wf-workflow-list__title">{{ workflow.name }}</span>
                        <span class="wf-workflow-list__badge">{{ workflow.status === 'ACTIVE' ? '已发布' : '草稿' }}</span>
                      </div>
                      <div class="wf-workflow-list__code">{{ workflow.code }}</div>
                      <div class="wf-workflow-list__desc">{{ workflow.description || '暂无描述' }}</div>
                    </div>
                    <div class="wf-workflow-list__meta">
                      <span>版本 {{ workflow.latestVersionNo }}</span>
                      <span>{{ workflow.category || '未分类' }}</span>
                    </div>
                  </button>

                  <div
                    v-if="selectedLibraryWorkflowId === workflow.id"
                    class="wf-workflow-list__versions"
                  >
                    <div class="wf-workflow-list__versions-header">
                      <span>版本列表</span>
                      <button class="wf-btn wf-btn-md wf-btn-primary" @click="handleLoadWorkflow(workflow)">
                        打开当前版本
                      </button>
                    </div>

                    <div v-if="libraryDetailLoading" class="wf-workflow-list__empty">
                      正在加载版本列表...
                    </div>

                    <div
                      v-else-if="selectedLibraryWorkflowDetail?.versions?.length"
                      class="wf-workflow-list__version-list"
                    >
                      <button
                        v-for="version in selectedLibraryWorkflowDetail.versions"
                        :key="version.id"
                        class="wf-workflow-list__version-item"
                        :class="{ 'is-active': version.id === selectedWorkflowVersionId }"
                        @click="handleLoadWorkflowVersion(workflow, version.id)"
                      >
                        <div class="wf-workflow-list__version-main">
                          <span class="wf-workflow-list__version-title">
                            V{{ version.versionNo }} {{ version.versionName || '未命名版本' }}
                          </span>
                          <span class="wf-workflow-list__version-desc">
                            {{ version.changeSummary || '暂无版本说明' }}
                          </span>
                        </div>
                        <span class="wf-workflow-list__version-badge">
                          {{ version.status === 'PUBLISHED' ? '已发布' : version.status === 'DEPRECATED' ? '已废弃' : '草稿' }}
                        </span>
                      </button>
                    </div>

                    <div v-else class="wf-workflow-list__empty">
                      这个工作流暂时还没有版本数据。
                    </div>
                  </div>
                </div>

                <div v-if="!workflowListLoading && workflowList.length === 0" class="wf-workflow-list__empty">
                  还没有可打开的工作流，先保存一个吧。
                </div>
              </div>
            </div>
          </div>
        </Transition>

<!--        <ContentGenerator-->
<!--          class="workflow-content-generator"-->
<!--          :collapsible="true"-->
<!--          :default-expanded="false"-->
<!--          popup-placement="top"-->
<!--          @send="handlePromptSend"-->
<!--        />-->
      </div>

      <!-- 右侧助手面板（复用 canana 视图的 RightPanel）：fixed 定位 + translateX 动画 -->
      <aside class="workflow-assistant-aside">
        <RightPanel
          :title="currentWorkflowTitle"
          :visible="!isAssistantCollapsed"
          :initial-message="pendingAssistantMessage"
          @close="toggleAssistantPanel"
          @message-received="pendingAssistantMessage = ''"
          @add-image-to-canvas="handleAssistantAddImage"
        />
      </aside>

      <!-- 折叠态下的展开把手 -->
      <button
        v-if="isAssistantCollapsed"
        class="canvas-assistant-toggle"
        title="展开助手面板"
        @click="toggleAssistantPanel"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
    </div>
  </div>
</template>

<style>
@import './styles/workflow.css';
</style>
