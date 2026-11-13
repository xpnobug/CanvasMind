/** 站内信展示用格式化工具 */

/** HTML 特殊字符转义 */
const escapeHtml = (value: string) => {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** 纯文本转 HTML 段落：编辑历史纯文本内容时回填富文本编辑器用，按行拆分保留换行 */
export const plainTextToHtml = (text: string | null | undefined) => {
  if (!text) {
    return ''
  }

  return text
    .split('\n')
    .map(line => (line.trim() ? `<p>${escapeHtml(line)}</p>` : '<p></p>'))
    .join('')
}

/** 相对时间：刚刚 / N分钟前 / N天前 */
export const formatRelativeTime = (value: string | null | undefined) => {
  if (!value) {
    return ''
  }

  const ts = new Date(value).getTime()
  if (!Number.isFinite(ts)) {
    return ''
  }

  const diff = Date.now() - ts
  const min = Math.floor(diff / 60_000)
  if (min < 1) {
    return '刚刚'
  }
  if (min < 60) {
    return `${min}分钟前`
  }

  const hr = Math.floor(min / 60)
  if (hr < 24) {
    return `${hr}小时前`
  }

  const day = Math.floor(hr / 24)
  if (day < 30) {
    return `${day}天前`
  }

  return new Date(ts).toLocaleDateString('zh-CN')
}

/** 从正文提取首张图片 URL，用于列表缩略图（兼容 HTML img 标签、markdown 图片语法与裸 URL） */
export const extractFirstImageUrl = (content: string | null | undefined): string | null => {
  if (!content) {
    return null
  }

  const htmlMatch = content.match(/<img\b[^>]*\bsrc=["']([^"']+)["']/i)
  if (htmlMatch?.[1]) {
    return htmlMatch[1]
  }

  const markdownMatch = content.match(/!\[[^\]]*\]\(([^)\s]+)\)/)
  if (markdownMatch?.[1]) {
    return markdownMatch[1]
  }

  const urlMatch = content.match(/https?:\/\/[^\s"'<>]+\.(?:png|jpe?g|gif|webp|svg)(?:\?[^\s"'<>]*)?/i)
  return urlMatch?.[0] ?? null
}

/** 解码常见 HTML 实体（摘要预览用，覆盖编辑器产出的高频实体即可） */
const decodeHtmlEntities = (value: string) => {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&amp;/gi, '&')
}

/** 生成列表摘要预览（兼容 HTML 与纯文本/markdown 正文） */
export const buildMessagePreview = (content: string | null | undefined, maxLength = 72) => {
  if (!content) {
    return ''
  }

  const plain = decodeHtmlEntities(
    content
      .replace(/<[^>]*>/g, ' ')
      .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/https?:\/\/\S+/g, ''),
  )
    .replace(/\s+/g, ' ')
    .trim()

  if (plain.length <= maxLength) {
    return plain
  }

  return `${plain.slice(0, maxLength)}...`
}
