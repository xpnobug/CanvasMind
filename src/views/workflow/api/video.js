/**
 * 视频生成 API（异步轮询）
 */

import { request, getEndpoint } from './request'

export const createVideoTask = (data, options = {}) => {
  const { endpoint } = options
  return request({
    url: endpoint || getEndpoint('video'),
    method: 'post',
    data,
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

export const getVideoTaskStatus = (taskId) =>
  request({ url: `/videos/${taskId}`, method: 'get' })

export const pollVideoTask = async (taskId, maxAttempts = 120, interval = 5000) => {
  for (let i = 0; i < maxAttempts; i++) {
    const result = await getVideoTaskStatus(taskId)
    if (result.status === 'completed' || result.data) return result
    if (result.status === 'failed') {
      throw new Error(result.error?.message || '视频生成失败')
    }
    await new Promise(resolve => setTimeout(resolve, interval))
  }
  throw new Error('视频生成超时')
}
