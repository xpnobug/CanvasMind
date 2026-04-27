import { sendJson } from '../ai-gateway/shared'
import { requireCurrentSessionUser } from '../auth/session'
import { isPrismaConfigured } from '../db/prisma'
import { createGenerationRecord, getGenerationRecordById, listGenerationRecords, updateGenerationRecord } from './service'
import { GENERATION_RECORDS_BASE_PATH } from './constants'
import { readGenerationRecordBody, sendGenerationRecordError } from './shared'

// 处理生成记录的列表、创建与更新请求
export const handleGenerationRecordsRequest = async (req: any, res: any) => {
  try {
    if (!isPrismaConfigured()) {
      sendGenerationRecordError(res, 500, '缺少 DATABASE_URL，暂时无法使用生成记录存储。')
      return
    }

    const requestUrl = String(req.url || '').split('?')[0]
    const currentUser = await requireCurrentSessionUser(req, res)
    if (!currentUser) {
      return
    }

    const recordId = requestUrl.startsWith(`${GENERATION_RECORDS_BASE_PATH}/`)
      ? decodeURIComponent(requestUrl.slice(GENERATION_RECORDS_BASE_PATH.length + 1))
      : ''

    if (req.method === 'GET' && requestUrl === GENERATION_RECORDS_BASE_PATH) {
      const data = await listGenerationRecords(currentUser.id)
      sendJson(res, 200, { data })
      return
    }

    if (req.method === 'GET' && recordId) {
      const data = await getGenerationRecordById(recordId, currentUser.id)
      sendJson(res, 200, { data })
      return
    }

    if (req.method === 'POST' && requestUrl === GENERATION_RECORDS_BASE_PATH) {
      const payload = await readGenerationRecordBody(req)
      const data = await createGenerationRecord(payload, currentUser.id)
      sendJson(res, 200, { data })
      return
    }

    if (req.method === 'PATCH' && recordId) {
      const payload = await readGenerationRecordBody(req)
      const data = await updateGenerationRecord(recordId, payload, currentUser.id)
      sendJson(res, 200, { data })
      return
    }

    sendGenerationRecordError(res, 405, 'Method Not Allowed')
  } catch (error: any) {
    sendGenerationRecordError(res, 500, error?.message || '处理生成记录失败')
  }
}
