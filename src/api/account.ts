import { get, post, API_BASE_URL } from '@/utils/request'
import type { ApiResponse, AccountInfo, PlatformType } from '@/types/api'

/**
 * 删除账号参数
 */
export interface DeleteAccountParams {
  /** 账号ID */
  id: string | number
}

/**
 * 更新账号信息参数
 */
export interface UpdateAccountParams {
  /** 账号ID */
  id: string | number
  /** 账号名称 */
  name?: string
  /** 是否启用 */
  enabled?: boolean
  /** 其他信息 */
  [key: string]: any
}

/**
 * Cookie 上传响应
 */
export interface UploadCookieResponse {
  /** 是否成功 */
  success: boolean
  /** 消息 */
  message: string
  /** Cookie 文件路径 */
  filePath?: string
}

/**
 * 账号管理 API
 */
export const accountApi = {
  /**
   * 获取所有账号（快速，不验证）
   * @returns 账号列表
   */
  getAccounts(): Promise<ApiResponse<AccountInfo[]>> {
    return get('/getAccounts')
  },

  /**
   * 获取所有账号（带验证）
   * @returns 验证后的账号列表
   */
  getValidAccounts(): Promise<ApiResponse<AccountInfo[]>> {
    return get('/getValidAccounts')
  },

  /**
   * 删除账号
   * @param id 账号ID
   * @returns 删除结果
   */
  deleteAccount(id: string | number): Promise<ApiResponse<void>> {
    return get('/deleteAccount', { id })
  },

  /**
   * 更新账号信息
   * @param data 更新数据
   * @returns 更新后的账号信息
   */
  updateAccount(data: UpdateAccountParams): Promise<ApiResponse<AccountInfo>> {
    return post('/updateUserinfo', data)
  },

  /**
   * 登录账号（SSE）
   * @param type 平台类型
   * @param id 账号ID
   * @returns SSE 连接 URL
   */
  loginAccount(type: PlatformType | string, id: string | number): string {
    return `${API_BASE_URL}/login?type=${type}&id=${encodeURIComponent(id)}`
  },

  /**
   * 下载 Cookie
   * @param filePath Cookie 文件路径
   * @returns 下载 URL
   */
  downloadCookie(filePath: string): string {
    return `${API_BASE_URL}/downloadCookie?filePath=${encodeURIComponent(filePath)}`
  },

  /**
   * 上传 Cookie
   * @param formData 表单数据
   * @returns 上传结果
   */
  uploadCookie(formData: FormData): Promise<UploadCookieResponse> {
    return fetch(`${API_BASE_URL}/uploadCookie`, {
      method: 'POST',
      body: formData
    }).then(res => res.json())
  }
}
