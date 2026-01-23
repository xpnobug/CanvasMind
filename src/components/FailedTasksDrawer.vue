<template>
  <el-drawer
    v-model="visible"
    title="失败任务"
    size="500px"
    :before-close="handleClose"
  >
    <div class="failed-tasks-container">
      <!-- 空状态 -->
      <el-empty v-if="failedTasks.length === 0" description="暂无失败任务" />

      <!-- 任务列表 -->
      <div v-else class="task-list">
        <div v-for="task in failedTasks" :key="task.id" class="task-item">
          <div class="task-header">
            <el-tag :type="getErrorTypeTag(task.error.type)">
              {{ getErrorTypeText(task.error.type) }}
            </el-tag>
            <span class="task-time">
              {{ formatTime(task.createdAt) }}
            </span>
          </div>

          <div class="task-content">
            <div class="task-title">{{ task.data.title || '未命名任务' }}</div>
            <div class="task-error">{{ task.error.message }}</div>
            <div class="task-meta">
              <span>平台: {{ getPlatformName(task.data.type) }}</span>
              <span>账号: {{ task.data.accountList?.length || 0 }} 个</span>
              <span>视频: {{ task.data.fileList?.length || 0 }} 个</span>
            </div>
          </div>

          <div class="task-actions">
            <el-button type="primary" size="small" @click="retryTask(task)" :loading="retrying[task.id]">
              重试
            </el-button>
            <el-button size="small" @click="viewDetails(task)"> 详情 </el-button>
            <el-button type="danger" size="small" @click="deleteTask(task.id)"> 删除 </el-button>
          </div>
        </div>
      </div>

      <!-- 批量操作 -->
      <div v-if="failedTasks.length > 0" class="batch-actions">
        <el-button type="primary" @click="retryAll" :loading="retryingAll"> 重试全部 </el-button>
        <el-button type="danger" @click="clearAll"> 清空全部 </el-button>
      </div>
    </div>
  </el-drawer>

  <!-- 任务详情对话框 -->
  <el-dialog v-model="detailsVisible" title="任务详情" width="600px">
    <div v-if="currentTask" class="task-details">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="错误类型">
          {{ getErrorTypeText(currentTask.error.type) }}
        </el-descriptions-item>
        <el-descriptions-item label="错误消息">
          {{ currentTask.error.message }}
        </el-descriptions-item>
        <el-descriptions-item label="错误代码">
          {{ currentTask.error.code }}
        </el-descriptions-item>
        <el-descriptions-item label="发生时间">
          {{ formatTime(currentTask.createdAt) }}
        </el-descriptions-item>
        <el-descriptions-item label="重试次数">
          {{ currentTask.error.retryCount }}
        </el-descriptions-item>
      </el-descriptions>

      <el-divider />

      <h4>任务数据</h4>
      <el-scrollbar height="300px">
        <pre>{{ JSON.stringify(currentTask.data, null, 2) }}</pre>
      </el-scrollbar>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ErrorHandler, ErrorType, type FailedTask } from '@/utils/errorHandler'
// @ts-ignore
import { publishApi } from '@/api/publish'

const visible = defineModel<boolean>('visible', { default: false })

const failedTasks = ref<FailedTask[]>([])
const retrying = ref<Record<string, boolean>>({})
const retryingAll = ref(false)
const detailsVisible = ref(false)
const currentTask = ref<FailedTask | null>(null)

// 加载失败任务
const loadFailedTasks = () => {
  failedTasks.value = ErrorHandler.getFailedTasks()
}

// 重试单个任务
const retryTask = async (task: FailedTask) => {
  retrying.value[task.id] = true

  try {
    await publishApi.publishVideo(task.data)
    ElMessage.success('发布成功')
    ErrorHandler.removeFailedTask(task.id)
    loadFailedTasks()
  } catch (error) {
    ElMessage.error('重试失败')
  } finally {
    retrying.value[task.id] = false
  }
}

// 重试全部
const retryAll = async () => {
  try {
    await ElMessageBox.confirm('确定要重试所有失败任务吗？', '批量重试', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
  } catch {
    return
  }

  retryingAll.value = true

  let successCount = 0
  let failCount = 0

  for (const task of failedTasks.value) {
    try {
      await publishApi.publishVideo(task.data)
      ErrorHandler.removeFailedTask(task.id)
      successCount++
    } catch {
      failCount++
    }
  }

  retryingAll.value = false
  loadFailedTasks()

  ElMessage.success(`重试完成：成功 ${successCount} 个，失败 ${failCount} 个`)
}

// 查看详情
const viewDetails = (task: FailedTask) => {
  currentTask.value = task
  detailsVisible.value = true
}

// 删除任务
const deleteTask = async (taskId: string) => {
  try {
    await ElMessageBox.confirm('确定要删除这个失败任务吗？', '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    ErrorHandler.removeFailedTask(taskId)
    loadFailedTasks()
    ElMessage.success('删除成功')
  } catch {
    // 用户取消
  }
}

// 清空全部
const clearAll = async () => {
  try {
    await ElMessageBox.confirm('确定要清空所有失败任务吗？此操作不可恢复！', '清空确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    ErrorHandler.clearAllFailedTasks()
    loadFailedTasks()
    ElMessage.success('已清空')
  } catch {
    // 用户取消
  }
}

const handleClose = () => {
  visible.value = false
}

const getErrorTypeTag = (type: ErrorType) => {
  const map = {
    [ErrorType.NETWORK]: 'warning',
    [ErrorType.AUTH]: 'danger',
    [ErrorType.PLATFORM]: 'danger',
    [ErrorType.DATA]: 'warning',
    [ErrorType.UNKNOWN]: 'info'
  }
  return map[type]
}

const getErrorTypeText = (type: ErrorType) => {
  const map = {
    [ErrorType.NETWORK]: '网络错误',
    [ErrorType.AUTH]: '认证错误',
    [ErrorType.PLATFORM]: '平台错误',
    [ErrorType.DATA]: '数据错误',
    [ErrorType.UNKNOWN]: '未知错误'
  }
  return map[type]
}

const getPlatformName = (platform: number) => {
  const map: Record<number, string> = {
    1: '小红书',
    2: '视频号',
    3: '抖音',
    4: '快手'
  }
  return map[platform] || '未知'
}

const formatTime = (time: string) => {
  return new Date(time).toLocaleString('zh-CN')
}

// 监听抽屉打开
watch(visible, (val) => {
  if (val) {
    loadFailedTasks()
  }
})
</script>

<style scoped>
.failed-tasks-container {
  padding: 20px;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.task-item {
  padding: 16px;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  background: var(--el-bg-color);
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.task-time {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.task-content {
  margin-bottom: 12px;
}

.task-title {
  font-weight: 500;
  margin-bottom: 8px;
}

.task-error {
  color: var(--el-color-danger);
  font-size: 14px;
  margin-bottom: 8px;
}

.task-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.task-actions {
  display: flex;
  gap: 8px;
}

.batch-actions {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid var(--el-border-color);
  display: flex;
  gap: 12px;
}

.task-details pre {
  background: var(--el-fill-color-light);
  padding: 12px;
  border-radius: 4px;
  font-size: 12px;
}
</style>
