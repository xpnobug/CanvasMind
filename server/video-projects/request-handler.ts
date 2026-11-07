import { sendJson } from '../ai-gateway/shared'
import { requireCurrentSessionUser } from '../auth/session'
import { isPrismaConfigured } from '../db/prisma'
import { VIDEO_PROJECTS_BASE_PATH } from './constants'
import {
  readVideoProjectBody,
  readVideoProjectListQuery,
  sendVideoProjectsError,
} from './shared'
import {
  getVideoProjectById,
  listAllVideoProjects,
  listMineVideoProjects,
  softDeleteVideoProject,
  upsertVideoProject,
} from './service'

// 解析路径形如 /api/video-projects/:id 的 id 段
const extractProjectId = (pathname: string): string | null => {
  if (!pathname.startsWith(`${VIDEO_PROJECTS_BASE_PATH}/`)) return null
  const rest = pathname.slice(VIDEO_PROJECTS_BASE_PATH.length + 1)
  if (!rest || rest.includes('/')) return null
  return rest
}

export const handleVideoProjectsRequest = async (req: any, res: any) => {
  try {
    if (!isPrismaConfigured()) {
      sendVideoProjectsError(res, 500, '缺少 DATABASE_URL,暂时无法使用项目存储。')
      return
    }

    const currentUser = await requireCurrentSessionUser(req, res)
    if (!currentUser) return

    const isAdmin = currentUser.role === 'ADMIN'
    const requestUrl = String(req.url || '')
    const pathname = requestUrl.split('?')[0]

    // GET /api/video-projects — 列表
    if (req.method === 'GET' && pathname === VIDEO_PROJECTS_BASE_PATH) {
      const query = readVideoProjectListQuery(requestUrl)
      if (query.scope === 'all') {
        if (!isAdmin) {
          sendVideoProjectsError(res, 403, '只有管理员可以查看全部用户的视频项目')
          return
        }
        const data = await listAllVideoProjects(query)
        sendJson(res, 200, { data })
        return
      }
      const data = await listMineVideoProjects(query, currentUser.id)
      sendJson(res, 200, { data })
      return
    }

    const projectId = extractProjectId(pathname)

    // GET /api/video-projects/:id — 单个
    if (req.method === 'GET' && projectId) {
      const result = await getVideoProjectById({ id: projectId, userId: currentUser.id, isAdmin })
      if (!result) {
        sendVideoProjectsError(res, 404, '项目不存在或已被删除')
        return
      }
      if ('forbidden' in result) {
        sendVideoProjectsError(res, 403, '无权访问该项目')
        return
      }
      sendJson(res, 200, { data: result })
      return
    }

    // PUT /api/video-projects/:id — 创建或更新（全量保存）
    if (req.method === 'PUT' && projectId) {
      const body = await readVideoProjectBody(req)
      if (!body) {
        sendVideoProjectsError(res, 400, '请求体格式错误,缺少 metadata.id')
        return
      }
      if (body.metadata.id !== projectId) {
        sendVideoProjectsError(res, 400, 'metadata.id 与 URL 中的 :id 不一致')
        return
      }
      const result = await upsertVideoProject({ id: projectId, userId: currentUser.id, isAdmin, body })
      if (result && typeof result === 'object' && 'forbidden' in result) {
        sendVideoProjectsError(res, 403, '无权覆盖其他用户的项目')
        return
      }
      sendJson(res, 200, { data: result })
      return
    }

    // DELETE /api/video-projects/:id — 软删除
    if (req.method === 'DELETE' && projectId) {
      const result = await softDeleteVideoProject({ id: projectId, userId: currentUser.id, isAdmin })
      if ('notFound' in result) {
        sendVideoProjectsError(res, 404, '项目不存在')
        return
      }
      if ('forbidden' in result) {
        sendVideoProjectsError(res, 403, '无权删除该项目')
        return
      }
      sendJson(res, 200, { data: { id: projectId, deleted: true } })
      return
    }

    sendVideoProjectsError(res, 405, 'Method Not Allowed')
  } catch (error: any) {
    sendVideoProjectsError(res, 500, error?.message || '处理视频项目请求失败')
  }
}
