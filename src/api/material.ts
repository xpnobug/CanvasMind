import { get, upload, API_BASE_URL } from '@/utils/request'
import type { ApiResponse, UploadResponse } from '@/types/api'

/**
 * 素材信息
 */
export interface MaterialInfo {
  /** 素材ID */
  id: string | number
  /** 文件名 */
  filename: string
  /** 文件路径 */
  path: string
  /** 文件大小（字节） */
  size: number
  /** 文件类型 */
  mimeType: string
  /** 创建时间 */
  createdAt: string
  /** 预览URL */
  previewUrl?: string
  /** 其他信息 */
  [key: string]: any
}

/**
 * 删除素材参数
 */
export interface DeleteMaterialParams {
  /** 素材ID */
  id: string | number
}

/**
 * 素材管理 API
 */
export const materialApi = {
  /**
   * 获取所有素材
   * @returns 素材列表
   */
  getAllMaterials(): Promise<ApiResponse<MaterialInfo[]>> {
    return get('/getFiles')
  },

  /**
   * 上传素材
   * @param formData 表单数据
   * @returns 上传结果
   */
  uploadMaterial(formData: FormData): Promise<ApiResponse<UploadResponse>> {
    return upload('/uploadSave', formData)
  },

  /**
   * 删除素材
   * @param id 素材ID
   * @returns 删除结果
   */
  deleteMaterial(id: string | number): Promise<ApiResponse<void>> {
    return get('/deleteFile', { id })
  },

  /**
   * 获取素材预览 URL
   * @param filename 文件名
   * @returns 预览 URL
   */
  getMaterialPreviewUrl(filename: string): string {
    return `${API_BASE_URL}/getFile?filename=${encodeURIComponent(filename)}`
  }
}
