import { sendJson } from '../ai-gateway/shared'
import { isPrismaConfigured } from '../db/prisma'
import { getProviderRuntimeConfig, saveProviderRuntimeConfig } from './service'
import { readProviderRuntimeBody, sendProviderRuntimeError } from './shared'

export const handleProviderConfigRequest = async (req: any, res: any) => {
  try {
    if (!isPrismaConfigured()) {
      sendProviderRuntimeError(res, 500, '缺少 DATABASE_URL，暂时无法使用后端配置存储。')
      return
    }

    if (req.method === 'GET') {
      const data = await getProviderRuntimeConfig()
      sendJson(res, 200, { data })
      return
    }

    if (req.method === 'PUT') {
      const payload = await readProviderRuntimeBody(req)
      const data = await saveProviderRuntimeConfig(payload)
      sendJson(res, 200, { data, message: '配置已保存' })
      return
    }

    sendProviderRuntimeError(res, 405, 'Method Not Allowed')
  } catch (error: any) {
    sendProviderRuntimeError(res, 500, error?.message || '读取配置失败')
  }
}
