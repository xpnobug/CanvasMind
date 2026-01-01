/**
 * 操作历史 - 支持撤销/重做
 */
import { ref, computed } from 'vue'

export function useHistory(maxSize = 50) {
  const history = ref([])
  const currentIndex = ref(-1)
  
  // 是否可以撤销
  const canUndo = computed(() => currentIndex.value >= 0)
  
  // 是否可以重做
  const canRedo = computed(() => currentIndex.value < history.value.length - 1)
  
  // 历史记录数量
  const historyCount = computed(() => history.value.length)
  
  /**
   * 添加操作到历史
   * @param {Object} action - { type, data, undo(), redo() }
   */
  function push(action) {
    // 如果当前不在最新位置，删除后面的历史
    if (currentIndex.value < history.value.length - 1) {
      history.value = history.value.slice(0, currentIndex.value + 1)
    }
    
    // 添加新操作
    history.value.push({
      type: action.type,
      data: action.data,
      timestamp: Date.now(),
      undo: action.undo,
      redo: action.redo
    })
    
    // 限制历史大小
    if (history.value.length > maxSize) {
      history.value.shift()
    } else {
      currentIndex.value++
    }
  }
  
  /**
   * 撤销
   */
  function undo() {
    if (!canUndo.value) return false
    
    const action = history.value[currentIndex.value]
    if (action && action.undo) {
      action.undo(action.data)
    }
    currentIndex.value--
    return true
  }
  
  /**
   * 重做
   */
  function redo() {
    if (!canRedo.value) return false
    
    currentIndex.value++
    const action = history.value[currentIndex.value]
    if (action && action.redo) {
      action.redo(action.data)
    }
    return true
  }
  
  /**
   * 清空历史
   */
  function clear() {
    history.value = []
    currentIndex.value = -1
  }
  
  /**
   * 批量操作（多个操作合并为一个撤销单元）
   */
  function batch(actions, type = 'batch') {
    push({
      type,
      data: actions,
      undo: (data) => {
        // 逆序撤销
        for (let i = data.length - 1; i >= 0; i--) {
          data[i].undo?.(data[i].data)
        }
      },
      redo: (data) => {
        // 顺序重做
        for (const action of data) {
          action.redo?.(action.data)
        }
      }
    })
  }

  return {
    history,
    currentIndex,
    canUndo,
    canRedo,
    historyCount,
    
    push,
    undo,
    redo,
    clear,
    batch
  }
}
