import { ref, computed, type Ref, type ComputedRef } from 'vue'

// 类型定义
export type PlatformType = 1 | 2 | 3 | 4

export type PlatformName = '小红书' | '视频号' | '抖音' | '快手'

export type AccountStatus = 0 | 1

export type RawAccount = [
  id: number,
  type: PlatformType,
  filePath: string,
  userName: string,
  status: AccountStatus
]

export interface Account {
  id: number
  type: PlatformType
  name: string
  platform: string
  filePath: string
  status: string
}

export interface AccountsByPlatform {
  [platform: string]: Account[]
}

export interface AccountUpdates {
  type?: PlatformType
  filePath?: string
  userName?: string
  status?: AccountStatus
}

export interface AccountStore {
  accounts: ComputedRef<Account[]>
  accountsByPlatform: ComputedRef<AccountsByPlatform>
  setAccounts: (data: RawAccount[]) => void
  deleteAccount: (id: number) => void
  updateAccount: (id: number, updates: AccountUpdates) => void
  PLATFORM_TYPE_MAP: Record<PlatformName, PlatformType>
  PLATFORM_NAME_MAP: Record<PlatformType, PlatformName>
}

// 平台类型映射
const PLATFORM_TYPE_MAP: Record<PlatformName, PlatformType> = {
  '小红书': 1,
  '视频号': 2,
  '抖音': 3,
  '快手': 4
}

const PLATFORM_NAME_MAP: Record<PlatformType, PlatformName> = {
  1: '小红书',
  2: '视频号',
  3: '抖音',
  4: '快手'
}

// 状态映射
const STATUS_MAP: Record<AccountStatus, string> = {
  0: '异常',
  1: '正常'
}

// 创建单例状态
const rawAccounts: Ref<RawAccount[]> = ref([])

/**
 * 账号状态管理（单例模式）
 */
export function useAccountStore(): AccountStore {
  // 格式化账号数据
  const accounts = computed<Account[]>(() => {
    return rawAccounts.value.map(account => {
      // account 格式: [id, type, filePath, userName, status]
      const [id, type, filePath, userName, status] = account
      
      return {
        id,
        type,
        name: userName,
        platform: PLATFORM_NAME_MAP[type] || '未知',
        filePath,
        status: STATUS_MAP[status] || '验证中'
      }
    })
  })

  // 按平台分组的账号
  const accountsByPlatform = computed<AccountsByPlatform>(() => {
    const grouped: AccountsByPlatform = {}
    accounts.value.forEach(account => {
      if (!grouped[account.platform]) {
        grouped[account.platform] = []
      }
      grouped[account.platform].push(account)
    })
    return grouped
  })

  // 设置账号列表
  function setAccounts(data: RawAccount[]): void {
    rawAccounts.value = data
  }

  // 删除账号
  function deleteAccount(id: number): void {
    const index = rawAccounts.value.findIndex(account => account[0] === id)
    if (index > -1) {
      rawAccounts.value.splice(index, 1)
    }
  }

  // 更新账号
  function updateAccount(id: number, updates: AccountUpdates): void {
    const index = rawAccounts.value.findIndex(account => account[0] === id)
    if (index > -1) {
      const account = rawAccounts.value[index]
      if (updates.type !== undefined) account[1] = updates.type
      if (updates.filePath !== undefined) account[2] = updates.filePath
      if (updates.userName !== undefined) account[3] = updates.userName
      if (updates.status !== undefined) account[4] = updates.status
    }
  }

  return {
    accounts,
    accountsByPlatform,
    setAccounts,
    deleteAccount,
    updateAccount,
    PLATFORM_TYPE_MAP,
    PLATFORM_NAME_MAP
  }
}
