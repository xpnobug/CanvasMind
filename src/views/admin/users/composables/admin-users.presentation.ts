/**
 * 用户管理页：纯展示层标签/格式化（无状态）
 */
import { resolveAdminDictionaryItem } from '@/config/adminDictionaries'
import type { AdminUserItem } from '@/api/admin-users'

export const USER_PAGE_SIZES = [12, 20, 50] as const

export const membershipDurationPresets = [
  { label: '7 天', value: 7, unit: 'DAY' as const },
  { label: '30 天', value: 30, unit: 'DAY' as const },
  { label: '3 个月', value: 3, unit: 'MONTH' as const },
  { label: '12 个月', value: 12, unit: 'MONTH' as const },
]

/** 菜单右对齐触发按钮，间距 4px */
export const cardMenuPopperOptions = {
  modifiers: [
    {
      name: 'offset',
      options: { offset: [0, 4] },
    },
  ],
}

export const roleOptions: Array<{ label: string; value: 'ALL' | 'USER' | 'ADMIN' }> = [
  { label: '全部角色', value: 'ALL' },
  { label: resolveAdminDictionaryItem('userRole', 'ADMIN').label, value: 'ADMIN' },
  { label: resolveAdminDictionaryItem('userRole', 'USER').label, value: 'USER' },
]

export const statusOptions: Array<{ label: string; value: 'ALL' | 'ANONYMOUS' | 'ACTIVE' | 'DISABLED' }> = [
  { label: '全部状态', value: 'ALL' },
  { label: resolveAdminDictionaryItem('userStatus', 'ANONYMOUS').label, value: 'ANONYMOUS' },
  { label: resolveAdminDictionaryItem('userStatus', 'ACTIVE').label, value: 'ACTIVE' },
  { label: resolveAdminDictionaryItem('userStatus', 'DISABLED').label, value: 'DISABLED' },
]

export const roleFacetOptions = roleOptions.filter((item) => item.value !== 'ALL')
export const statusFacetOptions = statusOptions.filter((item) => item.value !== 'ALL')

export const getUserInitial = (value: string) => {
  return String(value || 'U').trim().slice(0, 1).toUpperCase() || 'U'
}

export const buildUserDisplayNo = (userId: string) => {
  const value = String(userId || '').trim()
  if (!value) {
    return 'USER-UNKNOWN'
  }
  return `USER-${value.slice(-6).toUpperCase()}`
}

export const getUserSecondaryLabel = (user: AdminUserItem) => {
  return user.maskedEmail || user.maskedPhone || ''
}

export const getUserStatusLabel = (status: string) => resolveAdminDictionaryItem('userStatus', status).label

export const getUserRoleLabel = (role: string) => resolveAdminDictionaryItem('userRole', role).label

export const getUserStatusToneClass = (status: string) => {
  if (status === 'ACTIVE') return 'is-active'
  if (status === 'ANONYMOUS') return 'is-anonymous'
  return 'is-inactive'
}

export const getUserRoleToneClass = (role: string) => {
  if (role === 'ADMIN') return 'is-admin'
  return 'is-member'
}

export const getAuthMethodLabel = (methodType: string) => {
  if (methodType === 'ADMIN_PASSWORD') return '管理员账号密码'
  if (methodType === 'PHONE_CODE') return '手机验证码'
  if (methodType === 'EMAIL_CODE') return '邮箱验证码'
  if (methodType === 'GATEWAY_ACCOUNT') return '中转站账号'
  if (methodType === 'KEY_LOGIN') return 'Key 登录'
  if (methodType === 'TOKEN_LOGIN') return 'Token 登录'
  if (methodType === 'REGISTER') return '账号注册'
  if (methodType === 'WECHAT_OAUTH') return '微信登录'
  if (methodType === 'GITHUB_OAUTH') return 'GitHub 登录（已废弃）'
  if (methodType === 'GOOGLE_OAUTH') return 'Google 登录（已废弃）'
  if (methodType === 'CUSTOM_OAUTH') return '自定义 OAuth（已废弃）'
  if (methodType === 'OAUTH_PROVIDER') return '第三方身份源'
  return methodType || '未知方式'
}

export const getPointActionLabel = (action: string) => {
  if (action === 'DECREASE') return '扣减'
  if (action === 'FREEZE') return '冻结'
  if (action === 'UNFREEZE') return '解冻'
  return '增加'
}

export const resolveDurationUnitLabel = (value: string) => {
  if (value === 'DAY') return '天'
  if (value === 'YEAR') return '年'
  return '个月'
}

export const formatDate = (value?: string | null) => {
  if (!value) {
    return '未知时间'
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

export const formatMoney = (value: string | number | null | undefined) => {
  const numeric = Number(value || 0)
  if (!Number.isFinite(numeric)) {
    return '¥0.00'
  }
  return `¥${numeric.toFixed(2)}`
}
