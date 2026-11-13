<template>
  <AdminPageContainer title="Redis 管理" description="集中查看 Redis 健康状态、缓存数量、任务运行态与分布式锁情况。">
    <template #actions>
      <button
        class="admin-button admin-button--secondary"
        type="button"
        :disabled="loading || actionLoading"
        @click="loadRedisOverview"
      >
        {{ loading ? '刷新中...' : '刷新状态' }}
      </button>
    </template>

    <div class="admin-card admin-redis-hero-card">
      <div class="admin-card__content admin-redis-hero-card__content">
        <div class="admin-redis-hero-card__main">
          <div class="admin-redis-hero-card__eyebrow">Redis 运行控制台</div>
          <div class="admin-redis-hero-card__title-row">
            <h3 class="admin-redis-hero-card__title">缓存、任务运行态与治理诊断</h3>
            <span class="admin-redis-hero-card__status" :class="overview?.health.ok ? 'is-healthy' : 'is-risky'">
              {{ overview?.health.ok ? '运行正常' : '需要关注' }}
            </span>
          </div>
          <p class="admin-redis-hero-card__desc">
            聚合查看实例标识、命名空间、业务缓存命中率、任务执行锁与排队重试状态。
          </p>
        </div>
        <div class="admin-redis-hero-card__meta">
          <div v-for="item in heroMetaItems" :key="item.label" class="admin-redis-hero-card__meta-item">
            <span>{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
          </div>
        </div>
      </div>
    </div>

    <div class="admin-grid admin-grid--stats admin-redis-stats-grid">
      <AdminStatCard label="Redis 状态" :value="overview?.health.ok ? '正常' : '异常'" hint="根据健康检查接口实时返回" />
      <AdminStatCard label="模型缓存" :value="overview?.caches.providerCatalog.count ?? 0" hint="公开模型目录缓存数量" />
      <AdminStatCard label="发现缓存" :value="overview?.caches.providerDiscover.count ?? 0" hint="厂商 /v1/models 发现结果缓存数量" />
      <AdminStatCard label="技能缓存" :value="(overview?.caches.runtimeSkills.count ?? 0) + (overview?.caches.workspaceRuntimeSkills.count ?? 0)" hint="技能运行时与工作台技能缓存总数" />
      <AdminStatCard label="任务锁" :value="overview?.tasks.lock.count ?? 0" hint="当前 Redis 中仍存在的任务执行锁数量" />
      <AdminStatCard label="幂等记录" :value="overview?.tasks.idempotency.count ?? 0" hint="用于防重复提交的短期幂等键数量" />
      <AdminStatCard label="提交限流" :value="overview?.tasks.submitRateLimit.count ?? 0" hint="当前 Redis 中仍在生效的提交限流窗口数量" />
    </div>

    <div class="admin-card admin-redis-tabs-card">
      <div class="admin-card__content admin-redis-tabs-card__content">
        <button
          v-for="item in tabItems"
          :key="item.key"
          class="admin-system-tabs__item"
          :class="{ 'is-active': currentTab === item.key }"
          type="button"
          @click="currentTab = item.key"
        >
          <span class="admin-system-tabs__title">{{ item.label }}</span>
          <span class="admin-system-tabs__desc">{{ item.description }}</span>
        </button>
      </div>
    </div>

    <div v-if="currentTab === 'overview'" class="admin-card">
      <div class="admin-card__header">
        <div>
          <h4 class="admin-card__title">Redis 总览</h4>
          <div class="admin-card__desc">按缓存、任务运行态、限流与并发模块查看当前 Redis 使用情况。</div>
        </div>
      </div>
      <div class="admin-card__content">
        <AdminSystemRedisPanel
          :overview="overview"
          :loading="loading"
          :action-loading="actionLoading"
          :on-refresh="loadRedisOverview"
          :on-clear-scope="handleClearRedisScope"
        />
      </div>
    </div>

    <div v-else-if="currentTab === 'settings'" class="admin-card admin-redis-settings-card">
      <div class="admin-card__header">
        <div>
          <h4 class="admin-card__title">运行参数</h4>
          <div class="admin-card__desc">在后台调整并发上限与限流阈值，服务端会自动读取最新配置。</div>
        </div>
        <button
          class="admin-button admin-button--primary"
          type="button"
          :disabled="settingsLoading || settingsSaving"
          @click="handleSaveRuntimeSettings"
        >
          {{ settingsSaving ? '保存中...' : '保存参数' }}
        </button>
      </div>
      <div class="admin-card__content admin-redis-settings-card__sections">
        <section class="admin-redis-settings-card__section">
          <div class="admin-redis-settings-card__section-header">
            <h5>限流参数</h5>
            <p>控制高频请求的突发窗口，适合保护任务提交、登录和模型发现接口。</p>
          </div>
          <div class="admin-redis-settings-card__grid">
            <label class="admin-redis-settings-card__field">
              <span>任务提交限流</span>
              <input v-model.number="runtimeSettings.taskSubmitRateLimit" class="admin-input" type="number" min="1" max="200">
            </label>
            <label class="admin-redis-settings-card__field">
              <span>验证码限流</span>
              <input v-model.number="runtimeSettings.authVerificationRateLimit" class="admin-input" type="number" min="1" max="200">
            </label>
            <label class="admin-redis-settings-card__field">
              <span>登录限流</span>
              <input v-model.number="runtimeSettings.authLoginRateLimit" class="admin-input" type="number" min="1" max="200">
            </label>
            <label class="admin-redis-settings-card__field">
              <span>模型发现限流</span>
              <input v-model.number="runtimeSettings.providerModelDiscoverRateLimit" class="admin-input" type="number" min="1" max="200">
            </label>
          </div>
        </section>

        <section class="admin-redis-settings-card__section">
          <div class="admin-redis-settings-card__section-header">
            <h5>并发参数</h5>
            <p>约束用户、技能和厂商的同时执行数量，减少上游过载与锁竞争。</p>
          </div>
          <div class="admin-redis-settings-card__grid">
            <label class="admin-redis-settings-card__field">
              <span>用户并发上限</span>
              <input v-model.number="runtimeSettings.taskUserConcurrencyLimit" class="admin-input" type="number" min="1" max="200">
            </label>
            <label class="admin-redis-settings-card__field">
              <span>技能并发上限</span>
              <input v-model.number="runtimeSettings.taskSkillConcurrencyLimit" class="admin-input" type="number" min="1" max="200">
            </label>
            <label class="admin-redis-settings-card__field">
              <span>厂商并发上限</span>
              <input v-model.number="runtimeSettings.taskProviderConcurrencyLimit" class="admin-input" type="number" min="1" max="500">
            </label>
          </div>
        </section>
      </div>
    </div>

    <div v-else-if="currentTab === 'business'" class="admin-card admin-redis-business-card">
      <div class="admin-card__header">
        <div>
          <h4 class="admin-card__title">业务缓存观测</h4>
          <div class="admin-card__desc">查看模块级命中率、失效次数、热 key 与大 value 风险，帮助持续优化缓存策略。</div>
        </div>
      </div>
      <div class="admin-card__content admin-redis-business-card__content">
        <div class="admin-redis-business-card__summary">
          <div v-for="item in businessSummaryItems" :key="item.label" class="admin-redis-business-card__summary-item">
            <span>{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
          </div>
        </div>

        <div class="admin-redis-business-card__toolbar">
          <div class="admin-redis-business-card__toolbar-search">
            <span>模块检索</span>
            <input
              v-model.trim="businessModuleKeyword"
              class="admin-input"
              type="text"
              placeholder="输入模块名或 key 片段"
            >
          </div>
          <div class="admin-redis-business-card__toolbar-group">
            <label class="admin-redis-business-card__toolbar-field">
              <span>排序方式</span>
              <select v-model="businessSortMode" class="admin-select">
                <option value="reads">按读取量</option>
                <option value="hit-rate">按命中率</option>
                <option value="writes">按写入量</option>
                <option value="invalidates">按失效次数</option>
                <option value="value-size">按最大 Value</option>
              </select>
            </label>
            <label class="admin-redis-business-card__toolbar-field">
              <span>健康视图</span>
              <select v-model="businessHealthFilter" class="admin-select">
                <option value="all">全部模块</option>
                <option value="healthy">健康模块</option>
                <option value="attention">需要关注</option>
                <option value="risk">高风险模块</option>
              </select>
            </label>
          </div>
        </div>

        <div class="admin-redis-business-card__stats">
          <div
            v-for="module in businessModules"
            :key="module.scope"
            class="admin-redis-business-card__stat"
            :class="`is-${module.healthLevel}`"
          >
            <div class="admin-redis-business-card__stat-header">
              <div class="admin-redis-business-card__stat-title">
                <strong>{{ module.scope }}</strong>
                <span>{{ module.currentKeyCount }} 个 key</span>
              </div>
              <span class="admin-redis-business-card__health-badge" :class="`is-${module.healthLevel}`">
                {{ module.healthLabel }}
              </span>
            </div>
            <div class="admin-redis-business-card__stat-metrics">
              <span>命中 {{ module.hitCount }}</span>
              <span>未命中 {{ module.missCount }}</span>
              <span>命中率 {{ formatPercent(module.hitRate) }}</span>
              <span>写入 {{ module.writeCount }}</span>
              <span>失效 {{ module.invalidateCount }}</span>
            </div>
          </div>
        </div>

        <div class="admin-redis-business-card__workspace">
          <div class="admin-redis-business-card__diagnostics">
          </div>

          <div class="admin-redis-business-card__modules">
            <div
              v-for="module in businessModules"
              :key="`module-${module.scope}`"
              class="admin-redis-business-card__module"
              :class="`is-${module.healthLevel}`"
            >
              <div class="admin-redis-business-card__module-header">
                <div>
                  <div class="admin-redis-business-card__module-heading">
                    <h5>{{ module.scope }}</h5>
                    <span class="admin-redis-business-card__health-badge" :class="`is-${module.healthLevel}`">
                      {{ module.healthLabel }}
                    </span>
                  </div>
                  <p>读取 {{ module.readCount }} 次，当前命中率 {{ formatPercent(module.hitRate) }}</p>
                </div>
                <div class="admin-redis-business-card__module-badges">
                  <span>最后写入 {{ formatDateTime(module.lastWriteAt) }}</span>
                  <span>最后失效 {{ formatDateTime(module.lastInvalidateAt) }}</span>
                </div>
              </div>

              <div v-if="module.healthReasons.length" class="admin-redis-business-card__module-alerts">
                <span
                  v-for="reason in module.healthReasons"
                  :key="`${module.scope}-${reason}`"
                  class="admin-redis-business-card__module-alert"
                >
                  {{ reason }}
                </span>
              </div>

              <div class="admin-redis-business-card__module-grid">
                <div class="admin-redis-business-card__module-block">
                  <div class="admin-redis-business-card__block-title">样例 Key</div>
                  <div v-if="module.sampleKeys.length" class="admin-redis-business-card__chips">
                    <span v-for="sampleKey in module.sampleKeys" :key="sampleKey" class="admin-redis-business-card__chip">{{ sampleKey }}</span>
                  </div>
                  <div v-else class="admin-redis-business-card__empty">暂无样例 key。</div>
                </div>

                <div class="admin-redis-business-card__module-block">
                  <div class="admin-redis-business-card__block-title">热 Key</div>
                  <div v-if="module.hotKeys.length" class="admin-redis-business-card__list">
                    <div v-for="item in module.hotKeys" :key="item.key" class="admin-redis-business-card__list-item">
                      <span>{{ item.key }}</span>
                      <small>命中 {{ item.score }}</small>
                    </div>
                  </div>
                  <div v-else class="admin-redis-business-card__empty">暂无热 key。</div>
                </div>

                <div class="admin-redis-business-card__module-block">
                  <div class="admin-redis-business-card__block-title">大 Value</div>
                  <div v-if="module.largeValues.length" class="admin-redis-business-card__list">
                    <div v-for="item in module.largeValues" :key="item.key" class="admin-redis-business-card__list-item">
                      <span>{{ item.key }}</span>
                      <small>{{ formatBytes(item.bytes) }}</small>
                    </div>
                  </div>
                  <div v-else class="admin-redis-business-card__empty">暂无大 value。</div>
                </div>
              </div>

              <div class="admin-redis-business-card__module-footer">
                <span>最后命中：{{ formatDateTime(module.lastHitAt) }}</span>
                <span>最后未命中：{{ formatDateTime(module.lastMissAt) }}</span>
                <span>最近 value：{{ formatBytes(module.lastValueBytes) }}</span>
                <span>最大 value：{{ formatBytes(module.maxValueBytes) }}</span>
                <span>平均 value：{{ formatBytes(module.averageValueBytes) }}</span>
              </div>
            </div>
            <div v-if="!businessModules.length" class="admin-redis-business-card__empty-state">
              <strong>没有匹配到业务缓存模块</strong>
              <span>可以调整关键词、健康视图或排序方式后再查看。</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="currentTab === 'risk'" class="admin-card admin-redis-risk-card">
      <div class="admin-card__header">
        <div>
          <h4 class="admin-card__title">残留 Key 风险提示</h4>
          <div class="admin-card__desc">基于当前 Redis 中的 runtime、lock、snapshot、abort 等 key 关系做快速诊断。</div>
        </div>
      </div>
      <div class="admin-card__content admin-redis-risk-card__list">
        <div
          v-for="(item, index) in overview?.riskHints || []"
          :key="`${item.level}-${index}`"
          class="admin-redis-risk-card__item"
          :class="`is-${item.level}`"
        >
          {{ item.message }}
        </div>
      </div>
    </div>

    <div v-else class="admin-card admin-redis-query-card">
      <div class="admin-card__header">
        <div>
          <h4 class="admin-card__title">任务明细查询</h4>
          <div class="admin-card__desc">输入生成记录 recordId，查看 Redis 中该任务的运行态、停止标记和快照摘要。</div>
        </div>
      </div>
      <div class="admin-card__content admin-redis-query-card__content">
        <div class="admin-redis-query-card__search-card">
          <div class="admin-redis-query-card__search-copy">
            <div class="admin-redis-query-card__search-title">按记录 ID 检索任务链路</div>
            <div class="admin-redis-query-card__search-desc">适合排查任务排队、重试、锁续租、快照与数据库状态不一致的问题。</div>
          </div>
          <div class="admin-redis-query-card__toolbar">
            <input
              v-model.trim="recordIdKeyword"
              class="admin-input admin-redis-query-card__input"
              type="text"
              placeholder="请输入 recordId，例如 cmopoi65y0009l1t57j4g67ix"
            >
            <button
              class="admin-button admin-button--primary"
              type="button"
              :disabled="detailLoading || !recordIdKeyword"
              @click="loadTaskDetail"
            >
              {{ detailLoading ? '查询中...' : '查询任务' }}
            </button>
          </div>
        </div>

          <div v-if="taskDetail" class="admin-redis-query-card__detail">
          <div class="admin-redis-query-card__grid">
            <div class="admin-redis-query-card__item">
              <span>运行状态</span>
              <strong>{{ taskDetail.runtime?.status || '无运行态' }}</strong>
            </div>
            <div class="admin-redis-query-card__item">
              <span>策略类型</span>
              <strong>{{ taskDetail.runtime?.strategyKey || '--' }}</strong>
            </div>
            <div class="admin-redis-query-card__item">
              <span>停止标记</span>
              <strong>{{ taskDetail.abort.exists ? `存在 (${taskDetail.abort.ttlSeconds}s)` : '不存在' }}</strong>
            </div>
            <div class="admin-redis-query-card__item">
              <span>执行锁</span>
              <strong>{{ taskDetail.lock.exists ? `存在 (${taskDetail.lock.ttlMs}ms)` : '不存在' }}</strong>
            </div>
            <div class="admin-redis-query-card__item">
              <span>快照类型</span>
              <strong>{{ taskDetail.snapshot?.type || '--' }}</strong>
            </div>
            <div class="admin-redis-query-card__item">
              <span>技能</span>
              <strong>{{ taskDetail.snapshot?.skill || '--' }}</strong>
            </div>
            <div class="admin-redis-query-card__item">
              <span>图片数</span>
              <strong>{{ taskDetail.snapshot?.imageCount ?? 0 }}</strong>
            </div>
            <div class="admin-redis-query-card__item">
              <span>输出数</span>
              <strong>{{ taskDetail.snapshot?.outputCount ?? 0 }}</strong>
            </div>
          </div>

          <div class="admin-redis-query-card__prompt">
            <div class="admin-redis-query-card__prompt-title">数据库主记录摘要</div>
            <div class="admin-redis-query-card__compare-grid">
              <div class="admin-redis-query-card__item">
                <span>数据库状态</span>
                <strong>{{ taskDetail.database?.status || '--' }}</strong>
              </div>
              <div class="admin-redis-query-card__item">
                <span>数据库类型</span>
                <strong>{{ taskDetail.database?.type || '--' }}</strong>
              </div>
              <div class="admin-redis-query-card__item">
                <span>数据库技能</span>
                <strong>{{ taskDetail.database?.skill || '--' }}</strong>
              </div>
              <div class="admin-redis-query-card__item">
                <span>数据库模型</span>
                <strong>{{ taskDetail.database?.modelKey || '--' }}</strong>
              </div>
              <div class="admin-redis-query-card__item">
                <span>数据库图片数</span>
                <strong>{{ taskDetail.database?.imageCount ?? 0 }}</strong>
              </div>
              <div class="admin-redis-query-card__item">
                <span>数据库输出数</span>
                <strong>{{ taskDetail.database?.outputCount ?? 0 }}</strong>
              </div>
            </div>
          </div>

          <div class="admin-redis-query-card__prompt">
            <div class="admin-redis-query-card__prompt-title">任务提示词摘要</div>
            <div class="admin-redis-query-card__prompt-text">{{ taskDetail.snapshot?.prompt || taskDetail.database?.prompt || '暂无快照提示词。' }}</div>
          </div>

          <div class="admin-redis-query-card__prompt">
            <div class="admin-redis-query-card__prompt-title">排队与重试治理</div>
            <div class="admin-redis-query-card__compare-grid">
              <div class="admin-redis-query-card__item">
                <span>排队原因</span>
                <strong>{{ taskDetail.governance.queue?.reason || '--' }}</strong>
              </div>
              <div class="admin-redis-query-card__item">
                <span>排队耗时</span>
                <strong>{{ formatDurationMs(taskDetail.governance.queue?.waitDurationMs ?? 0) }}</strong>
              </div>
              <div class="admin-redis-query-card__item">
                <span>进入排队</span>
                <strong>{{ formatDateTime(taskDetail.governance.queue?.enteredAt || '') }}</strong>
              </div>
              <div class="admin-redis-query-card__item">
                <span>开始执行</span>
                <strong>{{ formatDateTime(taskDetail.governance.queue?.startedAt || '') }}</strong>
              </div>
              <div class="admin-redis-query-card__item">
                <span>总重试次数</span>
                <strong>{{ taskDetail.governance.retry?.totalRetryCount ?? 0 }}</strong>
              </div>
              <div class="admin-redis-query-card__item">
                <span>限突发重试</span>
                <strong>{{ taskDetail.governance.retry?.burstRateRetryCount ?? 0 }}</strong>
              </div>
              <div class="admin-redis-query-card__item">
                <span>最近重试阶段</span>
                <strong>{{ taskDetail.governance.retry?.lastRetryStage || '--' }}</strong>
              </div>
              <div class="admin-redis-query-card__item">
                <span>最近等待时长</span>
                <strong>{{ formatDurationMs(taskDetail.governance.retry?.lastWaitDurationMs ?? 0) }}</strong>
              </div>
              <div class="admin-redis-query-card__item">
                <span>最近状态码</span>
                <strong>{{ taskDetail.governance.retry?.lastStatusCode || '--' }}</strong>
              </div>
            </div>
            <div v-if="taskDetail.governance.retry?.lastErrorPreview" class="admin-redis-query-card__prompt-text">
              {{ taskDetail.governance.retry.lastErrorPreview }}
            </div>
          </div>

          <div class="admin-redis-query-card__prompt">
            <div class="admin-redis-query-card__prompt-title">执行治理摘要</div>
            <div class="admin-redis-query-card__compare-grid">
              <div class="admin-redis-query-card__item">
                <span>加锁时间</span>
                <strong>{{ formatDateTime(taskDetail.governance.execution?.lockAcquiredAt || '') }}</strong>
              </div>
              <div class="admin-redis-query-card__item">
                <span>锁是否丢失</span>
                <strong>{{ taskDetail.governance.execution?.lockLost ? '是' : '否' }}</strong>
              </div>
              <div class="admin-redis-query-card__item">
                <span>完成时间</span>
                <strong>{{ formatDateTime(taskDetail.governance.execution?.completedAt || '') }}</strong>
              </div>
              <div class="admin-redis-query-card__item">
                <span>最近错误时间</span>
                <strong>{{ formatDateTime(taskDetail.governance.execution?.lastErrorAt || '') }}</strong>
              </div>
            </div>
            <div v-if="taskDetail.governance.execution?.lastErrorMessage" class="admin-redis-query-card__prompt-text">
              {{ taskDetail.governance.execution.lastErrorMessage }}
            </div>
          </div>

          <div v-if="taskDetail.database?.error || taskDetail.snapshot?.error" class="admin-redis-query-card__prompt">
            <div class="admin-redis-query-card__prompt-title">错误对照</div>
            <div class="admin-redis-query-card__prompt-text">
              Redis: {{ taskDetail.snapshot?.error || '无' }}
              <br>
              DB: {{ taskDetail.database?.error || '无' }}
            </div>
          </div>

          <div class="admin-redis-query-card__prompt">
            <div class="admin-redis-query-card__prompt-title">最近事件摘要</div>
            <div v-if="taskDetail.recentEvents.length" class="admin-redis-query-card__event-list">
              <div v-for="(event, index) in taskDetail.recentEvents" :key="`${event.createdAt}-${index}`" class="admin-redis-query-card__event-item">
                <strong>{{ event.stage }}</strong>
                <span>{{ event.message || event.type }}</span>
                <small>{{ event.createdAt }}</small>
              </div>
            </div>
            <div v-else class="admin-redis-query-card__prompt-text">暂无最近事件摘要。</div>
          </div>
        </div>
      </div>
    </div>

  </AdminPageContainer>
</template>

<script setup lang="ts">
defineOptions({ name: 'AdminRedis' })
import './admin-redis.css'
import { computed, onMounted, ref } from 'vue'
import AdminPageContainer from '@/components/admin/layout/AdminPageContainer.vue'
import AdminStatCard from '@/components/admin/common/AdminStatCard.vue'
import { useAdminConfirm } from '@/composables/admin/useAdminConfirm'
import AdminSystemRedisPanel from '@/views/admin/system/components/AdminSystemRedisPanel.vue'
import {
  clearRedisCacheScope,
  getRedisAdminOverview,
  getRedisRuntimeSettings,
  getRedisTaskDetail,
  saveRedisRuntimeSettings,
  type RedisAdminOverviewConfig,
  type RedisTaskDetailConfig,
  type SystemRedisRuntimeSettingsConfig,
} from '@/api/system-config'

const loading = ref(false)
const actionLoading = ref(false)
const overview = ref<RedisAdminOverviewConfig | null>(null)
const { confirmDanger } = useAdminConfirm()
const detailLoading = ref(false)
const recordIdKeyword = ref('')
const taskDetail = ref<RedisTaskDetailConfig | null>(null)
const settingsLoading = ref(false)
const settingsSaving = ref(false)
const businessModuleKeyword = ref('')
const businessSortMode = ref<'reads' | 'hit-rate' | 'writes' | 'invalidates' | 'value-size'>('reads')
const businessHealthFilter = ref<'all' | 'healthy' | 'attention' | 'risk'>('all')
const currentTab = ref<'overview' | 'settings' | 'business' | 'risk' | 'task'>('overview')
const tabItems = [
  { key: 'overview', label: '总览', description: '查看缓存、任务运行态、限流与并发概览' },
  { key: 'settings', label: '运行参数', description: '调整并发上限与限流阈值' },
  { key: 'business', label: '业务缓存', description: '查看命中率、热 key 与大 value 诊断' },
  { key: 'risk', label: '风险诊断', description: '查看残留 key 风险提示' },
  { key: 'task', label: '任务诊断', description: '按 recordId 查询 Redis 与数据库对照' },
] as const
const createDefaultRuntimeSettings = (): SystemRedisRuntimeSettingsConfig => ({
  taskSubmitRateLimit: 6,
  authVerificationRateLimit: 5,
  authLoginRateLimit: 10,
  providerModelDiscoverRateLimit: 6,
  taskUserConcurrencyLimit: 3,
  taskSkillConcurrencyLimit: 4,
  taskProviderConcurrencyLimit: 8,
})
const runtimeSettings = ref<SystemRedisRuntimeSettingsConfig>(createDefaultRuntimeSettings())

const heroMetaItems = computed(() => ([
  {
    label: '实例标识',
    value: overview.value?.instanceId || '--',
  },
  {
    label: '命名空间',
    value: overview.value?.prefix ? `${overview.value.prefix}:${overview.value.env}` : '--',
  },
  {
    label: '风险提示',
    value: `${overview.value?.riskHints.length ?? 0} 条`,
  },
  {
    label: '业务模块',
    value: `${overview.value?.businessCaches.modules.length ?? 0} 个`,
  },
]))

const businessSummaryItems = computed(() => {
  const modules = overview.value?.businessCaches.modules || []
  const warnings = overview.value?.businessCaches.diagnostics.warnings || []
  const totalReads = modules.reduce((sum, item) => sum + item.readCount, 0)
  const totalWrites = modules.reduce((sum, item) => sum + item.writeCount, 0)
  const totalInvalidates = modules.reduce((sum, item) => sum + item.invalidateCount, 0)
  const unhealthyCount = modules.filter(item => resolveBusinessModuleHealth(item).level !== 'healthy').length

  return [
    { label: '模块数量', value: `${modules.length} 个` },
    { label: '累计读取', value: `${totalReads}` },
    { label: '累计写入', value: `${totalWrites}` },
    { label: '累计失效', value: `${totalInvalidates}` },
    { label: '待优化模块', value: `${unhealthyCount} 个` },
    { label: '当前告警', value: `${warnings.filter(item => item.level === 'warning').length} 条` },
  ]
})

const resolveBusinessModuleHealth = (module: NonNullable<RedisAdminOverviewConfig['businessCaches']>['modules'][number]) => {
  const reasons: string[] = []
  let level: 'healthy' | 'attention' | 'risk' = 'healthy'

  if (module.readCount >= 20 && module.hitRate < 40) {
    level = 'risk'
    reasons.push('命中率偏低')
  } else if (module.readCount >= 10 && module.hitRate < 65) {
    level = 'attention'
    reasons.push('命中率有优化空间')
  }

  if (module.invalidateCount >= 20) {
    level = level === 'risk' ? 'risk' : 'attention'
    reasons.push('失效次数偏高')
  }

  if (module.maxValueBytes >= 256 * 1024) {
    level = 'risk'
    reasons.push('存在大 Value')
  } else if (module.maxValueBytes >= 128 * 1024 && level === 'healthy') {
    level = 'attention'
    reasons.push('Value 体积偏大')
  }

  if (!reasons.length) {
    reasons.push('缓存状态稳定')
  }

  return {
    level,
    label: level === 'healthy' ? '健康' : level === 'attention' ? '关注' : '风险',
    reasons,
  }
}

const businessModules = computed(() => {
  const keyword = businessModuleKeyword.value.trim().toLowerCase()
  const modules = (overview.value?.businessCaches.modules || []).map((module) => {
    const health = resolveBusinessModuleHealth(module)
    return {
      ...module,
      healthLevel: health.level,
      healthLabel: health.label,
      healthReasons: health.reasons,
    }
  })

  const filteredModules = modules.filter((module) => {
    const matchKeyword = !keyword
      || module.scope.toLowerCase().includes(keyword)
      || module.sampleKeys.some(item => item.toLowerCase().includes(keyword))
      || module.hotKeys.some(item => item.key.toLowerCase().includes(keyword))
      || module.largeValues.some(item => item.key.toLowerCase().includes(keyword))

    if (!matchKeyword) {
      return false
    }

    if (businessHealthFilter.value === 'all') {
      return true
    }

    return module.healthLevel === businessHealthFilter.value
  })

  return [...filteredModules].sort((left, right) => {
    if (businessSortMode.value === 'hit-rate') {
      return right.hitRate - left.hitRate || right.readCount - left.readCount
    }
    if (businessSortMode.value === 'writes') {
      return right.writeCount - left.writeCount || right.readCount - left.readCount
    }
    if (businessSortMode.value === 'invalidates') {
      return right.invalidateCount - left.invalidateCount || right.readCount - left.readCount
    }
    if (businessSortMode.value === 'value-size') {
      return right.maxValueBytes - left.maxValueBytes || right.averageValueBytes - left.averageValueBytes
    }
    return right.readCount - left.readCount || right.currentKeyCount - left.currentKeyCount
  })
})

const formatPercent = (value: number) => `${Number(value || 0).toFixed(2)}%`

// 后台观测页只需要可读性友好的摘要，因此统一格式化字节大小。
const formatBytes = (value: number) => {
  const normalizedValue = Number(value || 0)
  if (normalizedValue <= 0) {
    return '0 B'
  }
  if (normalizedValue < 1024) {
    return `${normalizedValue} B`
  }
  if (normalizedValue < 1024 * 1024) {
    return `${(normalizedValue / 1024).toFixed(2)} KB`
  }
  return `${(normalizedValue / (1024 * 1024)).toFixed(2)} MB`
}

const formatDateTime = (value: string) => {
  return value || '--'
}

const formatDurationMs = (value: number) => {
  const normalizedValue = Number(value || 0)
  if (normalizedValue <= 0) {
    return '0ms'
  }
  if (normalizedValue < 1000) {
    return `${normalizedValue}ms`
  }
  if (normalizedValue < 60_000) {
    return `${(normalizedValue / 1000).toFixed(2)}s`
  }
  return `${(normalizedValue / 60_000).toFixed(2)}min`
}

const loadRedisOverview = async () => {
  loading.value = true
  try {
    overview.value = await getRedisAdminOverview()
  } finally {
    loading.value = false
  }
}

const loadRuntimeSettings = async () => {
  settingsLoading.value = true
  try {
    const nextSettings = await getRedisRuntimeSettings()
    runtimeSettings.value = {
      ...createDefaultRuntimeSettings(),
      ...(nextSettings || {}),
    }
  } finally {
    settingsLoading.value = false
  }
}

const handleSaveRuntimeSettings = async () => {
  settingsSaving.value = true
  try {
    const nextSettings = await saveRedisRuntimeSettings(runtimeSettings.value)
    runtimeSettings.value = {
      ...createDefaultRuntimeSettings(),
      ...(nextSettings || {}),
    }
    await loadRedisOverview()
  } finally {
    settingsSaving.value = false
  }
}

const handleClearRedisScope = async (scope: 'provider-model-catalog' | 'skill-runtime' | 'task-runtime') => {
  const scopeLabel = scope === 'provider-model-catalog'
    ? '模型缓存'
    : scope === 'skill-runtime'
      ? '技能缓存'
      : '任务运行态'

  await confirmDanger({
    title: '清理确认',
    message: `确认清理 Redis 中的${scopeLabel}吗？该操作会直接删除对应缓存或运行态 Key。`,
    confirmText: '确认清理',
  })

  actionLoading.value = true
  try {
    await clearRedisCacheScope(scope)
    await loadRedisOverview()
  } finally {
    actionLoading.value = false
  }
}

const loadTaskDetail = async () => {
  if (!recordIdKeyword.value) {
    return
  }

  detailLoading.value = true
  try {
    taskDetail.value = await getRedisTaskDetail(recordIdKeyword.value)
  } finally {
    detailLoading.value = false
  }
}

onMounted(() => {
  void loadRedisOverview()
  void loadRuntimeSettings()
})
</script>

<style scoped>
.admin-redis-hero-card {
  overflow: hidden;
}

.admin-redis-hero-card__content {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(320px, 0.9fr);
  gap: 20px;
  align-items: stretch;
}

.admin-redis-hero-card__main {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.admin-redis-hero-card__eyebrow {
  color: var(--text-secondary);
  font-size: 12px;
}

.admin-redis-hero-card__title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.admin-redis-hero-card__title {
  margin: 0;
  font-size: 24px;
  color: var(--text-primary);
}

.admin-redis-hero-card__status {
  display: inline-flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 12px;
  border: 1px solid var(--line-divider, #00000014);
}

.admin-redis-hero-card__status.is-healthy {
  background: color-mix(in srgb, var(--brand-success-default, #34c759) 18%, transparent);
  color: var(--brand-success-default, #34c759);
  border-color: color-mix(in srgb, var(--brand-success-default, #34c759) 28%, transparent);
}

.admin-redis-hero-card__status.is-risky {
  background: color-mix(in srgb, var(--brand-danger-default, #ff5f57) 16%, transparent);
  color: var(--brand-danger-default, #ff5f57);
  border-color: color-mix(in srgb, var(--brand-danger-default, #ff5f57) 26%, transparent);
}

.admin-redis-hero-card__desc {
  margin: 0;
  color: var(--text-secondary);
  line-height: 1.7;
}

.admin-redis-hero-card__meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.admin-redis-hero-card__meta-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px;
  border-radius: 12px;
  background: var(--bg-surface);
  border: 1px solid var(--line-divider, #00000014);
}

.admin-redis-hero-card__meta-item span {
  color: var(--text-secondary);
  font-size: 12px;
}

.admin-redis-hero-card__meta-item strong {
  color: var(--text-primary);
  font-size: 15px;
  word-break: break-word;
}

.admin-redis-stats-grid {
  margin-top: 16px;
}

.admin-redis-tabs-card__content {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
}

.admin-redis-business-card__content,
.admin-redis-business-card__modules,
.admin-redis-business-card__warnings {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.admin-redis-business-card__summary {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 12px;
}

.admin-redis-business-card__toolbar {
  display: grid;
  grid-template-columns: minmax(260px, 1fr) auto;
  gap: 12px;
  align-items: end;
}

.admin-redis-business-card__toolbar-search,
.admin-redis-business-card__toolbar-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.admin-redis-business-card__toolbar-search span,
.admin-redis-business-card__toolbar-field span {
  color: var(--text-secondary);
  font-size: 12px;
}

.admin-redis-business-card__toolbar-group {
  display: flex;
  gap: 12px;
}

.admin-redis-business-card__toolbar-field {
  min-width: 168px;
}

.admin-select {
  width: 100%;
  min-height: 40px;
  padding: 0 36px 0 12px;
  border-radius: 10px;
  border: 1px solid var(--line-divider, #00000014);
  background-color: var(--bg-surface);
  color: var(--text-primary);
  font-size: 14px;
  line-height: 40px;
  outline: none;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  background-image:
    linear-gradient(45deg, transparent 50%, var(--text-secondary) 50%),
    linear-gradient(135deg, var(--text-secondary) 50%, transparent 50%);
  background-position:
    calc(100% - 18px) calc(50% - 3px),
    calc(100% - 12px) calc(50% - 3px);
  background-size: 6px 6px, 6px 6px;
  background-repeat: no-repeat;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
}

.admin-select:hover {
  border-color: color-mix(in srgb, var(--brand-main-default, #5c8dff) 32%, var(--line-divider, #00000014));
  background-color: var(--bg-block-primary-hover, rgba(204, 221, 255, 0.08));
}

.admin-select:focus {
  border-color: var(--brand-main-default, #5c8dff);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--brand-main-default, #5c8dff) 18%, transparent);
}

.admin-redis-business-card__summary-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px;
  border: 1px solid var(--line-divider, #00000014);
  border-radius: 12px;
  background: var(--bg-surface);
}

.admin-redis-business-card__summary-item span {
  color: var(--text-secondary);
  font-size: 12px;
}

.admin-redis-business-card__summary-item strong {
  color: var(--text-primary);
  font-size: 18px;
}

.admin-redis-business-card__stats,
.admin-redis-business-card__module-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.admin-redis-business-card__workspace {
  display: flex;
  flex-direction: column;
  gap: 0;
  min-width: 0;
}

.admin-redis-business-card__diagnostics {
  display: none;
}

.admin-redis-business-card__modules {
  display: flex;
  flex-direction: column;
  gap: 0;
  min-width: 0;
}

.admin-redis-business-card__stat,
.admin-redis-business-card__panel,
.admin-redis-business-card__module,
.admin-redis-business-card__module-block {
  padding: 12px;
  border: 1px solid var(--line-divider, #00000014);
  border-radius: 12px;
  background: var(--bg-surface);
}

.admin-redis-business-card__module {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.admin-redis-business-card__stat.is-attention,
.admin-redis-business-card__module.is-attention {
  border-color: color-mix(in srgb, var(--brand-warning-default, #ffb020) 38%, var(--line-divider, #00000014));
}

.admin-redis-business-card__stat.is-risk,
.admin-redis-business-card__module.is-risk {
  border-color: color-mix(in srgb, var(--brand-danger-default, #ff5f57) 40%, var(--line-divider, #00000014));
}

.admin-redis-business-card__stat-title,
.admin-redis-business-card__module-heading {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.admin-redis-business-card__health-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 12px;
  border: 1px solid var(--line-divider, #00000014);
}

.admin-redis-business-card__health-badge.is-healthy {
  background: color-mix(in srgb, var(--brand-success-default, #34c759) 16%, transparent);
  color: var(--brand-success-default, #34c759);
  border-color: color-mix(in srgb, var(--brand-success-default, #34c759) 26%, transparent);
}

.admin-redis-business-card__health-badge.is-attention {
  background: color-mix(in srgb, var(--brand-warning-default, #ffb020) 16%, transparent);
  color: var(--brand-warning-default, #ffb020);
  border-color: color-mix(in srgb, var(--brand-warning-default, #ffb020) 26%, transparent);
}

.admin-redis-business-card__health-badge.is-risk {
  background: color-mix(in srgb, var(--brand-danger-default, #ff5f57) 16%, transparent);
  color: var(--brand-danger-default, #ff5f57);
  border-color: color-mix(in srgb, var(--brand-danger-default, #ff5f57) 26%, transparent);
}

.admin-redis-business-card__stat-header,
.admin-redis-business-card__module-header,
.admin-redis-business-card__list-item,
.admin-redis-business-card__module-footer {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.admin-redis-business-card__stat-header,
.admin-redis-business-card__module-header,
.admin-redis-business-card__module-footer {
  align-items: flex-start;
}

.admin-redis-business-card__stat-header span,
.admin-redis-business-card__panel-title,
.admin-redis-business-card__block-title,
.admin-redis-business-card__module-header p,
.admin-redis-business-card__module-badges span,
.admin-redis-business-card__list-item small,
.admin-redis-business-card__empty,
.admin-redis-business-card__module-footer span {
  color: var(--text-secondary);
  font-size: 12px;
}

.admin-redis-business-card__stat-metrics,
.admin-redis-business-card__module-badges,
.admin-redis-business-card__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.admin-redis-business-card__module-header,
.admin-redis-business-card__module-block,
.admin-redis-business-card__list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}


.admin-redis-business-card__module-alerts {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.admin-redis-business-card__module-alert {
  display: inline-flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: 999px;
  background: var(--bg-block-primary-hover, rgba(204, 221, 255, 0.12));
  color: var(--brand-main-default, var(--text-primary));
  font-size: 12px;
  border: 1px solid color-mix(in srgb, var(--brand-main-default, #5c8dff) 24%, transparent);
}

.admin-redis-business-card__warning {
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid var(--line-divider, #00000014);
}

.admin-redis-business-card__warning.is-info {
  background: var(--bg-block-primary-hover, rgba(204, 221, 255, 0.12));
}

.admin-redis-business-card__warning.is-warning {
  background: color-mix(in srgb, var(--brand-warning-default, #ffb020) 12%, transparent);
  border-color: color-mix(in srgb, var(--brand-warning-default, #ffb020) 24%, var(--line-divider, #00000014));
}

.admin-redis-business-card__chip {
  display: inline-flex;
  max-width: 100%;
  padding: 5px 10px;
  border-radius: 999px;
  background: var(--bg-block-primary-hover, rgba(204, 221, 255, 0.12));
  color: var(--text-primary);
  font-size: 12px;
  word-break: break-all;
  border: 1px solid color-mix(in srgb, var(--brand-main-default, #5c8dff) 18%, transparent);
}

.admin-redis-business-card__list-item span {
  color: var(--text-primary);
  word-break: break-all;
  line-height: 1.45;
}

.admin-redis-business-card__module-header h5 {
  margin: 0;
  font-size: 16px;
  color: var(--text-primary);
  line-height: 1.25;
}

.admin-redis-business-card__module-header p {
  margin: 2px 0 0;
  line-height: 1.45;
}

.admin-redis-business-card__module-grid {
  align-items: start;
}

.admin-redis-business-card__module-block {
  min-height: 178px;
}

.admin-redis-business-card__module-footer {
  padding-top: 10px;
  border-top: 1px solid var(--line-divider, #00000014);
  margin-top: 2px;
}

.admin-redis-business-card__empty-state {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 24px 16px;
  border: 1px dashed var(--line-divider, #0000001f);
  border-radius: 12px;
  background: var(--bg-surface);
  color: var(--text-secondary);
}

.admin-redis-business-card__empty-state strong {
  color: var(--text-primary);
}

.admin-redis-settings-card__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.admin-redis-settings-card__sections {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.admin-redis-settings-card__section {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px;
  border: 1px solid var(--line-divider, #00000014);
  border-radius: 12px;
  background: var(--bg-surface);
}

.admin-redis-settings-card__section-header h5 {
  margin: 0 0 6px;
  font-size: 16px;
  color: var(--text-primary);
}

.admin-redis-settings-card__section-header p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.6;
}

.admin-redis-settings-card__field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.admin-redis-settings-card__field span {
  color: var(--text-secondary);
  font-size: 12px;
}

.admin-redis-risk-card__list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.admin-redis-risk-card__item {
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid var(--line-divider, #00000014);
}

.admin-redis-risk-card__item.is-info {
  background: #f6f7fb;
}

.admin-redis-risk-card__item.is-warning {
  background: #fff7e8;
}

.admin-redis-risk-card__item.is-danger {
  background: #fff1f1;
}

.admin-redis-query-card__content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.admin-redis-query-card__search-card {
  display: grid;
  grid-template-columns: minmax(0, 0.8fr) minmax(420px, 1fr);
  gap: 16px;
  align-items: center;
  padding: 16px;
  border: 1px solid var(--line-divider, #00000014);
  border-radius: 12px;
  background: var(--bg-surface);
}

.admin-redis-query-card__search-copy {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.admin-redis-query-card__search-title {
  color: var(--text-primary);
  font-size: 16px;
  font-weight: 600;
}

.admin-redis-query-card__search-desc {
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.6;
}

.admin-redis-query-card__toolbar {
  display: flex;
  gap: 12px;
}

.admin-redis-query-card__input {
  flex: 1 1 auto;
}

.admin-redis-query-card__detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.admin-redis-query-card__grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.admin-redis-query-card__compare-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.admin-redis-query-card__item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px;
  border: 1px solid var(--line-divider, #00000014);
  border-radius: 12px;
  background: var(--bg-surface);
}

.admin-redis-query-card__item span,
.admin-redis-query-card__prompt-title {
  color: var(--text-secondary);
  font-size: 12px;
}

.admin-redis-query-card__item strong {
  color: var(--text-primary);
  font-size: 16px;
}

.admin-redis-query-card__prompt {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px;
  border: 1px solid var(--line-divider, #00000014);
  border-radius: 12px;
  background: var(--bg-surface);
}

.admin-redis-query-card__prompt-text {
  color: var(--text-primary);
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
}

.admin-redis-query-card__event-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.admin-redis-query-card__event-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 14px;
  border-radius: 10px;
  background: var(--bg-surface);
  border: 1px solid var(--line-divider, #00000014);
}

.admin-redis-query-card__event-item small {
  color: var(--text-secondary);
}

@media (max-width: 1080px) {
  .admin-redis-hero-card__content,
  .admin-redis-business-card__summary,
  .admin-redis-business-card__toolbar,
  .admin-redis-tabs-card__content,
  .admin-redis-business-card__stats,
  .admin-redis-business-card__diagnostics-grid,
  .admin-redis-business-card__modules-grid,
  .admin-redis-business-card__module-grid,
  .admin-redis-settings-card__grid,
  .admin-redis-query-card__search-card,
  .admin-redis-query-card__toolbar,
  .admin-redis-query-card__grid,
  .admin-redis-query-card__compare-grid {
    grid-template-columns: minmax(0, 1fr);
    flex-direction: column;
  }

  .admin-redis-hero-card__meta {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .admin-redis-business-card__diagnostics {
    position: static;
  }

  .admin-redis-business-card__toolbar-group {
    flex-direction: column;
  }

}
</style>
