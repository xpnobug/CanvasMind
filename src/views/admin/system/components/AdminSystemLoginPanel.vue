<template>
  <div class="admin-system-panel admin-login-panel">
    <div class="admin-login-panel__intro">
      <p class="admin-login-panel__intro-title">登录设置</p>
      <p class="admin-login-panel__intro-desc">
        维护登录入口展示、验证码 / OAuth 参数与启用状态。已配置 {{ authMethods.length }} 项，其中 {{ enabledMethodCount }} 项启用。
      </p>
    </div>

    <div class="admin-card admin-system-methods-card">
      <div class="admin-card__header">
        <div>
          <h4 class="admin-card__title">登录方式</h4>
          <div class="admin-card__desc">按卡片管理登录入口，弹窗内完成新增、编辑和参数配置；顶栏「保存登录方式」会批量写回后端。</div>
        </div>
        <div class="admin-page__actions">
          <button class="admin-button admin-button--secondary" type="button" @click="openCreateMethodDialog" :disabled="loading || methodSaving || !creatableMethodTemplates.length">
            {{ creatableMethodTemplates.length ? '新增登录方式' : '已全部添加' }}
          </button>
        </div>
      </div>
      <div class="admin-card__content">
        <div v-if="loading" class="admin-empty">正在加载系统设置...</div>
        <div v-else-if="!authMethods.length" class="admin-empty">暂无登录方式配置，请先检查后端认证配置初始化是否正常。</div>
        <div v-else class="admin-provider-grid admin-system-method-grid">
          <button
            class="admin-provider-create-card admin-system-method-create"
            type="button"
            @click="openCreateMethodDialog"
            :disabled="!creatableMethodTemplates.length"
          >
            <div class="admin-provider-create-card__plus">+</div>
            <div class="admin-provider-create-card__title">新增登录方式</div>
            <div class="admin-provider-create-card__desc">
              {{ creatableMethodTemplates.length ? '从预设模板中新增一项登录配置' : '预设登录方式已全部添加' }}
            </div>
            <div class="admin-provider-create-card__footer-actions">
              <span class="admin-provider-create-card__action admin-provider-create-card__action--muted">预设模板</span>
              <span class="admin-provider-create-card__action">弹窗配置</span>
            </div>
          </button>

          <div
            v-for="method in sortedAuthMethods"
            :key="method.methodType"
            class="admin-provider-tile admin-system-method-tile"
          >
            <div class="admin-provider-tile__header">
              <div class="admin-provider-tile__brand">
                <div class="admin-provider-avatar admin-provider-avatar--small">
                  <span>{{ method.displayName.slice(0, 1) }}</span>
                </div>
                <div class="admin-provider-tile__meta">
                  <div class="admin-provider-tile__title">{{ method.displayName || method.methodType }}</div>
                  <div class="admin-provider-tile__link">{{ method.methodType }} / {{ method.category }}</div>
                </div>
              </div>
              <div class="admin-provider-tile__actions" @click.stop>
                <button class="admin-icon-button" type="button" title="登录方式操作" @click="toggleMethodMenu(method.methodType)"><el-icon><MoreFilled /></el-icon></button>
                <div v-if="activeMethodMenuType === method.methodType" class="admin-provider-menu">
                  <button class="admin-provider-menu__item" type="button" @click="handleMethodMenuEdit(method)">
                    <span class="admin-provider-menu__icon"><el-icon><Edit /></el-icon></span>
                    <span>编辑配置</span>
                  </button>
                  <button class="admin-provider-menu__item" type="button" @click="handleMethodMenuToggleEnabled(method)">
                    <span class="admin-provider-menu__icon">{{ method.isEnabled ? '停' : '启' }}</span>
                    <span>{{ method.isEnabled ? '停用登录方式' : '启用登录方式' }}</span>
                  </button>
                  <button class="admin-provider-menu__item" type="button" @click="handleMethodMenuToggleVisible(method)">
                    <span class="admin-provider-menu__icon">{{ method.isVisible ? '隐' : '显' }}</span>
                    <span>{{ method.isVisible ? '前台隐藏' : '前台显示' }}</span>
                  </button>
                  <div class="admin-provider-menu__divider"></div>
                  <button class="admin-provider-menu__item admin-provider-menu__item--danger" type="button" @click="handleMethodMenuDelete(method)">
                    <span class="admin-provider-menu__icon"><el-icon><Delete /></el-icon></span>
                    <span>删除该项</span>
                  </button>
                </div>
              </div>
            </div>

            <div class="admin-provider-tile__status-row">
              <span class="admin-status" :class="method.isEnabled ? 'admin-status--success' : 'admin-status--warning'">
                {{ method.isEnabled ? '已启用' : '未启用' }}
              </span>
              <span class="admin-status" :class="method.isVisible ? 'admin-status--success' : 'admin-status--warning'">
                {{ method.isVisible ? '前台可见' : '前台隐藏' }}
              </span>
            </div>

            <div class="admin-provider-tile__chips">
              <span class="admin-chip">{{ getMethodCategoryLabel(method.category) }}</span>
              <span class="admin-chip">排序 {{ method.sortOrder }}</span>
              <span class="admin-chip">{{ method.allowSignUp ? '允许自动注册' : '禁止自动注册' }}</span>
              <span v-if="method.category === 'CODE'" class="admin-chip">{{ method.debugSendEnabled ? '调试自动填码开启' : '调试自动填码关闭' }}</span>
            </div>

            <div class="admin-system-method-preview">
              <div v-for="item in buildMethodPreviewItems(method)" :key="item" class="admin-system-method-preview__item">
                {{ item }}
              </div>
            </div>

            <div class="admin-provider-tile__footer">
              <span>{{ method.description || '未填写登录方式描述' }}</span>
              <span>{{ getMethodTypeLabel(method.methodType) }}</span>
            </div>

            <div class="admin-system-method-actions">
              <button class="admin-inline-button" type="button" @click="openEditMethodDialog(method)">编辑</button>
              <button class="admin-inline-button" type="button" @click="toggleMethodEnabled(method.methodType)">
                {{ method.isEnabled ? '停用' : '启用' }}
              </button>
              <button class="admin-inline-button" type="button" @click="toggleMethodVisible(method.methodType)">
                {{ method.isVisible ? '隐藏' : '显示' }}
              </button>
              <button class="admin-inline-button admin-inline-button--danger" type="button" @click="removeMethod(method.methodType)">删除</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Delete, Edit, MoreFilled } from '@element-plus/icons-vue'
import type { PropType } from 'vue'
import type { AuthMethodCategory, AuthMethodType } from '@/api/auth'

interface EditableAuthMethodLike {
  methodType: AuthMethodType
  category: AuthMethodCategory
  displayName: string
  description: string
  isEnabled: boolean
  isVisible: boolean
  sortOrder: number
  allowSignUp: boolean
  debugSendEnabled: boolean
}

interface AuthMethodTemplateLike {
  methodType: AuthMethodType
  displayName: string
}

defineProps({
  loading: {
    type: Boolean,
    required: true,
  },
  methodSaving: {
    type: Boolean,
    required: true,
  },
  enabledMethodCount: {
    type: Number,
    required: true,
  },
  authMethods: {
    type: Array as PropType<EditableAuthMethodLike[]>,
    required: true,
  },
  sortedAuthMethods: {
    type: Array as PropType<EditableAuthMethodLike[]>,
    required: true,
  },
  creatableMethodTemplates: {
    type: Array as PropType<AuthMethodTemplateLike[]>,
    required: true,
  },
  activeMethodMenuType: {
    type: String as PropType<AuthMethodType | ''>,
    required: true,
  },
  buildMethodPreviewItems: {
    type: Function as PropType<(method: any) => string[]>,
    required: true,
  },
  getMethodCategoryLabel: {
    type: Function as PropType<(category: AuthMethodCategory) => string>,
    required: true,
  },
  getMethodTypeLabel: {
    type: Function as PropType<(methodType: AuthMethodType) => string>,
    required: true,
  },
  openCreateMethodDialog: {
    type: Function as PropType<() => void>,
    required: true,
  },
  openEditMethodDialog: {
    type: Function as PropType<(method: any) => void>,
    required: true,
  },
  toggleMethodMenu: {
    type: Function as PropType<(methodType: AuthMethodType) => void>,
    required: true,
  },
  handleMethodMenuEdit: {
    type: Function as PropType<(method: any) => void>,
    required: true,
  },
  handleMethodMenuToggleEnabled: {
    type: Function as PropType<(method: any) => void>,
    required: true,
  },
  handleMethodMenuToggleVisible: {
    type: Function as PropType<(method: any) => void>,
    required: true,
  },
  handleMethodMenuDelete: {
    type: Function as PropType<(method: any) => void>,
    required: true,
  },
  toggleMethodEnabled: {
    type: Function as PropType<(methodType: AuthMethodType) => void>,
    required: true,
  },
  toggleMethodVisible: {
    type: Function as PropType<(methodType: AuthMethodType) => void>,
    required: true,
  },
  removeMethod: {
    type: Function as PropType<(methodType: AuthMethodType) => void>,
    required: true,
  },
})
</script>

<style scoped>
.admin-system-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.admin-login-panel__intro {
  padding: 2px 2px 0;
}

.admin-login-panel__intro-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.admin-login-panel__intro-desc {
  margin: 8px 0 0;
  max-width: 720px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--text-secondary);
}
</style>
