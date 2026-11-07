import fs from 'node:fs/promises'
import path from 'node:path'

const apiBaseUrl = process.env.TEST_RESEARCH_API_BASE_URL || 'http://localhost:5409'
const cookie = process.env.TEST_RESEARCH_COOKIE || ''
const providerId = process.env.TEST_RESEARCH_PROVIDER_ID || ''
const modelKey = process.env.TEST_RESEARCH_MODEL_KEY || ''
const prompt = process.env.TEST_RESEARCH_PROMPT || '请深度研究当前项目的 Deep Research 后端工作流，并总结实现现状与后续建议。'
const researchSearchProvider = process.env.TEST_RESEARCH_SEARCH_PROVIDER || ''
const researchSearchProviderId = process.env.TEST_RESEARCH_SEARCH_PROVIDER_ID || ''
const researchSearchModel = process.env.TEST_RESEARCH_SEARCH_MODEL || ''
const replayOutputPath = process.env.TEST_RESEARCH_REPLAY_OUTPUT || ''
const eventFilter = new Set(
  String(process.env.TEST_RESEARCH_EVENT_FILTER || '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean),
)
const stageTimestamps = new Map()
const replayEvents = []
let latestVerification = null

if (!cookie) {
  console.error('缺少 TEST_RESEARCH_COOKIE，无法提交研究任务。')
  process.exit(1)
}

if (!providerId || !modelKey) {
  console.error('缺少 TEST_RESEARCH_PROVIDER_ID 或 TEST_RESEARCH_MODEL_KEY。')
  process.exit(1)
}

const submitTask = async () => {
  const response = await fetch(`${apiBaseUrl}/generation-tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie,
    },
    body: JSON.stringify({
      type: 'research',
      source: 'generate',
      prompt,
      modelKey,
      requestBody: {
        providerId,
        ...(researchSearchProvider ? { researchSearchProvider } : {}),
        ...(researchSearchProviderId ? { researchSearchProviderId } : {}),
        ...(researchSearchModel ? { researchSearchModel } : {}),
      },
    }),
  })

  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(payload?.message || `提交研究任务失败 (${response.status})`)
  }

  return payload?.data
}

const streamTask = async (recordId) => {
  const response = await fetch(`${apiBaseUrl}/generation-tasks/${encodeURIComponent(recordId)}/events`, {
    headers: {
      Accept: 'text/event-stream',
      Cookie: cookie,
    },
  })

  if (!response.ok || !response.body) {
    throw new Error(`订阅研究任务事件失败 (${response.status})`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) {
      break
    }

    buffer += decoder.decode(value, { stream: true })
    const chunks = buffer.split('\n\n')
    buffer = chunks.pop() || ''

    for (const chunk of chunks) {
      const lines = chunk.split('\n')
      const eventLine = lines.find(line => line.startsWith('event:'))
      const dataLine = lines.find(line => line.startsWith('data:'))
      if (!eventLine || !dataLine) {
        continue
      }

      const eventName = eventLine.slice(6).trim()
      if (eventName === 'ping') {
        continue
      }

      let payload = null
      try {
        payload = JSON.parse(dataLine.slice(5).trim())
      } catch {
        payload = { raw: dataLine.slice(5).trim() }
      }

      if (payload?.type === 'stage_changed' && payload?.researchStage?.stage) {
        stageTimestamps.set(payload.researchStage.stage, Date.now())
      }

      if (payload?.type === 'verification' && payload?.verification) {
        latestVerification = payload.verification
      }

      replayEvents.push({
        eventName,
        payload,
        receivedAt: new Date().toISOString(),
      })

      if (!eventFilter.size || eventFilter.has(eventName) || eventFilter.has(String(payload?.type || '').trim())) {
        console.log(`[${eventName}]`, JSON.stringify(payload, null, 2))
      }
      if (payload?.done) {
        if (stageTimestamps.size) {
          console.log('[stage-summary]', JSON.stringify(
            Array.from(stageTimestamps.entries()).map(([stage, timestamp]) => ({
              stage,
              timestamp,
            })),
            null,
            2,
          ))
        }
        if (latestVerification) {
          console.log('[verification-summary]', JSON.stringify({
            verdict: latestVerification.verdict,
            checkedFacts: latestVerification.checkedFacts,
            passedFactCount: Array.isArray(latestVerification.passedFacts) ? latestVerification.passedFacts.length : 0,
            weakFactCount: Array.isArray(latestVerification.weakFacts) ? latestVerification.weakFacts.length : 0,
            conflictFactCount: Array.isArray(latestVerification.conflictFacts) ? latestVerification.conflictFacts.length : 0,
            unresolvedCount: Array.isArray(latestVerification.unresolvedItems) ? latestVerification.unresolvedItems.length : 0,
            unresolvedPreview: Array.isArray(latestVerification.unresolvedItems)
              ? latestVerification.unresolvedItems.slice(0, 8)
              : [],
          }, null, 2))
        }
        return
      }
    }
  }
}

const main = async () => {
  const task = await submitTask()
  const recordId = String(task?.id || task?.recordId || '').trim()
  if (!recordId) {
    throw new Error('提交成功但未返回记录 ID')
  }

  console.log(`研究任务已创建：${recordId}`)
  await streamTask(recordId)

  if (replayOutputPath) {
    const absoluteOutputPath = path.resolve(replayOutputPath)
    await fs.mkdir(path.dirname(absoluteOutputPath), { recursive: true })
    await fs.writeFile(absoluteOutputPath, JSON.stringify({
      recordId,
      prompt,
      providerId,
      modelKey,
      researchSearchProvider,
      researchSearchProviderId,
      researchSearchModel,
      events: replayEvents,
    }, null, 2))
    console.log(`研究任务回放已保存：${absoluteOutputPath}`)
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error || '未知错误'))
  process.exit(1)
})
