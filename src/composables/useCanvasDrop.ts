/**
 * 画布拖入文件：dragover/drop → 计算落点世界坐标 → 上传 → 新节点
 *
 * 绑定到 VueFlow 容器最外层：
 *   <div @dragover="onDragOver" @drop="onDrop">
 *     <VueFlow ... />
 *   </div>
 *
 * 多文件时按 x 方向错落 40px，避免节点完全重叠。
 */
import { useVueFlow } from '@vue-flow/core'
import { ElMessage } from 'element-plus'
import { uploadStorageFile } from '@/api/storage'
import { addNode } from '@/views/workflow/composables/useWorkflowCanvas'
import type { DroppedFileDescriptor, DroppedFileKind } from '@/types/canvas-interaction'

const MULTI_FILE_X_STEP = 40

function classifyFile(file: File): DroppedFileKind {
  if (file.type.startsWith('image/')) return 'image'
  if (file.type.startsWith('video/')) return 'video'
  return 'unsupported'
}

export function useCanvasDrop() {
  const { screenToFlowCoordinate } = useVueFlow()

  /**
   * Drop 事件处理器
   * @returns 已落地的文件描述列表（含节点未创建的失败项时也会返回 unsupported 之外的有效项）
   */
  const onDrop = async (event: DragEvent): Promise<DroppedFileDescriptor[]> => {
    event.preventDefault()
    if (!event.dataTransfer) return []
    const files = Array.from(event.dataTransfer.files)
    if (files.length === 0) return []

    const dropped: DroppedFileDescriptor[] = []
    let xOffset = 0
    for (const file of files) {
      const kind = classifyFile(file)
      if (kind === 'unsupported') {
        ElMessage.warning(`不支持的文件类型：${file.name}`)
        continue
      }
      const position = screenToFlowCoordinate({
        x: event.clientX + xOffset,
        y: event.clientY,
      })
      xOffset += MULTI_FILE_X_STEP
      dropped.push({ file, kind, position })

      try {
        const uploaded = await uploadStorageFile(file, 'asset')
        if (!uploaded) {
          ElMessage.error(`${file.name} 上传失败`)
          continue
        }
        if (kind === 'image') {
          addNode('image', position, { url: uploaded.publicUrl, label: file.name })
        } else {
          addNode('video', position, { url: uploaded.publicUrl, duration: 0, label: file.name })
        }
      } catch (err) {
        ElMessage.error(`${file.name} 上传失败`)
        // eslint-disable-next-line no-console
        console.error('[useCanvasDrop] upload failed', err)
      }
    }
    return dropped
  }

  /** dragover：必须 preventDefault 才能让 drop 触发 */
  const onDragOver = (event: DragEvent) => {
    event.preventDefault()
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy'
  }

  return { onDrop, onDragOver }
}
