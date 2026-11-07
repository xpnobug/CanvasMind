import { buildApiUrl } from './http'
import { readApiData } from './response'
import { buildDefaultScene } from '@cutia/lib/scenes'
import {
  DEFAULT_FPS,
  DEFAULT_CANVAS_SIZE,
  DEFAULT_COLOR,
} from '@cutia/constants/project-constants'
import { CURRENT_PROJECT_VERSION } from '@cutia/services/storage/migrations'

// 与 cutia src-cutia/services/storage/types.ts 的 SerializedProject 严格对齐。
// 这里只标关键字段,完整结构透传(后端也是按 SerializedProjectBody 全量保存)。
export interface SerializedVideoProject {
  metadata: {
    id: string
    name: string
    thumbnail?: string
    duration: number
    createdAt: string
    updatedAt: string
  }
  scenes: unknown[]
  currentSceneId?: string
  settings: Record<string, unknown>
  version: number
  timelineViewState?: Record<string, unknown> | null
  agentMessages?: unknown[] | null
}

// 列表返回的精简结构(不含 scenes)
export interface VideoProjectListItem {
  metadata: {
    id: string
    name: string
    thumbnail?: string
    duration: number
    createdAt: string
    updatedAt: string
  }
  durationSeconds?: number
  thumbnail?: string
  updatedAt: string
  version: number
  owner?: {
    id: string
    name: string
    email: string
  }
}

export interface VideoProjectListResponse {
  items: VideoProjectListItem[]
  summary: {
    totalCount: number
    totalPages: number
    page: number
    pageSize: number
  }
}

export interface VideoProjectListQuery {
  scope?: 'mine' | 'all'
  page?: number
  pageSize?: number
  keyword?: string
}

interface RequestMessageOptions {
  showSuccessMessage?: boolean
  successMessage?: string
}

const VIDEO_PROJECTS_PATH = '/api/video-projects'

const buildQueryString = (query: VideoProjectListQuery): string => {
  const params = new URLSearchParams()
  if (query.scope) params.set('scope', query.scope)
  if (query.page) params.set('page', String(query.page))
  if (query.pageSize) params.set('pageSize', String(query.pageSize))
  if (query.keyword) params.set('keyword', query.keyword)
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

const requestJson = async <T>(
  url: string,
  options: RequestInit = {},
  messageOptions: RequestMessageOptions = {},
) => {
  const response = await fetch(buildApiUrl(url), {
    credentials: 'include',
    cache: 'no-store',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })

  return readApiData<T>(response, {
    showErrorMessage: true,
    showSuccessMessage: messageOptions.showSuccessMessage,
    successMessage: messageOptions.successMessage,
  })
}

// 查询当前用户的视频项目列表(返回精简项,无 scenes)
export const listMyVideoProjects = (query: VideoProjectListQuery = {}) =>
  requestJson<VideoProjectListResponse>(
    `${VIDEO_PROJECTS_PATH}${buildQueryString({ ...query, scope: 'mine' })}`,
    { method: 'GET' },
  )

// 管理员查询全部用户的视频项目
export const listAllVideoProjects = (query: VideoProjectListQuery = {}) =>
  requestJson<VideoProjectListResponse>(
    `${VIDEO_PROJECTS_PATH}${buildQueryString({ ...query, scope: 'all' })}`,
    { method: 'GET' },
  )

// 加载单个项目完整数据(含 scenes)
export const getVideoProject = (id: string) =>
  requestJson<SerializedVideoProject>(`${VIDEO_PROJECTS_PATH}/${id}`, { method: 'GET' })

// 全量保存项目(upsert 创建或更新)
export const saveVideoProject = (id: string, payload: SerializedVideoProject) =>
  requestJson<SerializedVideoProject>(`${VIDEO_PROJECTS_PATH}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })

// 软删除项目
export const deleteVideoProject = (id: string) =>
  requestJson<{ id: string; deleted: boolean }>(
    `${VIDEO_PROJECTS_PATH}/${id}`,
    { method: 'DELETE' },
    { showSuccessMessage: true, successMessage: '已删除' },
  )

// 生成接近 cuid 形态的本地 id(24 位 hex,与 VarChar(36) 限制兼容)。
// 注: crypto.randomUUID 是 UUIDv4,去掉连字符后 32 位 hex,截 24 位即可。
const generateLocalProjectId = (): string => {
  const uuid = crypto.randomUUID().replace(/-/g, '')
  return uuid.slice(0, 24)
}

// 在前端构造一个含 mainScene 的完整 cutia 项目并 PUT 到后端,返回新建项目 id。
//
// 为什么前端构造而不是让 cutia 自己 createNewProject:
//   cutia 自带"not found 则 createNewProject"兜底,理论上可用。但实测发现
//   editor-provider 的 if (isNotFound) 分支在某些时序下不触发(可能与 React 19
//   effect cleanup / 重渲染相关),且 cutia 内部写死 name="Untitled Project",
//   用户输入的 name 也丢失。
//
// 改为前端 buildDefaultScene 复用 cutia 的 lib 函数(单向边界,Vue 端调 cutia
// lib 是被允许的),保证用户输入的 name + 完整最小结构(mainScene + tracks)
// 同时写入,cutia loadProject 后能正确生成缩略图、初始化 scene。
export const createBlankVideoProject = async ({ name }: { name: string }): Promise<string> => {
  const id = generateLocalProjectId()
  const now = new Date().toISOString()
  const mainScene = buildDefaultScene({ name: 'Main scene', isMain: true })
  // mainScene 内含 Date 字段,JSON.stringify 自动序列化为 ISO string,
  // 与 SerializedScene 形态对齐。
  const blank: SerializedVideoProject = {
    metadata: {
      id,
      name: name.trim() || '未命名项目',
      duration: 0,
      createdAt: now,
      updatedAt: now,
    },
    scenes: [mainScene as unknown as Record<string, unknown>],
    currentSceneId: mainScene.id,
    settings: {
      fps: DEFAULT_FPS,
      canvasSize: DEFAULT_CANVAS_SIZE,
      originalCanvasSize: null,
      background: { type: 'color', color: DEFAULT_COLOR },
    },
    version: CURRENT_PROJECT_VERSION,
  }
  await saveVideoProject(id, blank)
  return id
}
