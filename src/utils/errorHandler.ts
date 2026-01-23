import { ElNotification, ElMessageBox } from 'element-plus'

export enum ErrorType {
  NETWORK = 'network',
  AUTH = 'auth',
  PLATFORM = 'platform',
  DATA = 'data',
  UNKNOWN = 'unknown'
}

export interface ErrorContext {
  type: ErrorType
  code: string
  message: string
  originalError: any
  timestamp: number
  userAction: string
  canRetry: boolean
  retryCount: number
}

export interface FailedTask {
  id: string
  error: ErrorContext
  data: any
  createdAt: string
}

export class ErrorHandler {
  private static maxRetries = 3
  private static retryDelays = [1000, 2000, 4000] // 指数退避

  /**
   * 分类错误
   */
  static classifyError(error: any): ErrorContext {
    const context: ErrorContext = {
      type: ErrorType.UNKNOWN,
      code: error.code || 'UNKNOWN',
      message: error.message || '未知错误',
      originalError: error,
      timestamp: Date.now(),
      userAction: '',
      canRetry: false,
      retryCount: 0
    }

    // 网络错误
    if (
      error.name === 'TypeError' ||
      error.message?.includes('fetch') ||
      error.message?.includes('network') ||
      error.message?.includes('timeout')
    ) {
      context.type = ErrorType.NETWORK
      context.message = '网络连接超时，请检查网络'
      context.canRetry = true
    }
    // Cookie 过期
    else if (error.code === 401 || error.message?.includes('cookie') || error.message?.includes('登录')) {
      context.type = ErrorType.AUTH
      context.message = '登录已过期，请重新登录'
      context.canRetry = false
    }
    // 平台错误
    else if (error.code >= 500) {
      context.type = ErrorType.PLATFORM
      context.message = '平台服务异常，请稍后重试'
      context.canRetry = true
    }
    // 数据错误
    else if (error.code >= 400 && error.code < 500) {
      context.type = ErrorType.DATA
      context.message = error.message || '数据格式错误，请检查输入'
      context.canRetry = false
    }

    return context
  }

  /**
   * 自动重试
   */
  static async retry<T>(fn: () => Promise<T>, context: ErrorContext): Promise<T> {
    for (let i = 0; i < this.maxRetries; i++) {
      try {
        // 显示重试提示
        if (i > 0) {
          ElNotification({
            title: '正在重试',
            message: `第 ${i} 次重试中...`,
            type: 'info',
            duration: 2000
          })
        }

        const result = await fn()

        // 重试成功
        if (i > 0) {
          ElNotification({
            title: '重试成功',
            message: '操作已成功完成',
            type: 'success',
            duration: 3000
          })
        }

        return result
      } catch (error) {
        context.retryCount = i + 1

        // 最后一次重试失败
        if (i === this.maxRetries - 1) {
          throw error
        }

        // 等待后重试
        await this.delay(this.retryDelays[i])
      }
    }

    throw new Error('重试次数已达上限')
  }

  /**
   * 处理错误
   */
  static async handleError(
    error: any,
    options?: {
      showNotification?: boolean
      saveTask?: boolean
      taskData?: any
    }
  ): Promise<void> {
    const context = this.classifyError(error)

    // 记录错误日志
    this.logError(context)

    // 显示错误提示
    if (options?.showNotification !== false) {
      this.showErrorNotification(context)
    }

    // 保存失败任务
    if (options?.saveTask && options.taskData) {
      await this.saveFailedTask(context, options.taskData)
    }

    // 特殊处理
    switch (context.type) {
      case ErrorType.AUTH:
        await this.handleAuthError(context)
        break
      case ErrorType.NETWORK:
        await this.handleNetworkError(context)
        break
    }
  }

  /**
   * 显示错误通知
   */
  private static showErrorNotification(context: ErrorContext): void {
    const typeMap = {
      [ErrorType.NETWORK]: 'warning',
      [ErrorType.AUTH]: 'error',
      [ErrorType.PLATFORM]: 'error',
      [ErrorType.DATA]: 'warning',
      [ErrorType.UNKNOWN]: 'error'
    }

    ElNotification({
      title: this.getErrorTitle(context.type),
      message: context.message,
      type: typeMap[context.type] as any,
      duration: 5000,
      showClose: true
    })
  }

  /**
   * 处理认证错误
   */
  private static async handleAuthError(_context: ErrorContext): Promise<void> {
    try {
      await ElMessageBox.confirm('您的登录已过期，需要重新登录才能继续操作', '登录过期', {
        confirmButtonText: '重新登录',
        cancelButtonText: '稍后处理',
        type: 'warning',
        distinguishCancelAndClose: true
      })

      // 触发重新登录流程
      window.dispatchEvent(new CustomEvent('auth:relogin'))
    } catch {
      // 用户取消
    }
  }

  /**
   * 处理网络错误
   */
  private static async handleNetworkError(_context: ErrorContext): Promise<void> {
    // 检查网络状态
    if (!navigator.onLine) {
      ElNotification({
        title: '网络已断开',
        message: '请检查您的网络连接',
        type: 'error',
        duration: 0 // 不自动关闭
      })
    }
  }

  /**
   * 保存失败任务
   */
  private static async saveFailedTask(context: ErrorContext, taskData: any): Promise<void> {
    const failedTasks = this.getFailedTasks()

    failedTasks.push({
      id: Date.now().toString(),
      error: context,
      data: taskData,
      createdAt: new Date().toISOString()
    })

    localStorage.setItem('failed_tasks', JSON.stringify(failedTasks))

    ElNotification({
      title: '任务已保存',
      message: '失败的任务已保存，您可以稍后重试',
      type: 'info',
      duration: 3000
    })
  }

  /**
   * 获取失败任务列表
   */
  static getFailedTasks(): FailedTask[] {
    try {
      const tasks = localStorage.getItem('failed_tasks')
      return tasks ? JSON.parse(tasks) : []
    } catch {
      return []
    }
  }

  /**
   * 删除失败任务
   */
  static removeFailedTask(taskId: string): void {
    const tasks = this.getFailedTasks()
    const filtered = tasks.filter((t) => t.id !== taskId)
    localStorage.setItem('failed_tasks', JSON.stringify(filtered))
  }

  /**
   * 清空所有失败任务
   */
  static clearAllFailedTasks(): void {
    localStorage.removeItem('failed_tasks')
  }

  /**
   * 记录错误日志
   */
  private static logError(context: ErrorContext): void {
    const logs = this.getErrorLogs()

    logs.push({
      ...context,
      userAgent: navigator.userAgent,
      url: window.location.href
    })

    // 只保留最近 100 条
    if (logs.length > 100) {
      logs.splice(0, logs.length - 100)
    }

    localStorage.setItem('error_logs', JSON.stringify(logs))
  }

  /**
   * 获取错误日志
   */
  static getErrorLogs(): any[] {
    try {
      const logs = localStorage.getItem('error_logs')
      return logs ? JSON.parse(logs) : []
    } catch {
      return []
    }
  }

  /**
   * 清理过期日志
   */
  static cleanOldLogs(days: number = 30): void {
    const logs = this.getErrorLogs()
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
    const filtered = logs.filter((log) => log.timestamp > cutoff)
    localStorage.setItem('error_logs', JSON.stringify(filtered))
  }

  private static getErrorTitle(type: ErrorType): string {
    const titles = {
      [ErrorType.NETWORK]: '网络错误',
      [ErrorType.AUTH]: '认证错误',
      [ErrorType.PLATFORM]: '平台错误',
      [ErrorType.DATA]: '数据错误',
      [ErrorType.UNKNOWN]: '未知错误'
    }
    return titles[type]
  }

  private static delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
