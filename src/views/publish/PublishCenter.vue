<template>
  <div class="jimeng-home-container">
    <div id="csr-root">
      <div class="global-dreamina-container">
        <div id="dreamina" class="root_bf55f">
          <div class="top-down-layer-ilr3Ve">
            <div class="container-moSF_y" style="--side-menu-width:76px">
              <!-- 侧边菜单 -->
              <SideMenu/>

              <!-- 主内容区 -->
              <div class="content-wrapper-cF1zaN">
                <div class="main-container-nXfW_A">
                  <div class="content-TZbgMr">
                    <div class="scroll-container-Jsws2j">
                      <div class="scroll-content-DaYLnh">
                        <!-- 网络状态监控 -->
                        <NetworkStatus />
                        
                        <div class="publish-center">
                          <!-- Tab 管理区域 -->
                          <div class="tab-management">
                            <div class="tab-header">
                              <div class="tab-list">
                                <div
                                    v-for="tab in tabs"
                                    :key="tab.name"
                                    :class="['tab-item', { active: activeTab === tab.name }]"
                                    @click="activeTab = tab.name"
                                >
                                  <span>{{ tab.label }}</span>
                                  <button
                                      v-if="tabs.length > 1"
                                      class="tab-close"
                                      @click.stop="removeTab(tab.name)"
                                  >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                      <line x1="18" y1="6" x2="6" y2="18"/>
                                      <line x1="6" y1="6" x2="18" y2="18"/>
                                    </svg>
                                  </button>
                                </div>
                              </div>
                              <div class="tab-actions">
                                <button 
                                  v-if="failedTasksCount > 0"
                                  class="btn-warning" 
                                  @click="failedTasksVisible = true"
                                >
                                  <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="10"/>
                                    <line x1="12" y1="8" x2="12" y2="12"/>
                                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                                  </svg>
                                  失败任务 ({{ failedTasksCount }})
                                </button>
                                <button class="btn-secondary" @click="addTab">
                                  <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                       stroke-width="2">
                                    <line x1="12" y1="5" x2="12" y2="19"/>
                                    <line x1="5" y1="12" x2="19" y2="12"/>
                                  </svg>
                                  添加Tab
                                </button>
                                <button 
                                  class="btn-primary" 
                                  @click="batchPublish" 
                                  :disabled="batchPublishing || !isOnline"
                                >
                                  批量发布
                                </button>
                              </div>
                            </div>
                          </div>

                          <!-- 内容区域 -->
                          <div class="publish-content">
                            <div
                                v-for="tab in tabs"
                                :key="tab.name"
                                v-show="activeTab === tab.name"
                                class="tab-content"
                            >
                              <!-- 两栏布局 -->
                              <div class="content-layout">
                                <!-- 左侧：视频预览区 -->
                                <div class="left-panel">
                                  <div class="section">
                                    <h3 class="section-title">视频</h3>

                                    <!-- 视频上传区域 -->
                                    <div
                                        v-if="tab.fileList.length === 0"
                                        class="video-upload-placeholder"
                                        :class="{ 'drag-over': isDragging }"
                                        @click="showUploadOptions(tab)"
                                        @dragover.prevent="handleDragOver"
                                        @dragleave.prevent="handleDragLeave"
                                        @drop.prevent="handleMainDrop($event, tab)"
                                    >
                                      <svg class="upload-icon-large" viewBox="0 0 24 24" fill="none"
                                           stroke="currentColor" stroke-width="1.5">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                        <polyline points="17 8 12 3 7 8"/>
                                        <line x1="12" y1="3" x2="12" y2="15"/>
                                      </svg>
                                      <p class="upload-text">{{ isDragging ? '松开鼠标上传文件' : '上传视频' }}</p>
                                      <p class="upload-hint">点击选择文件或从素材库选择，也可直接拖拽文件到此处</p>
                                    </div>

                                    <!-- 已上传文件列表 -->
                                    <div v-else class="video-preview-area">
                                      <div class="video-list">
                                        <div v-for="(file, index) in tab.fileList" :key="index" class="video-item">
                                          <div class="video-thumbnail">
                                            <svg class="video-icon" viewBox="0 0 24 24" fill="none"
                                                 stroke="currentColor" stroke-width="2">
                                              <polygon points="5 3 19 12 5 21 5 3"/>
                                            </svg>
                                          </div>
                                          <div class="video-info">
                                            <div class="video-name">{{ file.name }}</div>
                                            <div class="video-size">{{ formatFileSize(file.size) }}</div>
                                          </div>
                                          <button class="video-remove" @click="removeFile(tab, index)">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                              <line x1="18" y1="6" x2="6" y2="18"/>
                                              <line x1="6" y1="6" x2="18" y2="18"/>
                                            </svg>
                                          </button>
                                        </div>
                                      </div>
                                      <button class="btn-add-more" @click="showUploadOptions(tab)">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                          <line x1="12" y1="5" x2="12" y2="19"/>
                                          <line x1="5" y1="12" x2="19" y2="12"/>
                                        </svg>
                                        添加更多视频
                                      </button>
                                    </div>
                                  </div>
                                </div>

                                <!-- 右侧：表单区 -->
                                <div class="right-panel">

                                  <!-- 账号选择 -->
                                  <div class="section">
                                    <h3 class="section-title">账号</h3>
                                    <div class="account-selector">
                                      <div v-if="tab.selectedAccounts.length > 0" class="selected-items">
                                        <div
                                            v-for="(accountId, index) in tab.selectedAccounts"
                                            :key="accountId"
                                            class="selected-tag"
                                        >
                                          {{ getAccountName(accountId) }}
                                          <button class="tag-remove" @click="removeAccount(tab, index)">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                              <line x1="18" y1="6" x2="6" y2="18"/>
                                              <line x1="6" y1="6" x2="18" y2="18"/>
                                            </svg>
                                          </button>
                                        </div>
                                      </div>
                                      <button class="btn-select" @click="openAccountDialog(tab)">
                                        {{ tab.selectedAccounts.length > 0 ? '修改账号' : '选择账号' }}
                                      </button>
                                    </div>
                                  </div>

                                  <!-- 平台选择 -->
                                  <div class="section">
                                    <h3 class="section-title">平台</h3>
                                    <div class="platform-selector">
                                      <label
                                          v-for="platform in platforms"
                                          :key="platform.key"
                                          class="platform-option"
                                      >
                                        <input
                                            type="radio"
                                            :value="platform.key"
                                            v-model="tab.selectedPlatform"
                                            class="platform-radio"
                                        />
                                        <span class="platform-label">{{ platform.name }}</span>
                                      </label>
                                    </div>
                                  </div>

                                  <!-- 草稿选项（仅视频号） -->
                                  <div v-if="tab.selectedPlatform === 2" class="section">
                                    <label class="checkbox-label">
                                      <input type="checkbox" v-model="tab.isDraft" class="checkbox-input"/>
                                      <span>视频号仅保存草稿（用手机发布）</span>
                                    </label>
                                  </div>

                                  <!-- 标题输入 -->
                                  <div class="section">
                                    <h3 class="section-title">标题</h3>
                                    <textarea
                                        v-model="tab.title"
                                        class="textarea-input"
                                        placeholder="请输入标题..."
                                        maxlength="100"
                                        rows="3"
                                    ></textarea>
                                    <div class="char-count">{{ tab.title.length }}/100</div>
                                  </div>

                                  <!-- 话题输入 -->
                                  <div class="section">
                                    <h3 class="section-title">话题</h3>
                                    <div class="topic-selector">
                                      <div v-if="tab.selectedTopics.length > 0" class="selected-items">
                                        <div
                                            v-for="(topic, index) in tab.selectedTopics"
                                            :key="index"
                                            class="selected-tag"
                                        >
                                          #{{ topic }}
                                          <button class="tag-remove" @click="removeTopic(tab, index)">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                              <line x1="18" y1="6" x2="6" y2="18"/>
                                              <line x1="6" y1="6" x2="18" y2="18"/>
                                            </svg>
                                          </button>
                                        </div>
                                      </div>
                                      <button class="btn-select" @click="openTopicDialog(tab)">
                                        {{ tab.selectedTopics.length > 0 ? '修改话题' : '添加话题' }}
                                      </button>
                                    </div>
                                  </div>

                                  <!-- 商品链接（仅抖音） -->
                                  <div v-if="tab.selectedPlatform === 3" class="section">
                                    <h3 class="section-title">商品链接</h3>
                                    <div class="product-inputs">
                                      <input
                                          v-model="tab.productTitle"
                                          type="text"
                                          class="text-input"
                                          placeholder="请输入商品名称"
                                          maxlength="200"
                                      />
                                      <input
                                          v-model="tab.productLink"
                                          type="text"
                                          class="text-input"
                                          placeholder="请输入商品链接"
                                          maxlength="200"
                                      />
                                    </div>
                                  </div>

                                  <!-- 定时发布 -->
                                  <div class="section">
                                    <h3 class="section-title">定时发布</h3>
                                    <label class="switch-label">
                                      <input
                                          type="checkbox"
                                          v-model="tab.scheduleEnabled"
                                          class="switch-input"
                                      />
                                      <span class="switch-slider"></span>
                                      <span class="switch-text">{{
                                          tab.scheduleEnabled ? '定时发布' : '立即发布'
                                        }}</span>
                                    </label>

                                    <div v-if="tab.scheduleEnabled" class="schedule-settings">
                                      <div class="form-row">
                                        <label class="form-label">每天发布视频数：</label>
                                        <select v-model="tab.videosPerDay" class="form-select">
                                          <option v-for="num in 55" :key="num" :value="num">{{ num }}</option>
                                        </select>
                                      </div>

                                      <div class="form-row">
                                        <label class="form-label">发布时间：</label>
                                        <div class="time-list">
                                          <input
                                              v-for="(time, index) in tab.dailyTimes"
                                              :key="index"
                                              v-model="tab.dailyTimes[index]"
                                              type="time"
                                              class="time-input"
                                          />
                                          <button
                                              v-if="tab.dailyTimes.length < tab.videosPerDay"
                                              class="btn-add-time"
                                              @click="tab.dailyTimes.push('10:00')"
                                          >
                                            +
                                          </button>
                                        </div>
                                      </div>

                                      <div class="form-row">
                                        <label class="form-label">开始天数：</label>
                                        <select v-model="tab.startDays" class="form-select">
                                          <option :value="0">明天</option>
                                          <option :value="1">后天</option>
                                        </select>
                                      </div>
                                    </div>
                                  </div>

                                  <!-- 操作按钮 -->
                                  <div class="action-buttons">
                                    <button class="btn-secondary" @click="cancelPublish(tab)">
                                      取消
                                    </button>
                                    <button
                                        class="btn-primary"
                                        @click="confirmPublish(tab)"
                                        :disabled="tab.publishing || !isOnline"
                                    >
                                      {{ tab.publishing ? '发布中...' : '发布' }}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <!-- 上传选项对话框 -->
                          <div v-if="uploadOptionsVisible" class="modal-overlay"
                               @click.self="uploadOptionsVisible = false">
                            <div class="modal-content modal-small">
                              <div class="modal-header">
                                <h2>选择上传方式</h2>
                                <button class="close-btn" @click="uploadOptionsVisible = false">
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="18" y1="6" x2="6" y2="18"/>
                                    <line x1="6" y1="6" x2="18" y2="18"/>
                                  </svg>
                                </button>
                              </div>
                              <div class="modal-body">
                                <button class="option-btn" @click="selectLocalUpload">
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                    <polyline points="17 8 12 3 7 8"/>
                                    <line x1="12" y1="3" x2="12" y2="15"/>
                                  </svg>
                                  本地上传
                                </button>
                                <button class="option-btn" @click="selectMaterialLibrary">
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path
                                        d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                                  </svg>
                                  素材库
                                </button>
                              </div>
                            </div>
                          </div>

                          <!-- 本地上传对话框 -->
                          <div v-if="localUploadVisible" class="modal-overlay" @click.self="localUploadVisible = false">
                            <div class="modal-content">
                              <div class="modal-header">
                                <h2>本地上传</h2>
                                <button class="close-btn" @click="localUploadVisible = false">
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="18" y1="6" x2="6" y2="18"/>
                                    <line x1="6" y1="6" x2="18" y2="18"/>
                                  </svg>
                                </button>
                              </div>
                              <div class="modal-body">
                                <div
                                    class="upload-dropzone"
                                    :class="{ 'drag-over': isDragging }"
                                    @click="triggerFileInput"
                                    @dragover.prevent="handleDragOver"
                                    @dragleave.prevent="handleDragLeave"
                                    @drop.prevent="handleDrop"
                                >
                                  <input
                                      ref="fileInput"
                                      type="file"
                                      accept="video/*"
                                      multiple
                                      style="display: none"
                                      @change="handleFileSelect"
                                  />
                                  <svg class="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                       stroke-width="2">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                    <polyline points="17 8 12 3 7 8"/>
                                    <line x1="12" y1="3" x2="12" y2="15"/>
                                  </svg>
                                  <p>{{ isDragging ? '松开鼠标上传文件' : '将视频文件拖到此处，或点击上传' }}</p>
                                  <p class="upload-tip">支持 MP4、AVI 等视频格式</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          <!-- 素材库对话框 -->
                          <div v-if="materialLibraryVisible" class="modal-overlay"
                               @click.self="materialLibraryVisible = false">
                            <div class="modal-content modal-large">
                              <div class="modal-header">
                                <h2>选择素材</h2>
                                <button class="close-btn" @click="materialLibraryVisible = false">
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="18" y1="6" x2="6" y2="18"/>
                                    <line x1="6" y1="6" x2="18" y2="18"/>
                                  </svg>
                                </button>
                              </div>
                              <div class="modal-body">
                                <div class="material-list">
                                  <label
                                      v-for="material in materials"
                                      :key="material.id"
                                      class="material-item"
                                  >
                                    <input
                                        type="checkbox"
                                        :value="material.id"
                                        v-model="selectedMaterials"
                                        class="material-checkbox"
                                    />
                                    <div class="material-info">
                                      <div class="material-name">{{ material.filename }}</div>
                                      <div class="material-meta">
                                        <span>{{ material.filesize }}MB</span>
                                        <span>{{ material.upload_time }}</span>
                                      </div>
                                    </div>
                                  </label>
                                </div>
                              </div>
                              <div class="modal-footer">
                                <button class="btn-secondary" @click="materialLibraryVisible = false">
                                  取消
                                </button>
                                <button class="btn-primary" @click="confirmMaterialSelection">
                                  确定
                                </button>
                              </div>
                            </div>
                          </div>

                          <!-- 账号选择对话框 -->
                          <div v-if="accountDialogVisible" class="modal-overlay"
                               @click.self="accountDialogVisible = false">
                            <div class="modal-content">
                              <div class="modal-header">
                                <h2>选择账号</h2>
                                <button class="close-btn" @click="accountDialogVisible = false">
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="18" y1="6" x2="6" y2="18"/>
                                    <line x1="6" y1="6" x2="18" y2="18"/>
                                  </svg>
                                </button>
                              </div>
                              <div class="modal-body">
                                <div class="account-list">
                                  <label
                                      v-for="account in availableAccounts"
                                      :key="account.id"
                                      class="account-item"
                                  >
                                    <input
                                        type="checkbox"
                                        :value="account.id"
                                        v-model="tempSelectedAccounts"
                                        class="account-checkbox"
                                    />
                                    <div class="account-info">
                                      <span class="account-name">{{ account.name }}</span>
                                      <span class="account-platform">{{ account.platform }}</span>
                                    </div>
                                  </label>
                                </div>
                              </div>
                              <div class="modal-footer">
                                <button class="btn-secondary" @click="accountDialogVisible = false">
                                  取消
                                </button>
                                <button class="btn-primary" @click="confirmAccountSelection">
                                  确定
                                </button>
                              </div>
                            </div>
                          </div>

                          <!-- 话题选择对话框 -->
                          <div v-if="topicDialogVisible" class="modal-overlay" @click.self="topicDialogVisible = false">
                            <div class="modal-content">
                              <div class="modal-header">
                                <h2>添加话题</h2>
                                <button class="close-btn" @click="topicDialogVisible = false">
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="18" y1="6" x2="6" y2="18"/>
                                    <line x1="6" y1="6" x2="18" y2="18"/>
                                  </svg>
                                </button>
                              </div>
                              <div class="modal-body">
                                <div class="custom-topic-input">
                                  <input
                                      v-model="customTopic"
                                      type="text"
                                      class="text-input"
                                      placeholder="输入自定义话题"
                                  />
                                  <button class="btn-primary" @click="addCustomTopic">添加</button>
                                </div>

                                <h4 class="recommended-title">推荐话题</h4>
                                <div class="topic-grid">
                                  <button
                                      v-for="topic in recommendedTopics"
                                      :key="topic"
                                      :class="['topic-btn', { active: currentTab?.selectedTopics?.includes(topic) }]"
                                      @click="toggleRecommendedTopic(topic)"
                                  >
                                    {{ topic }}
                                  </button>
                                </div>
                              </div>
                              <div class="modal-footer">
                                <button class="btn-secondary" @click="topicDialogVisible = false">
                                  取消
                                </button>
                                <button class="btn-primary" @click="confirmTopicSelection">
                                  确定
                                </button>
                              </div>
                            </div>
                          </div>
                          
                          <!-- 失败任务抽屉 -->
                          <FailedTasksDrawer v-model:visible="failedTasksVisible" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import SideMenu from '@/components/home/components/SideMenu.vue'
import NetworkStatus from '@/components/NetworkStatus.vue'
import FailedTasksDrawer from '@/components/FailedTasksDrawer.vue'

import {ref, reactive, computed, onMounted} from 'vue'
import {materialApi} from '@/api/material'
import {publishApi} from '@/api/publish'
import {useAccountStore} from '@/stores/account'
import {useAppStore} from '@/stores/app'
import {ErrorHandler} from '@/utils/errorHandler'
import {ElMessage} from 'element-plus'

const accountStore = useAccountStore()
const appStore = useAppStore()

// Tab 管理
const activeTab = ref('tab1')
let tabCounter = 1

const defaultTabData = {
  name: 'tab1',
  label: '发布1',
  fileList: [],
  selectedAccounts: [],
  selectedPlatform: 3,
  title: '',
  productLink: '',
  productTitle: '',
  selectedTopics: [],
  scheduleEnabled: false,
  videosPerDay: 1,
  dailyTimes: ['10:00'],
  startDays: 0,
  publishing: false,
  isDraft: false
}

const tabs = reactive([{...defaultTabData}])

const platforms = [
  {key: 3, name: '抖音'},
  {key: 4, name: '快手'},
  {key: 2, name: '视频号'},
  {key: 1, name: '小红书'}
]

// 对话框状态
const uploadOptionsVisible = ref(false)
const localUploadVisible = ref(false)
const materialLibraryVisible = ref(false)
const accountDialogVisible = ref(false)
const topicDialogVisible = ref(false)

// 其他状态
const currentUploadTab = ref(null)
const currentTab = ref(null)
const selectedMaterials = ref([])
const tempSelectedAccounts = ref([])
const customTopic = ref('')
const batchPublishing = ref(false)
const fileInput = ref(null)
const isDragging = ref(false)
const failedTasksVisible = ref(false)
const isOnline = ref(navigator.onLine)

const materials = computed(() => appStore.materials)

// 失败任务数量
const failedTasksCount = computed(() => {
  return ErrorHandler.getFailedTasks().length
})

// 监听网络状态
onMounted(() => {
  const handleOnlineStatus = () => {
    isOnline.value = navigator.onLine
  }
  
  window.addEventListener('online', handleOnlineStatus)
  window.addEventListener('offline', handleOnlineStatus)
  
  // 清理过期日志
  ErrorHandler.cleanOldLogs(30)
})

const recommendedTopics = [
  '游戏', '电影', '音乐', '美食', '旅行', '文化',
  '科技', '生活', '娱乐', '体育', '教育', '艺术'
]

// 根据选择的平台获取可用账号
const availableAccounts = computed(() => {
  const platformMap = {
    3: '抖音',
    2: '视频号',
    1: '小红书',
    4: '快手'
  }
  const currentPlatform = currentTab.value ? platformMap[currentTab.value.selectedPlatform] : null
  return currentPlatform ? accountStore.accounts.value.filter(acc => acc.platform === currentPlatform) : []
})

// Tab 操作
const addTab = () => {
  tabCounter++
  const newTab = {
    ...defaultTabData,
    name: `tab${tabCounter}`,
    label: `发布${tabCounter}`,
    fileList: [],
    selectedAccounts: [],
    selectedTopics: [],
    dailyTimes: ['10:00']
  }
  tabs.push(newTab)
  activeTab.value = newTab.name
}

const removeTab = (tabName) => {
  const index = tabs.findIndex(tab => tab.name === tabName)
  if (index > -1 && tabs.length > 1) {
    tabs.splice(index, 1)
    if (activeTab.value === tabName) {
      activeTab.value = tabs[0].name
    }
  }
}

// 文件操作
const formatFileSize = (bytes) => {
  return (bytes / 1024 / 1024).toFixed(2) + 'MB'
}

const showUploadOptions = (tab) => {
  currentUploadTab.value = tab
  uploadOptionsVisible.value = true
}

const selectLocalUpload = () => {
  uploadOptionsVisible.value = false
  localUploadVisible.value = true
}

const selectMaterialLibrary = async () => {
  uploadOptionsVisible.value = false

  if (materials.value.length === 0) {
    try {
      const res = await materialApi.getAllMaterials()
      if (res.code === 200) {
        appStore.setMaterials(res.data)
      }
    } catch (error) {
      console.error('获取素材失败:', error)
    }
  }

  selectedMaterials.value = []
  materialLibraryVisible.value = true
}

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleDragOver = (e) => {
  e.preventDefault()
  isDragging.value = true
}

const handleDragLeave = (e) => {
  e.preventDefault()
  isDragging.value = false
}

const handleDrop = async (e) => {
  e.preventDefault()
  isDragging.value = false

  const files = Array.from(e.dataTransfer.files).filter(file =>
      file.type.startsWith('video/')
  )

  if (files.length === 0) {
    ElMessage.warning('请拖入视频文件')
    return
  }

  await uploadFiles(files)
}

const handleMainDrop = async (e, tab) => {
  e.preventDefault()
  e.stopPropagation()
  isDragging.value = false

  const files = Array.from(e.dataTransfer.files).filter(file =>
      file.type.startsWith('video/')
  )

  if (files.length === 0) {
    ElMessage.warning('请拖入视频文件')
    return
  }

  currentUploadTab.value = tab
  await uploadFiles(files)
}

const handleFileSelect = async (event) => {
  const files = Array.from(event.target.files)
  await uploadFiles(files)
  event.target.value = ''
}

const uploadFiles = async (files) => {
  for (const file of files) {
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await materialApi.uploadMaterial(formData)
      if (res.code === 200) {
        // 后端返回的是文件名（如：uuid_filename.mp4）
        const filename = res.data.filepath || res.data || res.data.filename

        // 保存文件信息
        currentUploadTab.value.fileList.push({
          name: file.name,
          path: filename, // 只保存文件名，后端会自动添加路径前缀
          size: file.size,
          url: materialApi.getMaterialPreviewUrl(filename) // 用于前端显示
        })
      } else {
        ElMessage.error(`文件 ${file.name} 上传失败：${res.msg || '未知错误'}`)
      }
    } catch (error) {
      console.error('上传失败:', error)
      ElMessage.error(`文件 ${file.name} 上传失败`)
    }
  }

  localUploadVisible.value = false
}

const confirmMaterialSelection = () => {
  if (currentUploadTab.value) {
    selectedMaterials.value.forEach(materialId => {
      const material = materials.value.find(m => m.id === materialId)
      if (material) {
        const exists = currentUploadTab.value.fileList.some(f => f.path === material.file_path)
        if (!exists) {
          currentUploadTab.value.fileList.push({
            name: material.filename,
            path: material.file_path, // 只保存文件名，后端会自动添加路径前缀
            size: material.filesize * 1024 * 1024, // 转换为字节
            url: materialApi.getMaterialPreviewUrl(material.file_path) // 用于前端显示
          })
        }
      }
    })
  }

  materialLibraryVisible.value = false
  selectedMaterials.value = []
}

const removeFile = (tab, index) => {
  tab.fileList.splice(index, 1)
}

// 账号操作
const getAccountName = (accountId) => {
  const account = accountStore.accounts.value.find(acc => acc.id === accountId)
  return account ? account.name : accountId
}

const openAccountDialog = (tab) => {
  currentTab.value = tab
  tempSelectedAccounts.value = [...tab.selectedAccounts]
  accountDialogVisible.value = true
}

const confirmAccountSelection = () => {
  if (currentTab.value) {
    currentTab.value.selectedAccounts = [...tempSelectedAccounts.value]
  }
  accountDialogVisible.value = false
}

const removeAccount = (tab, index) => {
  tab.selectedAccounts.splice(index, 1)
}

// 话题操作
const openTopicDialog = (tab) => {
  currentTab.value = tab
  topicDialogVisible.value = true
}

const addCustomTopic = () => {
  if (!customTopic.value.trim()) return

  if (currentTab.value && !currentTab.value.selectedTopics.includes(customTopic.value.trim())) {
    currentTab.value.selectedTopics.push(customTopic.value.trim())
    customTopic.value = ''
  }
}

const toggleRecommendedTopic = (topic) => {
  if (!currentTab.value) return

  const index = currentTab.value.selectedTopics.indexOf(topic)
  if (index > -1) {
    currentTab.value.selectedTopics.splice(index, 1)
  } else {
    currentTab.value.selectedTopics.push(topic)
  }
}

const removeTopic = (tab, index) => {
  tab.selectedTopics.splice(index, 1)
}

const confirmTopicSelection = () => {
  topicDialogVisible.value = false
  customTopic.value = ''
}

// 发布操作
const cancelPublish = (tab) => {
  console.log('取消发布', tab)
}

const confirmPublish = async (tab) => {
  if (tab.publishing) return

  // 验证
  if (tab.fileList.length === 0) {
    ElMessage.warning('请先上传视频文件')
    return
  }
  if (!tab.title.trim()) {
    ElMessage.warning('请输入标题')
    return
  }
  if (tab.selectedAccounts.length === 0) {
    ElMessage.warning('请选择发布账号')
    return
  }

  tab.publishing = true

  try {
    const publishData = {
      type: tab.selectedPlatform,
      title: tab.title,
      tags: tab.selectedTopics, // 不带#号的话题列表
      fileList: tab.fileList.map(f => f.path), // 只发送文件路径字符串
      accountList: tab.selectedAccounts.map(accountId => {
        const account = accountStore.accounts.value.find(acc => acc.id === accountId)
        return account ? account.filePath : accountId
      }), // 发送账号的文件路径
      enableTimer: tab.scheduleEnabled ? 1 : 0, // 是否启用定时发布，开启传1，不开启传0
      videosPerDay: tab.videosPerDay, // 每天发布视频数量，1-55
      dailyTimes: tab.dailyTimes, // 每天发布时间点
      startDays: tab.startDays, // 从今天开始计算的发布天数，0表示明天，1表示后天
      category: 0, // 表示非原创
      productLink: tab.productLink || '', // 商品链接
      productTitle: tab.productTitle || '', // 商品名称
      isDraft: tab.isDraft // 是否保存为草稿，仅视频号平台使用
    }

    const res = await publishApi.publishVideo(publishData)

    if (res.code === 200) {
      ElMessage.success('发布成功')
      // 清空表单
      tab.fileList = []
      tab.title = ''
      tab.selectedTopics = []
      tab.selectedAccounts = []
    } else {
      throw new Error(res.msg || '发布失败')
    }
  } catch (error) {
    console.error('发布失败:', error)
    
    // 使用错误处理器处理错误
    await ErrorHandler.handleError(error, {
      showNotification: true,
      saveTask: true,
      taskData: {
        type: tab.selectedPlatform,
        title: tab.title,
        tags: tab.selectedTopics,
        fileList: tab.fileList.map(f => f.path),
        accountList: tab.selectedAccounts.map(accountId => {
          const account = accountStore.accounts.value.find(acc => acc.id === accountId)
          return account ? account.filePath : accountId
        }),
        enableTimer: tab.scheduleEnabled ? 1 : 0,
        videosPerDay: tab.videosPerDay,
        dailyTimes: tab.dailyTimes,
        startDays: tab.startDays,
        category: 0,
        productLink: tab.productLink || '',
        productTitle: tab.productTitle || '',
        isDraft: tab.isDraft
      }
    })
  } finally {
    tab.publishing = false
  }
}

const batchPublish = async () => {
  if (batchPublishing.value) return

  batchPublishing.value = true

  for (const tab of tabs) {
    try {
      await confirmPublish(tab)
    } catch (error) {
      console.error('批量发布失败:', error)
    }
  }

  batchPublishing.value = false
  ElMessage.success('批量发布完成')
}

onMounted(async () => {
  // 获取素材列表
  try {
    const res = await materialApi.getAllMaterials()
    if (res.code === 200) {
      appStore.setMaterials(res.data)
    }
  } catch (error) {
    console.error('获取素材失败:', error)
  }
})
</script>

<style scoped>
.publish-center {
  padding: 24px;
  max-width: 1600px;
  margin: 0 auto;
}

/* Tab 管理 */
.tab-management {
  margin-bottom: 24px;
}

.tab-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px;
  background: var(--bg-block-primary-default);
  border: 1px solid var(--stroke-primary);
  border-radius: 12px;
}

.tab-list {
  display: flex;
  gap: 8px;
  flex: 1;
  overflow-x: auto;
}

.tab-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--lv-border-radius-medium);
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
  font-family: var(--font-family);
  cursor: pointer;
  transition: all 0.1s linear;
  white-space: nowrap;
}

.tab-item:hover {
  background: var(--bg-block-primary-hover);
  color: var(--text-primary);
}

.tab-item:active {
  background: var(--bg-block-primary-pressed);
  transition: none;
}

.tab-item.active {
  background: var(--brand-main-block-default);
  border-color: var(--brand-main-default);
  color: var(--brand-main-default);
  font-weight: 600;
}

.tab-close {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: var(--lv-border-radius-small);
  color: currentColor;
  cursor: pointer;
  opacity: 0.6;
  transition: all 0.1s linear;
}

.tab-close:hover {
  opacity: 1;
  background: var(--bg-block-primary-hover);
}

.tab-close:active {
  transform: scale(0.9);
  transition: none;
}

.tab-close svg {
  width: 12px;
  height: 12px;
}

.tab-actions {
  display: flex;
  gap: 12px;
}

/* 内容区域 */
.publish-content {
  background: var(--bg-block-primary-default);
  border: 1px solid var(--stroke-primary);
  border-radius: 12px;
  padding: 24px;
}

.tab-content {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 两栏布局 */
.content-layout {
  display: grid;
  grid-template-columns: minmax(400px, 480px) minmax(500px, 1fr);
  gap: 24px;
  align-items: start;
}

@media (max-width: 1200px) {
  .content-layout {
    grid-template-columns: 1fr;
  }

  .left-panel {
    position: relative;
    top: auto;
  }
}

/* 左侧面板 - 视频预览 */
.left-panel {
  position: sticky;
  top: 24px;
}

/* 右侧面板 - 表单 */
.right-panel {
  min-height: 600px;
}

/* 区块 */
.section {
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--stroke-primary);
}

.section:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 12px 0;
}

/* 注意: 按钮样式统一定义在下方 1214-1291 行，此处已移除重复定义 */

/* 文件列表 */
.upload-area {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.file-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--bg-block-secondary-default);
  border-radius: 8px;
  transition: all 0.2s ease;
}

.file-item:hover {
  background: var(--bg-block-secondary-hover);
}

.file-icon {
  width: 24px;
  height: 24px;
  color: var(--brand-main-default);
  flex-shrink: 0;
}

.file-name {
  flex: 1;
  color: var(--text-primary);
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-size {
  color: var(--text-secondary);
  font-size: 12px;
  flex-shrink: 0;
}

.file-remove {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 4px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.file-remove:hover {
  background: rgba(255, 51, 85, 0.2);
  color: var(--functional-error);
}

.file-remove svg {
  width: 14px;
  height: 14px;
}

/* 按钮样式 */
.btn-primary,
.btn-secondary,
.btn-warning,
.btn-select {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 36px;
  padding: 0 16px;
  border: none;
  border-radius: var(--lv-border-radius-large);
  font-size: 14px;
  font-weight: 600;
  font-family: var(--font-family);
  cursor: pointer;
  transition: all 0.1s linear;
  white-space: nowrap;
  -webkit-user-select: none;
  user-select: none;
}

.btn-primary {
  background: var(--component-primary-button-bg-default);
  color: var(--component-primary-button-text-default);
}

.btn-primary:hover:not(:disabled) {
  background: var(--component-primary-button-bg-hover);
}

.btn-primary:active:not(:disabled) {
  background: var(--component-primary-button-bg-pressed);
  transition: none;
}

.btn-primary:disabled {
  background: var(--component-primary-button-bg-disabled);
  color: var(--component-primary-button-text-disabled);
  cursor: not-allowed;
}

.btn-secondary {
  background: var(--component-secondary-button-bg-default);
  color: var(--component-secondary-button-text-default);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--component-secondary-button-bg-hover);
}

.btn-secondary:active:not(:disabled) {
  background: var(--component-secondary-button-bg-pressed);
  transition: none;
}

.btn-warning {
  background: rgba(255, 153, 0, 0.1);
  color: #ff9900;
  border: 1px solid rgba(255, 153, 0, 0.3);
}

.btn-warning:hover:not(:disabled) {
  background: rgba(255, 153, 0, 0.2);
  border-color: rgba(255, 153, 0, 0.5);
}

.btn-warning:active:not(:disabled) {
  background: rgba(255, 153, 0, 0.3);
  transition: none;
}

.btn-select {
  width: 100%;
  background: var(--bg-block-secondary-default);
  border: 1px dashed var(--stroke-primary);
  color: var(--text-secondary);
  font-weight: 500;
}

.btn-select:hover {
  background: var(--bg-block-secondary-hover);
  border-color: var(--brand-main-default);
  color: var(--text-primary);
}

.btn-select:active {
  background: var(--bg-block-secondary-pressed);
  transition: none;
}

.btn-icon {
  width: 16px;
  height: 16px;
}

/* 视频上传占位符 */
.video-upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  background: var(--bg-block-secondary-default);
  border: 2px dashed var(--stroke-primary);
  border-radius: var(--lv-border-radius-large);
  cursor: pointer;
  transition: all 0.1s linear;
  will-change: transform, background-color;
}

.video-upload-placeholder:hover {
  border-color: var(--brand-main-default);
  background: var(--bg-block-secondary-hover);
}

.video-upload-placeholder:active {
  background: var(--bg-block-secondary-pressed);
  transition: none;
}

.video-upload-placeholder.drag-over {
  border-color: var(--brand-main-default);
  background: var(--brand-main-block-default);
  transform: translate3d(0, 0, 0) scale(1.01);
}

.video-upload-placeholder.drag-over .upload-icon-large {
  color: var(--brand-main-default);
  transform: scale(1.1);
}

.video-upload-placeholder.drag-over .upload-text {
  color: var(--brand-main-default);
}

/* 上传拖放区 */
.upload-dropzone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  background: var(--bg-block-primary-default);
  border: 2px dashed var(--stroke-primary);
  border-radius: var(--lv-border-radius-large);
  cursor: pointer;
  transition: all 0.1s linear;
  will-change: transform, background-color;
}

.upload-dropzone:hover {
  border-color: var(--brand-main-default);
  background: var(--bg-block-primary-hover);
}

.upload-dropzone.drag-over {
  border-color: var(--brand-main-default);
  background: var(--brand-main-block-default);
  transform: translate3d(0, 0, 0) scale(1.02);
}

.upload-dropzone.drag-over .upload-icon {
  color: var(--brand-main-default);
  transform: scale(1.1);
}

.upload-dropzone.drag-over p {
  color: var(--brand-main-default);
}

.upload-icon-large {
  width: 64px;
  height: 64px;
  color: var(--text-tertiary);
  margin-bottom: 16px;
  transition: all 0.2s ease;
}

.upload-text {
  color: var(--text-primary);
  font-size: 16px;
  font-weight: 500;
  margin: 0 0 8px 0;
  transition: all 0.1s linear;
}

.upload-hint {
  color: var(--text-secondary);
  font-size: 14px;
  margin: 0;
  text-align: center;
  max-width: 320px;
}

/* 视频预览区域 */
.video-preview-area {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.video-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 500px;
  overflow-y: auto;
}

.video-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--bg-block-secondary-default);
  border: 1px solid var(--stroke-primary);
  border-radius: var(--lv-border-radius-large);
  transition: all 0.1s linear;
}

.video-item:hover {
  background: var(--bg-block-secondary-hover);
  border-color: var(--stroke-secondary);
}

.video-thumbnail {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-block-primary-default);
  border-radius: 6px;
  flex-shrink: 0;
}

.video-icon {
  width: 24px;
  height: 24px;
  color: var(--brand-main-default);
}

.video-info {
  flex: 1;
  min-width: 0;
}

.video-name {
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 4px;
}

.video-size {
  color: var(--text-secondary);
  font-size: 12px;
}

.video-remove {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.video-remove:hover {
  background: rgba(255, 51, 85, 0.2);
  color: var(--functional-error);
}

.video-remove svg {
  width: 16px;
  height: 16px;
}

.btn-add-more {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  background: var(--bg-block-secondary-default);
  border: 1px dashed var(--stroke-primary);
  border-radius: 8px;
  color: var(--text-secondary);
  font-size: 14px;
  font-family: var(--font-family);
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-add-more:hover {
  background: var(--bg-block-secondary-hover);
  border-color: var(--brand-main-default);
  color: var(--text-primary);
}

.btn-add-more svg {
  width: 16px;
  height: 16px;
}

/* 选择器 */
.account-selector,
.topic-selector {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.selected-items {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.selected-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: var(--brand-main-block-default);
  border: 1px solid var(--brand-main-default);
  border-radius: 12px;
  color: var(--brand-main-default);
  font-size: 13px;
  font-weight: 500;
  transition: all 0.1s linear;
}

.selected-tag:hover {
  background: var(--brand-main-block-hover);
}

.tag-remove {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: var(--lv-border-radius-circle);
  color: currentColor;
  cursor: pointer;
  opacity: 0.7;
  transition: all 0.1s linear;
  padding: 0;
  flex-shrink: 0;
}

.tag-remove:hover {
  opacity: 1;
  background: var(--brand-main-default);
  color: var(--inverse-text-primary);
}

.tag-remove:active {
  transform: scale(0.9);
  transition: none;
}

.tag-remove svg {
  width: 10px;
  height: 10px;
}

/* 平台选择 */
.platform-selector {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.platform-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: var(--bg-block-secondary-default);
  border: 1px solid var(--stroke-primary);
  border-radius: var(--lv-border-radius-large);
  cursor: pointer;
  transition: all 0.1s linear;
}

.platform-option:hover {
  background: var(--bg-block-secondary-hover);
  border-color: var(--stroke-secondary);
}

.platform-option:has(.platform-radio:checked) {
  background: var(--brand-main-block-default);
  border-color: var(--brand-main-default);
}

.platform-radio {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: var(--brand-main-default);
}

.platform-label {
  color: var(--text-primary);
  font-size: 14px;
  cursor: pointer;
  flex: 1;
}

/* 输入框 */
.text-input,
.textarea-input,
.time-input,
.form-select {
  padding: 10px 14px;
  background: var(--bg-block-secondary-default);
  border: 1px solid var(--stroke-primary);
  border-radius: var(--lv-border-radius-large);
  color: var(--text-primary);
  font-size: 14px;
  font-family: var(--font-family);
  line-height: 1.5;
  transition: all 0.1s linear;
  caret-color: var(--brand-main-default);
}

.text-input::placeholder,
.textarea-input::placeholder {
  color: var(--text-placeholder);
  opacity: 1;
  transition: opacity 0.1s linear;
}

.text-input:hover,
.textarea-input:hover,
.time-input:hover,
.form-select:hover {
  background: var(--bg-block-secondary-hover);
  border-color: var(--stroke-secondary);
}

.text-input:focus,
.textarea-input:focus,
.time-input:focus,
.form-select:focus {
  outline: none;
  border-color: var(--brand-main-default);
  background: var(--bg-block-secondary-hover);
  box-shadow: 0 0 0 3px var(--brand-main-block-default);
}

.text-input:focus::placeholder,
.textarea-input:focus::placeholder {
  opacity: 0.5;
}

.textarea-input {
  width: 100%;
  resize: vertical;
  min-height: 100px;
  line-height: 1.6;
  padding: 12px 0px;
}

.char-count {
  text-align: right;
  color: var(--text-secondary);
  font-size: 12px;
  margin-top: 6px;
  transition: color 0.1s linear;
}

.textarea-input:focus ~ .char-count {
  color: var(--brand-main-default);
}

/* 商品输入框容器 */
.product-inputs {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-select {
  cursor: pointer;
  min-width: 120px;
}

/* 复选框和开关 */
.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-primary);
  font-size: 14px;
  cursor: pointer;
}

.checkbox-input {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.switch-label {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.switch-input {
  display: none;
}

.switch-slider {
  position: relative;
  width: 44px;
  height: 24px;
  background: var(--bg-block-primary-hover);
  border-radius: 12px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.switch-slider::before {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background: var(--inverse-text-primary);
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.switch-input:checked + .switch-slider {
  background: var(--brand-main-default);
}

.switch-input:checked + .switch-slider::before {
  transform: translateX(20px);
}

.switch-text {
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 500;
}

/* 定时设置 */
.schedule-settings {
  margin-top: 12px;
  padding: 16px;
  background: var(--bg-block-secondary-default);
  border-radius: 8px;
}

.form-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.form-row:last-child {
  margin-bottom: 0;
}

.form-label {
  min-width: 110px;
  color: var(--text-primary);
  font-size: 13px;
}

.time-list {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  flex: 1;
}

.time-input {
  width: 100px;
}

.btn-add-time {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--brand-main-block-default);
  border: 1px dashed var(--brand-main-default);
  border-radius: 6px;
  color: var(--brand-main-default);
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-add-time:hover {
  background: var(--brand-main-default);
  color: var(--inverse-text-primary);
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid var(--stroke-primary);
}

.action-buttons .btn-primary,
.action-buttons .btn-secondary {
  min-width: 100px;
}

/* 模态框 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--bg-mask-60);
  backdrop-filter: blur(var(--canvas-float-backdrop-blur));
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.15s ease;
}

.modal-content {
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  background: var(--canvas-float-block-default);
  backdrop-filter: blur(var(--canvas-float-backdrop-blur));
  -webkit-backdrop-filter: blur(var(--canvas-float-backdrop-blur));
  border: 1px solid var(--stroke-primary);
  border-radius: var(--lv-border-radius-large);
  box-shadow: var(--shadow-dropdown-menu);
  display: flex;
  flex-direction: column;
  animation: slideUp 0.2s cubic-bezier(0.34, 0.69, 0.1, 1);
}

.modal-small {
  max-width: 400px;
}

.modal-large {
  max-width: 800px;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(16px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--stroke-primary);
  flex-shrink: 0;
}

.modal-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.close-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: var(--lv-border-radius-medium);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.1s linear;
}

.close-btn:hover {
  background: var(--bg-block-primary-hover);
  color: var(--text-primary);
}

.close-btn:active {
  background: var(--bg-block-primary-pressed);
  transition: none;
}

.close-btn svg {
  width: 16px;
  height: 16px;
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid var(--stroke-primary);
  flex-shrink: 0;
}

/* 上传选项 */
.option-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 20px;
  background: var(--bg-block-primary-default);
  border: 1px solid var(--stroke-primary);
  border-radius: 12px;
  color: var(--text-primary);
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 12px;
}

.option-btn:last-child {
  margin-bottom: 0;
}

.option-btn:hover {
  background: var(--bg-block-primary-hover);
  border-color: var(--brand-main-default);
}

.option-btn svg {
  width: 24px;
  height: 24px;
}

/* 上传拖放区 */
.upload-dropzone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  background: var(--bg-block-primary-default);
  border: 2px dashed var(--stroke-primary);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.upload-dropzone:hover {
  border-color: var(--brand-main-default);
  background: var(--bg-block-primary-hover);
}

.upload-icon {
  width: 48px;
  height: 48px;
  color: var(--brand-main-default);
  margin-bottom: 16px;
  transition: all 0.2s ease;
}

.upload-dropzone p {
  color: var(--text-primary);
  font-size: 16px;
  margin: 0 0 8px 0;
  transition: all 0.1s linear;
}

.upload-tip {
  color: var(--text-secondary);
  font-size: 14px;
}

/* 素材和账号列表 */
.material-list,
.account-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 400px;
  overflow-y: auto;
}

.material-item,
.account-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--bg-block-primary-default);
  border: 1px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.material-item:hover,
.account-item:hover {
  background: var(--bg-block-primary-hover);
  border-color: var(--brand-main-default);
}

.material-checkbox,
.account-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
  flex-shrink: 0;
}

.material-info,
.account-info {
  flex: 1;
  min-width: 0;
}

.material-name,
.account-name {
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.material-meta {
  display: flex;
  gap: 12px;
  margin-top: 4px;
  color: var(--text-secondary);
  font-size: 12px;
}

.account-platform {
  display: inline-block;
  margin-top: 4px;
  padding: 2px 8px;
  background: var(--brand-main-block-default);
  border-radius: 4px;
  color: var(--brand-main-default);
  font-size: 12px;
}

/* 话题相关 */
.custom-topic-input {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.custom-topic-input .text-input {
  flex: 1;
}

.recommended-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  margin: 0 0 12px 0;
}

.topic-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 8px;
}

.topic-btn {
  padding: 8px 12px;
  background: var(--bg-block-primary-default);
  border: 1px solid transparent;
  border-radius: 6px;
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.1s linear;
  will-change: transform;
}

.topic-btn:hover {
  background: var(--bg-block-primary-hover);
  color: var(--text-primary);
  transform: translateY(-2px);
  box-shadow: var(--shadow-generator-float-block);
}

.topic-btn:active {
  transform: translateY(0);
  transition: none;
}

.topic-btn.active {
  background: var(--brand-main-block-default);
  border-color: var(--brand-main-default);
  color: var(--brand-main-default);
  font-weight: 500;
}
</style>
