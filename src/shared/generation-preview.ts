export type GenerationPreviewKind = 'video' | 'image' | 'none'

export interface GenerationPreviewMedia {
  kind: GenerationPreviewKind
  url: string
}

export const isVideoMediaUrl = (url?: string | null) => /\.(mp4|mov|webm|m4v)(\?|#|$)/i.test(String(url || '').trim())

const normalizeOutputType = (value?: string | null) => String(value || '').trim().toLowerCase()

/** 从生成记录 outputs / images 解析预览媒体类型与地址 */
export const resolveGenerationPreviewMedia = (record?: {
  type?: string
  images?: string[]
  outputs?: Array<{ outputType?: string; url?: string | null }>
} | null): GenerationPreviewMedia => {
  if (!record) {
    return { kind: 'none', url: '' }
  }

  const outputs = Array.isArray(record.outputs) ? record.outputs : []

  const videoOutput = outputs.find((output) => normalizeOutputType(output.outputType) === 'video' && output.url)
  if (videoOutput?.url) {
    return { kind: 'video', url: String(videoOutput.url) }
  }

  const imageOutput = outputs.find((output) => normalizeOutputType(output.outputType) === 'image' && output.url)
  if (imageOutput?.url) {
    return { kind: 'image', url: String(imageOutput.url) }
  }

  const fallbackUrl = String(record.images?.[0] || '').trim()
  if (!fallbackUrl) {
    return { kind: 'none', url: '' }
  }

  if (isVideoMediaUrl(fallbackUrl) || normalizeOutputType(record.type) === 'video') {
    return { kind: 'video', url: fallbackUrl }
  }

  return { kind: 'image', url: fallbackUrl }
}

export const resolveGenerationPreviewUrl = (record?: Parameters<typeof resolveGenerationPreviewMedia>[0]) =>
  resolveGenerationPreviewMedia(record).url
