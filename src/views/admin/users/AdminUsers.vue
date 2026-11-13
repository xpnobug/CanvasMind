<template>
  <AdminPageContainer
    class="admin-list-page"
    title="用户管理"
    description="统一管理平台用户资料、账号状态与资源沉淀，并集中处理用户角色与运营动作。"
    compact
  >
    <AdminListFrame>
      <template #toolbar>
        <AdminListToolbar
          :disabled="loading"
          :has-active-filters="hasActiveFilters"
          :facets="listFacets"
          @update:facet="handleFacetUpdate"
          @clear="resetFilters"
        >
          <input
            v-model.trim="filters.keyword"
            class="admin-list-toolbar__input is-wide"
            type="text"
            placeholder="搜索昵称、邮箱、手机号或用户 ID"
            :disabled="loading"
            @keydown.enter="handleSearch"
          >
        </AdminListToolbar>
      </template>

      <div class="admin-provider-grid admin-console-grid admin-user-grid">
        <button
          class="admin-provider-create-card admin-console-create-card admin-user-create-card"
          type="button"
          :disabled="submitting"
          @click="handleCreateUser"
        >
          <div class="admin-provider-create-card__main admin-user-create-card__main">
            <div class="admin-provider-create-card__plus">+</div>
            <div class="admin-provider-create-card__copy">
              <div class="admin-provider-create-card__title">创建用户</div>
              <div class="admin-provider-create-card__desc">添加新的用户</div>
            </div>
          </div>
        </button>

        <template v-if="loading && !users.length">
          <div
            v-for="index in 4"
            :key="`user-skeleton-${index}`"
            class="admin-provider-tile admin-console-card admin-user-card admin-provider-tile--skeleton"
            aria-hidden="true"
          >
            <div class="admin-provider-tile__header">
              <div class="admin-provider-tile__brand">
                <div class="admin-provider-avatar is-skeleton" />
                <div class="admin-provider-tile__meta">
                  <div class="admin-provider-tile__skeleton-line is-title" />
                  <div class="admin-provider-tile__skeleton-line is-link" />
                </div>
              </div>
            </div>
            <div class="admin-provider-tile__skeleton-line is-chips" />
          </div>
        </template>

        <div
          v-else-if="!users.length"
          class="admin-console-grid-span"
        >
          <AdminEmptyState
            :message="filters.keyword ? `没有找到与「${filters.keyword}」相关的用户` : '暂无用户数据'"
          />
        </div>

        <template v-else>
          <article
            v-for="user in users"
            :key="user.id"
            class="admin-provider-tile admin-console-card admin-user-card"
            role="button"
            tabindex="0"
            @click="openUserDetail(user)"
            @keydown.enter.prevent="openUserDetail(user)"
          >
            <el-dropdown
              class="admin-provider-tile__menu"
              trigger="click"
              placement="bottom-end"
              :show-arrow="false"
              :popper-options="cardMenuPopperOptions"
              popper-class="admin-provider-card-dropdown"
              @command="(command: string | number | boolean | object) => handleUserCommand(String(command), user)"
              @click.stop
            >
              <button class="admin-provider-tile__more" type="button" aria-label="用户操作" @click.stop>
                <el-icon class="admin-provider-tile__more-icon"><MoreFilled /></el-icon>
              </button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="edit">
                    <span class="admin-provider-menu-item">
                      <el-icon><Edit /></el-icon>
                      <span>编辑</span>
                    </span>
                  </el-dropdown-item>
                  <el-dropdown-item command="membership">
                    <span class="admin-provider-menu-item">
                      <el-icon><Star /></el-icon>
                      <span>调整会员</span>
                    </span>
                  </el-dropdown-item>
                  <el-dropdown-item command="points">
                    <span class="admin-provider-menu-item">
                      <el-icon><Lightning /></el-icon>
                      <span>调整积分</span>
                    </span>
                  </el-dropdown-item>
                  <el-dropdown-item command="reset-login-state">
                    <span class="admin-provider-menu-item">
                      <el-icon><Key /></el-icon>
                      <span>清空登录态</span>
                    </span>
                  </el-dropdown-item>
                  <el-dropdown-item command="membership-orders">
                    <span class="admin-provider-menu-item">
                      <el-icon><Tickets /></el-icon>
                      <span>订阅记录</span>
                    </span>
                  </el-dropdown-item>
                  <el-dropdown-item command="copy-user-id">
                    <span class="admin-provider-menu-item">
                      <el-icon><DocumentCopy /></el-icon>
                      <span>复制用户 ID</span>
                    </span>
                  </el-dropdown-item>
                  <el-dropdown-item v-if="canAssignPlatformAdmin" command="toggle-role">
                    <span class="admin-provider-menu-item">
                      <el-icon><User /></el-icon>
                      <span>{{ user.role === 'ADMIN' ? '设为成员' : '设为管理员' }}</span>
                    </span>
                  </el-dropdown-item>
                  <el-dropdown-item command="copy-display-no">
                    <span class="admin-provider-menu-item">
                      <el-icon><Coin /></el-icon>
                      <span>复制用户编号</span>
                    </span>
                  </el-dropdown-item>
                  <el-dropdown-item command="detail">
                    <span class="admin-provider-menu-item">
                      <el-icon><Tickets /></el-icon>
                      <span>查看详情</span>
                    </span>
                  </el-dropdown-item>
                  <el-dropdown-item command="delete" class="is-danger" divided>
                    <span class="admin-provider-menu-item">
                      <el-icon><Delete /></el-icon>
                      <span>删除</span>
                    </span>
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>

            <div class="admin-provider-tile__header">
              <div class="admin-provider-tile__brand">
                <div class="admin-provider-avatar admin-provider-avatar--interactive">
                  <img
                    v-if="user.avatarUrl"
                    :src="user.avatarUrl"
                    :alt="user.name || '用户头像'"
                    class="admin-provider-avatar__logo"
                  >
                  <span v-else>{{ getUserInitial(user.name || user.maskedEmail || user.maskedPhone || 'U') }}</span>
                  <div class="admin-provider-avatar__overlay" @click.stop>
                    <el-switch
                      :model-value="user.status === 'ACTIVE'"
                      size="small"
                      :loading="togglingUserId === user.id"
                      @change="(value: string | number | boolean) => handleUserStatusChange(user, value)"
                    />
                  </div>
                </div>
                <div class="admin-provider-tile__meta admin-user-card__meta">
                  <div class="admin-user-card__name-row">
                    <span class="admin-provider-tile__title">{{ user.name || '未命名用户' }}</span>
                    <span v-if="getUserSecondaryLabel(user)" class="admin-user-card__username">
                      ({{ getUserSecondaryLabel(user) }})
                    </span>
                  </div>
                  <div class="admin-user-card__id-line" @click.stop>
                    <span>{{ buildUserDisplayNo(user.id) }}</span>
                    <button
                      class="admin-user-card__copy"
                      type="button"
                      title="复制用户编号"
                      @click="copyText(buildUserDisplayNo(user.id), '用户编号已复制')"
                    >
                      <el-icon><DocumentCopy /></el-icon>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div class="admin-provider-tile__badges">
              <span
                class="admin-provider-status"
                :class="getUserStatusToneClass(user.status)"
              >
                {{ user.status === 'ACTIVE' ? '正常' : getUserStatusLabel(user.status) }}
              </span>
              <span
                class="admin-provider-type"
                :class="getUserRoleToneClass(user.role)"
              >
                {{ getUserRoleLabel(user.role) }}
              </span>
              <span
                v-if="user.activeSubscription?.level?.name"
                class="admin-provider-type is-membership admin-user-card__membership"
              >
                <el-icon><Star /></el-icon>
                {{ user.activeSubscription.level.name }}
              </span>
            </div>

            <div class="admin-user-card__created">
              <el-icon><Clock /></el-icon>
              创建于 {{ formatDate(user.createdAt) }}
            </div>
          </article>
        </template>
      </div>

      <template #pagination>
        <AdminPagination
          v-model:page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="USER_PAGE_SIZES"
          :disabled="loading"
          @change="handlePaginationChange"
        />
      </template>
    </AdminListFrame>

    <el-drawer
      v-model="detailVisible"
      title="用户详情"
      size="860px"
      destroy-on-close
      class="admin-user-detail-drawer"
    >
      <div v-if="detailLoading" class="admin-empty">正在加载用户详情...</div>
      <div v-else-if="selectedUserDetail" class="admin-user-drawer">
        <div class="admin-user-profile-hero">
          <div class="admin-user-profile-hero__identity">
            <div class="admin-user-card__avatar admin-user-card__avatar--drawer">
              <img v-if="selectedUserDetail.avatarUrl" :src="selectedUserDetail.avatarUrl" :alt="selectedUserDetail.name || '用户头像'" class="admin-user-card__avatar-image">
              <div v-else class="admin-user-card__avatar-fallback">{{ getUserInitial(selectedUserDetail.name || selectedUserDetail.maskedEmail || selectedUserDetail.maskedPhone || 'U') }}</div>
            </div>
            <div class="admin-user-profile-hero__main">
              <div class="admin-user-drawer__title-row">
                <h3 class="admin-user-drawer__title">{{ selectedUserDetail.name || '未命名用户' }}</h3>
                <AdminStatusBadge category="userStatus" :value="selectedUserDetail.status" />
                <AdminStatusBadge category="userRole" :value="selectedUserDetail.role" />
              </div>
              <div class="admin-user-profile-hero__meta">{{ buildUserDisplayNo(selectedUserDetail.id) }} · {{ selectedUserDetail.maskedEmail || selectedUserDetail.maskedPhone || '未绑定登录标识' }}</div>
              <div class="admin-user-profile-hero__id">{{ selectedUserDetail.id }}</div>
            </div>
          </div>
          <div class="admin-user-profile-hero__actions">
            <button class="admin-button admin-button--secondary" type="button" @click="openEditDialog(selectedUserDetail)">编辑资料</button>
            <button class="admin-button admin-button--secondary" type="button" @click="openMembershipDialog(selectedUserDetail)">调整会员</button>
            <button class="admin-button admin-button--secondary" type="button" @click="openPointDialog(selectedUserDetail)">调整积分</button>
          </div>
        </div>

        <div class="admin-user-profile-metrics">
          <div class="admin-user-profile-metric">
            <span>当前积分</span>
            <strong>{{ selectedUserDetail.currentPointBalance }}</strong>
          </div>
          <div class="admin-user-profile-metric">
            <span>有效会话</span>
            <strong>{{ selectedUserDetail.sessionCount }}</strong>
          </div>
          <div class="admin-user-profile-metric">
            <span>认证身份</span>
            <strong>{{ selectedUserDetail.verifiedAuthIdentityCount }}/{{ selectedUserDetail.authIdentityCount }}</strong>
          </div>
          <div class="admin-user-profile-metric">
            <span>资源资产</span>
            <strong>{{ selectedUserDetail.assetCount }}</strong>
          </div>
          <div class="admin-user-profile-metric">
            <span>生成记录</span>
            <strong>{{ selectedUserDetail.generationRecordCount }}</strong>
          </div>
        </div>

        <div class="admin-user-profile-grid">
          <div class="admin-card admin-card--drawer admin-user-profile-card">
            <div class="admin-card__header">
              <div>
                <h4 class="admin-card__title">账号信息</h4>
                <div class="admin-card__desc">来自 app_users 的基础资料、状态和生命周期字段。</div>
              </div>
            </div>
            <div class="admin-card__content admin-user-drawer__content">
              <div class="admin-user-drawer__field">
                <span class="admin-user-drawer__field-label">昵称</span>
                <strong class="admin-user-drawer__field-value">{{ selectedUserDetail.name || '未命名用户' }}</strong>
              </div>
              <div class="admin-user-drawer__field">
                <span class="admin-user-drawer__field-label">邮箱</span>
                <strong class="admin-user-drawer__field-value">{{ selectedUserDetail.maskedEmail || '未绑定邮箱' }}</strong>
              </div>
              <div class="admin-user-drawer__field">
                <span class="admin-user-drawer__field-label">手机号</span>
                <strong class="admin-user-drawer__field-value">{{ selectedUserDetail.maskedPhone || '未绑定手机号' }}</strong>
              </div>
              <div class="admin-user-drawer__field">
                <span class="admin-user-drawer__field-label">账号角色</span>
                <strong class="admin-user-drawer__field-value">{{ selectedUserDetail.role === 'ADMIN' ? '管理员' : '成员' }}</strong>
              </div>
              <div class="admin-user-drawer__field">
                <span class="admin-user-drawer__field-label">账号状态</span>
                <strong class="admin-user-drawer__field-value">{{ getUserStatusLabel(selectedUserDetail.status) }}</strong>
              </div>
              <div class="admin-user-drawer__field">
                <span class="admin-user-drawer__field-label">创建时间</span>
                <strong class="admin-user-drawer__field-value">{{ formatDate(selectedUserDetail.createdAt) }}</strong>
              </div>
              <div class="admin-user-drawer__field">
                <span class="admin-user-drawer__field-label">最近更新时间</span>
                <strong class="admin-user-drawer__field-value">{{ formatDate(selectedUserDetail.updatedAt) }}</strong>
              </div>
            </div>
          </div>

          <div class="admin-card admin-card--drawer admin-user-profile-card">
            <div class="admin-card__header">
              <div>
                <h4 class="admin-card__title">会员权益</h4>
                <div class="admin-card__desc">来自 user_subscriptions 与 membership_orders 的当前权益。</div>
              </div>
            </div>
            <div class="admin-card__content admin-user-drawer__content">
              <template v-if="selectedUserDetail.activeSubscription">
                <div class="admin-user-drawer__field">
                  <span class="admin-user-drawer__field-label">会员等级</span>
                  <strong class="admin-user-drawer__field-value">
                    {{ selectedUserDetail.activeSubscription.level?.name || '未命名等级' }}
                    <template v-if="selectedUserDetail.activeSubscription.level?.level">· Lv.{{ selectedUserDetail.activeSubscription.level.level }}</template>
                  </strong>
                </div>
                <div class="admin-user-drawer__field">
                  <span class="admin-user-drawer__field-label">订阅状态</span>
                  <strong class="admin-user-drawer__field-value">{{ selectedUserDetail.activeSubscription.status }}</strong>
                </div>
                <div class="admin-user-drawer__field">
                  <span class="admin-user-drawer__field-label">开始时间</span>
                  <strong class="admin-user-drawer__field-value">{{ formatDate(selectedUserDetail.activeSubscription.startTime) }}</strong>
                </div>
                <div class="admin-user-drawer__field">
                  <span class="admin-user-drawer__field-label">结束时间</span>
                  <strong class="admin-user-drawer__field-value">{{ formatDate(selectedUserDetail.activeSubscription.endTime) }}</strong>
                </div>
                <div class="admin-user-drawer__field">
                  <span class="admin-user-drawer__field-label">月赠积分</span>
                  <strong class="admin-user-drawer__field-value">{{ selectedUserDetail.activeSubscription.level?.monthlyBonusPoints ?? 0 }}</strong>
                </div>
                <div class="admin-user-drawer__field">
                  <span class="admin-user-drawer__field-label">订阅来源</span>
                  <strong class="admin-user-drawer__field-value">{{ selectedUserDetail.activeSubscription.order?.sourceType || '后台调整' }}</strong>
                </div>
              </template>
              <div v-else class="admin-empty admin-empty--inline">当前暂无有效订阅。</div>
            </div>
          </div>
        </div>

        <div class="admin-user-profile-grid">
          <div class="admin-card admin-card--drawer admin-user-profile-card">
            <div class="admin-card__header">
              <div>
                <h4 class="admin-card__title">内容沉淀</h4>
                <div class="admin-card__desc">资源发布审核与生成任务状态，用于判断创作活跃和风险。</div>
              </div>
            </div>
            <div class="admin-card__content">
              <div class="admin-user-profile-breakdown">
                <div><span>已发布</span><strong>{{ selectedUserDetail.assetBreakdown.published }}</strong></div>
                <div><span>草稿</span><strong>{{ selectedUserDetail.assetBreakdown.draft }}</strong></div>
                <div><span>待审核</span><strong>{{ selectedUserDetail.assetBreakdown.pendingReview }}</strong></div>
                <div><span>审核通过</span><strong>{{ selectedUserDetail.assetBreakdown.approved }}</strong></div>
                <div><span>生成成功</span><strong>{{ selectedUserDetail.generationBreakdown.completed }}</strong></div>
                <div><span>生成失败</span><strong>{{ selectedUserDetail.generationBreakdown.failed }}</strong></div>
              </div>
            </div>
          </div>

          <div class="admin-card admin-card--drawer admin-user-profile-card">
            <div class="admin-card__header">
              <div>
                <h4 class="admin-card__title">最近会话</h4>
                <div class="admin-card__desc">来自 app_sessions 的登录方式、IP、有效期与活跃时间。</div>
              </div>
              <button class="admin-button admin-button--secondary" type="button" @click="handleResetLoginState(selectedUserDetail)">清空登录态</button>
            </div>
            <div class="admin-card__content">
              <div v-if="!selectedUserDetail.recentSessions.length" class="admin-empty admin-empty--inline">暂无会话记录。</div>
              <div v-else class="admin-user-timeline">
                <div v-for="session in selectedUserDetail.recentSessions" :key="session.id" class="admin-user-timeline__item">
                  <div>
                    <div class="admin-user-timeline__title">{{ getAuthMethodLabel(session.authMethodType) }} · {{ session.ipAddress || '未知 IP' }}</div>
                    <div class="admin-user-timeline__meta">{{ session.identifierSnapshot || '无登录标识快照' }}</div>
                  </div>
                  <div class="admin-user-timeline__side">
                    <span class="admin-status" :class="session.revokedAt ? 'admin-status--danger' : 'admin-status--success'">{{ session.revokedAt ? '已失效' : '有效' }}</span>
                    <span>{{ formatDate(session.lastActiveAt || session.createdAt) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="admin-card admin-card--drawer">
          <div class="admin-card__header">
            <div>
              <h4 class="admin-card__title">登录身份</h4>
              <div class="admin-card__desc">来自 app_user_auth_identities，展示验证码和 OAuth 身份绑定。</div>
            </div>
          </div>
          <div class="admin-card__content">
            <div v-if="!selectedUserDetail.authIdentities.length" class="admin-empty admin-empty--inline">该用户暂未绑定登录身份。</div>
            <div v-else class="admin-user-identity-list">
              <div v-for="identity in selectedUserDetail.authIdentities" :key="identity.id" class="admin-user-identity-item">
                <div>
                  <div class="admin-user-identity-item__title">{{ getAuthMethodLabel(identity.methodType) }}</div>
                  <div class="admin-user-identity-item__meta">{{ identity.identifier }}</div>
                </div>
                <div class="admin-user-identity-item__side">
                  <span class="admin-status" :class="identity.isVerified ? 'admin-status--success' : 'admin-status--warning'">
                    {{ identity.isVerified ? '已验证' : '未验证' }}
                  </span>
                  <span class="admin-user-identity-item__meta">{{ formatDate(identity.verifiedAt || identity.createdAt) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="admin-card admin-card--drawer">
          <div class="admin-card__header">
            <div>
              <h4 class="admin-card__title">积分流水</h4>
              <div class="admin-card__desc">展示最近 8 条 point_account_logs，用于核对后台调整、充值和权益赠送。</div>
            </div>
          </div>
          <div class="admin-card__content">
            <div v-if="!selectedUserDetail.recentPointLogs.length" class="admin-empty admin-empty--inline">暂无积分流水。</div>
            <div v-else class="admin-user-timeline">
              <div v-for="item in selectedUserDetail.recentPointLogs" :key="item.id" class="admin-user-timeline__item">
                <div>
                  <div class="admin-user-timeline__title">{{ getPointActionLabel(item.action) }} {{ item.changeAmount }} 积分 · 余额 {{ item.balanceAfter }}</div>
                  <div class="admin-user-timeline__meta">{{ item.accountNo }} · {{ item.sourceType }}<template v-if="item.remark"> · {{ item.remark }}</template></div>
                </div>
                <div class="admin-user-timeline__side">
                  <span class="admin-status" :class="item.action === 'DECREASE' ? 'admin-status--warning' : 'admin-status--success'">{{ item.changeType }}</span>
                  <span>{{ formatDate(item.createdAt) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="admin-card admin-card--drawer">
          <div class="admin-card__header">
            <div>
              <h4 class="admin-card__title">最近订阅记录</h4>
              <div class="admin-card__desc">展示最近 10 条会员订单，用于快速核对后台调整与订阅变化。</div>
            </div>
            <button class="admin-button admin-button--secondary" type="button" @click="openMembershipOrdersDialogByDetail">查看全部</button>
          </div>
          <div class="admin-card__content">
            <div v-if="!selectedUserDetail.membershipOrders.length" class="admin-empty admin-empty--inline">暂无订阅记录。</div>
            <div v-else class="admin-user-order-list">
              <div v-for="item in selectedUserDetail.membershipOrders.slice(0, 5)" :key="item.id" class="admin-user-order-item">
                <div>
                  <div class="admin-user-order-item__title">{{ item.level?.name || '会员等级' }}<template v-if="item.plan?.name"> · {{ item.plan.name }}</template></div>
                  <div class="admin-user-order-item__meta">{{ item.orderNo }} · {{ item.sourceType }} · {{ item.status }}</div>
                </div>
                <div class="admin-user-order-item__side">
                  <div class="admin-user-order-item__meta">{{ formatDate(item.createdAt) }}</div>
                  <div class="admin-user-order-item__meta">{{ formatMoney(item.paidAmount) }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="admin-card admin-card--drawer">
          <div class="admin-card__header">
            <div>
              <h4 class="admin-card__title">运营动作</h4>
              <div class="admin-card__desc">支持编辑资料、调整会员和积分、清空登录态以及复制用户标识。</div>
            </div>
          </div>
          <div class="admin-card__content admin-user-drawer__actions">
            <button class="admin-button admin-button--secondary" type="button" @click="openEditDialog(selectedUserDetail)">编辑</button>
            <button class="admin-button admin-button--secondary" type="button" @click="openMembershipDialog(selectedUserDetail)">调整会员</button>
            <button class="admin-button admin-button--secondary" type="button" @click="openPointDialog(selectedUserDetail)">调整积分</button>
            <button class="admin-button admin-button--secondary" type="button" @click="handleResetLoginState(selectedUserDetail)">清空登录态</button>
            <button class="admin-button admin-button--secondary" type="button" @click="copyText(selectedUserDetail.id, '用户 ID 已复制')">复制用户 ID</button>
            <button class="admin-button admin-button--secondary" type="button" @click="copyText(buildUserDisplayNo(selectedUserDetail.id), '用户编号已复制')">复制用户编号</button>
          </div>
        </div>
      </div>
    </el-drawer>

    <AdminDialog
      :visible="editDialogVisible"
      :title="isCreateMode ? '创建用户' : '编辑用户'"
      :description="isCreateMode ? '添加一个新的系统用户' : '修改用户的基本信息'"
      panel-class="admin-console-dialog admin-console-dialog--form admin-user-form-dialog"
      :close-disabled="submitting"
      @close="closeEditDialog"
    >
      <form
        class="admin-form admin-dialog__body admin-console-dialog__body admin-console-dialog__form admin-user-form-dialog__form"
        @submit.prevent="handleSubmitEdit"
      >
        <div class="admin-user-form-dialog__top">
          <div class="admin-form__field">
            <label class="admin-form__label">头像地址</label>
            <input
              v-model.trim="editForm.avatarUrl"
              class="admin-input admin-user-form-dialog__avatar"
              type="text"
              placeholder="https://..."
              autocomplete="off"
            >
          </div>
          <div class="admin-form__field">
            <label class="admin-form__label">启用状态</label>
            <div class="admin-radio-group admin-user-form-dialog__status-group">
              <label class="admin-radio-item">
                <input v-model="editForm.status" value="ACTIVE" type="radio">
                <span>启用</span>
              </label>
              <label class="admin-radio-item">
                <input v-model="editForm.status" value="DISABLED" type="radio">
                <span>禁用</span>
              </label>
              <label v-if="!isCreateMode || editForm.status === 'ANONYMOUS'" class="admin-radio-item">
                <input v-model="editForm.status" value="ANONYMOUS" type="radio">
                <span>匿名</span>
              </label>
            </div>
          </div>
        </div>

        <div class="admin-form__field">
          <label class="admin-form__label">昵称</label>
          <input v-model.trim="editForm.name" class="admin-input" type="text" placeholder="请输入昵称（可选）" autocomplete="off">
        </div>

        <div class="admin-form__field">
          <label class="admin-form__label">角色</label>
          <select v-model="editForm.role" class="admin-input" :disabled="!canAssignPlatformAdmin && editForm.role === 'ADMIN'">
            <option value="USER">成员</option>
            <option v-if="canAssignPlatformAdmin || editForm.role === 'ADMIN'" value="ADMIN">管理员</option>
          </select>
          <p v-if="!canAssignPlatformAdmin" class="admin-form__hint">仅平台管理员可调整平台管理员角色</p>
        </div>

        <div v-if="!isCreateMode" class="admin-form__field">
          <label class="admin-form__label">积分余额</label>
          <div class="admin-user-form-dialog__addon-field">
            <input
              class="admin-input"
              type="text"
              :value="String(editPointBalance)"
              disabled
              readonly
            >
            <button
              class="admin-icon-button"
              type="button"
              title="调整积分"
              @click="openPointDialogFromEdit"
            >
              <el-icon><Edit /></el-icon>
            </button>
          </div>
        </div>

        <div class="admin-form__grid admin-user-form-dialog__grid">
          <div class="admin-form__field">
            <label class="admin-form__label">邮箱</label>
            <input v-model.trim="editForm.email" class="admin-input" type="email" placeholder="请输入邮箱（可选）" autocomplete="off">
            <div v-if="isCreateMode" class="admin-form__hint">创建时绑定邮箱验证码登录身份（与手机号至少填一项）</div>
          </div>
          <div class="admin-form__field">
            <label class="admin-form__label">手机号</label>
            <input v-model.trim="editForm.phone" class="admin-input" type="text" placeholder="请输入手机号（可选）" autocomplete="off">
            <div v-if="isCreateMode" class="admin-form__hint">创建时绑定手机验证码登录身份（与邮箱至少填一项）</div>
          </div>
        </div>

        <div v-if="!isCreateMode" class="admin-form__field">
          <label class="admin-form__label">订阅会员</label>
          <div class="admin-user-form-dialog__membership">
            <div class="admin-user-form-dialog__membership-copy">
              <div class="admin-user-form-dialog__membership-title">{{ editMembershipLabel }}</div>
              <div class="admin-user-form-dialog__membership-meta">有效期至：{{ editMembershipEndLabel }}</div>
            </div>
            <button
              class="admin-icon-button"
              type="button"
              title="调整会员"
              @click="openMembershipDialogFromEdit"
            >
              <el-icon><Edit /></el-icon>
            </button>
          </div>
        </div>

        <div class="admin-dialog__footer admin-form__footer admin-console-dialog__footer admin-user-form-dialog__footer">
          <button class="admin-button admin-button--secondary" type="button" :disabled="submitting" @click="closeEditDialog">取消</button>
          <button class="admin-button admin-button--primary" type="submit" :disabled="submitting">
            {{ submitting ? (isCreateMode ? '创建中...' : '保存中...') : (isCreateMode ? '创建' : '保存') }}
          </button>
        </div>
      </form>
    </AdminDialog>

    <AdminDialog
      :visible="pointDialogVisible"
      title="调整积分"
      description="直接增加或扣减用户个人积分，变更会记入统一积分流水。团队积分请到「团队管理」。"
      panel-class="admin-dialog--provider-form admin-user-manage-dialog"
      @close="closePointDialog"
    >
        <form class="admin-dialog__body admin-form" @submit.prevent="handleSubmitPointAdjust">
          <div class="admin-user-dialog-hero">
            <span class="admin-chip">积分账本</span>
            <span class="admin-user-dialog-hero__text">直接写入统一积分流水，并实时刷新当前余额。</span>
          </div>
          <div class="admin-user-balance-preview">
            <div class="admin-user-balance-preview__item">
              <span class="admin-user-balance-preview__label">当前余额</span>
              <strong class="admin-user-balance-preview__value">{{ pointCurrentBalance }}</strong>
            </div>
            <div class="admin-user-balance-preview__arrow">→</div>
            <div class="admin-user-balance-preview__item">
              <span class="admin-user-balance-preview__label">调整后</span>
              <strong class="admin-user-balance-preview__value admin-user-balance-preview__value--active">{{ pointPreviewBalance }}</strong>
            </div>
          </div>
          <div class="admin-form__grid">
            <div class="admin-form__field">
              <label class="admin-form__label">调整方向</label>
              <div class="admin-user-option-grid admin-user-option-grid--two">
                <button
                  class="admin-user-option-card"
                  :class="{ 'is-active': pointForm.action === 'INCREASE' }"
                  type="button"
                  @click="pointForm.action = 'INCREASE'"
                >
                  <span class="admin-user-option-card__title">增加积分</span>
                  <span class="admin-user-option-card__desc">用于活动补发、人工奖励等场景</span>
                </button>
                <button
                  class="admin-user-option-card"
                  :class="{ 'is-active': pointForm.action === 'DECREASE' }"
                  type="button"
                  @click="pointForm.action = 'DECREASE'"
                >
                  <span class="admin-user-option-card__title">扣减积分</span>
                  <span class="admin-user-option-card__desc">用于异常回收或人工修正场景</span>
                </button>
              </div>
            </div>
            <div class="admin-form__field">
              <label class="admin-form__label">调整数量</label>
              <input v-model.number="pointForm.changeAmount" class="admin-input" type="number" min="1" placeholder="请输入调整积分">
            </div>
            <div class="admin-form__field admin-form__field--full">
              <label class="admin-form__label">备注</label>
              <textarea v-model.trim="pointForm.remark" class="admin-textarea" rows="4" placeholder="请输入调整原因，例如：活动补发积分"></textarea>
            </div>
          </div>
          <AdminFormActions
            submit-text="确认调整"
            submitting-text="处理中..."
            :submitting="submitting"
            @cancel="closePointDialog"
          />
        </form>
    </AdminDialog>

    <AdminDialog
      :visible="membershipDialogVisible"
      title="调整会员"
      description="直接为用户发放会员权益，并可同步赠送积分。"
      panel-class="admin-dialog--provider-form admin-user-manage-dialog"
      @close="closeMembershipDialog"
    >
        <form class="admin-dialog__body admin-form" @submit.prevent="handleSubmitMembershipAdjust">
          <div class="admin-user-dialog-hero">
            <span class="admin-chip">会员发放</span>
            <span class="admin-user-dialog-hero__text">沿用系统会员等级与订单模型，避免后台另起一套规则。</span>
          </div>
          <div class="admin-user-dialog-summary">
            <div class="admin-user-dialog-summary__item">
              <span class="admin-user-dialog-summary__label">当前用户</span>
              <strong class="admin-user-dialog-summary__value">{{ currentMembershipUserDisplayName }}</strong>
            </div>
            <div class="admin-user-dialog-summary__item">
              <span class="admin-user-dialog-summary__label">当前等级</span>
              <strong class="admin-user-dialog-summary__value">{{ currentMembershipLevelLabel }}</strong>
            </div>
          </div>
          <div class="admin-form__grid">
            <div class="admin-form__field admin-form__field--full">
              <label class="admin-form__label">会员等级</label>
              <div class="admin-user-option-grid">
                <button
                  v-for="item in membershipLevels"
                  :key="item.id"
                  class="admin-user-option-card"
                  :class="{ 'is-active': membershipForm.levelId === item.id }"
                  type="button"
                  @click="membershipForm.levelId = item.id"
                >
                  <span class="admin-user-option-card__title">{{ item.name }} · Lv.{{ item.level }}</span>
                  <span class="admin-user-option-card__desc">
                    每月赠送 {{ item.monthlyBonusPoints }} 积分
                    <template v-if="item.description"> · {{ item.description }}</template>
                  </span>
                </button>
              </div>
            </div>
            <div class="admin-form__field admin-form__field--full">
              <label class="admin-form__label">快捷时长</label>
              <div class="admin-user-duration-presets">
                <button
                  v-for="preset in membershipDurationPresets"
                  :key="preset.label"
                  class="admin-user-duration-presets__item"
                  :class="{ 'is-active': membershipForm.durationValue === preset.value && membershipForm.durationUnit === preset.unit }"
                  type="button"
                  @click="applyMembershipDurationPreset(preset.value, preset.unit)"
                >
                  {{ preset.label }}
                </button>
              </div>
            </div>
            <div class="admin-form__field">
              <label class="admin-form__label">时长数值</label>
              <input v-model.number="membershipForm.durationValue" class="admin-input" type="number" min="1" placeholder="请输入时长">
            </div>
            <div class="admin-form__field">
              <label class="admin-form__label">时长单位</label>
              <select v-model="membershipForm.durationUnit" class="admin-input">
                <option value="DAY">天</option>
                <option value="MONTH">月</option>
                <option value="YEAR">年</option>
              </select>
            </div>
            <div class="admin-form__field">
              <label class="admin-form__label">赠送积分</label>
              <input v-model.number="membershipForm.bonusPoints" class="admin-input" type="number" min="0" placeholder="可选">
            </div>
            <div class="admin-form__field">
              <label class="admin-form__label">发放预览</label>
              <div class="admin-user-membership-preview">
                <div class="admin-user-membership-preview__title">{{ selectedMembershipLevel?.name || '请选择会员等级' }}</div>
                <div class="admin-user-membership-preview__meta">
                  {{ membershipForm.durationValue }} {{ resolveDurationUnitLabel(membershipForm.durationUnit) }}
                  <template v-if="membershipForm.bonusPoints"> · 赠送 {{ membershipForm.bonusPoints }} 积分</template>
                </div>
              </div>
            </div>
            <div class="admin-form__field admin-form__field--full">
              <label class="admin-form__label">备注</label>
              <textarea v-model.trim="membershipForm.remark" class="admin-textarea" rows="4" placeholder="请输入会员发放备注"></textarea>
            </div>
          </div>
          <AdminFormActions
            submit-text="确认发放"
            submitting-text="处理中..."
            :submitting="submitting"
            @cancel="closeMembershipDialog"
          />
        </form>
    </AdminDialog>

    <AdminDialog
      :visible="membershipOrdersDialogVisible"
      title="订阅记录"
      description="查看该用户的会员订单历史与后台调整记录。"
      panel-class="admin-dialog--provider-form admin-user-manage-dialog admin-user-manage-dialog--wide"
      @close="closeMembershipOrdersDialog"
    >
        <div class="admin-dialog__body admin-form">
          <div class="admin-user-dialog-hero">
            <span class="admin-chip">订阅记录</span>
            <span class="admin-user-dialog-hero__text">按时间倒序查看该用户的会员订单与后台调整记录。</span>
          </div>
          <div class="admin-user-dialog-summary">
            <div class="admin-user-dialog-summary__item">
              <span class="admin-user-dialog-summary__label">记录总数</span>
              <strong class="admin-user-dialog-summary__value">{{ membershipOrders.length }}</strong>
            </div>
            <div class="admin-user-dialog-summary__item">
              <span class="admin-user-dialog-summary__label">最近来源</span>
              <strong class="admin-user-dialog-summary__value">{{ membershipOrders[0]?.sourceType || '暂无' }}</strong>
            </div>
          </div>
          <div v-if="membershipOrdersLoading" class="admin-empty admin-empty--inline">正在加载订阅记录...</div>
          <div v-else-if="!membershipOrders.length" class="admin-empty admin-empty--inline">暂无订阅记录。</div>
          <div v-else class="admin-user-order-list admin-user-order-list--dialog">
            <div v-for="item in membershipOrders" :key="item.id" class="admin-user-order-item">
              <div>
                <div class="admin-user-order-item__title">{{ item.level?.name || '会员等级' }}<template v-if="item.plan?.name"> · {{ item.plan.name }}</template></div>
                <div class="admin-user-order-item__meta">{{ item.orderNo }} · {{ item.sourceType }} · {{ item.status }}</div>
                <div class="admin-user-order-item__meta">开始 {{ formatDate(item.startTime) }} · 结束 {{ formatDate(item.endTime) }}</div>
              </div>
              <div class="admin-user-order-item__side">
                <div class="admin-user-order-item__meta">支付 {{ formatMoney(item.paidAmount) }}</div>
                <div class="admin-user-order-item__meta">赠送 {{ item.bonusPoints }} 积分</div>
                <div class="admin-user-order-item__meta">{{ formatDate(item.createdAt) }}</div>
              </div>
            </div>
          </div>
          <div class="admin-form__footer">
            <button class="admin-button admin-button--secondary" type="button" @click="closeMembershipOrdersDialog">关闭</button>
          </div>
        </div>
    </AdminDialog>
  </AdminPageContainer>
</template>

<script setup lang="ts">
defineOptions({ name: 'AdminUsers' })
import './admin-users.css'
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Clock, Coin, Delete, DocumentCopy, Edit, Key, Lightning, MoreFilled, Star, Tickets, User } from '@element-plus/icons-vue'
import AdminListFrame from '@/components/admin/common/AdminListFrame.vue'
import AdminListToolbar from '@/components/admin/common/AdminListToolbar.vue'
import AdminEmptyState from '@/components/admin/common/AdminEmptyState.vue'
import AdminDialog from '@/components/admin/common/AdminDialog.vue'
import AdminFormActions from '@/components/admin/common/AdminFormActions.vue'
import AdminPagination from '@/components/admin/common/AdminPagination.vue'
import AdminStatusBadge from '@/components/admin/common/AdminStatusBadge.vue'
import AdminPageContainer from '@/components/admin/layout/AdminPageContainer.vue'
import { useAdminConfirm } from '@/composables/admin/useAdminConfirm'
import { useAdminListFilters } from '@/composables/useAdminListFilters'
import { useAuthStore } from '@/stores/auth'
import {
  adjustAdminUserMembership,
  adjustAdminUserPoints,
  createAdminUser,
  deleteAdminUser,
  getAdminUserDetail,
  listAdminUserMembershipOrders,
  listAdminUsers,
  resetAdminUserLoginState,
  updateAdminUserProfile,
  updateAdminUserRole,
  type AdminUserDetail,
  type AdminUserItem,
  type AdminUserMembershipOrderItem,
  type ListAdminUsersOptions,
} from '@/api/admin-users'
import { listMembershipLevels, type MembershipLevelItem } from '@/api/admin-marketing'
import {
  USER_PAGE_SIZES,
  membershipDurationPresets,
  cardMenuPopperOptions,
  roleFacetOptions,
  statusFacetOptions,
  getUserInitial,
  buildUserDisplayNo,
  getUserSecondaryLabel,
  getUserStatusLabel,
  getUserRoleLabel,
  getUserStatusToneClass,
  getUserRoleToneClass,
  getAuthMethodLabel,
  getPointActionLabel,
  resolveDurationUnitLabel,
  formatDate,
  formatMoney,
} from './composables/admin-users.presentation'

const authStore = useAuthStore()
/** 仅平台 ADMIN 可提升 UserRole=ADMIN；CM auth 返回 ComputedRef，需 .value */
const canAssignPlatformAdmin = computed(() => authStore.isAdmin.value)

const loading = ref(false)
const submitting = ref(false)
const detailLoading = ref(false)
const membershipOrdersLoading = ref(false)
const updatingId = ref('')
const togglingUserId = ref('')
const users = ref<AdminUserItem[]>([])
const membershipLevels = ref<MembershipLevelItem[]>([])
const detailVisible = ref(false)
const selectedUserDetail = ref<AdminUserDetail | null>(null)
const membershipOrders = ref<AdminUserMembershipOrderItem[]>([])
const selectedUserId = ref('')
const { confirmDanger } = useAdminConfirm()

const editDialogVisible = ref(false)
const editMode = ref<'create' | 'edit'>('edit')
const pointDialogVisible = ref(false)
const membershipDialogVisible = ref(false)
const membershipOrdersDialogVisible = ref(false)
const filters = reactive<ListAdminUsersOptions>({
  keyword: '',
  role: 'ALL',
  status: 'ALL',
})
const filterDefaults: ListAdminUsersOptions = {
  keyword: '',
  role: 'ALL',
  status: 'ALL',
}
const { resetFilters: resetFilterValues } = useAdminListFilters({
  filters,
  defaults: filterDefaults,
})
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
})

const editForm = reactive({
  id: '',
  name: '',
  email: '',
  phone: '',
  avatarUrl: '',
  role: 'USER' as 'USER' | 'ADMIN',
  status: 'ACTIVE' as 'ANONYMOUS' | 'ACTIVE' | 'DISABLED',
})

const pointForm = reactive({
  id: '',
  action: 'INCREASE' as 'INCREASE' | 'DECREASE',
  changeAmount: 0,
  remark: '',
})

const membershipForm = reactive({
  id: '',
  levelId: '',
  durationValue: 1,
  durationUnit: 'MONTH' as 'DAY' | 'MONTH' | 'YEAR',
  bonusPoints: 0,
  remark: '',
})

const listFacets = computed(() => [
  {
    key: 'role',
    title: '角色',
    options: roleFacetOptions,
    modelValue: filters.role || 'ALL',
    emptyValue: 'ALL',
  },
  {
    key: 'status',
    title: '状态',
    options: statusFacetOptions,
    modelValue: filters.status || 'ALL',
    emptyValue: 'ALL',
  },
])

const hasActiveFilters = computed(() => (
  Boolean(filters.keyword?.trim())
  || (filters.role && filters.role !== 'ALL')
  || (filters.status && filters.status !== 'ALL')
))

const handleFacetUpdate = ({ key, value }: { key: string; value: string }) => {
  if (key === 'role') {
    setRole(value as 'ALL' | 'USER' | 'ADMIN')
    return
  }
  if (key === 'status') {
    setStatus(value as 'ALL' | 'ANONYMOUS' | 'ACTIVE' | 'DISABLED')
  }
}

const isCreateMode = computed(() => editMode.value === 'create')
const pointCurrentBalance = computed(() => {
  if (selectedUserDetail.value?.id === pointForm.id) {
    return Number(selectedUserDetail.value.currentPointBalance || 0)
  }
  return 0
})
const pointPreviewBalance = computed(() => {
  const currentBalance = pointCurrentBalance.value
  const amount = Math.max(0, Number(pointForm.changeAmount || 0))
  return pointForm.action === 'DECREASE'
    ? Math.max(0, currentBalance - amount)
    : currentBalance + amount
})
const selectedMembershipLevel = computed(() => {
  return membershipLevels.value.find(item => item.id === membershipForm.levelId) || null
})
const currentMembershipUserDisplayName = computed(() => {
  if (selectedUserDetail.value?.id === membershipForm.id) {
    return selectedUserDetail.value.name || buildUserDisplayNo(selectedUserDetail.value.id)
  }
  const user = users.value.find(item => item.id === membershipForm.id)
  return user?.name || (user ? buildUserDisplayNo(user.id) : '-')
})
const currentMembershipLevelLabel = computed(() => {
  if (selectedUserDetail.value?.id === membershipForm.id && selectedUserDetail.value.activeSubscription?.level?.name) {
    return selectedUserDetail.value.activeSubscription.level.name
  }
  return '普通用户'
})

const editPointBalance = computed(() => {
  if (selectedUserDetail.value?.id === editForm.id) {
    return Number(selectedUserDetail.value.currentPointBalance || 0)
  }
  const user = users.value.find(item => item.id === editForm.id)
  return Number(user?.currentPointBalance || 0)
})

const editMembershipLabel = computed(() => {
  if (selectedUserDetail.value?.id === editForm.id && selectedUserDetail.value.activeSubscription?.level?.name) {
    return selectedUserDetail.value.activeSubscription.level.name
  }
  const user = users.value.find(item => item.id === editForm.id)
  return user?.activeSubscription?.level?.name || '普通用户'
})

const editMembershipEndLabel = computed(() => {
  const endTime = selectedUserDetail.value?.id === editForm.id
    ? selectedUserDetail.value.activeSubscription?.endTime
    : users.value.find(item => item.id === editForm.id)?.activeSubscription?.endTime
  return endTime ? formatDate(endTime) : '--'
})

const loadUsers = async () => {
  loading.value = true
  try {
    const result = await listAdminUsers({
      ...filters,
      page: pagination.page,
      pageSize: pagination.pageSize,
    })
    users.value = result.items
    pagination.page = result.summary.page
    pagination.pageSize = result.summary.pageSize
    pagination.total = result.summary.totalCount
  } finally {
    loading.value = false
  }
}

const loadMembershipLevels = async () => {
  membershipLevels.value = await listMembershipLevels().catch(() => [])
}

const loadUserDetail = async (userId: string) => {
  detailLoading.value = true
  try {
    selectedUserDetail.value = await getAdminUserDetail(userId)
  } finally {
    detailLoading.value = false
  }
}

const ensureUserDetailLoaded = async (userId: string) => {
  if (selectedUserDetail.value?.id === userId) {
    return
  }
  await loadUserDetail(userId)
}

const refreshAfterUserMutation = async (userId = '') => {
  await loadUsers()
  if (detailVisible.value && (userId || selectedUserId.value)) {
    await loadUserDetail(userId || selectedUserId.value)
  }
}

const handleUpdateRole = async (id: string, role: 'USER' | 'ADMIN') => {
  updatingId.value = id
  try {
    await updateAdminUserRole(id, role)
    await refreshAfterUserMutation(id)
  } finally {
    updatingId.value = ''
  }
}

const handleQuickRoleToggle = async (user: AdminUserItem) => {
  await handleUpdateRole(user.id, user.role === 'ADMIN' ? 'USER' : 'ADMIN')
}

const handleUserStatusChange = async (user: AdminUserItem, value: string | number | boolean) => {
  const nextStatus = Boolean(value) ? 'ACTIVE' : 'DISABLED'
  if (user.status === nextStatus) {
    return
  }

  togglingUserId.value = user.id
  try {
    await updateAdminUserProfile(user.id, { status: nextStatus })
    await refreshAfterUserMutation(user.id)
  } finally {
    togglingUserId.value = ''
  }
}

const handleSearch = () => {
  pagination.page = 1
  void loadUsers()
}

const setRole = (role: 'ALL' | 'USER' | 'ADMIN') => {
  if (filters.role === role) {
    return
  }
  filters.role = role
  pagination.page = 1
  void loadUsers()
}

const setStatus = (status: 'ALL' | 'ANONYMOUS' | 'ACTIVE' | 'DISABLED') => {
  if (filters.status === status) {
    return
  }
  filters.status = status
  pagination.page = 1
  void loadUsers()
}

const resetFilters = () => {
  resetFilterValues()
  pagination.page = 1
  void loadUsers()
}

const handlePaginationChange = (payload: { page: number; pageSize: number }) => {
  pagination.page = payload.page
  pagination.pageSize = payload.pageSize
  void loadUsers()
}

const openUserDetail = async (user: AdminUserItem) => {
  selectedUserId.value = user.id
  detailVisible.value = true
  await loadUserDetail(user.id)
}

const handleCreateUser = () => {
  editMode.value = 'create'
  resetEditForm()
  editDialogVisible.value = true
}

const copyText = async (text: string, successMessage: string) => {
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success(successMessage)
  } catch {
    ElMessage.error('复制失败，请检查浏览器剪贴板权限。')
  }
}

const resetEditForm = () => {
  editForm.id = ''
  editForm.name = ''
  editForm.email = ''
  editForm.phone = ''
  editForm.avatarUrl = ''
  editForm.role = 'USER'
  editForm.status = 'ACTIVE'
}

const resetPointForm = () => {
  pointForm.id = ''
  pointForm.action = 'INCREASE'
  pointForm.changeAmount = 0
  pointForm.remark = ''
}

const resetMembershipForm = () => {
  membershipForm.id = ''
  membershipForm.levelId = ''
  membershipForm.durationValue = 1
  membershipForm.durationUnit = 'MONTH'
  membershipForm.bonusPoints = 0
  membershipForm.remark = ''
}

const openEditDialog = async (user: AdminUserItem | AdminUserDetail) => {
  editMode.value = 'edit'
  await ensureUserDetailLoaded(user.id)
  editForm.id = user.id
  editForm.name = user.name || ''
  editForm.email = user.email || ''
  editForm.phone = user.phone || ''
  editForm.avatarUrl = user.avatarUrl || ''
  editForm.role = user.role === 'ADMIN' ? 'ADMIN' : 'USER'
  editForm.status = (user.status === 'DISABLED' || user.status === 'ANONYMOUS' ? user.status : 'ACTIVE') as 'ANONYMOUS' | 'ACTIVE' | 'DISABLED'
  editDialogVisible.value = true
}

const closeEditDialog = () => {
  editDialogVisible.value = false
  editMode.value = 'edit'
  resetEditForm()
}

const openPointDialogFromEdit = async () => {
  if (!editForm.id) {
    return
  }
  await openPointDialog({ id: editForm.id } as AdminUserItem)
}

const openMembershipDialogFromEdit = async () => {
  if (!editForm.id) {
    return
  }
  await openMembershipDialog({ id: editForm.id } as AdminUserItem)
}

const openPointDialog = async (user: AdminUserItem | AdminUserDetail) => {
  await ensureUserDetailLoaded(user.id)
  pointForm.id = user.id
  pointDialogVisible.value = true
}

const closePointDialog = () => {
  pointDialogVisible.value = false
  resetPointForm()
}

const openMembershipDialog = async (user: AdminUserItem | AdminUserDetail) => {
  await ensureUserDetailLoaded(user.id)
  membershipForm.id = user.id
  membershipDialogVisible.value = true
}

const applyMembershipDurationPreset = (value: number, unit: 'DAY' | 'MONTH' | 'YEAR') => {
  membershipForm.durationValue = value
  membershipForm.durationUnit = unit
}

const closeMembershipDialog = () => {
  membershipDialogVisible.value = false
  resetMembershipForm()
}

const openMembershipOrdersDialog = async (user: AdminUserItem | AdminUserDetail) => {
  membershipOrdersDialogVisible.value = true
  selectedUserId.value = user.id
  membershipOrdersLoading.value = true
  try {
    membershipOrders.value = await listAdminUserMembershipOrders(user.id)
  } finally {
    membershipOrdersLoading.value = false
  }
}

const openMembershipOrdersDialogByDetail = async () => {
  if (!selectedUserDetail.value) {
    return
  }
  await openMembershipOrdersDialog(selectedUserDetail.value)
}

const closeMembershipOrdersDialog = () => {
  membershipOrdersDialogVisible.value = false
  membershipOrders.value = []
}

const handleSubmitEdit = async () => {
  if (!isCreateMode.value && !editForm.id) {
    return
  }
  submitting.value = true
  try {
    if (isCreateMode.value) {
      if (editForm.role === 'ADMIN' && !canAssignPlatformAdmin.value) {
        ElMessage.error('仅平台管理员可创建管理员账号')
        return
      }
      const createdUser = await createAdminUser({
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
        avatarUrl: editForm.avatarUrl,
        role: editForm.role,
        status: editForm.status,
      })
      closeEditDialog()
      await refreshAfterUserMutation(createdUser.id)
      selectedUserId.value = createdUser.id
      return
    }

    const targetUserId = editForm.id
    const previousRole = selectedUserDetail.value?.id === targetUserId
      ? selectedUserDetail.value.role
      : users.value.find(item => item.id === targetUserId)?.role

    await updateAdminUserProfile(editForm.id, {
      name: editForm.name,
      email: editForm.email,
      phone: editForm.phone,
      avatarUrl: editForm.avatarUrl,
      status: editForm.status,
    })

    if (previousRole && previousRole !== editForm.role) {
      if (editForm.role === 'ADMIN' && !canAssignPlatformAdmin.value) {
        ElMessage.error('仅平台管理员可将用户设为管理员')
        return
      }
      await updateAdminUserRole(targetUserId, editForm.role)
    }

    closeEditDialog()
    await refreshAfterUserMutation(targetUserId)
  } finally {
    submitting.value = false
  }
}

const handleSubmitPointAdjust = async () => {
  if (!pointForm.id) {
    return
  }
  submitting.value = true
  try {
    await adjustAdminUserPoints(pointForm.id, {
      action: pointForm.action,
      changeAmount: Number(pointForm.changeAmount || 0),
      remark: pointForm.remark,
    })
    closePointDialog()
    await refreshAfterUserMutation(pointForm.id)
  } finally {
    submitting.value = false
  }
}

const handleSubmitMembershipAdjust = async () => {
  if (!membershipForm.id) {
    return
  }
  submitting.value = true
  try {
    await adjustAdminUserMembership(membershipForm.id, {
      levelId: membershipForm.levelId,
      durationValue: Number(membershipForm.durationValue || 1),
      durationUnit: membershipForm.durationUnit,
      bonusPoints: Number(membershipForm.bonusPoints || 0),
      remark: membershipForm.remark,
    })
    closeMembershipDialog()
    await refreshAfterUserMutation(membershipForm.id)
  } finally {
    submitting.value = false
  }
}

const handleDeleteUser = async (user: AdminUserItem | AdminUserDetail) => {
  await confirmDanger({
    title: '删除确认',
    message: `确定删除用户“${user.name || buildUserDisplayNo(user.id)}”吗？该操作不可恢复。`,
    confirmText: '确认删除',
  })
  submitting.value = true
  try {
    await deleteAdminUser(user.id)
    if (selectedUserDetail.value?.id === user.id) {
      detailVisible.value = false
      selectedUserDetail.value = null
    }
    await loadUsers()
  } finally {
    submitting.value = false
  }
}

const handleResetLoginState = async (user: AdminUserItem | AdminUserDetail) => {
  await confirmDanger({
    title: '清空登录态',
    message: `确定清空用户“${user.name || buildUserDisplayNo(user.id)}”的当前登录会话吗？执行后该用户需要重新登录。`,
    confirmText: '确认清空',
  })
  submitting.value = true
  try {
    await resetAdminUserLoginState(user.id)
    await refreshAfterUserMutation(user.id)
  } finally {
    submitting.value = false
  }
}

const handleUserCommand = async (command: string, user: AdminUserItem) => {
  if (command === 'copy-user-id') {
    await copyText(user.id, '用户 ID 已复制')
    return
  }
  if (command === 'copy-display-no') {
    await copyText(buildUserDisplayNo(user.id), '用户编号已复制')
    return
  }
  if (command === 'toggle-role') {
    if (!canAssignPlatformAdmin.value) {
      ElMessage.error('仅平台管理员可调整平台管理员角色')
      return
    }
    await handleQuickRoleToggle(user)
    return
  }
  if (command === 'detail') {
    await openUserDetail(user)
    return
  }
  if (command === 'edit') {
    await openEditDialog(user)
    return
  }
  if (command === 'points') {
    await openPointDialog(user)
    return
  }
  if (command === 'membership') {
    await openMembershipDialog(user)
    return
  }
  if (command === 'membership-orders') {
    await openMembershipOrdersDialog(user)
    return
  }
  if (command === 'reset-login-state') {
    await handleResetLoginState(user)
    return
  }
  if (command === 'delete') {
    await handleDeleteUser(user)
  }
}

onMounted(async () => {
  await Promise.all([
    loadUsers(),
    loadMembershipLevels(),
  ])
})
</script>

<style scoped src="./admin-users.scoped.css"></style>
