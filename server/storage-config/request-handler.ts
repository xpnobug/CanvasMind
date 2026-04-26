import { sendJson } from '../ai-gateway/shared'
import { isPrismaConfigured } from '../db/prisma'
import { STORAGE_CONFIGS_BASE_PATH } from './constants'
import { readStorageConfigBody, sendStorageConfigError } from './shared'
import {
  activateObjectStorageConfig,
  createObjectStorageConfig,
  listObjectStorageConfigs,
  updateObjectStorageConfig,
} from './service'

// 处理对象存储配置请求。
export const handleStorageConfigRequest = async (req: any, res: any) => {
  try {
    if (!isPrismaConfigured()) {
      sendStorageConfigError(res, 500, '缺少 DATABASE_URL，暂时无法使用对象存储配置。')
      return
    }

    const requestUrl = String(req.url || '').split('?')[0]
    const suffix = requestUrl.startsWith(`${STORAGE_CONFIGS_BASE_PATH}/`)
      ? requestUrl.slice(STORAGE_CONFIGS_BASE_PATH.length + 1)
      : ''
    const isActivatePath = suffix.endsWith('/activate')
    const configId = isActivatePath
      ? decodeURIComponent(suffix.slice(0, -('/activate'.length)))
      : decodeURIComponent(suffix)

    if (req.method === 'GET' && requestUrl === STORAGE_CONFIGS_BASE_PATH) {
      const data = await listObjectStorageConfigs()
      sendJson(res, 200, { data })
      return
    }

    if (req.method === 'POST' && requestUrl === STORAGE_CONFIGS_BASE_PATH) {
      const payload = await readStorageConfigBody(req)
      const data = await createObjectStorageConfig(payload)
      sendJson(res, 200, { data, message: '对象存储已创建' })
      return
    }

    if (req.method === 'PUT' && configId && !isActivatePath) {
      const payload = await readStorageConfigBody(req)
      const data = await updateObjectStorageConfig(configId, payload)
      sendJson(res, 200, { data, message: '对象存储已更新' })
      return
    }

    if (req.method === 'POST' && configId && isActivatePath) {
      const data = await activateObjectStorageConfig(configId)
      sendJson(res, 200, { data, message: '对象存储已启用' })
      return
    }

    sendStorageConfigError(res, 405, 'Method Not Allowed')
  } catch (error: any) {
    sendStorageConfigError(res, 500, error?.message || '处理对象存储配置失败')
  }
}
