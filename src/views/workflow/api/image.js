/**
 * 图片生成 API
 * 支持 /images/generations 和 /chat/completions 两种协议
 */

import { request, getEndpoint, getBaseUrl, getApiKey } from './request'

export const generateImage = async (data, options = {}) => {
  const { requestType = 'json', endpoint } = options
  const url = endpoint || getEndpoint('image')

  // 如果路径包含 chat/completions，使用 chat 协议
  if (url.includes('chat/completions')) {
    return generateImageViaChat(data, url)
  }

  return request({
    url,
    method: 'post',
    data,
    headers: requestType === 'formdata' ? { 'Content-Type': 'multipart/form-data' } : {}
  })
}

/**
 * 通过 chat completions 接口生成图片
 * 从 SSE 流中提取图片 URL 或 base64
 */
async function generateImageViaChat(data, endpoint) {
  const baseUrl = getBaseUrl()
  const apiKey = getApiKey()

  const body = {
    model: data.model,
    messages: [{ role: 'user', content: data.prompt }],
    stream: true
  }

  const response = await fetch(`${baseUrl}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(body)
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err?.error?.message || '请求失败')
  }

  // 解析 SSE 流，收集完整内容
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let fullContent = ''
  const imageUrls = []

  while (true) {
    let done, value
    try {
      ({ done, value } = await reader.read())
    } catch {
      // 网络中断，用已收到的数据继续处理
      break
    }
    if (done) break

    buffer += decoder.decode(value, { stream: true })

    // SSE 消息以双换行分隔
    let boundary
    while ((boundary = buffer.indexOf('\n\n')) !== -1) {
      const message = buffer.slice(0, boundary)
      buffer = buffer.slice(boundary + 2)

      for (const line of message.split('\n')) {
        const trimmed = line.trim()
        if (!trimmed || !trimmed.startsWith('data:')) continue
        const chunk = trimmed.slice(5).trim()
        if (chunk === '[DONE]') continue

        try {
          const parsed = JSON.parse(chunk)
          const delta = parsed.choices?.[0]?.delta
          if (delta?.content) fullContent += delta.content
          // delta.images 格式（Gemini 等）
          if (delta?.images) {
            for (const img of delta.images) {
              const url = img?.image_url?.url
              if (url) imageUrls.push(url)
            }
          }
          // inline_data 格式
          if (delta?.inline_data) {
            const d = delta.inline_data
            imageUrls.push(`data:${d.mime_type};base64,${d.data}`)
          }
        } catch {}
      }
    }
  }

  // 处理 buffer 中剩余数据
  if (buffer.trim()) {
    for (const line of buffer.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || !trimmed.startsWith('data:')) continue
      const chunk = trimmed.slice(5).trim()
      if (chunk === '[DONE]') continue
      try {
        const parsed = JSON.parse(chunk)
        const delta = parsed.choices?.[0]?.delta
        if (delta?.content) fullContent += delta.content
        if (delta?.images) {
          for (const img of delta.images) {
            const url = img?.image_url?.url
            if (url) imageUrls.push(url)
          }
        }
      } catch {}
    }
  }

  // 从内容中提取图片 URL（markdown 格式）
  const mdImages = fullContent.match(/!\[.*?\]\((https?:\/\/[^\s)]+)\)/g)
  if (mdImages) {
    for (const m of mdImages) {
      const urlMatch = m.match(/\((https?:\/\/[^\s)]+)\)/)
      if (urlMatch) imageUrls.push(urlMatch[1])
    }
  }

  // 提取 base64 图片
  const b64Match = fullContent.match(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/)
  if (b64Match) imageUrls.push(b64Match[0])

  if (imageUrls.length) {
    return { data: imageUrls.map(url => ({ url })) }
  }

  throw new Error('未能从响应中提取到图片')
}
