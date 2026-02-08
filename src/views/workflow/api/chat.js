/**
 * 聊天 API - SSE 流式对话
 */

import { getBaseUrl, getApiKey, getEndpoint } from './request'

/**
 * 流式对话补全（async generator）
 */
export async function* streamChatCompletions(data, signal) {
  const apiKey = getApiKey()
  const baseUrl = getBaseUrl()
  const endpoint = getEndpoint('chat')

  const response = await fetch(`${baseUrl}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({ ...data, stream: true }),
    signal
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error?.error?.message || error?.message || '请求失败')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || !trimmed.startsWith('data:')) continue

      const chunk = trimmed.slice(5).trim()
      if (chunk === '[DONE]') return

      try {
        const parsed = JSON.parse(chunk)
        const content = parsed.choices?.[0]?.delta?.content
        if (content) yield content
      } catch {
        // 跳过无效 JSON
      }
    }
  }
}
