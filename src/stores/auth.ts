import { computed, ref } from 'vue'
import type { AuthMethodType, AuthUserProfile, PublicAuthMethod } from '@/api/auth'
import { getAuthSession, listEnabledAuthMethods, loginByVerificationCode, logoutAuthSession } from '@/api/auth'

// 登录成功后通知页面刷新接口数据。
export const AUTH_LOGIN_SUCCESS_EVENT = 'auth:login-success'

// 广播登录成功事件，供各页面按需重拉接口。
const dispatchAuthLoginSuccess = () => {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(AUTH_LOGIN_SUCCESS_EVENT))
}

// 当前登录用户。
const currentUser = ref<AuthUserProfile | null>(null)

// 当前启用的登录方式列表。
const enabledMethods = ref<PublicAuthMethod[]>([])

// 是否正在拉取登录态。
const sessionLoading = ref(false)

// 登录态是否已完成至少一次初始化。
const sessionInitialized = ref(false)

// 是否正在拉取登录方式。
const methodsLoading = ref(false)

// 首次登录态加载任务。
let loadSessionPromise: Promise<AuthUserProfile | null> | null = null

// 首次登录方式加载任务。
let loadMethodsPromise: Promise<PublicAuthMethod[]> | null = null

// 统一应用当前登录用户。
const applySessionUser = (user: AuthUserProfile | null) => {
  currentUser.value = user
  return currentUser.value
}

// 统一应用当前可用登录方式。
const applyEnabledMethods = (methods: PublicAuthMethod[]) => {
  enabledMethods.value = Array.isArray(methods) ? methods : []
  return enabledMethods.value
}

// 认证状态单例。
export const useAuthStore = () => {
  // 当前是否已登录。
  const isLoggedIn = computed(() => Boolean(currentUser.value?.id))

  // 当前是否具备后台管理员权限。
  const isAdmin = computed(() => currentUser.value?.role === 'ADMIN')

  // 公开版暂无细粒度权限码，预留空数组以对接工作标签可见性。
  const permissions = computed(() => [] as string[])

  // 当前用户按钮文案。
  const loginButtonText = computed(() => {
    return currentUser.value?.maskedPhone || currentUser.value?.maskedEmail || '登录'
  })

  // 拉取当前会话。
  const loadSession = async (force = false) => {
    if (loadSessionPromise && !force) {
      return loadSessionPromise
    }

    sessionLoading.value = true

    loadSessionPromise = getAuthSession()
      .then((result) => applySessionUser(result?.user || null))
      .catch(() => applySessionUser(null))
      .finally(() => {
        sessionInitialized.value = true
        sessionLoading.value = false
        loadSessionPromise = null
      })

    return loadSessionPromise
  }

  // 拉取当前启用的登录方式。
  const loadMethods = async (force = false) => {
    if (loadMethodsPromise && !force) {
      return loadMethodsPromise
    }

    methodsLoading.value = true

    loadMethodsPromise = listEnabledAuthMethods()
      .then((result) => applyEnabledMethods(result || []))
      .catch(() => applyEnabledMethods([]))
      .finally(() => {
        methodsLoading.value = false
        loadMethodsPromise = null
      })

    return loadMethodsPromise
  }

  // 使用验证码方式登录。
  const login = async (payload: {
    methodType: AuthMethodType
    target: string
    code?: string
    password?: string
  }) => {
    const result = await loginByVerificationCode(payload)
    sessionInitialized.value = true
    const user = applySessionUser(result?.user || null)
    if (user?.id) {
      dispatchAuthLoginSuccess()
    }
    return user
  }

  // 退出登录。
  const logout = async () => {
    await logoutAuthSession().catch(() => null)
    sessionInitialized.value = true
    applySessionUser(null)
  }

  return {
    currentUser,
    enabledMethods,
    isLoggedIn,
    isAdmin,
    permissions,
    loginButtonText,
    sessionLoading,
    sessionInitialized,
    methodsLoading,
    loadSession,
    loadMethods,
    login,
    logout,
  }
}
