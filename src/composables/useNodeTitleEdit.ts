/**
 * 节点标题双击编辑
 *
 * 把双击切输入框、回车提交、Esc 取消、blur 提交的逻辑统一封装，
 * 给 TextNode / ImageNode / VideoNode 及 CanvasConfigNodeShell 共用。
 */
import { nextTick, ref } from 'vue'
import { updateNode } from '@/views/workflow/composables/useWorkflowCanvas'

export function useNodeTitleEdit(nodeId: string, currentLabel: () => string) {
  const editing = ref(false)
  const draft = ref('')
  const inputRef = ref<HTMLInputElement | null>(null)

  const setInputRef = (el: unknown) => {
    inputRef.value = el instanceof HTMLInputElement ? el : null
  }

  const start = async () => {
    draft.value = currentLabel()
    editing.value = true
    await nextTick()
    inputRef.value?.focus()
    inputRef.value?.select()
  }

  const commit = () => {
    if (!editing.value) return
    editing.value = false
    const trimmed = draft.value.trim()
    if (!trimmed) return
    if (trimmed === currentLabel()) return
    updateNode(nodeId, { label: trimmed })
  }

  const cancel = () => {
    draft.value = currentLabel()
    editing.value = false
  }

  return { editing, draft, inputRef, setInputRef, start, commit, cancel }
}
