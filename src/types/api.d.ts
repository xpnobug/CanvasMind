/**
 * API 相关类型定义
 */

import type { PublishFormData } from './form'

/**
 * API 响应基础结构
 */
export interface ApiResponse<T = any> {
  /** 状态码 */
  code: number
  /** 响应消息 */
  message: string
  /** 响应数据 */
  data: T
  /** 时间戳 */
  timestamp?: number
}

/**
 * 分页请求参数
 */
export interface PaginationParams {
  /** 当前页码 */
  page: number
  /** 每页数量 */
  pageSize: number
  /** 排序字段 */
  sortBy?: string
  /** 排序方向 */
  sortOrder?: 'asc' | 'desc'
}

/**
 * 分页响应数据
 */
export interface PaginationResponse<T = any> {
  /** 数据列表 */
  list: T[]
  /** 总数 */
  total: number
  /** 当前页码 */
  page: number
  /** 每页数量 */
  pageSize: number
  /** 总页数 */
  totalPages: number
}

/**
 * 平台类型
 */
export enum PlatformType {
  /** 视频号 */
  VIDEO_ACCOUNT = 2,
  /** 抖音 */
  DOUYIN = 3,
  /** 快手 */
  KUAISHOU = 4
}

/**
 * 账号信息
 */
export interface AccountInfo {
  /** 账号ID */
  id: string | number
  /** 账号名称 */
  name: string
  /** 平台类型 */
  platform: PlatformType
  /** 是否启用 */
  enabled: boolean
  /** 头像URL */
  avatar?: string
  /** 其他信息 */
  [key: string]: any
}

/**
 * 定时发布配置
 */
export interface ScheduleConfig {
  /** 是否启用定时发布 */
  enabled: boolean
  /** 每天发布视频数量 */
  videosPerDay: number
  /** 每天发布时间点 */
  dailyTimes: string[]
  /** 开始天数 */
  startDays: number
}

/**
 * 视频信息
 */
export interface VideoInfo {
  /** 视频ID */
  id: string | number
  /** 视频标题 */
  title: string
  /** 视频URL */
  url: string
  /** 封面URL */
  cover?: string
  /** 时长（秒） */
  duration?: number
  /** 文件大小（字节） */
  size?: number
  /** 创建时间 */
  createdAt?: string
  /** 其他信息 */
  [key: string]: any
}

/**
 * 发布任务
 */
export interface PublishTask {
  /** 任务ID */
  id: string | number
  /** 视频信息 */
  video: VideoInfo
  /** 发布表单数据 */
  formData: PublishFormData
  /** 任务状态 */
  status: TaskStatus
  /** 创建时间 */
  createdAt: string
  /** 更新时间 */
  updatedAt?: string
  /** 错误信息 */
  error?: string
}

/**
 * 任务状态
 */
export enum TaskStatus {
  /** 待发布 */
  PENDING = 'pending',
  /** 发布中 */
  PUBLISHING = 'publishing',
  /** 已完成 */
  COMPLETED = 'completed',
  /** 失败 */
  FAILED = 'failed',
  /** 已取消 */
  CANCELLED = 'cancelled'
}

/**
 * 上传文件响应
 */
export interface UploadResponse {
  /** 文件URL */
  url: string
  /** 文件名 */
  filename: string
  /** 文件大小 */
  size: number
  /** 文件类型 */
  mimeType: string
}

/**
 * 错误响应
 */
export interface ErrorResponse {
  /** 错误码 */
  code: number
  /** 错误消息 */
  message: string
  /** 错误详情 */
  details?: any
  /** 堆栈信息（仅开发环境） */
  stack?: string
}
