<template>
  <AdminPageContainer
    class="admin-list-page"
    title="营销中心"
    description="集中管理会员订阅、积分充值、卡密兑换与奖励规则。"
    compact
  >
    <template #actions>
      <button class="admin-button admin-button--secondary" type="button" :disabled="loading" @click="loadAllData">
        {{ loading ? '刷新中...' : '刷新数据' }}
      </button>
    </template>

    <div class="admin-grid admin-grid--stats admin-marketing-kpis">
      <AdminStatCard label="会员等级" :value="overview?.membership.levelCount ?? levels.length" hint="含免费档与付费档" />
      <AdminStatCard label="会员计划" :value="overview?.membership.planCount ?? plans.length" hint="按周期售卖的订阅商品" />
      <AdminStatCard label="充值套餐" :value="overview?.recharge.packageCount ?? packages.length" hint="积分包与多充多送" />
      <AdminStatCard label="卡密批次" :value="overview?.cdk?.batchCount ?? cardBatches.length" hint="兑换码批次与库存" />
    </div>

    <div class="admin-marketing-shell">
      <nav class="admin-marketing-tabs" role="tablist" aria-label="营销模块">
        <button
          v-for="item in marketingTabs"
          :key="item.key"
          type="button"
          role="tab"
          class="admin-marketing-tabs__item"
          :class="{ 'is-active': activeTool === item.key }"
          :aria-selected="activeTool === item.key"
          @click="activeTool = item.key"
        >
          <span class="admin-marketing-tabs__label">{{ item.title }}</span>
          <span class="admin-marketing-tabs__meta">{{ item.group }} · {{ item.count }}</span>
        </button>
      </nav>

      <div class="admin-marketing-main">
        <div v-if="activeTool === 'membership'" class="admin-marketing-section-shell">
          <div class="admin-marketing-subtabs" role="tablist" aria-label="会员配置">
            <button
              type="button"
              role="tab"
              class="admin-marketing-subtabs__item"
              :class="{ 'is-active': membershipSubTab === 'levels' }"
              :aria-selected="membershipSubTab === 'levels'"
              @click="membershipSubTab = 'levels'"
            >
              会员等级
              <span>{{ levels.length }}</span>
            </button>
            <button
              type="button"
              role="tab"
              class="admin-marketing-subtabs__item"
              :class="{ 'is-active': membershipSubTab === 'plans' }"
              :aria-selected="membershipSubTab === 'plans'"
              @click="membershipSubTab = 'plans'"
            >
              会员计划
              <span>{{ plans.length }}</span>
            </button>
          </div>

          <AdminListFrame v-if="membershipSubTab === 'levels'">
            <template #toolbar>
              <AdminListToolbar
                :disabled="loading"
                :has-active-filters="Boolean(listKeyword.trim())"
                @clear="clearListKeyword"
              >
                <input
                  v-model.trim="listKeyword"
                  class="admin-list-toolbar__input is-wide"
                  type="text"
                  placeholder="搜索等级名称"
                  :disabled="loading"
                >
                <template #actions>
                  <button class="admin-button admin-button--primary" type="button" @click="openLevelDialog()">新增等级</button>
                </template>
              </AdminListToolbar>
            </template>
            <AdminArtTable :loading="loading" :data="filteredLevels" empty-text="暂无会员等级，请先创建。">
              <el-table-column label="名称" min-width="160">
                <template #default="{ row }">
                  <div class="admin-marketing-table__title">{{ row.name }}</div>
                  <div class="admin-marketing-table__meta">Lv.{{ row.level }} · 容量 {{ row.storageCapacity || 0 }}</div>
                </template>
              </el-table-column>
              <el-table-column label="月赠积分" width="100" align="right">
                <template #default="{ row }">{{ row.monthlyBonusPoints }}</template>
              </el-table-column>
              <el-table-column label="排序" width="72" align="center" prop="sortOrder" />
              <el-table-column label="启用" width="88" align="center">
                <template #default="{ row }">
                  <el-switch
                    :model-value="row.isEnabled"
                    size="small"
                    :disabled="enableTogglingId === row.id"
                    @change="(value: string | number | boolean) => handleToggleLevelEnabled(row, Boolean(value))"
                  />
                </template>
              </el-table-column>
              <el-table-column label="操作" width="140" fixed="right" align="right">
                <template #default="{ row }">
                  <div class="admin-row-actions">
                    <button class="admin-inline-button" type="button" @click="openLevelDialog(row)">编辑</button>
                    <button class="admin-inline-button admin-inline-button--danger" type="button" @click="handleDeleteLevel(row)">删除</button>
                  </div>
                </template>
              </el-table-column>
            </AdminArtTable>
          </AdminListFrame>

          <AdminListFrame v-else>
            <template #toolbar>
              <AdminListToolbar
                :disabled="loading"
                :has-active-filters="Boolean(listKeyword.trim())"
                @clear="clearListKeyword"
              >
                <input
                  v-model.trim="listKeyword"
                  class="admin-list-toolbar__input is-wide"
                  type="text"
                  placeholder="搜索计划名称 / 时长"
                  :disabled="loading"
                >
                <template #actions>
                  <button class="admin-button admin-button--primary" type="button" @click="openPlanDialog()">新增计划</button>
                </template>
              </AdminListToolbar>
            </template>
            <AdminEmptyState v-if="!loading && !levels.length" message="请先创建会员等级，再配置计划。" />
            <div v-else class="admin-marketing-plan-groups">
              <section
                v-for="group in filteredPlanGroups"
                :key="group.key"
                class="admin-marketing-plan-group"
              >
                <header class="admin-marketing-plan-group__head">
                  <div class="admin-marketing-plan-group__identity">
                    <strong class="admin-marketing-plan-group__title">{{ group.title }}</strong>
                    <span v-if="group.levelLabel" class="admin-chip">{{ group.levelLabel }}</span>
                  </div>
                  <div class="admin-marketing-plan-group__meta">
                    <div class="admin-marketing-plan-group__stats">
                      <span>{{ group.plans.length }} 个计划</span>
                      <span>启用 {{ group.enabledCount }}</span>
                    </div>
                  </div>
                </header>
                <AdminArtTable :loading="loading" :data="group.plans" empty-text="该分组暂无计划。">
                  <el-table-column label="计划" min-width="160">
                    <template #default="{ row }">
                      <div class="admin-marketing-table__title">{{ row.name }}</div>
                      <div class="admin-marketing-plan-card__sub">
                        <span>{{ row.durationValue }} {{ getDurationUnitLabel(row.durationUnit) }}</span>
                        <span v-if="row.label" class="admin-chip">{{ row.label }}</span>
                      </div>
                    </template>
                  </el-table-column>
                  <el-table-column label="售价" min-width="140" align="right">
                    <template #default="{ row }">
                      <div class="admin-marketing-table__title">{{ getPlanBillingSummary(row.billingRules) }}</div>
                      <div
                        v-if="row.originalPrice !== null && row.originalPrice !== undefined && String(row.originalPrice).trim() !== ''"
                        class="admin-marketing-plan-card__origin"
                      >
                        原价 {{ formatMoney(row.originalPrice) }}
                      </div>
                    </template>
                  </el-table-column>
                  <el-table-column label="赠送" width="88" align="right">
                    <template #default="{ row }">{{ row.bonusPoints || 0 }}</template>
                  </el-table-column>
                  <el-table-column label="排序" width="64" align="center" prop="sortOrder" />
                  <el-table-column label="启用" width="72" align="center">
                    <template #default="{ row }">
                      <el-switch
                        :model-value="row.isEnabled"
                        size="small"
                        :disabled="enableTogglingId === row.id"
                        @change="(value: string | number | boolean) => handleTogglePlanEnabled(row, Boolean(value))"
                      />
                    </template>
                  </el-table-column>
                  <el-table-column label="操作" width="140" fixed="right" align="right">
                    <template #default="{ row }">
                      <div class="admin-row-actions admin-marketing-plan-actions">
                        <button class="admin-inline-button" type="button" @click="openPlanDialog(row)">编辑</button>
                        <button class="admin-inline-button admin-inline-button--danger" type="button" @click="handleDeletePlan(row)">删除</button>
                      </div>
                    </template>
                  </el-table-column>
                </AdminArtTable>
              </section>
            </div>
          </AdminListFrame>
        </div>

        <div v-else-if="activeTool === 'recharge'" class="admin-marketing-section-shell">
          <AdminListFrame>
            <template #toolbar>
              <AdminListToolbar
                :disabled="loading"
                :has-active-filters="Boolean(listKeyword.trim())"
                @clear="clearListKeyword"
              >
                <input
                  v-model.trim="listKeyword"
                  class="admin-list-toolbar__input is-wide"
                  type="text"
                  placeholder="搜索套餐名称 / 角标"
                  :disabled="loading"
                >
                <template #actions>
                  <button class="admin-button admin-button--primary" type="button" @click="openPackageDialog()">新增套餐</button>
                </template>
              </AdminListToolbar>
            </template>
            <AdminArtTable :loading="loading" :data="filteredPackages" empty-text="暂无积分充值套餐。">
              <el-table-column label="套餐" min-width="180">
                <template #default="{ row }">
                  <div class="admin-marketing-table__title">{{ row.name }}</div>
                  <div class="admin-marketing-table__meta">{{ row.description || row.label || '—' }}</div>
                </template>
              </el-table-column>
              <el-table-column label="积分" width="88" align="right" prop="points" />
              <el-table-column label="赠送" width="88" align="right" prop="bonusPoints" />
              <el-table-column label="售价" width="100" align="right">
                <template #default="{ row }">{{ formatMoney(row.price) }}</template>
              </el-table-column>
              <el-table-column label="角标" width="120">
                <template #default="{ row }">{{ row.badgeText || '—' }}</template>
              </el-table-column>
              <el-table-column label="排序" width="72" align="center" prop="sortOrder" />
              <el-table-column label="启用" width="88" align="center">
                <template #default="{ row }">
                  <el-switch
                    :model-value="row.isEnabled"
                    size="small"
                    :disabled="enableTogglingId === row.id"
                    @change="(value: string | number | boolean) => handleTogglePackageEnabled(row, Boolean(value))"
                  />
                </template>
              </el-table-column>
              <el-table-column label="操作" width="140" fixed="right" align="right">
                <template #default="{ row }">
                  <div class="admin-row-actions">
                    <button class="admin-inline-button" type="button" @click="openPackageDialog(row)">编辑</button>
                    <button class="admin-inline-button admin-inline-button--danger" type="button" @click="handleDeletePackage(row)">删除</button>
                  </div>
                </template>
              </el-table-column>
            </AdminArtTable>
          </AdminListFrame>
        </div>

        <div v-else-if="activeTool === 'rewards'" class="admin-marketing-section-shell">
          <AdminListFrame>
            <template #toolbar>
              <AdminListToolbar
                :disabled="loading"
                :has-active-filters="Boolean(listKeyword.trim())"
                @clear="clearListKeyword"
              >
                <input
                  v-model.trim="listKeyword"
                  class="admin-list-toolbar__input is-wide"
                  type="text"
                  placeholder="搜索规则名称"
                  :disabled="loading"
                >
                <template #actions>
                  <button class="admin-button admin-button--primary" type="button" @click="openRewardDialog()">新增规则</button>
                </template>
              </AdminListToolbar>
            </template>
            <AdminArtTable :loading="loading" :data="filteredRewardRules" empty-text="暂无奖励规则。">
              <el-table-column label="规则" min-width="160">
                <template #default="{ row }">
                  <div class="admin-marketing-table__title">{{ row.name }}</div>
                  <div class="admin-marketing-table__meta">{{ row.code || '—' }}</div>
                </template>
              </el-table-column>
              <el-table-column label="触发" width="110">
                <template #default="{ row }">{{ getRewardTriggerLabel(row.triggerType) }}</template>
              </el-table-column>
              <el-table-column label="周期" width="100">
                <template #default="{ row }">{{ getCycleTypeLabel(row.cycleType) }}</template>
              </el-table-column>
              <el-table-column label="每周期上限" width="110" align="center" prop="limitPerCycle" />
              <el-table-column label="奖励积分" width="100" align="right" prop="rewardPoints" />
              <el-table-column label="启用" width="88" align="center">
                <template #default="{ row }">
                  <el-switch
                    :model-value="row.isEnabled"
                    size="small"
                    :disabled="enableTogglingId === row.id"
                    @change="(value: string | number | boolean) => handleToggleRewardEnabled(row, Boolean(value))"
                  />
                </template>
              </el-table-column>
              <el-table-column label="操作" width="140" fixed="right" align="right">
                <template #default="{ row }">
                  <div class="admin-row-actions">
                    <button class="admin-inline-button" type="button" @click="openRewardDialog(row)">编辑</button>
                    <button class="admin-inline-button admin-inline-button--danger" type="button" @click="handleDeleteReward(row)">删除</button>
                  </div>
                </template>
              </el-table-column>
            </AdminArtTable>
          </AdminListFrame>
        </div>

        <div v-else-if="activeTool === 'cdk'" class="admin-marketing-section-shell">
          <AdminListFrame>
            <template #toolbar>
              <AdminListToolbar
                :disabled="loading"
                :has-active-filters="Boolean(listKeyword.trim())"
                @clear="clearListKeyword"
              >
                <input
                  v-model.trim="listKeyword"
                  class="admin-list-toolbar__input is-wide"
                  type="text"
                  placeholder="搜索批次名称 / 批次号"
                  :disabled="loading"
                >
                <template #actions>
                  <button class="admin-button admin-button--primary" type="button" @click="openBatchDialog()">新增批次</button>
                </template>
              </AdminListToolbar>
            </template>
            <AdminArtTable :loading="loading" :data="filteredCardBatches" empty-text="暂无卡密批次。">
              <el-table-column label="批次" min-width="180">
                <template #default="{ row }">
                  <div class="admin-marketing-table__title">{{ row.name }}</div>
                  <div class="admin-marketing-table__meta">{{ row.batchNo }}</div>
                </template>
              </el-table-column>
              <el-table-column label="奖励" min-width="140">
                <template #default="{ row }">{{ getCardRewardSummary(row) }}</template>
              </el-table-column>
              <el-table-column label="总量" width="80" align="right" prop="totalCount" />
              <el-table-column label="已用" width="80" align="right" prop="usedCount" />
              <el-table-column label="剩余" width="80" align="right">
                <template #default="{ row }">{{ Math.max(row.totalCount - row.usedCount, 0) }}</template>
              </el-table-column>
              <el-table-column label="启用" width="88" align="center">
                <template #default="{ row }">
                  <el-switch
                    :model-value="row.isEnabled"
                    size="small"
                    :disabled="enableTogglingId === row.id"
                    @change="(value: string | number | boolean) => handleToggleBatchEnabled(row, Boolean(value))"
                  />
                </template>
              </el-table-column>
              <el-table-column label="操作" width="200" fixed="right" align="right">
                <template #default="{ row }">
                  <div class="admin-row-actions">
                    <button class="admin-inline-button" type="button" @click="openCodesDialog(row)">卡密</button>
                    <button class="admin-inline-button" type="button" @click="openBatchDialog(row)">编辑</button>
                    <button class="admin-inline-button admin-inline-button--danger" type="button" @click="handleDeleteBatch(row)">删除</button>
                  </div>
                </template>
              </el-table-column>
            </AdminArtTable>
          </AdminListFrame>
        </div>

        <div v-else class="admin-marketing-section-shell">
          <AdminListFrame>
            <template #toolbar>
              <AdminListToolbar
                :disabled="compensationLoading"
                :has-active-filters="pointLogActiveFilterCount > 0"
                :facets="pointLogFacets"
                @update:facet="handlePointLogFacetUpdate"
                @clear="handleResetPointLogFilters"
              >
                <input
                  v-model.trim="pointLogFilters.keyword"
                  class="admin-list-toolbar__input is-wide"
                  type="text"
                  placeholder="搜索用户、流水号、备注、模型、任务提示词"
                  :disabled="compensationLoading"
                  @keydown.enter.prevent="handleApplyPointLogFilters"
                >
                <template #actions>
                  <button class="admin-button admin-button--secondary" type="button" :disabled="compensationLoading" @click="loadPointLogs">
                    {{ compensationLoading ? '刷新中...' : '刷新流水' }}
                  </button>
                  <button class="admin-button admin-button--secondary" type="button" @click="openManualCompensationDialog">
                    手动补偿
                  </button>
                  <button
                    class="admin-button admin-button--primary"
                    type="button"
                    :disabled="compensationSubmitting || !selectedCompensationAssociationNos.length"
                    @click="handleExecuteSelectedPointLogCompensation"
                  >
                    {{ compensationSubmitting ? '补偿中...' : `补偿已选 ${selectedCompensationAssociationNos.length} 条` }}
                  </button>
                  <button class="admin-button admin-button--primary" type="button" :disabled="compensationLoading" @click="handleApplyPointLogFilters">
                    应用筛选
                  </button>
                </template>
              </AdminListToolbar>
            </template>

              <div class="admin-marketing-log-summary">
                <div class="admin-marketing-log-summary__item">
                  <span class="admin-marketing-log-summary__label">命中明细</span>
                  <strong class="admin-marketing-log-summary__value">{{ pointLogSummary.totalCount }}</strong>
                </div>
                <div class="admin-marketing-log-summary__item">
                  <span class="admin-marketing-log-summary__label">待补偿</span>
                  <strong class="admin-marketing-log-summary__value">{{ pointLogSummary.compensableCount }}</strong>
                </div>
                <div class="admin-marketing-log-summary__item">
                  <span class="admin-marketing-log-summary__label">已退款</span>
                  <strong class="admin-marketing-log-summary__value">{{ pointLogSummary.refundCount }}</strong>
                </div>
                <div class="admin-marketing-log-summary__item">
                  <span class="admin-marketing-log-summary__label">统计窗口</span>
                  <strong class="admin-marketing-log-summary__value">{{ pointLogSummary.windowDays }} 天</strong>
                </div>
              </div>

              <AdminEmptyState v-if="!pointLogs.length" message="当前筛选条件下暂无积分流水。" />
              <div v-else class="admin-list admin-point-log-list">
                <label v-for="item in pointLogs" :key="item.id" class="admin-list-item admin-point-log-item">
                  <div class="admin-point-log-item__check">
                    <input
                      :checked="selectedCompensationAssociationNos.includes(item.associationNo)"
                      :disabled="!item.canCompensate"
                      type="checkbox"
                      @change="toggleCompensationSelection(item.associationNo)"
                    >
                  </div>
                  <div class="admin-point-log-item__main">
                    <div class="admin-point-log-item__headline">
                      <div class="admin-list-item__title">{{ getPointLogTitle(item) }}</div>
                      <span class="admin-chip admin-point-log-item__amount" :class="item.action === 'DECREASE' ? 'is-decrease' : 'is-increase'">
                        {{ item.action === 'DECREASE' ? '-' : '+' }}{{ item.changeAmount }} 积分
                      </span>
                    </div>
                    <div class="admin-point-log-item__meta-grid">
                      <div class="admin-list-item__meta">
                        用户 {{ resolvePointLogUserText(item) }} · ID {{ item.userId || '-' }}
                        <button
                          v-if="item.userId"
                          class="admin-inline-button admin-point-log-item__copy-button"
                          type="button"
                          @click.prevent="handleCopyPointLogText('user', item.id, item.userId)"
                        >
                          {{ resolveCopyButtonText('user', item.id, '复制用户ID') }}
                        </button>
                      </div>
                      <div class="admin-list-item__meta">余额 {{ item.balanceAfter }} · 可用 {{ item.availableAmount }}</div>
                    </div>
                    <div class="admin-point-log-item__meta-grid">
                      <div class="admin-list-item__meta">来源 {{ item.sourceType }} · 终端 {{ item.endpointType || '-' }}</div>
                      <div class="admin-list-item__meta">
                        流水号 {{ item.associationNo || item.accountNo }}
                        <button
                          v-if="item.associationNo || item.accountNo"
                          class="admin-inline-button admin-point-log-item__copy-button"
                          type="button"
                          @click.prevent="handleCopyPointLogText('association', item.id, item.associationNo || item.accountNo)"
                        >
                          {{ resolveCopyButtonText('association', item.id, '复制流水号') }}
                        </button>
                      </div>
                    </div>
                    <div class="admin-list-item__meta">发生时间 {{ formatDateText(item.createdAt) }}</div>
                    <div v-if="item.generationPrompt || item.generationErrorMessage" class="admin-list-item__meta">
                      {{ item.generationPrompt || '未记录任务提示词' }}<span v-if="item.generationErrorMessage"> · 错误：{{ item.generationErrorMessage }}</span>
                    </div>
                  </div>
                  <div class="admin-point-log-item__aside">
                    <div class="admin-point-log-item__status">
                    <span class="admin-status" :class="resolvePointLogStatusClass(item)">
                      {{ resolvePointLogStatusText(item) }}
                    </span>
                    </div>
                    <div class="admin-point-log-item__compensation-reason">
                      {{ item.compensationReason }}
                    </div>
                  </div>
                  <div class="admin-row-actions">
                    <button
                      v-if="item.canCompensate"
                      class="admin-inline-button"
                      type="button"
                      :disabled="compensationSubmitting"
                      @click.prevent="handleExecuteSinglePointLogCompensation(item.associationNo)"
                    >
                      失败补偿
                    </button>
                  </div>
                </label>
              </div>
            <template #pagination>
              <AdminPagination
                v-model:page="pointLogPagination.page"
                v-model:page-size="pointLogPagination.pageSize"
                :total="pointLogSummary.totalCount"
                :disabled="compensationLoading || compensationSubmitting"
                @change="handlePointLogPaginationChange"
              />
            </template>
          </AdminListFrame>
        </div>
      </div>
    </div>

    <AdminDialog
      v-model:visible="manualCompensationDialogVisible"
      title="手动补偿"
      description="按流水号手动补偿积分，支持强制模式。"
      size="provider-form"
      panel-class="admin-marketing-dialog"
      :close-disabled="compensationSubmitting"
      @close="closeManualCompensationDialog"
    >
<div class="admin-dialog__body admin-form">
          <div class="admin-form__field">
            <label class="admin-form__label">手动输入关联号</label>
            <textarea
              v-model.trim="compensationForm.manualAssociationNos"
              class="admin-textarea"
              rows="8"
              placeholder="每行一个关联号，或使用逗号分隔，例如：&#10;GTK1777512523146OM0MFW&#10;GTK1777512456545MH6GTH"
            />
          </div>
          <div class="admin-form__field">
            <label class="admin-form__label">补偿备注</label>
            <textarea
              v-model.trim="compensationForm.note"
              class="admin-textarea"
              rows="4"
              placeholder="例如：修复对话失败退款漏账后，补偿 2026-04-30 历史遗留记录"
            />
          </div>
          <label class="admin-checkbox">
            <input v-model="compensationForm.forceManual" type="checkbox">
            <span>允许补偿缺少生成记录关联的历史流水（请先人工确认任务确实失败）</span>
          </label>
          <div class="admin-form__footer">
            <button class="admin-button admin-button--secondary" type="button" @click="fillLegacyCompensationExample">填入当前遗留样例</button>
            <button class="admin-button admin-button--secondary" type="button" @click="closeManualCompensationDialog">取消</button>
            <button class="admin-button admin-button--primary" type="button" :disabled="compensationSubmitting" @click="handleExecuteManualCompensation">
              {{ compensationSubmitting ? '执行中...' : '执行手动补偿' }}
            </button>
          </div>
        </div>
    </AdminDialog>

    <AdminDialog
      v-model:visible="levelDialogVisible"
      :title="levelEditingId ? '编辑会员等级' : '新增会员等级'"
      description="配置会员层级、每月积分和权益说明。"
      size="provider-form"
      panel-class="admin-marketing-dialog"
      :close-disabled="submitting"
      @close="closeLevelDialog"
    >
<form class="admin-dialog__body admin-form" @submit.prevent="handleSubmitLevel">
          <div class="admin-form__grid">
            <div class="admin-form__field">
              <label class="admin-form__label">等级名称</label>
              <input v-model.trim="levelForm.name" class="admin-input" type="text" placeholder="例如：黄金会员">
            </div>
            <div class="admin-form__field">
              <label class="admin-form__label">等级值</label>
              <input v-model.number="levelForm.level" class="admin-input" type="number" min="1">
            </div>
            <div class="admin-form__field">
              <label class="admin-form__label">每月赠送积分</label>
              <input v-model.number="levelForm.monthlyBonusPoints" class="admin-input" type="number" min="0">
            </div>
            <div class="admin-form__field">
              <label class="admin-form__label">存储容量</label>
              <input v-model.number="levelForm.storageCapacity" class="admin-input" type="number" min="0" placeholder="单位自定义">
            </div>
            <div class="admin-form__field admin-form__field--full">
              <label class="admin-form__label">图标地址</label>
              <input v-model.trim="levelForm.iconUrl" class="admin-input" type="text" placeholder="https://...">
            </div>
            <div class="admin-form__field admin-form__field--full">
              <label class="admin-form__label">等级说明</label>
              <textarea v-model.trim="levelForm.description" class="admin-textarea" placeholder="简述此等级的定位和权益"></textarea>
            </div>
            <div class="admin-form__field admin-form__field--full">
              <label class="admin-form__label">权益 JSON</label>
              <textarea v-model.trim="levelForm.benefitsJsonText" class="admin-textarea admin-system-json" placeholder='例如：[{"label":"高速生成"}]'></textarea>
            </div>
            <div class="admin-form__field">
              <label class="admin-form__label">排序权重</label>
              <input v-model.number="levelForm.sortOrder" class="admin-input" type="number" min="0">
            </div>
            <div class="admin-form__field admin-form__field--checkbox">
              <label class="admin-form__label admin-form__label--inline">
                <input v-model="levelForm.isEnabled" type="checkbox">
                <span>启用此等级</span>
              </label>
            </div>
          </div>
          <div class="admin-form__footer">
            <button class="admin-button admin-button--secondary" type="button" @click="closeLevelDialog">取消</button>
            <button class="admin-button admin-button--primary" type="submit" :disabled="submitting">
              {{ submitting ? '保存中...' : '保存等级' }}
            </button>
          </div>
        </form>
    </AdminDialog>

    <AdminDialog
      v-model:visible="planDialogVisible"
      :title="planEditingId ? '编辑会员计划' : '新增会员计划'"
      description="设置订阅时长、价格和绑定等级。"
      size="provider-form"
      panel-class="admin-marketing-dialog"
      :close-disabled="submitting"
      @close="closePlanDialog"
    >
<form class="admin-dialog__body admin-form" @submit.prevent="handleSubmitPlan">
          <div class="admin-form__grid">
            <div class="admin-form__field">
              <label class="admin-form__label">计划名称</label>
              <input v-model.trim="planForm.name" class="admin-input" type="text" placeholder="例如：黄金月卡">
            </div>
            <div class="admin-form__field">
              <label class="admin-form__label">展示标签</label>
              <input v-model.trim="planForm.label" class="admin-input" type="text" placeholder="热门推荐">
            </div>
            <div class="admin-form__field">
              <label class="admin-form__label">时长数值</label>
              <input v-model.number="planForm.durationValue" class="admin-input" type="number" min="1">
            </div>
            <div class="admin-form__field">
              <label class="admin-form__label">时长单位</label>
              <select v-model="planForm.durationUnit" class="admin-input">
                <option value="DAY">天</option>
                <option value="MONTH">月</option>
                <option value="YEAR">年</option>
              </select>
            </div>
            <div class="admin-form__field">
              <label class="admin-form__label">赠送积分</label>
              <input v-model.number="planForm.bonusPoints" class="admin-input" type="number" min="0">
            </div>
            <div class="admin-form__field admin-form__field--full">
              <div class="admin-form__label admin-form__label--row">
                <span>会员计费</span>
                <button class="admin-inline-button" type="button" @click="appendPlanBillingRule">新增计费</button>
              </div>
              <div class="admin-membership-billing-list">
                <div v-for="(rule, ruleIndex) in planForm.billingRules" :key="`${rule.levelId}-${ruleIndex}`" class="admin-membership-billing-item">
                  <select v-model="rule.levelId" class="admin-input">
                    <option value="">选择等级</option>
                    <option v-for="item in levels" :key="item.id" :value="item.id">{{ item.name }}</option>
                  </select>
                  <input v-model.trim="rule.salesPrice" class="admin-input" type="text" inputmode="decimal" placeholder="售价">
                  <input v-model.trim="rule.originalPrice" class="admin-input" type="text" inputmode="decimal" placeholder="原价，可留空">
                  <input v-model.trim="rule.label" class="admin-input" type="text" placeholder="标签，可选">
                  <label class="admin-form__label admin-form__label--inline admin-membership-billing-switch">
                    <input v-model="rule.status" type="checkbox">
                    <span>启用</span>
                  </label>
                  <button class="admin-inline-button admin-inline-button--danger" type="button" @click="removePlanBillingRule(ruleIndex)">删除</button>
                </div>
              </div>
            </div>
            <div class="admin-form__field admin-form__field--full">
              <label class="admin-form__label">计划说明</label>
              <textarea v-model.trim="planForm.description" class="admin-textarea" placeholder="描述计划内容与目标用户"></textarea>
            </div>
            <div class="admin-form__field admin-form__field--full">
              <label class="admin-form__label">会员权益 JSON</label>
              <textarea v-model.trim="planForm.benefitsJsonText" class="admin-textarea admin-system-json" placeholder='例如：["高速生成","会员专属能力"]'></textarea>
            </div>
            <div class="admin-form__field">
              <label class="admin-form__label">排序权重</label>
              <input v-model.number="planForm.sortOrder" class="admin-input" type="number" min="0">
            </div>
            <div class="admin-form__field admin-form__field--checkbox">
              <label class="admin-form__label admin-form__label--inline">
                <input v-model="planForm.isEnabled" type="checkbox">
                <span>启用此计划</span>
              </label>
            </div>
          </div>
          <div class="admin-form__footer">
            <button class="admin-button admin-button--secondary" type="button" @click="closePlanDialog">取消</button>
            <button class="admin-button admin-button--primary" type="submit" :disabled="submitting">
              {{ submitting ? '保存中...' : '保存计划' }}
            </button>
          </div>
        </form>
    </AdminDialog>

    <AdminDialog
      v-model:visible="packageDialogVisible"
      :title="packageEditingId ? '编辑充值套餐' : '新增充值套餐'"
      description="配置积分包售价、赠送与促销角标。"
      size="provider-form"
      panel-class="admin-marketing-dialog"
      :close-disabled="submitting"
      @close="closePackageDialog"
    >
<form class="admin-dialog__body admin-form" @submit.prevent="handleSubmitPackage">
          <div class="admin-form__grid">
            <div class="admin-form__field">
              <label class="admin-form__label">套餐名称</label>
              <input v-model.trim="packageForm.name" class="admin-input" type="text" placeholder="例如：500 积分包">
            </div>
            <div class="admin-form__field">
              <label class="admin-form__label">展示标签</label>
              <input v-model.trim="packageForm.label" class="admin-input" type="text" placeholder="限时特惠">
            </div>
            <div class="admin-form__field">
              <label class="admin-form__label">基础积分</label>
              <input v-model.number="packageForm.points" class="admin-input" type="number" min="0">
            </div>
            <div class="admin-form__field">
              <label class="admin-form__label">赠送积分</label>
              <input v-model.number="packageForm.bonusPoints" class="admin-input" type="number" min="0">
            </div>
            <div class="admin-form__field">
              <label class="admin-form__label">售价</label>
              <input v-model.trim="packageForm.price" class="admin-input" type="text" inputmode="decimal" placeholder="例如：19.90">
            </div>
            <div class="admin-form__field">
              <label class="admin-form__label">原价</label>
              <input v-model.trim="packageForm.originalPrice" class="admin-input" type="text" inputmode="decimal" placeholder="例如：19.90">
            </div>
            <div class="admin-form__field">
              <label class="admin-form__label">角标文案</label>
              <input v-model.trim="packageForm.badgeText" class="admin-input" type="text" placeholder="多充多送">
            </div>
            <div class="admin-form__field">
              <label class="admin-form__label">排序权重</label>
              <input v-model.number="packageForm.sortOrder" class="admin-input" type="number" min="0">
            </div>
            <div class="admin-form__field admin-form__field--full">
              <label class="admin-form__label">套餐说明</label>
              <textarea v-model.trim="packageForm.description" class="admin-textarea" placeholder="说明套餐定位和活动力度"></textarea>
            </div>
            <div class="admin-form__field admin-form__field--full">
              <label class="admin-form__label">底部权益文案</label>
              <textarea v-model.trim="packageForm.benefitsText" class="admin-textarea" placeholder="每行一条，例如：&#10;充值后即时到账&#10;支持多充多送&#10;可用于图片与视频生成"></textarea>
            </div>
            <div class="admin-form__field admin-form__field--full">
              <label class="admin-form__label">扩展 JSON</label>
              <textarea v-model.trim="packageForm.metaJsonText" class="admin-textarea admin-system-json" placeholder='例如：{"tagColor":"gold"}'></textarea>
            </div>
            <div class="admin-form__field admin-form__field--checkbox">
              <label class="admin-form__label admin-form__label--inline">
                <input v-model="packageForm.isEnabled" type="checkbox">
                <span>启用此套餐</span>
              </label>
            </div>
          </div>
          <div class="admin-form__footer">
            <button class="admin-button admin-button--secondary" type="button" @click="closePackageDialog">取消</button>
            <button class="admin-button admin-button--primary" type="submit" :disabled="submitting">
              {{ submitting ? '保存中...' : '保存套餐' }}
            </button>
          </div>
        </form>
    </AdminDialog>

    <AdminDialog
      v-model:visible="rewardDialogVisible"
      :title="rewardEditingId ? '编辑奖励规则' : '新增奖励规则'"
      description="配置触发条件、周期上限与奖励积分。"
      size="provider-form"
      panel-class="admin-marketing-dialog"
      :close-disabled="submitting"
      @close="closeRewardDialog"
    >
<form class="admin-dialog__body admin-form" @submit.prevent="handleSubmitReward">
          <div class="admin-form__grid">
            <div class="admin-form__field">
              <label class="admin-form__label">规则编码</label>
              <input v-model.trim="rewardForm.code" class="admin-input" type="text" placeholder="LOGIN_DAILY_DEFAULT">
            </div>
            <div class="admin-form__field">
              <label class="admin-form__label">规则名称</label>
              <input v-model.trim="rewardForm.name" class="admin-input" type="text" placeholder="每日登录奖励">
            </div>
            <div class="admin-form__field">
              <label class="admin-form__label">触发类型</label>
              <select v-model="rewardForm.triggerType" class="admin-input">
                <option value="LOGIN_DAILY">登录奖励</option>
                <option value="REGISTER_ONCE">注册奖励</option>
                <option value="CHECKIN_DAILY">签到奖励</option>
              </select>
            </div>
            <div class="admin-form__field">
              <label class="admin-form__label">周期类型</label>
              <select v-model="rewardForm.cycleType" class="admin-input">
                <option value="ONCE">仅一次</option>
                <option value="DAILY">每日</option>
                <option value="WEEKLY">每周</option>
                <option value="MONTHLY">每月</option>
              </select>
            </div>
            <div class="admin-form__field">
              <label class="admin-form__label">奖励积分</label>
              <input v-model.number="rewardForm.rewardPoints" class="admin-input" type="number" min="0">
            </div>
            <div class="admin-form__field">
              <label class="admin-form__label">周期上限</label>
              <input v-model.number="rewardForm.limitPerCycle" class="admin-input" type="number" min="1">
            </div>
            <div class="admin-form__field admin-form__field--full">
              <label class="admin-form__label">规则说明</label>
              <textarea v-model.trim="rewardForm.description" class="admin-textarea" placeholder="说明规则的投放场景与限制"></textarea>
            </div>
            <div class="admin-form__field admin-form__field--full">
              <label class="admin-form__label">条件 JSON</label>
              <textarea v-model.trim="rewardForm.conditionJsonText" class="admin-textarea admin-system-json" placeholder='例如：{"days":[1,2,3]}'></textarea>
            </div>
            <div class="admin-form__field">
              <label class="admin-form__label">排序权重</label>
              <input v-model.number="rewardForm.sortOrder" class="admin-input" type="number" min="0">
            </div>
            <div class="admin-form__field admin-form__field--checkbox">
              <label class="admin-form__label admin-form__label--inline">
                <input v-model="rewardForm.isEnabled" type="checkbox">
                <span>启用此规则</span>
              </label>
            </div>
          </div>
          <div class="admin-form__footer">
            <button class="admin-button admin-button--secondary" type="button" @click="closeRewardDialog">取消</button>
            <button class="admin-button admin-button--primary" type="submit" :disabled="submitting">
              {{ submitting ? '保存中...' : '保存规则' }}
            </button>
          </div>
        </form>
    </AdminDialog>

    <AdminDialog
      v-model:visible="batchDialogVisible"
      :title="batchEditingId ? '编辑卡密批次' : '新增卡密批次'"
      description="批量生成兑换码并绑定积分或会员权益。"
      size="provider-form"
      panel-class="admin-marketing-dialog"
      :close-disabled="submitting"
      @close="closeBatchDialog"
    >
<form class="admin-dialog__body admin-form" @submit.prevent="handleSubmitBatch">
          <div class="admin-form__grid">
            <div class="admin-form__field">
              <label class="admin-form__label">批次名称</label>
              <input v-model.trim="batchForm.name" class="admin-input" type="text" placeholder="例如：五一活动卡密批次">
            </div>
            <div class="admin-form__field">
              <label class="admin-form__label">批次号</label>
              <input v-model.trim="batchForm.batchNo" class="admin-input" type="text" placeholder="例如：MKT-20260428-A">
            </div>
            <div class="admin-form__field">
              <label class="admin-form__label">奖励类型</label>
              <select v-model="batchForm.rewardType" class="admin-input">
                <option value="POINTS">积分</option>
                <option value="MEMBERSHIP">会员时长</option>
              </select>
            </div>
            <div class="admin-form__field" v-if="batchForm.rewardType === 'POINTS'">
              <label class="admin-form__label">奖励积分</label>
              <input v-model.number="batchForm.rewardPoints" class="admin-input" type="number" min="0">
            </div>
            <div class="admin-form__field" v-else>
              <label class="admin-form__label">会员等级</label>
              <select v-model="batchForm.rewardLevelId" class="admin-input">
                <option value="">请选择会员等级</option>
                <option v-for="item in levels" :key="item.id" :value="item.id">{{ item.name }}</option>
              </select>
            </div>
            <div class="admin-form__field" v-if="batchForm.rewardType === 'MEMBERSHIP'">
              <label class="admin-form__label">奖励天数</label>
              <input v-model.number="batchForm.rewardDays" class="admin-input" type="number" min="1">
            </div>
            <div class="admin-form__field" v-else>
              <label class="admin-form__label">总数量</label>
              <input v-model.number="batchForm.totalCount" class="admin-input" type="number" min="1" :disabled="Boolean(batchEditingId)">
            </div>
            <div class="admin-form__field">
              <label class="admin-form__label">过期时间</label>
              <input v-model="batchForm.expiresAt" class="admin-input" type="datetime-local">
            </div>
            <div class="admin-form__field admin-form__field--full">
              <label class="admin-form__label">批次说明</label>
              <textarea v-model.trim="batchForm.description" class="admin-textarea" placeholder="说明该批次的用途和发放渠道"></textarea>
            </div>
            <div class="admin-form__field admin-form__field--full">
              <label class="admin-form__label">扩展 JSON</label>
              <textarea v-model.trim="batchForm.metaJsonText" class="admin-textarea admin-system-json" placeholder='例如：{"channel":"douyin"}'></textarea>
            </div>
            <div class="admin-form__field admin-form__field--checkbox">
              <label class="admin-form__label admin-form__label--inline">
                <input v-model="batchForm.isEnabled" type="checkbox">
                <span>允许兑换</span>
              </label>
            </div>
          </div>
          <div class="admin-form__footer">
            <button class="admin-button admin-button--secondary" type="button" @click="closeBatchDialog">取消</button>
            <button class="admin-button admin-button--primary" type="submit" :disabled="submitting">
              {{ submitting ? '保存中...' : '保存批次' }}
            </button>
          </div>
        </form>
    </AdminDialog>

    <AdminDialog
      v-model:visible="codesDialogVisible"
      title="卡密列表"
      :description="`${currentBatch?.name || '当前批次'} · ${currentBatch?.batchNo || '-'}`"
      size="manager"
      panel-class="admin-marketing-dialog"
      :close-disabled="codesLoading"
      @close="closeCodesDialog"
    >
      <div class="admin-dialog__body">
        <div v-if="codesLoading" class="admin-empty">正在加载卡密...</div>
        <div v-else-if="!cardCodes.length" class="admin-empty">当前批次暂无卡密数据。</div>
        <div v-else class="admin-marketing-code-grid">
          <div v-for="item in cardCodes" :key="item.id" class="admin-marketing-code-card">
            <div class="admin-marketing-code-card__top">
              <strong>{{ item.code }}</strong>
              <span class="admin-status" :class="item.status === 'USED' ? 'admin-status--warning' : 'admin-status--success'">
                {{ item.status === 'USED' ? '已使用' : '未使用' }}
              </span>
            </div>
            <div class="admin-marketing-code-card__meta">到期：{{ formatDateText(item.expiresAt) }}</div>
            <div class="admin-marketing-code-card__meta">使用者：{{ item.usedByUser?.name || item.usedByUser?.email || item.usedByUser?.phone || '暂无' }}</div>
            <div class="admin-marketing-code-card__meta">使用时间：{{ formatDateText(item.usedAt) }}</div>
          </div>
        </div>
      </div>
    </AdminDialog>
  </AdminPageContainer>
</template>

<script setup lang="ts">
import './admin-marketing.scoped.css'
import './admin-marketing-panel.css'
import { computed, onMounted, reactive, ref } from 'vue'
import AdminDialog from '@/components/admin/common/AdminDialog.vue'
import AdminEmptyState from '@/components/admin/common/AdminEmptyState.vue'
import AdminListFrame from '@/components/admin/common/AdminListFrame.vue'
import AdminListToolbar, { type AdminListToolbarFacet } from '@/components/admin/common/AdminListToolbar.vue'
import AdminStatCard from '@/components/admin/common/AdminStatCard.vue'
import AdminPagination from '@/components/admin/common/AdminPagination.vue'
import AdminArtTable from '@/components/admin/table/AdminArtTable.vue'
import AdminPageContainer from '@/components/admin/layout/AdminPageContainer.vue'
import { useAdminListFilters } from '@/composables/useAdminListFilters'
import {
  createCardBatch,
  createMembershipLevel,
  createMembershipPlan,
  createRechargePackage,
  createRewardRule,
  deleteCardBatch,
  deleteMembershipLevel,
  deleteMembershipPlan,
  deleteRechargePackage,
  deleteRewardRule,
  getAdminMarketingOverview,
  listAdminPointLogs,
  listCardBatches,
  listCardCodesByBatch,
  listMembershipLevels,
  listMembershipPlans,
  listRechargePackages,
  listRewardRules,
  executePointCompensation,
  updateCardBatch,
  updateMembershipLevel,
  updateMembershipPlan,
  updateRechargePackage,
  updateRewardRule,
  type AdminMarketingOverview,
  type CardBatchItem,
  type CardCodeItem,
  type AdminPointLogItem,
  type AdminPointLogListResult,
  type MembershipLevelItem,
  type MembershipPlanBillingItem,
  type MembershipPlanItem,
  type RechargePackageItem,
  type RewardRuleItem,
} from '@/api/admin-marketing'
import { formatMoney, normalizeMoneyString, toMoneyNumber } from '@/utils/money'

// 营销中心四个核心工具。
type MarketingToolKey = 'membership' | 'recharge' | 'rewards' | 'cdk' | 'compensation'

const overview = ref<AdminMarketingOverview | null>(null)
const levels = ref<MembershipLevelItem[]>([])
const plans = ref<MembershipPlanItem[]>([])
const packages = ref<RechargePackageItem[]>([])
const rewardRules = ref<RewardRuleItem[]>([])
const cardBatches = ref<CardBatchItem[]>([])
const cardCodes = ref<CardCodeItem[]>([])
const pointLogs = ref<AdminPointLogItem[]>([])

const loading = ref(false)
const submitting = ref(false)
const codesLoading = ref(false)
const compensationLoading = ref(false)
const compensationSubmitting = ref(false)
const pointLogCopiedKey = ref('')
const activeTool = ref<MarketingToolKey>('membership')
const selectedCompensationAssociationNos = ref<string[]>([])
const pointLogFilters = reactive({
  days: 30,
  action: '',
  sourceType: '',
  endpointType: '',
  refundStatus: '',
  keyword: '',
})
const pointLogFilterDefaults = {
  days: 30,
  action: '',
  sourceType: '',
  endpointType: '',
  refundStatus: '',
  keyword: '',
}
const pointLogPagination = reactive({
  page: 1,
  pageSize: 10,
})
const compensationForm = reactive({
  manualAssociationNos: '',
  note: '',
  forceManual: false,
})
const pointLogSummary = reactive<AdminPointLogListResult['summary']>({
  totalCount: 0,
  compensableCount: 0,
  refundCount: 0,
  windowDays: 30,
  page: 1,
  pageSize: 10,
  totalPages: 1,
})
const { activeFilterCount: pointLogActiveFilterCount, resetFilters: resetPointLogFilters } = useAdminListFilters({
  filters: pointLogFilters,
  defaults: pointLogFilterDefaults,
})

const membershipSubTab = ref<'levels' | 'plans'>('levels')
const listKeyword = ref('')
const enableTogglingId = ref('')

const clearListKeyword = () => {
  listKeyword.value = ''
}

const matchesListKeyword = (...parts: Array<string | number | null | undefined>) => {
  const keyword = listKeyword.value.trim().toLowerCase()
  if (!keyword) {
    return true
  }
  return parts.some((part) => String(part ?? '').toLowerCase().includes(keyword))
}

const filteredLevels = computed(() => levels.value.filter((item) => (
  matchesListKeyword(item.name, item.level, item.monthlyBonusPoints)
)))

const filteredPackages = computed(() => packages.value.filter((item) => (
  matchesListKeyword(item.name, item.description, item.label, item.badgeText)
)))

const filteredRewardRules = computed(() => rewardRules.value.filter((item) => (
  matchesListKeyword(item.name, item.code, item.triggerType)
)))

const filteredCardBatches = computed(() => cardBatches.value.filter((item) => (
  matchesListKeyword(item.name, item.batchNo)
)))

/** 按绑定等级分组计划；无等级时落入未绑定组。 */
const planGroups = computed(() => {
  const levelMap = new Map(levels.value.map((level) => [level.id, level]))
  const grouped = new Map<string, {
    key: string
    title: string
    levelLabel: string
    plans: MembershipPlanItem[]
    enabledCount: number
  }>()

  const ensureGroup = (key: string, title: string, levelLabel: string) => {
    let group = grouped.get(key)
    if (!group) {
      group = { key, title, levelLabel, plans: [], enabledCount: 0 }
      grouped.set(key, group)
    }
    return group
  }

  for (const plan of plans.value) {
    const boundLevelId = String(plan.levelId || plan.billingRules?.[0]?.levelId || '').trim()
    const level = boundLevelId ? levelMap.get(boundLevelId) : undefined
    const group = level
      ? ensureGroup(level.id, level.name, `Lv.${level.level}`)
      : ensureGroup('__unbound__', '未绑定等级', '')
    group.plans.push(plan)
    if (plan.isEnabled) {
      group.enabledCount += 1
    }
  }

  // 等级顺序优先，未绑定垫底
  const ordered: typeof grouped extends Map<string, infer V> ? V[] : never[] = []
  for (const level of [...levels.value].sort((a, b) => a.sortOrder - b.sortOrder || a.level - b.level)) {
    const group = grouped.get(level.id)
    if (group) {
      ordered.push(group)
    }
  }
  const unbound = grouped.get('__unbound__')
  if (unbound) {
    ordered.push(unbound)
  }
  return ordered
})

const filteredPlanGroups = computed(() => {
  const keyword = listKeyword.value.trim().toLowerCase()
  if (!keyword) {
    return planGroups.value
  }
  return planGroups.value
    .map((group) => {
      const plansInGroup = group.plans.filter((plan) => (
        matchesListKeyword(
          plan.name,
          plan.label,
          plan.durationValue,
          plan.durationUnit,
          group.title,
        )
      ))
      return {
        ...group,
        plans: plansInGroup,
        enabledCount: plansInGroup.filter((item) => item.isEnabled).length,
      }
    })
    .filter((group) => group.plans.length > 0 || matchesListKeyword(group.title))
})

const marketingTabs = computed(() => [
  {
    key: 'membership' as MarketingToolKey,
    title: '会员订阅',
    group: '增长',
    count: `${levels.value.length}/${plans.value.length}`,
  },
  {
    key: 'recharge' as MarketingToolKey,
    title: '积分充值',
    group: '变现',
    count: String(packages.value.length),
  },
  {
    key: 'rewards' as MarketingToolKey,
    title: '奖励中心',
    group: '留存',
    count: String(rewardRules.value.length),
  },
  {
    key: 'cdk' as MarketingToolKey,
    title: '卡密兑换',
    group: '投放',
    count: String(cardBatches.value.length),
  },
  {
    key: 'compensation' as MarketingToolKey,
    title: '积分流水',
    group: '治理',
    count: String(pointLogSummary.totalCount),
  },
])

const pointLogFacets = computed<AdminListToolbarFacet[]>(() => [
  {
    key: 'action',
    title: '动作类型',
    options: [
      { label: '收入', value: 'INCREASE' },
      { label: '支出', value: 'DECREASE' },
    ],
    modelValue: pointLogFilters.action,
    emptyValue: '',
  },
  {
    key: 'sourceType',
    title: '来源渠道',
    options: [
      { label: '生成消费', value: 'GENERATION_CONSUME' },
      { label: '充值', value: 'RECHARGE_ORDER' },
      { label: '订阅', value: 'MEMBERSHIP_ORDER' },
      { label: '奖励规则', value: 'REWARD_RULE' },
      { label: '签到', value: 'CHECKIN' },
      { label: '卡密兑换', value: 'CARD_REDEEM' },
    ],
    modelValue: pointLogFilters.sourceType,
    emptyValue: '',
  },
  {
    key: 'endpointType',
    title: '终端类型',
    options: [
      { label: 'CHAT', value: 'chat' },
      { label: 'IMAGE', value: 'image' },
      { label: 'VIDEO', value: 'video' },
    ],
    modelValue: pointLogFilters.endpointType,
    emptyValue: '',
  },
  {
    key: 'refundStatus',
    title: '退款状态',
    options: [
      { label: '待补偿', value: 'compensable' },
      { label: '已退款', value: 'refunded' },
      { label: '未退款', value: 'unrefunded' },
    ],
    modelValue: pointLogFilters.refundStatus,
    emptyValue: '',
  },
  {
    key: 'days',
    title: '时间窗口',
    options: [
      { label: '近 7 天', value: '7' },
      { label: '近 30 天', value: '30' },
      { label: '近 90 天', value: '90' },
    ],
    modelValue: String(pointLogFilters.days),
    emptyValue: '30',
  },
])

const handlePointLogFacetUpdate = ({ key, value }: { key: string; value: string }) => {
  if (key === 'action') pointLogFilters.action = value
  else if (key === 'sourceType') pointLogFilters.sourceType = value
  else if (key === 'endpointType') pointLogFilters.endpointType = value
  else if (key === 'refundStatus') pointLogFilters.refundStatus = value
  else if (key === 'days') pointLogFilters.days = Number(value) || 30
}


const createLevelForm = () => ({
  name: '',
  level: Math.max(levels.value.length + 1, 1),
  description: '',
  iconUrl: '',
  monthlyBonusPoints: 0,
  storageCapacity: 0,
  benefitsJsonText: '[]',
  isEnabled: true,
  sortOrder: levels.value.length,
})

const createPlanBillingRule = () => ({
  levelId: '',
  salesPrice: '0',
  originalPrice: '',
  label: '',
  status: true,
})

const createPlanForm = () => ({
  name: '',
  label: '',
  description: '',
  durationValue: 1,
  durationUnit: 'MONTH',
  bonusPoints: 0,
  billingRules: [createPlanBillingRule()],
  benefitsJsonText: '[]',
  isEnabled: true,
  sortOrder: plans.value.length,
})

const createPackageForm = () => ({
  name: '',
  label: '',
  description: '',
  points: 0,
  bonusPoints: 0,
  // 价格字段保留字符串中间态，避免 number 修饰符吞掉小数点和清空输入。
  price: '0',
  originalPrice: '0',
  badgeText: '',
  // 充值卡片底部权益文案按行编辑，提交时写入 metaJson.benefits。
  benefitsText: '',
  isEnabled: true,
  sortOrder: packages.value.length,
  metaJsonText: '{}',
})

const createRewardForm = () => ({
  code: '',
  triggerType: 'LOGIN',
  name: '',
  description: '',
  rewardPoints: 0,
  cycleType: 'DAILY',
  limitPerCycle: 1,
  isEnabled: true,
  conditionJsonText: '{}',
  sortOrder: rewardRules.value.length,
})

const createBatchForm = () => ({
  name: '',
  batchNo: '',
  description: '',
  rewardType: 'POINTS',
  rewardPoints: 0,
  rewardLevelId: '',
  rewardDays: 30,
  totalCount: 10,
  expiresAt: '',
  isEnabled: true,
  metaJsonText: '{}',
})

const levelDialogVisible = ref(false)
const levelEditingId = ref('')
const levelForm = reactive(createLevelForm())

const planDialogVisible = ref(false)
const planEditingId = ref('')
const planForm = reactive(createPlanForm())

const packageDialogVisible = ref(false)
const packageEditingId = ref('')
const packageForm = reactive(createPackageForm())

const rewardDialogVisible = ref(false)
const rewardEditingId = ref('')
const rewardForm = reactive(createRewardForm())

const batchDialogVisible = ref(false)
const batchEditingId = ref('')
const batchForm = reactive(createBatchForm())

const codesDialogVisible = ref(false)
const currentBatch = ref<CardBatchItem | null>(null)
const manualCompensationDialogVisible = ref(false)

// 用于把表单重置为最新初始值，避免多次弹窗编辑残留脏数据。
const assignForm = <T extends Record<string, any>>(target: T, source: T) => {
  Object.assign(target, source)
}

const parseJsonText = (value: string, fallback: unknown) => {
  const normalized = String(value || '').trim()
  if (!normalized) {
    return fallback
  }
  return JSON.parse(normalized)
}

const formatJsonText = (value: unknown, fallback = '{}') => {
  if (value === null || value === undefined || value === '') {
    return fallback
  }
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return fallback
  }
}


// 充值套餐底部权益文案统一读写 metaJson.benefits，后台按多行文本编辑更直观。
const parsePackageBenefitsText = (metaJson: unknown) => {
  if (!metaJson || typeof metaJson !== 'object') {
    return ''
  }
  const benefits = (metaJson as Record<string, unknown>).benefits
  if (!Array.isArray(benefits)) {
    return ''
  }
  return benefits
    .map((item) => String(item || '').trim())
    .filter(Boolean)
    .join('\n')
}

const mergePackageMetaJson = (metaJsonText: string, benefitsText: string) => {
  const parsed = parseJsonText(metaJsonText, {})
  const base = parsed && typeof parsed === 'object' && !Array.isArray(parsed)
    ? { ...(parsed as Record<string, unknown>) }
    : {}
  const benefits = String(benefitsText || '')
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)

  if (benefits.length) {
    base.benefits = benefits
  } else {
    delete base.benefits
  }

  return base
}

const toDatetimeLocalValue = (value: string | null | undefined) => {
  if (!value) {
    return ''
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

// 统一解析价格输入，兼容字符串小数、空值和中文逗号。
const parseDecimalInput = (value: string | number | null | undefined) => {
  const normalized = normalizeMoneyString(value, '').replace(/，/g, '.').replace(/[^\d.-]/g, '')
  return toMoneyNumber(normalized, 0)
}

// 原价允许留空，不强制回落为 0。
const parseOptionalDecimalInput = (value: string | number | null | undefined) => {
  const normalized = String(value ?? '').trim()
  if (!normalized) {
    return null
  }
  const numeric = parseDecimalInput(normalized)
  return Number.isFinite(numeric) ? numeric : null
}

const appendPlanBillingRule = () => {
  planForm.billingRules.push(createPlanBillingRule())
}

const removePlanBillingRule = (index: number) => {
  if (planForm.billingRules.length <= 1) {
    planForm.billingRules.splice(0, planForm.billingRules.length, createPlanBillingRule())
    return
  }
  planForm.billingRules.splice(index, 1)
}

const getPlanBillingSummary = (billingRules?: MembershipPlanBillingItem[]) => {
  const enabledRules = Array.isArray(billingRules) ? billingRules.filter((item) => item.status !== false) : []
  if (!enabledRules.length) {
    return '暂无计费规则'
  }
  return `计费 ${enabledRules.length} 档 · ${enabledRules.map((item) => `${item.level?.name || '未命名等级'} ${formatMoney(item.salesPrice)}`).join(' / ')}`
}

const formatDateText = (value: string | null | undefined) => {
  if (!value) {
    return '未设置'
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '未设置'
  }
  return date.toLocaleString('zh-CN', { hour12: false })
}

const getDurationUnitLabel = (value: string) => {
  if (value === 'DAY') return '天'
  if (value === 'YEAR') return '年'
  return '月'
}

const getRewardTriggerLabel = (value: string) => {
  if (value === 'REGISTER' || value === 'REGISTER_ONCE') return '注册奖励'
  if (value === 'CHECKIN' || value === 'CHECKIN_DAILY') return '签到奖励'
  return '登录奖励'
}

const getCycleTypeLabel = (value: string) => {
  if (value === 'ONCE') return '仅一次'
  if (value === 'WEEKLY') return '每周'
  if (value === 'MONTHLY') return '每月'
  return '每日'
}

const getCardRewardSummary = (item: CardBatchItem) => {
  if (item.rewardType === 'MEMBERSHIP') {
    return `${item.rewardLevel?.name || '会员权益'} ${item.rewardDays || 0} 天`
  }
  return `${item.rewardPoints} 积分`
}

const parseAssociationNoList = (value: string) => {
  return Array.from(new Set(
    String(value || '')
      .split(/[\n,，\s]+/g)
      .map((item) => item.trim())
      .filter(Boolean),
  ))
}

const toggleCompensationSelection = (associationNo: string) => {
  const current = new Set(selectedCompensationAssociationNos.value)
  if (current.has(associationNo)) {
    current.delete(associationNo)
  } else {
    current.add(associationNo)
  }
  selectedCompensationAssociationNos.value = Array.from(current)
}

// 统一处理后台复制动作，优先使用 Clipboard API，失败时自动回退到选区复制。
const copyText = async (value: string) => {
  const text = String(value || '').trim()
  if (!text) {
    throw new Error('empty_text')
  }

  if (navigator?.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }

  const textArea = document.createElement('textarea')
  textArea.value = text
  textArea.style.position = 'fixed'
  textArea.style.opacity = '0'
  textArea.style.pointerEvents = 'none'
  document.body.appendChild(textArea)
  textArea.focus()
  textArea.select()
  const copied = document.execCommand('copy')
  document.body.removeChild(textArea)
  if (!copied) {
    throw new Error('copy_failed')
  }
}

const buildPointLogCopyKey = (field: 'user' | 'association', recordId: string) => {
  return `${field}:${recordId}`
}

const resolveCopyButtonText = (field: 'user' | 'association', recordId: string, fallback: string) => {
  return pointLogCopiedKey.value === buildPointLogCopyKey(field, recordId) ? '已复制' : fallback
}

const handleCopyPointLogText = async (field: 'user' | 'association', recordId: string, value: string) => {
  try {
    await copyText(value)
    const currentKey = buildPointLogCopyKey(field, recordId)
    pointLogCopiedKey.value = currentKey
    window.setTimeout(() => {
      if (pointLogCopiedKey.value === currentKey) {
        pointLogCopiedKey.value = ''
      }
    }, 1600)
  } catch {
    window.alert('复制失败，请稍后重试。')
  }
}

const openManualCompensationDialog = () => {
  manualCompensationDialogVisible.value = true
}

const closeManualCompensationDialog = () => {
  manualCompensationDialogVisible.value = false
}

const loadPointLogs = async () => {
  compensationLoading.value = true
  try {
    const result = await listAdminPointLogs({
      ...pointLogFilters,
      page: pointLogPagination.page,
      pageSize: pointLogPagination.pageSize,
    })
    pointLogs.value = Array.isArray(result.items) ? result.items : []
    pointLogSummary.totalCount = Number(result.summary?.totalCount || 0)
    pointLogSummary.compensableCount = Number(result.summary?.compensableCount || 0)
    pointLogSummary.refundCount = Number(result.summary?.refundCount || 0)
    pointLogSummary.windowDays = Number(result.summary?.windowDays || pointLogFilters.days)
    pointLogSummary.page = Number(result.summary?.page || pointLogPagination.page)
    pointLogSummary.pageSize = Number(result.summary?.pageSize || pointLogPagination.pageSize)
    pointLogSummary.totalPages = Number(result.summary?.totalPages || 1)
    selectedCompensationAssociationNos.value = selectedCompensationAssociationNos.value
      .filter((item) => pointLogs.value.some((log) => log.associationNo === item && log.canCompensate))
    pointLogPagination.page = pointLogSummary.page
    pointLogPagination.pageSize = pointLogSummary.pageSize
  } finally {
    compensationLoading.value = false
  }
}

const handleApplyPointLogFilters = async () => {
  pointLogPagination.page = 1
  await loadPointLogs()
}

const handleResetPointLogFilters = async () => {
  resetPointLogFilters()
  pointLogPagination.page = 1
  await loadPointLogs()
}

const handlePointLogPaginationChange = async (payload: { page: number; pageSize: number }) => {
  pointLogPagination.page = payload.page
  pointLogPagination.pageSize = payload.pageSize
  await loadPointLogs()
}

const fillLegacyCompensationExample = () => {
  compensationForm.manualAssociationNos = [
    'GTK1777512523146OM0MFW',
    'GTK1777512456545MH6GTH',
  ].join('\n')
  if (!compensationForm.note) {
    compensationForm.note = '补偿修复前产生的对话失败未退款历史流水'
  }
  compensationForm.forceManual = true
}

const handleExecuteSelectedPointLogCompensation = async () => {
  if (!selectedCompensationAssociationNos.value.length) {
    window.alert('请先选择需要补偿的流水记录。')
    return
  }
  if (!window.confirm(`确认补偿已选中的 ${selectedCompensationAssociationNos.value.length} 条积分流水吗？`)) {
    return
  }

  compensationSubmitting.value = true
  try {
    const result = await executePointCompensation({
      associationNos: selectedCompensationAssociationNos.value,
      note: compensationForm.note || '后台手动补偿失败未退款任务',
      forceManual: false,
    })
    selectedCompensationAssociationNos.value = []
    await loadPointLogs()
    window.alert(`补偿完成：成功 ${result.refundedCount} 条，跳过 ${result.skippedCount} 条。`)
  } finally {
    compensationSubmitting.value = false
  }
}

const handleExecuteSinglePointLogCompensation = async (associationNo: string) => {
  if (!associationNo) {
    return
  }
  if (!window.confirm(`确认补偿流水 ${associationNo} 吗？`)) {
    return
  }
  compensationSubmitting.value = true
  try {
    const result = await executePointCompensation({
      associationNos: [associationNo],
      note: compensationForm.note || '后台单条失败补偿',
      forceManual: false,
    })
    await loadPointLogs()
    window.alert(`补偿完成：成功 ${result.refundedCount} 条，跳过 ${result.skippedCount} 条。`)
  } finally {
    compensationSubmitting.value = false
  }
}

const handleExecuteManualCompensation = async () => {
  const associationNos = parseAssociationNoList(compensationForm.manualAssociationNos)
  if (!associationNos.length) {
    window.alert('请先输入至少一个关联号。')
    return
  }
  if (!window.confirm(`确认手动补偿 ${associationNos.length} 条流水吗？该操作会直接补回积分。`)) {
    return
  }

  compensationSubmitting.value = true
  try {
    const result = await executePointCompensation({
      associationNos,
      note: compensationForm.note || '后台手动补偿历史漏账',
      forceManual: compensationForm.forceManual,
    })
    compensationForm.manualAssociationNos = ''
    compensationForm.note = ''
    compensationForm.forceManual = false
    closeManualCompensationDialog()
    await loadPointLogs()
    window.alert(`手动补偿完成：成功 ${result.refundedCount} 条，跳过 ${result.skippedCount} 条。`)
  } finally {
    compensationSubmitting.value = false
  }
}

const getPointLogTitle = (item: AdminPointLogItem) => {
  if (item.remark) {
    return item.remark
  }
  if (item.sourceType === 'RECHARGE_ORDER') return '充值到账'
  if (item.sourceType === 'MEMBERSHIP_ORDER') return '订阅积分到账'
  if (item.sourceType === 'CHECKIN') return '签到奖励'
  if (item.sourceType === 'CARD_REDEEM') return '卡密兑换'
  if (item.sourceType === 'REWARD_RULE') return '奖励规则发放'
  return '积分流水'
}

const resolvePointLogUserText = (item: AdminPointLogItem) => {
  if (item.userName) {
    if (item.userPhone) {
      return `${item.userName}（${item.userPhone}）`
    }
    if (item.userEmail) {
      return `${item.userName}（${item.userEmail}）`
    }
    return item.userName
  }
  return item.userPhone || item.userEmail || '未知用户'
}

const resolvePointLogStatusText = (item: AdminPointLogItem) => {
  if (item.canCompensate) return '待补偿'
  if (item.refunded) return '已退款'
  if (item.generationStatus === 'FAILED') return '失败未退'
  if (item.generationStatus === 'STOPPED') return '停止未退'
  return item.action === 'DECREASE' ? '已支出' : '已入账'
}

const resolvePointLogStatusClass = (item: AdminPointLogItem) => {
  if (item.canCompensate) return 'admin-status--warning'
  if (item.refunded) return 'admin-status--success'
  return item.action === 'DECREASE' ? 'admin-status--muted' : 'admin-status--success'
}

const loadAllData = async () => {
  loading.value = true
  try {
    const [overviewData, levelData, planData, packageData, rewardData, batchData, pointLogData] = await Promise.all([
      getAdminMarketingOverview(),
      listMembershipLevels(),
      listMembershipPlans(),
      listRechargePackages(),
      listRewardRules(),
      listCardBatches(),
      listAdminPointLogs({
        ...pointLogFilters,
        page: pointLogPagination.page,
        pageSize: pointLogPagination.pageSize,
      }),
    ])
    overview.value = overviewData
    levels.value = levelData
    plans.value = planData
    packages.value = packageData
    rewardRules.value = rewardData
    cardBatches.value = batchData
    pointLogs.value = Array.isArray(pointLogData.items) ? pointLogData.items : []
    pointLogSummary.totalCount = Number(pointLogData.summary?.totalCount || 0)
    pointLogSummary.compensableCount = Number(pointLogData.summary?.compensableCount || 0)
    pointLogSummary.refundCount = Number(pointLogData.summary?.refundCount || 0)
    pointLogSummary.windowDays = Number(pointLogData.summary?.windowDays || pointLogFilters.days)
    pointLogSummary.page = Number(pointLogData.summary?.page || pointLogPagination.page)
    pointLogSummary.pageSize = Number(pointLogData.summary?.pageSize || pointLogPagination.pageSize)
    pointLogSummary.totalPages = Number(pointLogData.summary?.totalPages || 1)
    selectedCompensationAssociationNos.value = selectedCompensationAssociationNos.value
      .filter((item) => pointLogs.value.some((log) => log.associationNo === item && log.canCompensate))
    pointLogPagination.page = pointLogSummary.page
    pointLogPagination.pageSize = pointLogSummary.pageSize
  } finally {
    loading.value = false
  }
}

const openLevelDialog = (item?: MembershipLevelItem) => {
  levelEditingId.value = item?.id || ''
  assignForm(levelForm, item ? {
    name: item.name,
    level: item.level,
    description: item.description || '',
    iconUrl: item.iconUrl || '',
    monthlyBonusPoints: item.monthlyBonusPoints,
    storageCapacity: Number(item.storageCapacity || 0),
    benefitsJsonText: formatJsonText(item.benefitsJson, '[]'),
    isEnabled: item.isEnabled,
    sortOrder: item.sortOrder,
  } : createLevelForm())
  levelDialogVisible.value = true
}

const closeLevelDialog = () => {
  levelDialogVisible.value = false
  levelEditingId.value = ''
  assignForm(levelForm, createLevelForm())
}

const handleSubmitLevel = async () => {
  submitting.value = true
  try {
    const payload = {
      name: levelForm.name,
      level: Number(levelForm.level || 1),
      description: levelForm.description || '',
      iconUrl: levelForm.iconUrl || '',
      monthlyBonusPoints: Number(levelForm.monthlyBonusPoints || 0),
      storageCapacity: Number(levelForm.storageCapacity || 0),
      benefitsJson: parseJsonText(levelForm.benefitsJsonText, []),
      isEnabled: Boolean(levelForm.isEnabled),
      sortOrder: Number(levelForm.sortOrder || 0),
    }
    if (levelEditingId.value) {
      await updateMembershipLevel(levelEditingId.value, payload)
    } else {
      await createMembershipLevel(payload)
    }
    closeLevelDialog()
    await loadAllData()
  } finally {
    submitting.value = false
  }
}

/** 列表内启用开关：只改 isEnabled，避免整表单提交。 */
const withEnableToggle = async (id: string, runner: () => Promise<unknown>) => {
  if (enableTogglingId.value) {
    return
  }
  enableTogglingId.value = id
  try {
    await runner()
    await loadAllData()
  } finally {
    enableTogglingId.value = ''
  }
}

const handleToggleLevelEnabled = async (item: MembershipLevelItem, enabled: boolean) => {
  if (item.isEnabled === enabled) {
    return
  }
  await withEnableToggle(item.id, () => updateMembershipLevel(item.id, { isEnabled: enabled }))
}

const handleTogglePlanEnabled = async (item: MembershipPlanItem, enabled: boolean) => {
  if (item.isEnabled === enabled) {
    return
  }
  await withEnableToggle(item.id, () => updateMembershipPlan(item.id, { isEnabled: enabled }))
}

const handleTogglePackageEnabled = async (item: RechargePackageItem, enabled: boolean) => {
  if (item.isEnabled === enabled) {
    return
  }
  await withEnableToggle(item.id, () => updateRechargePackage(item.id, { isEnabled: enabled }))
}

const handleToggleRewardEnabled = async (item: RewardRuleItem, enabled: boolean) => {
  if (item.isEnabled === enabled) {
    return
  }
  await withEnableToggle(item.id, () => updateRewardRule(item.id, { isEnabled: enabled }))
}

const handleToggleBatchEnabled = async (item: CardBatchItem, enabled: boolean) => {
  if (item.isEnabled === enabled) {
    return
  }
  await withEnableToggle(item.id, () => updateCardBatch(item.id, { isEnabled: enabled }))
}

const handleDeleteLevel = async (item: MembershipLevelItem) => {
  if (!window.confirm(`确认删除会员等级“${item.name}”吗？`)) {
    return
  }
  await deleteMembershipLevel(item.id)
  await loadAllData()
}

const openPlanDialog = (item?: MembershipPlanItem) => {
  planEditingId.value = item?.id || ''
  assignForm(planForm, item ? {
    name: item.name,
    label: item.label || '',
    description: item.description || '',
    durationValue: item.durationValue,
    durationUnit: item.durationUnit || 'MONTH',
    bonusPoints: item.bonusPoints,
    billingRules: Array.isArray(item.billingRules) && item.billingRules.length
      ? item.billingRules.map((rule) => ({
          levelId: rule.levelId || '',
          salesPrice: normalizeMoneyString(rule.salesPrice),
          originalPrice: rule.originalPrice === null || rule.originalPrice === undefined ? '' : normalizeMoneyString(rule.originalPrice),
          label: rule.label || '',
          status: rule.status !== false,
        }))
      : [createPlanBillingRule()],
    benefitsJsonText: formatJsonText(item.benefitsJson, '[]'),
    isEnabled: item.isEnabled,
    sortOrder: item.sortOrder,
  } : createPlanForm())
  planDialogVisible.value = true
}

const closePlanDialog = () => {
  planDialogVisible.value = false
  planEditingId.value = ''
  assignForm(planForm, createPlanForm())
}

const handleSubmitPlan = async () => {
  submitting.value = true
  try {
    const payload = {
      name: planForm.name,
      label: planForm.label || '',
      description: planForm.description || '',
      durationType: planForm.durationUnit === 'YEAR' ? 'YEAR' : planForm.durationUnit === 'MONTH' && Number(planForm.durationValue || 1) === 12 ? 'YEAR' : planForm.durationUnit === 'MONTH' && Number(planForm.durationValue || 1) === 6 ? 'HALF_YEAR' : planForm.durationUnit === 'MONTH' && Number(planForm.durationValue || 1) === 3 ? 'QUARTER' : planForm.durationUnit === 'MONTH' && Number(planForm.durationValue || 1) === 1 ? 'MONTH' : 'CUSTOM',
      durationValue: Number(planForm.durationValue || 1),
      durationUnit: planForm.durationUnit,
      bonusPoints: Number(planForm.bonusPoints || 0),
      billingRules: planForm.billingRules.map((rule) => ({
        levelId: rule.levelId,
        salesPrice: parseDecimalInput(rule.salesPrice),
        originalPrice: parseOptionalDecimalInput(rule.originalPrice),
        label: rule.label || '',
        status: Boolean(rule.status),
      })).filter((rule) => rule.levelId),
      benefitsJson: parseJsonText(planForm.benefitsJsonText, []),
      isEnabled: Boolean(planForm.isEnabled),
      sortOrder: Number(planForm.sortOrder || 0),
    }
    if (planEditingId.value) {
      await updateMembershipPlan(planEditingId.value, payload)
    } else {
      await createMembershipPlan(payload)
    }
    closePlanDialog()
    await loadAllData()
  } finally {
    submitting.value = false
  }
}

const handleDeletePlan = async (item: MembershipPlanItem) => {
  if (!window.confirm(`确认删除会员计划“${item.name}”吗？`)) {
    return
  }
  await deleteMembershipPlan(item.id)
  await loadAllData()
}

const openPackageDialog = (item?: RechargePackageItem) => {
  packageEditingId.value = item?.id || ''
  assignForm(packageForm, item ? {
    name: item.name,
    label: item.label || '',
    description: item.description || '',
    points: item.points,
    bonusPoints: item.bonusPoints,
    price: normalizeMoneyString(item.price),
    originalPrice: item.originalPrice === null || item.originalPrice === undefined ? '' : normalizeMoneyString(item.originalPrice),
    badgeText: item.badgeText || '',
    benefitsText: parsePackageBenefitsText(item.metaJson),
    isEnabled: item.isEnabled,
    sortOrder: item.sortOrder,
    metaJsonText: formatJsonText(item.metaJson, '{}'),
  } : createPackageForm())
  packageDialogVisible.value = true
}

const closePackageDialog = () => {
  packageDialogVisible.value = false
  packageEditingId.value = ''
  assignForm(packageForm, createPackageForm())
}

const handleSubmitPackage = async () => {
  submitting.value = true
  try {
    const payload = {
      name: packageForm.name,
      label: packageForm.label || '',
      description: packageForm.description || '',
      points: Number(packageForm.points || 0),
      bonusPoints: Number(packageForm.bonusPoints || 0),
      price: parseDecimalInput(packageForm.price),
      originalPrice: parseOptionalDecimalInput(packageForm.originalPrice),
      badgeText: packageForm.badgeText || '',
      isEnabled: Boolean(packageForm.isEnabled),
      sortOrder: Number(packageForm.sortOrder || 0),
      metaJson: mergePackageMetaJson(packageForm.metaJsonText, packageForm.benefitsText),
    }
    if (packageEditingId.value) {
      await updateRechargePackage(packageEditingId.value, payload)
    } else {
      await createRechargePackage(payload)
    }
    closePackageDialog()
    await loadAllData()
  } finally {
    submitting.value = false
  }
}

const handleDeletePackage = async (item: RechargePackageItem) => {
  if (!window.confirm(`确认删除充值套餐“${item.name}”吗？`)) {
    return
  }
  await deleteRechargePackage(item.id)
  await loadAllData()
}

const openRewardDialog = (item?: RewardRuleItem) => {
  rewardEditingId.value = item?.id || ''
  assignForm(rewardForm, item ? {
    code: item.code,
    triggerType: item.triggerType,
    name: item.name,
    description: item.description || '',
    rewardPoints: item.rewardPoints,
    cycleType: item.cycleType,
    limitPerCycle: item.limitPerCycle,
    isEnabled: item.isEnabled,
    conditionJsonText: formatJsonText(item.conditionJson, '{}'),
    sortOrder: item.sortOrder,
  } : createRewardForm())
  rewardDialogVisible.value = true
}

const closeRewardDialog = () => {
  rewardDialogVisible.value = false
  rewardEditingId.value = ''
  assignForm(rewardForm, createRewardForm())
}

const handleSubmitReward = async () => {
  submitting.value = true
  try {
    const payload = {
      code: rewardForm.code,
      triggerType: rewardForm.triggerType,
      name: rewardForm.name,
      description: rewardForm.description || '',
      rewardPoints: Number(rewardForm.rewardPoints || 0),
      cycleType: rewardForm.cycleType,
      limitPerCycle: Number(rewardForm.limitPerCycle || 1),
      isEnabled: Boolean(rewardForm.isEnabled),
      conditionJson: parseJsonText(rewardForm.conditionJsonText, {}),
      sortOrder: Number(rewardForm.sortOrder || 0),
    }
    if (rewardEditingId.value) {
      await updateRewardRule(rewardEditingId.value, payload)
    } else {
      await createRewardRule(payload)
    }
    closeRewardDialog()
    await loadAllData()
  } finally {
    submitting.value = false
  }
}

const handleDeleteReward = async (item: RewardRuleItem) => {
  if (!window.confirm(`确认删除奖励规则“${item.name}”吗？`)) {
    return
  }
  await deleteRewardRule(item.id)
  await loadAllData()
}

const openBatchDialog = (item?: CardBatchItem) => {
  batchEditingId.value = item?.id || ''
  assignForm(batchForm, item ? {
    name: item.name,
    batchNo: item.batchNo,
    description: item.description || '',
    rewardType: item.rewardType,
    rewardPoints: item.rewardPoints,
    rewardLevelId: item.rewardLevelId || '',
    rewardDays: item.rewardDays || 30,
    totalCount: item.totalCount,
    expiresAt: toDatetimeLocalValue(item.expiresAt),
    isEnabled: item.isEnabled,
    metaJsonText: formatJsonText(item.metaJson, '{}'),
  } : createBatchForm())
  batchDialogVisible.value = true
}

const closeBatchDialog = () => {
  batchDialogVisible.value = false
  batchEditingId.value = ''
  assignForm(batchForm, createBatchForm())
}

const handleSubmitBatch = async () => {
  submitting.value = true
  try {
    const payload = {
      name: batchForm.name,
      batchNo: batchForm.batchNo,
      description: batchForm.description || '',
      rewardType: batchForm.rewardType,
      rewardPoints: batchForm.rewardType === 'POINTS' ? Number(batchForm.rewardPoints || 0) : 0,
      rewardLevelId: batchForm.rewardType === 'MEMBERSHIP' ? batchForm.rewardLevelId : '',
      rewardDays: batchForm.rewardType === 'MEMBERSHIP' ? Number(batchForm.rewardDays || 30) : null,
      totalCount: Number(batchForm.totalCount || 1),
      expiresAt: batchForm.expiresAt ? new Date(batchForm.expiresAt).toISOString() : '',
      isEnabled: Boolean(batchForm.isEnabled),
      metaJson: parseJsonText(batchForm.metaJsonText, {}),
    }
    if (batchEditingId.value) {
      await updateCardBatch(batchEditingId.value, payload)
    } else {
      await createCardBatch(payload)
    }
    closeBatchDialog()
    await loadAllData()
  } finally {
    submitting.value = false
  }
}

const handleDeleteBatch = async (item: CardBatchItem) => {
  if (!window.confirm(`确认删除卡密批次“${item.name}”吗？此操作会删除批次下所有卡密。`)) {
    return
  }
  await deleteCardBatch(item.id)
  await loadAllData()
}

const openCodesDialog = async (item: CardBatchItem) => {
  currentBatch.value = item
  codesDialogVisible.value = true
  codesLoading.value = true
  try {
    cardCodes.value = await listCardCodesByBatch(item.id)
  } finally {
    codesLoading.value = false
  }
}

const closeCodesDialog = () => {
  codesDialogVisible.value = false
  currentBatch.value = null
  cardCodes.value = []
}

onMounted(() => {
  void loadAllData()
})
</script>


<style scoped>




















.admin-marketing-main {
  display: flex;
  flex-direction: column;
  gap: 18px;
  min-width: 0;
}









.admin-marketing-section-shell {
  display: flex;
  flex-direction: column;
  gap: 18px;
}



.admin-marketing-package-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-top: 2px;
  color: var(--text-tertiary);
  font-size: 12px;
  line-height: 1.6;
}

.admin-marketing-package-card__footer-text {
  white-space: nowrap;
}

.admin-marketing-log-toolbar {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 18px;
  padding: 16px;
  border: 1px solid var(--line-divider, #00000014);
  border-radius: 16px;
  background: var(--bg-block-primary-default);
}

.admin-marketing-log-toolbar__search {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: end;
}

.admin-marketing-log-toolbar__actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.admin-marketing-log-filters {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
}

.admin-marketing-log-filter-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.admin-marketing-log-filter-field--search {
  min-width: 0;
}

.admin-marketing-log-filter-field__label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-tertiary);
}

.admin-marketing-log-filter-field__control {
  width: 100%;
  min-height: 42px;
  border: 1px solid var(--line-divider, #00000014);
  border-radius: 12px;
  background: var(--bg-surface);
  color: var(--text-primary);
  box-sizing: border-box;
  transition: border-color .2s ease, box-shadow .2s ease, background-color .2s ease;
}

.admin-marketing-log-filter-field__control:focus {
  border-color: color-mix(in srgb, var(--brand-main-default) 48%, var(--line-divider, #00000014));
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--brand-main-default) 14%, transparent);
  outline: none;
}

.admin-marketing-log-filter-field__control.admin-input {
  padding: 0 14px;
}

.admin-marketing-log-filter-field__control.admin-select {
  padding: 0 42px 0 14px;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  cursor: pointer;
  background-image:
    linear-gradient(45deg, transparent 50%, var(--text-tertiary) 50%),
    linear-gradient(135deg, var(--text-tertiary) 50%, transparent 50%),
    linear-gradient(to right, color-mix(in srgb, var(--line-divider, #00000014) 100%, transparent), color-mix(in srgb, var(--line-divider, #00000014) 100%, transparent));
  background-position:
    calc(100% - 18px) calc(50% - 3px),
    calc(100% - 12px) calc(50% - 3px),
    calc(100% - 38px) 50%;
  background-size:
    6px 6px,
    6px 6px,
    1px 18px;
  background-repeat: no-repeat;
}

.admin-marketing-log-filter-field__control.admin-select:hover {
  border-color: color-mix(in srgb, var(--brand-main-default) 26%, var(--line-divider, #00000014));
  background-color: color-mix(in srgb, var(--bg-surface) 92%, var(--brand-main-default) 8%);
}

.admin-marketing-log-filter-field__control.admin-select option {
  color: var(--text-primary);
  background: var(--bg-surface);
}

.admin-marketing-log-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.admin-marketing-log-summary__item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 84px;
  padding: 14px 16px;
  border-radius: 14px;
  border: 1px solid var(--line-divider, #00000014);
  background: var(--bg-block-primary-default);
}

.admin-marketing-log-summary__label {
  font-size: 12px;
  color: var(--text-tertiary);
}

.admin-marketing-log-summary__value {
  font-size: 24px;
  line-height: 1.1;
  color: var(--text-primary);
}

.admin-point-log-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.admin-point-log-item {
  grid-template-columns: auto minmax(0, 1.8fr) minmax(180px, 0.7fr) auto;
  gap: 14px;
  align-items: flex-start;
  padding: 16px 18px;
  border-radius: 16px;
  border: 1px solid var(--line-divider, #00000014);
  background: var(--bg-block-primary-default);
}

.admin-point-log-item__check {
  padding-top: 4px;
}

.admin-point-log-item__main {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.admin-point-log-item__headline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.admin-point-log-item__amount {
  white-space: nowrap;
}

.admin-point-log-item__amount.is-increase {
  color: var(--brand-main-default);
}

.admin-point-log-item__amount.is-decrease {
  color: #ff8a65;
}

.admin-point-log-item__meta-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 12px;
}

.admin-point-log-item__copy-button {
  margin-left: 8px;
  padding: 0;
  min-height: auto;
  border: none;
  background: transparent;
  color: var(--brand-main-default);
  font-size: 12px;
  font-weight: 500;
}

.admin-point-log-item__aside {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.admin-point-log-item__status {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.admin-point-log-item__compensation-reason {
  font-size: 12px;
  line-height: 1.6;
  text-align: right;
  color: var(--text-tertiary);
}

.admin-membership-billing-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.admin-membership-billing-item {
  display: grid;
  grid-template-columns: 1.2fr 1fr 1fr 1fr auto auto;
  gap: 12px;
  align-items: center;
  padding: 12px;
  border-radius: 12px;
  background: var(--bg-block-primary-default);
  border: 1px solid var(--line-divider, #00000014);
}

.admin-form__label--row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.admin-membership-billing-switch {
  white-space: nowrap;
}

.admin-compensation-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.admin-compensation-item {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 12px;
  align-items: flex-start;
  cursor: pointer;
}

.admin-compensation-item__check {
  padding-top: 4px;
}

.admin-compensation-item__body {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.admin-compensation-item__error {
  color: var(--text-danger, #d14343);
}

.admin-checkbox {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  color: var(--text-secondary, rgba(15, 23, 42, 0.68));
}

@media (max-width: 1100px) {
  .admin-marketing-tabs__item {
    flex: 0 0 auto;
  }

  .admin-membership-billing-item {
    grid-template-columns: 1fr 1fr;
  }

  .admin-marketing-log-kpis {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .admin-marketing-log-toolbar__actions {
    margin-left: 0;
    width: 100%;
  }
}

@media (max-width: 720px) {
  .admin-marketing-log-kpis {
    grid-template-columns: minmax(0, 1fr);
  }

  .admin-marketing-log-toolbar__select,
  .admin-marketing-log-toolbar__search {
    flex: 1 1 100%;
  }
}
</style>
