/**
 * 发布 API 类型定义
 */

export interface PublishVideoData {
  type: number
  title: string
  tags: string[]
  fileList: string[]
  accountList: string[]
  enableTimer: number
  videosPerDay: number
  dailyTimes: string[]
  startDays: number
  category: number
  productLink?: string
  productTitle?: string
  isDraft?: boolean
}

export interface PublishApiResponse {
  code: number
  msg?: string
  message?: string
  data?: any
}

export const publishApi: {
  publishVideo(data: PublishVideoData): Promise<PublishApiResponse>
  batchPublishVideos(dataList: PublishVideoData[]): Promise<PublishApiResponse>
}
