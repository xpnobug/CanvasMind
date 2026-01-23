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
                        <div class="account-management">
                          <!-- 顶部操作栏 -->
                          <div class="page-header">
                            <div class="search-box">
                              <input
                                  v-model="searchKeyword"
                                  type="text"
                                  placeholder="搜索账号名称..."
                                  class="search-input"
                              />
                            </div>
                            <div class="header-actions">
                              <button class="btn-secondary" @click="refreshAccounts" :disabled="isRefreshing">
                                <svg class="btn-icon" :class="{ spinning: isRefreshing }" viewBox="0 0 24 24"
                                     fill="none" stroke="currentColor" stroke-width="2">
                                  <polyline points="23 4 23 10 17 10"/>
                                  <polyline points="1 20 1 14 7 14"/>
                                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                                </svg>
                                刷新
                              </button>
                              <button class="btn-primary" @click="showAddDialog">
                                <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                     stroke-width="2">
                                  <line x1="12" y1="5" x2="12" y2="19"/>
                                  <line x1="5" y1="12" x2="19" y2="12"/>
                                </svg>
                                添加账号
                              </button>
                            </div>
                          </div>

                          <!-- 平台标签 -->
                          <div class="platform-tabs">
                            <button
                                v-for="tab in platformTabs"
                                :key="tab.key"
                                class="tab-btn"
                                :class="{ active: activeTab === tab.key }"
                                @click="activeTab = tab.key"
                            >
                              {{ tab.label }}
                              <span class="tab-count">{{ getTabCount(tab.key) }}</span>
                            </button>
                          </div>

                          <!-- 账号列表 -->
                          <div class="account-list">
                            <div v-if="filteredAccounts.length === 0" class="empty-state">
                              <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                   stroke-width="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                <circle cx="12" cy="7" r="4"/>
                              </svg>
                              <p class="empty-text">暂无账号数据</p>
                              <button class="btn-primary" @click="showAddDialog">添加第一个账号</button>
                            </div>

                            <div v-else class="account-grid">
                              <div
                                  v-for="account in filteredAccounts"
                                  :key="account.id"
                                  class="account-card"
                              >
                                <div class="card-header">
                                  <div class="account-avatar">
                                    {{ account.name.charAt(0) }}
                                  </div>
                                  <div class="account-info">
                                    <h3 class="account-name">{{ account.name }}</h3>
                                    <span class="account-platform" :class="`platform-${account.type}`">
                {{ account.platform }}
              </span>
                                  </div>
                                  <div class="account-status">
              <span
                  class="status-badge"
                  :class="getStatusClass(account.status)"
                  @click="handleStatusClick(account)"
              >
                {{ account.status }}
              </span>
                                  </div>
                                </div>

                                <div class="card-actions">
                                  <button class="action-btn" @click="handleEdit(account)">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                    </svg>
                                    编辑
                                  </button>
                                  <button class="action-btn" @click="handleDownloadCookie(account)">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                      <polyline points="7 10 12 15 17 10"/>
                                      <line x1="12" y1="15" x2="12" y2="3"/>
                                    </svg>
                                    下载
                                  </button>
                                  <button class="action-btn" @click="handleUploadCookie(account)">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                      <polyline points="17 8 12 3 7 8"/>
                                      <line x1="12" y1="3" x2="12" y2="15"/>
                                    </svg>
                                    上传
                                  </button>
                                  <button class="action-btn danger" @click="handleDelete(account)">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                      <polyline points="3 6 5 6 21 6"/>
                                      <path
                                          d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                    </svg>
                                    删除
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>

                          <!-- 添加/编辑账号对话框 -->
                          <div v-if="dialogVisible" class="modal-overlay" @click.self="closeDialog">
                            <div class="modal-content">
                              <div class="modal-header">
                                <h2>{{ dialogType === 'add' ? '添加账号' : '编辑账号' }}</h2>
                                <button class="close-btn" @click="closeDialog">
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="18" y1="6" x2="6" y2="18"/>
                                    <line x1="6" y1="6" x2="18" y2="18"/>
                                  </svg>
                                </button>
                              </div>

                              <div class="modal-body">
                                <div v-if="!sseConnecting" class="form-group">
                                  <label class="form-label">平台</label>
                                  <select
                                      v-model="accountForm.platform"
                                      class="form-select"
                                      :disabled="dialogType === 'edit'"
                                  >
                                    <option value="">请选择平台</option>
                                    <option value="快手">快手</option>
                                    <option value="抖音">抖音</option>
                                    <option value="视频号">视频号</option>
                                    <option value="小红书">小红书</option>
                                  </select>
                                </div>

                                <div v-if="!sseConnecting" class="form-group">
                                  <label class="form-label">账号名称</label>
                                  <input
                                      v-model="accountForm.name"
                                      type="text"
                                      class="form-input"
                                      placeholder="请输入账号名称"
                                  />
                                </div>

                                <!-- 二维码显示区域 -->
                                <div v-if="sseConnecting" class="qrcode-container">
                                  <div v-if="qrCodeData && !loginStatus" class="qrcode-wrapper">
                                    <p class="qrcode-tip">请使用{{ accountForm.platform }}APP扫描二维码登录</p>
                                    <img :src="qrCodeData" alt="登录二维码" class="qrcode-image"/>
                                  </div>
                                  <div v-else-if="!qrCodeData && !loginStatus" class="loading-wrapper">
                                    <div class="loading-spinner"></div>
                                    <span>正在请求登录...</span>
                                  </div>
                                  <div v-else-if="loginStatus === '200'" class="success-wrapper">
                                    <svg class="status-icon success" viewBox="0 0 24 24" fill="none"
                                         stroke="currentColor" stroke-width="2">
                                      <polyline points="20 6 9 17 4 12"/>
                                    </svg>
                                    <span>登录成功</span>
                                  </div>
                                  <div v-else-if="loginStatus === '500'" class="error-wrapper">
                                    <svg class="status-icon error" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                         stroke-width="2">
                                      <circle cx="12" cy="12" r="10"/>
                                      <line x1="15" y1="9" x2="9" y2="15"/>
                                      <line x1="9" y1="9" x2="15" y2="15"/>
                                    </svg>
                                    <span>登录失败，请重试</span>
                                  </div>
                                </div>
                              </div>

                              <div class="modal-footer">
                                <button class="btn-secondary" @click="closeDialog" :disabled="sseConnecting">
                                  取消
                                </button>
                                <button
                                    class="btn-primary"
                                    @click="submitForm"
                                    :disabled="sseConnecting"
                                >
                                  {{ sseConnecting ? '登录中...' : '确认' }}
                                </button>
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
      </div>
    </div>
  </div>
</template>

<script setup>
import SideMenu from '@/components/home/components/SideMenu.vue'

import {ref, computed, onMounted} from 'vue'
import {accountApi} from '@/api/account'
import {useAccountStore} from '@/stores/account'
import {useAppStore} from '@/stores/app'

const accountStore = useAccountStore()
const appStore = useAppStore()

const searchKeyword = ref('')
const activeTab = ref('all')
const isRefreshing = ref(false)
const dialogVisible = ref(false)
const dialogType = ref('add')
const sseConnecting = ref(false)
const qrCodeData = ref('')
const loginStatus = ref('')
let eventSource = null

const accountForm = ref({
  id: null,
  name: '',
  platform: '',
  status: '正常'
})

const platformTabs = [
  {key: 'all', label: '全部'},
  {key: '快手', label: '快手'},
  {key: '抖音', label: '抖音'},
  {key: '视频号', label: '视频号'},
  {key: '小红书', label: '小红书'}
]

// 过滤后的账号列表
const filteredAccounts = computed(() => {
  let accountsList = [...accountStore.accounts.value]

  // 按平台过滤
  if (activeTab.value !== 'all') {
    accountsList = accountsList.filter(acc => acc.platform === activeTab.value)
  }

  // 按关键词搜索
  if (searchKeyword.value) {
    accountsList = accountsList.filter(acc =>
        acc.name.toLowerCase().includes(searchKeyword.value.toLowerCase())
    )
  }

  return accountsList
})

// 获取标签数量
const getTabCount = (key) => {
  if (key === 'all') return accountStore.accounts.value.length
  return accountStore.accounts.value.filter(acc => acc.platform === key).length
}

// 获取状态样式类
const getStatusClass = (status) => {
  return {
    'status-normal': status === '正常',
    'status-error': status === '异常',
    'status-pending': status === '验证中',
    'clickable': status === '异常'
  }
}

// 处理状态点击
const handleStatusClick = (account) => {
  if (account.status === '异常') {
    handleReLogin(account)
  }
}

// 快速获取账号列表
const fetchAccountsQuick = async () => {
  try {
    const res = await accountApi.getAccounts()
    if (res.code === 200 && res.data) {
      const accountsWithPendingStatus = res.data.map(account => {
        const updatedAccount = [...account]
        updatedAccount[4] = '验证中'
        return updatedAccount
      })
      accountStore.setAccounts(accountsWithPendingStatus)
    }
  } catch (error) {
    console.error('获取账号失败:', error)
  }
}

// 刷新账号（带验证）
const refreshAccounts = async () => {
  if (isRefreshing.value) return

  isRefreshing.value = true
  try {
    const res = await accountApi.getValidAccounts()
    if (res.code === 200 && res.data) {
      accountStore.setAccounts(res.data)
      showToast('账号刷新成功', 'success')
    }
  } catch (error) {
    console.error('刷新账号失败:', error)
    showToast('刷新账号失败', 'error')
  } finally {
    isRefreshing.value = false
  }
}

// 显示添加对话框
const showAddDialog = () => {
  dialogType.value = 'add'
  accountForm.value = {
    id: null,
    name: '',
    platform: '',
    status: '正常'
  }
  sseConnecting.value = false
  qrCodeData.value = ''
  loginStatus.value = ''
  dialogVisible.value = true
}

// 编辑账号
const handleEdit = (account) => {
  dialogType.value = 'edit'
  accountForm.value = {
    id: account.id,
    name: account.name,
    platform: account.platform,
    status: account.status
  }
  dialogVisible.value = true
}

// 重新登录
const handleReLogin = (account) => {
  dialogType.value = 'edit'
  accountForm.value = {
    id: account.id,
    name: account.name,
    platform: account.platform,
    status: account.status
  }
  dialogVisible.value = true

  setTimeout(() => {
    connectSSE(account.platform, account.name)
  }, 300)
}

// 删除账号
const handleDelete = async (account) => {
  if (!confirm(`确定要删除账号 ${account.name} 吗？`)) return

  try {
    const res = await accountApi.deleteAccount(account.id)
    if (res.code === 200) {
      accountStore.deleteAccount(account.id)
      showToast('删除成功', 'success')
    }
  } catch (error) {
    console.error('删除失败:', error)
    showToast('删除失败', 'error')
  }
}

// 下载 Cookie
const handleDownloadCookie = (account) => {
  const url = accountApi.downloadCookie(account.filePath)
  const link = document.createElement('a')
  link.href = url
  link.download = `${account.name}_cookie.json`
  link.click()
}

// 上传 Cookie
const handleUploadCookie = (account) => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'

  input.onchange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)
    formData.append('id', account.id)
    formData.append('platform', account.platform)

    try {
      const res = await accountApi.uploadCookie(formData)
      if (res.code === 200) {
        showToast('Cookie上传成功', 'success')
        refreshAccounts()
      } else {
        showToast(res.msg || 'Cookie上传失败', 'error')
      }
    } catch (error) {
      console.error('上传失败:', error)
      showToast('Cookie上传失败', 'error')
    }
  }

  input.click()
}

// 关闭对话框
const closeDialog = () => {
  if (sseConnecting.value) return
  closeSSEConnection()
  dialogVisible.value = false
}

// 提交表单
const submitForm = () => {
  if (!accountForm.value.platform || !accountForm.value.name) {
    showToast('请填写完整信息', 'error')
    return
  }

  if (dialogType.value === 'add' || (dialogType.value === 'edit' && accountForm.value.status === '异常')) {
    connectSSE(accountForm.value.platform, accountForm.value.name)
  } else {
    // 编辑账号信息
    updateAccountInfo()
  }
}

// 更新账号信息
const updateAccountInfo = async () => {
  try {
    const res = await accountApi.updateAccount({
      id: accountForm.value.id,
      type: accountStore.PLATFORM_TYPE_MAP[accountForm.value.platform],
      userName: accountForm.value.name
    })

    if (res.code === 200) {
      showToast('更新成功', 'success')
      dialogVisible.value = false
      refreshAccounts()
    }
  } catch (error) {
    console.error('更新失败:', error)
    showToast('更新失败', 'error')
  }
}

// 建立 SSE 连接
const connectSSE = (platform, name) => {
  closeSSEConnection()

  sseConnecting.value = true
  qrCodeData.value = ''
  loginStatus.value = ''

  const platformTypeMap = {
    '小红书': '1',
    '视频号': '2',
    '抖音': '3',
    '快手': '4'
  }

  const type = platformTypeMap[platform]
  const url = accountApi.loginAccount(type, name)

  eventSource = new EventSource(url)

  eventSource.onmessage = (event) => {
    const data = event.data

    if (!qrCodeData.value && data.length > 100) {
      qrCodeData.value = data.startsWith('data:image') ? data : `data:image/png;base64,${data}`
    } else if (data === '200' || data === '500') {
      loginStatus.value = data

      if (data === '200') {
        setTimeout(() => {
          closeSSEConnection()
          setTimeout(() => {
            dialogVisible.value = false
            sseConnecting.value = false
            showToast('登录成功', 'success')
            refreshAccounts()
          }, 1000)
        }, 1000)
      } else {
        closeSSEConnection()
        setTimeout(() => {
          sseConnecting.value = false
          qrCodeData.value = ''
          loginStatus.value = ''
        }, 2000)
      }
    }
  }

  eventSource.onerror = () => {
    showToast('连接失败，请重试', 'error')
    closeSSEConnection()
    sseConnecting.value = false
  }
}

// 关闭 SSE 连接
const closeSSEConnection = () => {
  if (eventSource) {
    eventSource.close()
    eventSource = null
  }
}

// 简单的 Toast 提示
const showToast = (message, type = 'info') => {
  const toast = document.createElement('div')
  toast.className = `toast toast-${type}`
  toast.textContent = message
  document.body.appendChild(toast)

  setTimeout(() => {
    toast.classList.add('show')
  }, 10)

  setTimeout(() => {
    toast.classList.remove('show')
    setTimeout(() => {
      document.body.removeChild(toast)
    }, 300)
  }, 3000)
}

onMounted(() => {
  // 只在首次加载或需要时才验证账号
  // 如果 store 中已有账号数据，直接使用
  if (accountStore.accounts.value.length === 0) {
    fetchAccountsQuick()
    setTimeout(() => {
      refreshAccounts()
    }, 100)
  } else {
    // 已有数据，只做快速获取
    fetchAccountsQuick()
  }
})
</script>

<style scoped>
.account-management {
  padding: 32px;
  max-width: 1400px;
  margin: 0 auto;
}

/* 页面头部 */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32px;
  gap: 16px;
}

.search-box {
  flex: 1;
  max-width: 400px;
}

.search-input {
  width: 100%;
  height: 36px;
  padding: 0 12px;
  background: var(--bg-block-primary-default);
  border: 1px solid var(--stroke-primary);
  border-radius: var(--lv-border-radius-large);
  color: var(--text-primary);
  font-size: 14px;
  font-family: var(--font-family);
  transition: all 0.1s linear;
  caret-color: var(--brand-main-default);
}

.search-input:hover {
  background: var(--bg-block-primary-hover);
  border-color: var(--stroke-secondary);
}

.search-input:focus {
  outline: none;
  border-color: var(--brand-main-default);
  background: var(--bg-block-primary-hover);
  box-shadow: 0 0 0 2px var(--brand-main-block-default);
}

.search-input::placeholder {
  color: var(--text-placeholder);
}

.header-actions {
  display: flex;
  gap: 12px;
}

/* 按钮样式 */
.btn-primary,
.btn-secondary {
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

.btn-secondary:disabled {
  background: var(--component-secondary-button-bg-disabled);
  color: var(--component-secondary-button-text-disabled);
  cursor: not-allowed;
}

.btn-icon {
  width: 16px;
  height: 16px;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 平台标签 */
.platform-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--stroke-primary);
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: transparent;
  border: none;
  border-radius: var(--lv-border-radius-medium);
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
  font-family: var(--font-family);
  cursor: pointer;
  transition: all 0.1s linear;
  white-space: nowrap;
}

.tab-btn:hover {
  background: var(--bg-block-primary-hover);
  color: var(--text-primary);
}

.tab-btn:active {
  background: var(--bg-block-primary-pressed);
  transition: none;
}

.tab-btn.active {
  background: var(--brand-main-block-default);
  color: var(--brand-main-default);
  font-weight: 600;
}

.tab-count {
  padding: 2px 6px;
  background: var(--bg-block-secondary-default);
  border-radius: 10px;
  font-size: 12px;
  font-weight: 500;
}

.tab-btn.active .tab-count {
  background: var(--brand-main-default);
  color: var(--inverse-text-primary);
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
}

.empty-icon {
  width: 64px;
  height: 64px;
  color: var(--text-tertiary);
  margin-bottom: 16px;
}

.empty-text {
  color: var(--text-secondary);
  font-size: 16px;
  margin-bottom: 24px;
}

/* 账号网格 */
.account-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

/* 账号卡片 */
.account-card {
  background: var(--bg-block-primary-default);
  border: 1px solid var(--stroke-primary);
  border-radius: var(--lv-border-radius-large);
  padding: 16px;
  transition: all 0.1s linear;
}

.account-card:hover {
  background: var(--bg-block-primary-hover);
  border-color: var(--stroke-secondary);
  transform: translateY(-1px);
  box-shadow: var(--shadow-generator-float-block);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.account-avatar {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--brand-main-block-default);
  color: var(--brand-main-default);
  border-radius: var(--lv-border-radius-circle);
  font-size: 20px;
  font-weight: 600;
  flex-shrink: 0;
}

.account-info {
  flex: 1;
  min-width: 0;
}

.account-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 4px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.account-platform {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.platform-1 {
  background: rgba(255, 36, 66, 0.2);
  color: #ff2442;
}

.platform-2 {
  background: rgba(7, 193, 96, 0.2);
  color: #07c160;
}

.platform-3 {
  background: rgba(0, 0, 0, 0.2);
  color: #fff;
}

.platform-4 {
  background: rgba(255, 102, 0, 0.2);
  color: #ff6600;
}

.account-status {
  flex-shrink: 0;
}

.status-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
  transition: all 0.1s linear;
}

.status-normal {
  background: var(--brand-main-block-default);
  color: var(--brand-main-default);
}

.status-error {
  background: rgba(255, 51, 85, 0.15);
  color: var(--functional-error);
}

.status-pending {
  background: var(--bg-block-secondary-default);
  color: var(--text-secondary);
}

.status-badge.clickable {
  cursor: pointer;
}

.status-badge.clickable:hover {
  opacity: 0.85;
  transform: scale(1.05);
}

.status-badge.clickable:active {
  transform: scale(0.98);
  transition: none;
}

.card-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.action-btn {
  flex: 1;
  min-width: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 6px 10px;
  background: var(--bg-block-secondary-default);
  border: none;
  border-radius: var(--lv-border-radius-medium);
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 500;
  font-family: var(--font-family);
  cursor: pointer;
  transition: all 0.1s linear;
}

.action-btn:hover {
  background: var(--bg-block-secondary-hover);
  color: var(--text-primary);
}

.action-btn:active {
  background: var(--bg-block-secondary-pressed);
  transition: none;
}

.action-btn.danger:hover {
  background: rgba(255, 51, 85, 0.15);
  color: var(--functional-error);
}

.action-btn.danger:active {
  background: rgba(255, 51, 85, 0.25);
}

.action-btn svg {
  width: 14px;
  height: 14px;
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

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal-content {
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  background: var(--bg-float);
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
}

.form-group {
  margin-bottom: 20px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 500;
}

.form-input,
.form-select {
  width: 100%;
  height: 40px;
  padding: 0 12px;
  background: var(--bg-block-primary-default);
  border: 1px solid var(--stroke-primary);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 14px;
  font-family: var(--font-family);
  transition: all 0.2s ease;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: var(--brand-main-default);
  background: var(--bg-block-primary-hover);
}

.form-input:disabled,
.form-select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 二维码容器 */
.qrcode-container {
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.qrcode-wrapper,
.loading-wrapper,
.success-wrapper,
.error-wrapper {
  text-align: center;
}

.qrcode-tip {
  color: var(--text-secondary);
  font-size: 14px;
  margin-bottom: 16px;
}

.qrcode-image {
  max-width: 240px;
  border-radius: 8px;
}

.loading-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: var(--text-secondary);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--bg-block-primary-hover);
  border-top-color: var(--brand-main-default);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.success-wrapper,
.error-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.status-icon {
  width: 48px;
  height: 48px;
}

.status-icon.success {
  color: var(--functional-success);
}

.status-icon.error {
  color: var(--functional-error);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid var(--stroke-primary);
}

/* Toast 提示 */
.toast {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%) translateY(-60px);
  padding: 10px 20px;
  background: var(--component-toast);
  border: 1px solid var(--stroke-primary);
  border-radius: var(--lv-border-radius-large);
  color: var(--text-primary);
  font-size: 14px;
  box-shadow: var(--shadow-dropdown-menu);
  z-index: 2000;
  opacity: 0;
  transition: all 0.2s cubic-bezier(0.34, 0.69, 0.1, 1);
}

.toast.show {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

.toast-success {
  border-color: var(--functional-success);
}

.toast-error {
  border-color: var(--functional-error);
}
</style>
