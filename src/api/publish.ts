import { post } from '@/utils/request'
import type { ApiResponse, PublishTask } from '@/types/api'
import type { PublishFormData } from '@/types/form'

/**
 * 发布视频请求参数
 */
export interface PublishVideoParams extends PublishFormData {
  /** 视频文件路径或URL */
  videoPath?: string
  /** 其他参数 */
  [key: string]: any
}

/**
 * 批量发布视频请求参数
 */
export type BatchPublishVideosParams = PublishVideoParams[]

/**
 * 发布管理 API
 */
export const publishApi = {
  /**
   * 发布视频
   * @param data 发布数据
   * @returns 发布任务信息
   */
  publishVideo(data: PublishVideoParams): Promise<ApiResponse<PublishTask>> {
    return post('/postVideo', data)
  },

  /**
   * 批量发布视频
   * @param dataList 批量发布数据列表
   * @returns 批量发布任务信息
   */
  batchPublishVideos(dataList: BatchPublishVideosParams): Promise<ApiResponse<PublishTask[]>> {
    return post('/postVideoBatch', dataList)
  }
}
