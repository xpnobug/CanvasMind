/**
 * 画布剪贴板：复制/粘贴选中节点 + 节点间连线
 *
 * - copySelected(): 把选中节点 + 它们之间的连线序列化到内存（不写浏览器剪贴板）
 *                   保留相对位置（以选区中心为原点）
 * - pasteFromSlot(): 反序列化粘贴，所有节点新 id，落点在视口中心区域 + 小偏移
 *
 * 不处理"剪贴板里有图片/文本时粘贴成节点"——那由助手面板的粘贴流处理。
 */
import { useVueFlow } from '@vue-flow/core'
import {
  addNode,
  addEdge,
  type WorkflowCanvasNode,
  type WorkflowCanvasEdge,
  type WorkflowNodeType,
} from '@/views/workflow/composables/useWorkflowCanvas'
import { CANVAS_CLIPBOARD_VERSION, type CanvasClipboardPayload } from '@/types/canvas-interaction'

const PASTE_OFFSET = { x: 40, y: 40 }

let clipboardSlot: CanvasClipboardPayload | null = null

export function useCanvasClipboard() {
  const { getNodes, getEdges, screenToFlowCoordinate } = useVueFlow()

  /**
   * 把当前选中节点 + 它们之间的连线放入剪贴板
   * @returns 是否成功（无选中时返回 false）
   */
  const copySelected = (): boolean => {
    const selectedNodes = getNodes.value.filter((n) => n.selected)
    if (selectedNodes.length === 0) {
      return false
    }
    const idSet = new Set(selectedNodes.map((n) => n.id))
    const selectedEdges = getEdges.value.filter((e) => idSet.has(e.source) && idSet.has(e.target))

    // 选区 bbox 中心作为序列化原点
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    for (const n of selectedNodes) {
      if (n.position.x < minX) minX = n.position.x
      if (n.position.y < minY) minY = n.position.y
      if (n.position.x > maxX) maxX = n.position.x
      if (n.position.y > maxY) maxY = n.position.y
    }
    const origin = { x: (minX + maxX) / 2, y: (minY + maxY) / 2 }

    clipboardSlot = {
      version: CANVAS_CLIPBOARD_VERSION,
      nodes: JSON.parse(JSON.stringify(selectedNodes)) as WorkflowCanvasNode[],
      edges: JSON.parse(JSON.stringify(selectedEdges)) as WorkflowCanvasEdge[],
      origin,
    }
    return true
  }

  /**
   * 粘贴：以视口中心为基准放下剪贴板内容；所有节点 ID 重新生成，连线映射保留
   */
  const pasteFromSlot = (): { addedNodeIds: string[]; addedEdgeIds: string[] } => {
    if (!clipboardSlot) return { addedNodeIds: [], addedEdgeIds: [] }
    const payload = clipboardSlot

    // 视口中心（世界坐标）
    const w = typeof window !== 'undefined' ? window.innerWidth : 1280
    const h = typeof window !== 'undefined' ? window.innerHeight : 720
    const centerWorld = screenToFlowCoordinate({ x: w / 2, y: h / 2 })

    const idMap = new Map<string, string>()
    const addedNodeIds: string[] = []

    for (const sourceNode of payload.nodes) {
      const relX = sourceNode.position.x - payload.origin.x + PASTE_OFFSET.x
      const relY = sourceNode.position.y - payload.origin.y + PASTE_OFFSET.y
      const position = { x: centerWorld.x + relX, y: centerWorld.y + relY }
      const newId = addNode(sourceNode.type as WorkflowNodeType, position, { ...sourceNode.data })
      idMap.set(sourceNode.id, newId)
      addedNodeIds.push(newId)
    }

    const addedEdgeIds: string[] = []
    for (const sourceEdge of payload.edges) {
      const source = idMap.get(sourceEdge.source)
      const target = idMap.get(sourceEdge.target)
      if (!source || !target) continue
      addEdge({
        source,
        target,
        sourceHandle: sourceEdge.sourceHandle,
        targetHandle: sourceEdge.targetHandle,
        type: sourceEdge.type,
        data: sourceEdge.data,
      })
      addedEdgeIds.push(`edge_${source}_${target}`)
    }

    return { addedNodeIds, addedEdgeIds }
  }

  const hasClipboard = (): boolean => clipboardSlot !== null
  const clearClipboard = () => {
    clipboardSlot = null
  }

  return { copySelected, pasteFromSlot, hasClipboard, clearClipboard }
}
