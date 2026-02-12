/**
 * 画布状态管理
 * 管理节点、边和画布状态
 */
import { ref } from 'vue'
import { IMAGE_MODELS, VIDEO_MODELS, DEFAULT_IMAGE_MODEL, DEFAULT_VIDEO_MODEL, DEFAULT_CHAT_MODEL } from '@/config/models'

// 节点 ID 计数器
let nodeId = 0
const getNodeId = () => `node_${nodeId++}`

// 节点和边
export const nodes = ref<any[]>([])
export const edges = ref<any[]>([])

// 视口状态
export const canvasViewport = ref({ x: 100, y: 50, zoom: 0.8 })

// 撤销/重做历史
const history = ref<any[]>([])
const historyIndex = ref(-1)
const MAX_HISTORY = 50
let isRestoring = false

/**
 * 保存当前状态到历史
 */
const saveToHistory = () => {
  if (isRestoring) return

  const state = {
    nodes: JSON.parse(JSON.stringify(nodes.value)),
    edges: JSON.parse(JSON.stringify(edges.value))
  }

  if (historyIndex.value < history.value.length - 1) {
    history.value = history.value.slice(0, historyIndex.value + 1)
  }

  history.value.push(state)

  if (history.value.length > MAX_HISTORY) {
    history.value.shift()
  } else {
    historyIndex.value++
  }
}

/**
 * 获取节点类型的默认数据
 */
const getDefaultNodeData = (type: string) => {
  switch (type) {
    case 'text':
      return { content: '', label: '文本输入' }
    case 'imageConfig': {
      const model = IMAGE_MODELS.find(m => m.key === DEFAULT_IMAGE_MODEL) || IMAGE_MODELS[0]
      return {
        prompt: '',
        model: DEFAULT_IMAGE_MODEL,
        size: model?.defaultParams?.size || '1x1',
        quality: model?.defaultParams?.quality || 'standard',
        label: '文生图'
      }
    }
    case 'videoConfig': {
      const model = VIDEO_MODELS.find(m => m.key === DEFAULT_VIDEO_MODEL) || VIDEO_MODELS[0]
      return {
        prompt: '',
        ratio: model?.defaultParams?.ratio || '16:9',
        duration: model?.defaultParams?.duration || 5,
        model: DEFAULT_VIDEO_MODEL,
        label: '图生视频'
      }
    }
    case 'video':
      return { url: '', duration: 0, label: '视频节点' }
    case 'image':
      return { url: '', label: '图片节点' }
    case 'llmConfig':
      return {
        systemPrompt: '',
        model: DEFAULT_CHAT_MODEL,
        outputFormat: 'text',
        outputContent: '',
        label: 'LLM文本生成'
      }
    default:
      return {}
  }
}

// 添加节点
export const addNode = (type: string, position: { x: number; y: number } = { x: 100, y: 100 }, data: Record<string, any> = {}) => {
  const id = getNodeId()
  const now = Date.now()
  nodes.value = [...nodes.value, {
    id,
    type,
    position,
    data: {
      ...getDefaultNodeData(type),
      ...data,
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now
    }
  }]
  saveToHistory()
  return id
}

// 更新节点数据
export const updateNode = (id: string, data: Record<string, any>) => {
  nodes.value = nodes.value.map(node =>
    node.id === id ? { ...node, data: { ...node.data, ...data } } : node
  )
}

// 删除节点
export const removeNode = (id: string) => {
  nodes.value = nodes.value.filter(node => node.id !== id)
  edges.value = edges.value.filter(edge => edge.source !== id && edge.target !== id)
  saveToHistory()
}

// 复制节点
export const duplicateNode = (id: string) => {
  const source = nodes.value.find(node => node.id === id)
  if (!source) return null

  const newId = getNodeId()
  const maxZ = Math.max(0, ...nodes.value.map(n => n.zIndex || 0))

  nodes.value = [...nodes.value, {
    id: newId,
    type: source.type,
    position: { x: source.position.x + 50, y: source.position.y + 50 },
    data: { ...source.data },
    zIndex: maxZ + 1
  }]
  saveToHistory()
  return newId
}

// 添加边
export const addEdge = (params: Record<string, any>) => {
  edges.value = [...edges.value, {
    id: `edge_${params.source}_${params.target}`,
    ...params
  }]
  saveToHistory()
}

// 更新边数据
export const updateEdge = (id: string, data: Record<string, any>) => {
  edges.value = edges.value.map(edge =>
    edge.id === id ? { ...edge, data: { ...edge.data, ...data } } : edge
  )
  saveToHistory()
}

// 删除边
export const removeEdge = (id: string) => {
  edges.value = edges.value.filter(edge => edge.id !== id)
  saveToHistory()
}

// 清空画布
export const clearCanvas = () => {
  nodes.value = []
  edges.value = []
  nodeId = 0
}

// 更新视口
export const updateViewport = (viewport: any) => {
  canvasViewport.value = viewport
}

// 撤销
export const undo = () => {
  if (historyIndex.value <= 0) return false
  historyIndex.value--
  restoreState(history.value[historyIndex.value])
  return true
}

// 重做
export const redo = () => {
  if (historyIndex.value >= history.value.length - 1) return false
  historyIndex.value++
  restoreState(history.value[historyIndex.value])
  return true
}

const restoreState = (state: any) => {
  isRestoring = true
  nodes.value = JSON.parse(JSON.stringify(state.nodes))
  edges.value = JSON.parse(JSON.stringify(state.edges))
  setTimeout(() => { isRestoring = false }, 100)
}

export const canUndo = () => historyIndex.value > 0
export const canRedo = () => historyIndex.value < history.value.length - 1
export const manualSaveHistory = () => saveToHistory()

/**
 * 初始化画布（带示例数据）
 */
export const initSampleData = () => {
  clearCanvas()
  addNode('text', { x: 150, y: 150 }, {
    content: '一只金毛寻回犬在草地上奔跑，摇着尾巴，脸上带着快乐的表情。',
    label: '文本输入'
  })
  addNode('imageConfig', { x: 500, y: 150 }, { label: '文生图' })
  addEdge({
    source: 'node_0',
    target: 'node_1',
    sourceHandle: 'right',
    targetHandle: 'left'
  })
}

/**
 * 初始化历史（页面加载时调用）
 */
export const initHistory = () => {
  history.value = [{
    nodes: JSON.parse(JSON.stringify(nodes.value)),
    edges: JSON.parse(JSON.stringify(edges.value))
  }]
  historyIndex.value = 0
}
