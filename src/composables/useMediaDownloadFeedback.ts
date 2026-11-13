import { ref } from 'vue'
import { ElMessage, type MessageHandler } from 'element-plus'
import { downloadMediaFile, downloadMediaFilesSequential } from '@/shared/media-download'

export type MediaDownloadParams = Parameters<typeof downloadMediaFile>[0]

export type MediaDownloadFeedbackOptions = {
  loadingMessage?: string
  successMessage?: string
  /** 批量下载等场景自行汇总提示时可设为 true */
  silent?: boolean
}

const activeDownloadCount = ref(0)

/** 全局是否有下载任务进行中（可用于禁用重复触发）。 */
export const isMediaDownloadActive = activeDownloadCount

const resolveLoadingMessage = (kind?: MediaDownloadParams['kind']) => {
  if (kind === 'video') {
    return '正在准备视频下载…'
  }
  return '正在准备下载…'
}

const resolveSuccessMessage = (kind?: MediaDownloadParams['kind']) => {
  if (kind === 'video') {
    return '下载完成'
  }
  return '下载完成'
}

export async function runMediaDownloadWithFeedback(
  input: MediaDownloadParams,
  options?: MediaDownloadFeedbackOptions,
): Promise<boolean> {
  let loadingToast: MessageHandler | undefined
  activeDownloadCount.value += 1

  if (!options?.silent) {
    loadingToast = ElMessage({
      message: options?.loadingMessage ?? resolveLoadingMessage(input.kind),
      type: 'info',
      duration: 0,
      showClose: false,
    })
  }

  try {
    await downloadMediaFile(input)
    loadingToast?.close()
    if (!options?.silent) {
      ElMessage.success(options?.successMessage ?? resolveSuccessMessage(input.kind))
    }
    return true
  } catch (error) {
    loadingToast?.close()
    if (!options?.silent) {
      ElMessage.error(error instanceof Error ? error.message : '下载失败，请稍后重试')
    }
    return false
  } finally {
    activeDownloadCount.value = Math.max(0, activeDownloadCount.value - 1)
  }
}

export function useMediaDownloadFeedback() {
  const downloading = ref(false)

  const downloadWithFeedback = async (
    input: MediaDownloadParams,
    options?: MediaDownloadFeedbackOptions,
  ) => {
    if (downloading.value) {
      ElMessage.warning('正在下载，请稍候…')
      return false
    }

    downloading.value = true
    try {
      return await runMediaDownloadWithFeedback(input, options)
    } finally {
      downloading.value = false
    }
  }

  return {
    downloading,
    downloadWithFeedback,
  }
}

/** 批量顺序下载：展示整体 loading，汇总结果由调用方决定如何提示。 */
export async function runBatchMediaDownloadWithFeedback(
  items: MediaDownloadParams[],
  options?: { intervalMs?: number },
): Promise<{ successCount: number; totalCount: number }> {
  let loadingToast: MessageHandler | undefined
  activeDownloadCount.value += 1

  loadingToast = ElMessage({
    message: items.length > 1 ? `正在下载 ${items.length} 项，请稍候…` : resolveLoadingMessage(items[0]?.kind),
    type: 'info',
    duration: 0,
    showClose: false,
  })

  try {
    const result = await downloadMediaFilesSequential(items, { intervalMs: options?.intervalMs })
    loadingToast?.close()
    return result
  } catch (error) {
    loadingToast?.close()
    ElMessage.error(error instanceof Error ? error.message : '下载失败，请稍后重试')
    return { successCount: 0, totalCount: items.length }
  } finally {
    activeDownloadCount.value = Math.max(0, activeDownloadCount.value - 1)
  }
}
