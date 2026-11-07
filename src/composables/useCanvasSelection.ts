/**
 * 画布选择行为封装
 *
 * 提供更顺手的"画布选中态"查询/批量操作 API。选中态本身仍由 Vue Flow
 * 维护（每个节点/边对象上的 .selected 字段），这里只做包装。
 *
 * 用途：
 *   - Cmd+A 全选
 *   - Esc 清空
 *   - 助手面板"引用选中节点"读取选中 ID 集合
 *   - 复制粘贴 / 节点删除等都依赖"当前选中节点"
 */
import { computed } from 'vue'
import { useVueFlow } from '@vue-flow/core'

export function useCanvasSelection() {
  const {
    getNodes,
    getEdges,
    addSelectedNodes,
    removeSelectedNodes,
    removeSelectedEdges,
  } = useVueFlow()

  /** 当前选中的节点 ID 集合（响应式） */
  const selectedNodeIds = computed<Set<string>>(() => {
    const set = new Set<string>()
    for (const n of getNodes.value) {
      if (n.selected) set.add(n.id)
    }
    return set
  })

  /** 当前选中的边 ID（多选取第一个） */
  const selectedEdgeId = computed<string | null>(() => {
    const found = getEdges.value.find((e) => e.selected)
    return found ? found.id : null
  })

  /** 是否有任何选中（节点或边） */
  const hasSelection = computed(() => selectedNodeIds.value.size > 0 || selectedEdgeId.value !== null)

  /** 全选所有节点（不选边） */
  const selectAll = () => {
    addSelectedNodes(getNodes.value)
  }

  /** 清空所有选择（节点 + 边） */
  const deselectAll = () => {
    removeSelectedNodes(getNodes.value)
    removeSelectedEdges(getEdges.value)
  }

  /** 查询节点是否选中 */
  const isNodeSelected = (id: string): boolean => selectedNodeIds.value.has(id)

  return {
    selectedNodeIds,
    selectedEdgeId,
    hasSelection,
    selectAll,
    deselectAll,
    isNodeSelected,
  }
}
