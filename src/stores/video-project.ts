import { ref } from 'vue'
import {
  createBlankVideoProject,
  deleteVideoProject,
  listMyVideoProjects,
  type VideoProjectListItem,
} from '@/api/video-projects'
import { AUTH_LOGIN_SUCCESS_EVENT } from '@/stores/auth'

// 视频项目列表全局单例 store。模块级 ref + composable 风格,
// 与 src/stores/marketing-center.ts 一致(本项目不使用 Pinia defineStore)。
const projects = ref<VideoProjectListItem[]>([])
const totalCount = ref(0)
const loading = ref(false)
const submitting = ref(false)
let loadPromise: Promise<VideoProjectListItem[]> | null = null
let authEventBound = false

export const useVideoProjectStore = () => {
  const ensureAuthRefreshListener = () => {
    if (authEventBound || typeof window === 'undefined') return
    authEventBound = true
    window.addEventListener(AUTH_LOGIN_SUCCESS_EVENT, () => {
      void loadProjects(true)
    })
  }

  const loadProjects = async (force = false) => {
    ensureAuthRefreshListener()
    if (loadPromise && !force) return loadPromise

    loading.value = true
    loadPromise = listMyVideoProjects({ pageSize: 120 })
      .then((result) => {
        projects.value = result.items
        totalCount.value = result.summary.totalCount
        return result.items
      })
      .finally(() => {
        loading.value = false
        loadPromise = null
      })

    return loadPromise
  }

  const runWithReload = async <T>(task: () => Promise<T>) => {
    submitting.value = true
    try {
      const result = await task()
      await loadProjects(true)
      return result
    } finally {
      submitting.value = false
    }
  }

  const createProject = async (name: string) => {
    return runWithReload(() => createBlankVideoProject({ name }))
  }

  const removeProject = async (id: string) => {
    return runWithReload(() => deleteVideoProject(id))
  }

  return {
    projects,
    totalCount,
    loading,
    submitting,
    loadProjects,
    createProject,
    removeProject,
  }
}
