const sanitizeDownloadSlug = (value?: string | null) => {
  return String(value || '')
    .trim()
    .replace(/[^\w\u4e00-\u9fff-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48)
}

/** 生成视频下载文件名（不含第三方品牌词） */
export const buildVideoDownloadFilename = (input?: {
  prompt?: string
  recordId?: string
  taskId?: string
}) => {
  const slug = sanitizeDownloadSlug(input?.prompt) || 'canana-video'
  const suffix = String(input?.recordId || input?.taskId || '').trim().slice(-8)
  const idPart = suffix ? `-${suffix}` : ''
  return `${slug}${idPart}-${Date.now()}.mp4`
}

/** 将 16x9 / 16:9 转为 CSS aspect-ratio 数值 */
export const resolveVideoDisplayAspectRatio = (value?: string | number | null) => {
  const explicit = Number(value)
  if (Number.isFinite(explicit) && explicit > 0) {
    return explicit
  }

  const normalized = String(value || '16:9').trim().toLowerCase()
  const colonMatch = normalized.match(/^(\d+(?:\.\d+)?)\s*:\s*(\d+(?:\.\d+)?)$/)
  if (colonMatch) {
    const width = Number(colonMatch[1])
    const height = Number(colonMatch[2])
    if (width > 0 && height > 0) {
      return width / height
    }
  }

  const sizeMatch = normalized.match(/^(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)$/i)
  if (sizeMatch) {
    const width = Number(sizeMatch[1])
    const height = Number(sizeMatch[2])
    if (width > 0 && height > 0) {
      return width / height
    }
  }

  return 16 / 9
}
