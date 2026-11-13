<template>
  <AdminPageContainer
    class="admin-list-page"
    title="数据看板"
    description="订单、用户与生成数据概览。"
    compact
  >
    <div v-if="loading && !overview" class="admin-dashboard">
      <div class="admin-dashboard__grid admin-dashboard__grid--stats">
        <div v-for="index in 3" :key="`stat-skeleton-${index}`" class="admin-dashboard-data-card is-skeleton">
          <div class="admin-dashboard-skeleton is-title" />
          <div class="admin-dashboard-skeleton is-line" />
          <div class="admin-dashboard-skeleton is-line" />
          <div class="admin-dashboard-skeleton is-line" />
        </div>
      </div>
    </div>

    <div v-else-if="!overview" class="admin-empty">暂未获取到数据看板统计。</div>

    <div v-else class="admin-dashboard">
      <div class="admin-dashboard__grid admin-dashboard__grid--stats">
        <AdminDashboardDataCard title="订单统计" description="会员直购 · 充值">
          <template #action>
            <AdminDashboardTrendAction :delta-percent="overview.order.orderChange" prefix="同比昨天" />
          </template>
          <div class="admin-dashboard-metric-row">
            <span class="admin-dashboard-metric-row__label">本月收入</span>
            <strong class="admin-dashboard-metric-row__value">
              <span class="admin-dashboard-metric-row__currency">¥</span>{{ formatAmount(overview.order.monthOrderAmount) }}
            </strong>
          </div>
          <div class="admin-dashboard-metric-row">
            <span class="admin-dashboard-metric-row__label">今日订单</span>
            <strong class="admin-dashboard-metric-row__value">{{ formatNumber(overview.order.ordersToday) }}</strong>
          </div>
          <div class="admin-dashboard-metric-tiles" aria-label="订单明细">
            <div
              v-for="item in orderTileRows"
              :key="item.key"
              class="admin-dashboard-metric-tiles__item"
            >
              <span class="admin-dashboard-metric-tiles__label">{{ item.label }}</span>
              <strong class="admin-dashboard-metric-tiles__total">{{ item.value }}</strong>
              <span class="admin-dashboard-metric-tiles__sub">{{ item.sub }}</span>
            </div>
          </div>
        </AdminDashboardDataCard>

        <AdminDashboardDataCard title="用户统计" description="注册 · 活跃 · 新增">
          <template #action>
            <AdminDashboardTrendAction :delta-percent="overview.user.userChange" prefix="同比昨天" />
          </template>
          <div class="admin-dashboard-metric-row">
            <span class="admin-dashboard-metric-row__label">用户总数</span>
            <strong class="admin-dashboard-metric-row__value">{{ formatNumber(overview.user.totalUsers) }}</strong>
          </div>
          <div class="admin-dashboard-metric-row">
            <span class="admin-dashboard-metric-row__label">今日新增</span>
            <strong class="admin-dashboard-metric-row__value">{{ formatNumber(overview.user.newUsersToday) }}</strong>
          </div>
          <div class="admin-dashboard-metric-tiles" aria-label="用户明细">
            <div
              v-for="item in userTileRows"
              :key="item.key"
              class="admin-dashboard-metric-tiles__item"
            >
              <span class="admin-dashboard-metric-tiles__label">{{ item.label }}</span>
              <strong class="admin-dashboard-metric-tiles__total">{{ item.value }}</strong>
              <span class="admin-dashboard-metric-tiles__sub">{{ item.sub }}</span>
            </div>
          </div>
        </AdminDashboardDataCard>

        <AdminDashboardDataCard title="生成统计" description="文本 · 生图 · 视频次数">
          <template #action>
            <AdminDashboardTrendAction
              :delta-percent="overview.chat.chatChange"
              prefix="同比昨天"
              positive-tone="info"
            />
          </template>
          <div class="admin-dashboard-metric-row">
            <span class="admin-dashboard-metric-row__label">累计消耗积分</span>
            <strong class="admin-dashboard-metric-row__value">{{ formatNumber(overview.chat.totalConsumePoints) }}</strong>
          </div>
          <div class="admin-dashboard-metric-row">
            <span class="admin-dashboard-metric-row__label">今日生成</span>
            <strong class="admin-dashboard-metric-row__value">{{ formatNumber(overview.chat.conversationsToday) }}</strong>
          </div>
          <div class="admin-dashboard-metric-tiles" aria-label="按类型统计">
            <div
              v-for="item in generationTypeRows"
              :key="item.key"
              class="admin-dashboard-metric-tiles__item"
            >
              <span class="admin-dashboard-metric-tiles__label">{{ item.label }}</span>
              <strong class="admin-dashboard-metric-tiles__total">{{ formatNumber(item.total) }}</strong>
              <span class="admin-dashboard-metric-tiles__sub">今日 {{ formatNumber(item.today) }}</span>
            </div>
          </div>
        </AdminDashboardDataCard>
      </div>

      <div class="admin-dashboard__grid admin-dashboard__grid--main">
        <AdminDashboardDataCard
          class="admin-dashboard-data-card--span-2"
          title="用户趋势"
          :description="`近${userDays}天用户访问与注册趋势`"
          content-class="admin-dashboard-data-card__content--chart"
        >
          <template #action>
            <AdminDashboardRangeSelect
              v-model="userDays"
              aria-label="用户趋势时间范围"
            />
          </template>
          <AdminDashboardAreaChart
            :labels="userChartLabels"
            :series="userChartSeries"
            :values="userChartValues"
            height="18.75rem"
          />
        </AdminDashboardDataCard>

        <AdminDashboardDataCard
          :title="consumeRankingSource === 'points' ? '积分使用排行' : '中转调用排行'"
          :description="consumeRankingSource === 'points'
            ? `近${RANKING_DAYS}天积分消耗排行`
            : `近${RANKING_DAYS}天中转调用次数`"
          content-class="admin-dashboard-data-card__content--list"
        >
          <template #action>
            <div class="admin-dashboard-rank-filters">
              <div class="admin-dashboard-tabs" role="tablist" aria-label="排行口径">
                <button
                  class="admin-dashboard-tabs__item"
                  :class="{ 'is-active': consumeRankingSource === 'points' }"
                  type="button"
                  role="tab"
                  :aria-selected="consumeRankingSource === 'points'"
                  @click="consumeRankingSource = 'points'"
                >
                  积分
                </button>
                <button
                  class="admin-dashboard-tabs__item"
                  :class="{ 'is-active': consumeRankingSource === 'gateway' }"
                  type="button"
                  role="tab"
                  :aria-selected="consumeRankingSource === 'gateway'"
                  @click="consumeRankingSource = 'gateway'"
                >
                  中转调用
                </button>
              </div>
              <div class="admin-dashboard-tabs" role="tablist" aria-label="排行维度">
                <button
                  class="admin-dashboard-tabs__item"
                  :class="{ 'is-active': consumeRankingType === 'model' }"
                  type="button"
                  role="tab"
                  :aria-selected="consumeRankingType === 'model'"
                  @click="consumeRankingType = 'model'"
                >
                  模型
                </button>
                <button
                  class="admin-dashboard-tabs__item"
                  :class="{ 'is-active': consumeRankingType === 'provider' }"
                  type="button"
                  role="tab"
                  :aria-selected="consumeRankingType === 'provider'"
                  @click="consumeRankingType = 'provider'"
                >
                  供应商
                </button>
              </div>
            </div>
          </template>
          <div class="admin-dashboard-rank-list">
            <div class="admin-dashboard-rank-list__head">
              <span class="admin-dashboard-rank-list__index">排名</span>
              <span>{{ consumeRankingType === 'model' ? '模型信息' : '供应商信息' }}</span>
              <span class="admin-dashboard-rank-list__head-side">
                {{ consumeRankingSource === 'points' ? '消耗' : '调用' }}
              </span>
            </div>
            <div v-if="!consumeRankingRows.length" class="admin-dashboard-rank-empty">
              {{ consumeRankingSource === 'points' ? '暂无消耗数据' : '暂无中转调用数据' }}
            </div>
            <div
              v-for="(item, index) in consumeRankingRows"
              :key="`${consumeRankingSource}-${consumeRankingType}-${item.id}-${index}`"
              class="admin-dashboard-rank-list__row"
            >
              <div class="admin-dashboard-rank-list__main">
                <span class="admin-dashboard-rank-list__index">#{{ index + 1 }}</span>
                <div class="admin-dashboard-rank-list__avatar">
                  <span>{{ getInitial(item.name) }}</span>
                </div>
                <div class="admin-dashboard-rank-list__info">
                  <div class="admin-dashboard-rank-list__title">{{ item.name }}</div>
                  <div class="admin-dashboard-rank-list__meta">
                    {{ item.providerName || (consumeRankingType === 'model' ? '模型' : '供应商') }}
                  </div>
                </div>
              </div>
              <div class="admin-dashboard-rank-list__side">
                <template v-if="consumeRankingSource === 'points'">
                  <div class="admin-dashboard-rank-list__value">{{ formatPoints(item.points) }}</div>
                  <div class="admin-dashboard-rank-list__meta">{{ item.conversations }}次</div>
                </template>
                <template v-else>
                  <div class="admin-dashboard-rank-list__value is-bold">{{ formatNumber(item.conversations) }}</div>
                  <div class="admin-dashboard-rank-list__meta">次</div>
                </template>
              </div>
            </div>
          </div>
        </AdminDashboardDataCard>
      </div>

      <div class="admin-dashboard__grid admin-dashboard__grid--main">
        <AdminDashboardDataCard
          class="admin-dashboard-data-card--span-2"
          title="收入趋势"
          :description="`近${revenueDays}天收入与订单趋势`"
          content-class="admin-dashboard-data-card__content--chart"
        >
          <template #action>
            <AdminDashboardRangeSelect
              v-model="revenueDays"
              aria-label="收入趋势时间范围"
            />
          </template>
          <AdminDashboardAreaChart
            :labels="revenueChartLabels"
            :series="revenueChartSeries"
            :values="revenueChartValues"
            height="18.75rem"
          />
        </AdminDashboardDataCard>

        <AdminDashboardDataCard
          :title="userRankingSource === 'points' ? '用户消耗排行' : '中转用户排行'"
          :description="userRankingSource === 'points'
            ? `近${RANKING_DAYS}天用户积分消耗`
            : `近${RANKING_DAYS}天中转用户调用次数（令牌侧计费）`"
          content-class="admin-dashboard-data-card__content--list"
        >
          <template #action>
            <div class="admin-dashboard-tabs" role="tablist" aria-label="用户排行口径">
              <button
                class="admin-dashboard-tabs__item"
                :class="{ 'is-active': userRankingSource === 'points' }"
                type="button"
                role="tab"
                :aria-selected="userRankingSource === 'points'"
                @click="userRankingSource = 'points'"
              >
                积分
              </button>
              <button
                class="admin-dashboard-tabs__item"
                :class="{ 'is-active': userRankingSource === 'gateway' }"
                type="button"
                role="tab"
                :aria-selected="userRankingSource === 'gateway'"
                @click="userRankingSource = 'gateway'"
              >
                中转调用
              </button>
            </div>
          </template>
          <div class="admin-dashboard-rank-list">
            <div class="admin-dashboard-rank-list__head">
              <span class="admin-dashboard-rank-list__index">排名</span>
              <span>用户信息</span>
              <span class="admin-dashboard-rank-list__head-side">
                {{ userRankingSource === 'points' ? '消耗' : '调用' }}
              </span>
            </div>
            <div v-if="!userRankingRows.length" class="admin-dashboard-rank-empty">
              {{ userRankingSource === 'points' ? '暂无用户消耗数据' : '暂无中转用户调用数据' }}
            </div>
            <div
              v-for="(item, index) in userRankingRows"
              :key="`${userRankingSource}-${item.id}`"
              class="admin-dashboard-rank-list__row"
            >
              <div class="admin-dashboard-rank-list__main">
                <span class="admin-dashboard-rank-list__index">#{{ index + 1 }}</span>
                <div class="admin-dashboard-rank-list__avatar is-user">
                  <span>{{ getInitial(item.name) }}</span>
                </div>
                <div class="admin-dashboard-rank-list__info">
                  <div class="admin-dashboard-rank-list__title">{{ item.name }}</div>
                  <div class="admin-dashboard-rank-list__meta">
                    {{ item.username ? `@${item.username}` : `ID：${item.id}` }}
                  </div>
                </div>
              </div>
              <div class="admin-dashboard-rank-list__side">
                <template v-if="userRankingSource === 'points'">
                  <div class="admin-dashboard-rank-list__value">{{ formatPoints(item.points) }}</div>
                  <div class="admin-dashboard-rank-list__meta">{{ item.conversations }}次</div>
                </template>
                <template v-else>
                  <div class="admin-dashboard-rank-list__value is-bold">{{ formatNumber(item.conversations) }}</div>
                  <div class="admin-dashboard-rank-list__meta">次</div>
                </template>
              </div>
            </div>
          </div>
        </AdminDashboardDataCard>
      </div>
    </div>
  </AdminPageContainer>
</template>

<script setup lang="ts">
/**
 * 数据看板：缺订单 / 用户 / 图表 / 排行接口时用演示数据填满；生成总量若有真实 overview 则叠加上去。
 */
defineOptions({ name: 'AdminDashboard' })

import './admin-dashboard.css'
import { computed, onMounted, ref } from 'vue'
import AdminPageContainer from '@/components/admin/layout/AdminPageContainer.vue'
import { getAdminDashboardOverview } from '@/api/admin-dashboard'
import AdminDashboardAreaChart from './components/AdminDashboardAreaChart.vue'
import AdminDashboardDataCard from './components/AdminDashboardDataCard.vue'
import AdminDashboardRangeSelect from './components/AdminDashboardRangeSelect.vue'
import AdminDashboardTrendAction from './components/AdminDashboardTrendAction.vue'
import {
  createDemoDashboardOverview,
  mergeCmOverviewIntoDemo,
  type DemoDashboardOverview,
} from './composables/admin-dashboard.demo'

const RANKING_DAYS = 15

const loading = ref(false)
const overview = ref<DemoDashboardOverview | null>(null)
const userDays = ref(15)
const revenueDays = ref(15)
const consumeRankingSource = ref<'points' | 'gateway'>('points')
const consumeRankingType = ref<'model' | 'provider'>('model')
const userRankingSource = ref<'points' | 'gateway'>('points')

const sliceChart = <T,>(items: T[], days: number) => items.slice(Math.max(0, items.length - days))

const userChartData = computed(() => sliceChart(overview.value?.userDetail.chartData || [], userDays.value))
const revenueChartData = computed(() => sliceChart(overview.value?.revenueDetail.chartData || [], revenueDays.value))

const userChartLabels = computed(() => userChartData.value.map(item => item.label))
const userChartSeries = [
  { key: 'visit', label: '访问数', color: '#6366f1' },
  { key: 'register', label: '注册数', color: '#22c55e' },
]
const userChartValues = computed(() => ({
  visit: userChartData.value.map(item => item.visit),
  register: userChartData.value.map(item => item.register),
}))

const revenueChartLabels = computed(() => revenueChartData.value.map(item => item.label))
const revenueChartSeries = [
  { key: 'revenue', label: '收入', color: '#f59e0b' },
  { key: 'orders', label: '订单数', color: '#3b82f6' },
]
const revenueChartValues = computed(() => ({
  revenue: revenueChartData.value.map(item => item.revenue),
  orders: revenueChartData.value.map(item => item.orders),
}))

const consumeRankingRows = computed(() => {
  if (!overview.value) {
    return []
  }
  const bucket = consumeRankingSource.value === 'points'
    ? overview.value.consumeUsage
    : overview.value.gatewayUsage
  return consumeRankingType.value === 'model' ? bucket.byModel : bucket.byProvider
})

const userRankingRows = computed(() => {
  if (!overview.value) {
    return []
  }
  if (userRankingSource.value === 'points') {
    return overview.value.userConsumeRanking
  }
  return overview.value.gatewayUsage.byUser
})

const emptyChatTypeStat = () => ({ total: 0, today: 0, consumePoints: 0 })

const orderTileRows = computed(() => {
  const order = overview.value?.order
  return [
    {
      key: 'today-amount',
      label: '今日金额',
      value: `¥${formatAmount(order?.todayOrderAmount || 0)}`,
      sub: `昨日 ¥${formatAmount(order?.yesterdayOrderAmount || 0)}`,
    },
    {
      key: 'today-count',
      label: '今日笔数',
      value: formatNumber(order?.ordersToday || 0),
      sub: `昨日 ${formatNumber(order?.ordersYesterday || 0)}`,
    },
    {
      key: 'month-count',
      label: '本月笔数',
      value: formatNumber(order?.monthOrderCount || 0),
      sub: `收入 ¥${formatAmount(order?.monthOrderAmount || 0)}`,
    },
  ]
})

const userTileRows = computed(() => {
  const user = overview.value?.user
  return [
    {
      key: 'total',
      label: '全部用户',
      value: formatNumber(user?.totalUsers || 0),
      sub: '含历史注册',
    },
    {
      key: 'active',
      label: '活跃用户',
      value: formatNumber(user?.activeUsers || 0),
      sub: '近 30 天',
    },
    {
      key: 'new',
      label: '今日新增',
      value: formatNumber(user?.newUsersToday || 0),
      sub: `昨日 ${formatNumber(user?.newUsersYesterday || 0)}`,
    },
  ]
})

const generationTypeRows = computed(() => {
  const byType = overview.value?.chat.byType
  const text = byType?.text || emptyChatTypeStat()
  const image = byType?.image || emptyChatTypeStat()
  const video = byType?.video || emptyChatTypeStat()
  return [
    { key: 'text', label: '文本', total: text.total, today: text.today },
    { key: 'image', label: '生图', total: image.total, today: image.today },
    { key: 'video', label: '视频', total: video.total, today: video.today },
  ]
})

const formatNumber = (value: number) => Number(value || 0).toLocaleString('zh-CN')

const formatAmount = (value: number) => {
  const numeric = Number(value || 0)
  if (!Number.isFinite(numeric)) {
    return '0'
  }
  return numeric.toLocaleString('zh-CN', {
    minimumFractionDigits: Number.isInteger(numeric) ? 0 : 2,
    maximumFractionDigits: 2,
  })
}

const formatPoints = (value: number) => {
  const numeric = Number(value || 0)
  if (numeric >= 1000) {
    return `${(numeric / 1000).toFixed(1)}k`
  }
  return formatNumber(numeric)
}

const getInitial = (value: string, size = 1) => {
  const text = String(value || '').trim()
  if (!text) {
    return '?'
  }
  return text.slice(0, size).toUpperCase()
}

const loadOverview = async () => {
  loading.value = true
  try {
    const demo = createDemoDashboardOverview()
    const real = await getAdminDashboardOverview().catch(() => null)
    overview.value = mergeCmOverviewIntoDemo(demo, real)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void loadOverview()
})
</script>
