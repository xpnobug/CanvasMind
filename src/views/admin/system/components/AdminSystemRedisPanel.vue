<template>
  <section class="admin-card">
    <div class="admin-card__header admin-redis-panel__header">
      <div>
        <h4 class="admin-card__title">Redis 运行状态</h4>
        <div class="admin-card__desc">查看缓存、任务运行态和分布式锁的后台状态。</div>
      </div>
      <div class="admin-redis-panel__actions">
        <button
          class="admin-button admin-button--ghost"
          type="button"
          :disabled="loading || actionLoading"
          @click="onRefresh"
        >
          {{ loading ? '刷新中...' : '刷新状态' }}
        </button>
      </div>
    </div>

    <div class="admin-card__content admin-redis-panel__content">
      <div class="admin-redis-panel__summary">
        <div class="admin-redis-panel__summary-item">
          <span class="admin-redis-panel__label">启用状态</span>
          <strong :class="overview?.enabled ? 'is-success' : 'is-muted'">{{ overview?.enabled ? '已启用' : '未启用' }}</strong>
        </div>
        <div class="admin-redis-panel__summary-item">
          <span class="admin-redis-panel__label">连通状态</span>
          <strong :class="overview?.health?.ok ? 'is-success' : 'is-danger'">{{ overview?.health?.ok ? '正常' : '异常' }}</strong>
        </div>
        <div class="admin-redis-panel__summary-item">
          <span class="admin-redis-panel__label">命名空间</span>
          <strong>{{ overview?.prefix || '--' }}</strong>
        </div>
        <div class="admin-redis-panel__summary-item">
          <span class="admin-redis-panel__label">运行环境</span>
          <strong>{{ overview?.env || '--' }}</strong>
        </div>
      </div>

      <div class="admin-redis-panel__message">
        {{ overview?.health?.message || '暂未获取 Redis 状态。' }}
      </div>

      <div class="admin-redis-panel__grid">
        <article class="admin-redis-panel__group">
          <div class="admin-redis-panel__group-head">
            <h5>缓存概览</h5>
          </div>
          <div class="admin-redis-panel__metric-list">
            <div class="admin-redis-panel__metric">
              <span>模型目录缓存</span>
              <strong>{{ overview?.caches.providerCatalog.count ?? 0 }}</strong>
              <small>TTL: {{ formatTtl(overview?.caches.providerCatalog.ttlSeconds) }}</small>
            </div>
            <div class="admin-redis-panel__metric">
              <span>模型发现缓存</span>
              <strong>{{ overview?.caches.providerDiscover.count ?? 0 }}</strong>
            </div>
          </div>
          <div class="admin-redis-panel__button-row">
            <button class="admin-button admin-button--ghost" type="button" :disabled="actionLoading" @click="onClearScope('provider-model-catalog')">
              清理模型缓存
            </button>
          </div>
        </article>

        <article class="admin-redis-panel__group">
          <div class="admin-redis-panel__group-head">
            <h5>任务运行态</h5>
          </div>
          <div class="admin-redis-panel__metric-list">
            <div class="admin-redis-panel__metric">
              <span>runtime</span>
              <strong>{{ overview?.tasks.runtime.count ?? 0 }}</strong>
            </div>
            <div class="admin-redis-panel__metric">
              <span>snapshot</span>
              <strong>{{ overview?.tasks.snapshot.count ?? 0 }}</strong>
            </div>
            <div class="admin-redis-panel__metric">
              <span>abort</span>
              <strong>{{ overview?.tasks.abort.count ?? 0 }}</strong>
            </div>
            <div class="admin-redis-panel__metric">
              <span>lock</span>
              <strong>{{ overview?.tasks.lock.count ?? 0 }}</strong>
            </div>
            <div class="admin-redis-panel__metric">
              <span>idempotency</span>
              <strong>{{ overview?.tasks.idempotency.count ?? 0 }}</strong>
            </div>
            <div class="admin-redis-panel__metric">
              <span>user concurrency</span>
              <strong>{{ overview?.tasks.userConcurrency.count ?? 0 }}</strong>
            </div>
            <div class="admin-redis-panel__metric">
              <span>provider concurrency</span>
              <strong>{{ overview?.tasks.providerConcurrency.count ?? 0 }}</strong>
            </div>
            <div class="admin-redis-panel__metric">
              <span>submit rate</span>
              <strong>{{ overview?.tasks.submitRateLimit.count ?? 0 }}</strong>
            </div>
            <div class="admin-redis-panel__metric">
              <span>discover rate</span>
              <strong>{{ overview?.tasks.providerDiscoverRateLimit.count ?? 0 }}</strong>
            </div>
            <div class="admin-redis-panel__metric">
              <span>auth verify rate</span>
              <strong>{{ overview?.tasks.authVerificationRateLimit.count ?? 0 }}</strong>
            </div>
            <div class="admin-redis-panel__metric">
              <span>auth login rate</span>
              <strong>{{ overview?.tasks.authLoginRateLimit.count ?? 0 }}</strong>
            </div>
          </div>
          <div class="admin-redis-panel__button-row">
            <button class="admin-button admin-button--ghost" type="button" :disabled="actionLoading" @click="onClearScope('task-runtime')">
              清理任务运行态
            </button>
          </div>
        </article>
      </div>

      <div class="admin-redis-panel__samples">
        <div class="admin-redis-panel__sample">
          <div class="admin-redis-panel__sample-title">任务锁当前样本 Key</div>
          <code>{{ overview?.tasks.lock.sampleKeys?.[0] || '--' }}</code>
        </div>
        <div class="admin-redis-panel__sample">
          <div class="admin-redis-panel__sample-title">模型发现缓存当前样本 Key</div>
          <code>{{ overview?.caches.providerDiscover.sampleKeys?.[0] || '--' }}</code>
        </div>
        <div class="admin-redis-panel__sample">
          <div class="admin-redis-panel__sample-title">幂等当前样本 Key</div>
          <code>{{ overview?.tasks.idempotency.sampleKeys?.[0] || '--' }}</code>
        </div>
        <div class="admin-redis-panel__sample">
          <div class="admin-redis-panel__sample-title">任务限流当前样本 Key</div>
          <code>{{ overview?.tasks.submitRateLimit.sampleKeys?.[0] || '--' }}</code>
        </div>
        <div class="admin-redis-panel__sample">
          <div class="admin-redis-panel__sample-title">模型发现限流当前样本 Key</div>
          <code>{{ overview?.tasks.providerDiscoverRateLimit.sampleKeys?.[0] || '--' }}</code>
        </div>
        <div class="admin-redis-panel__sample">
          <div class="admin-redis-panel__sample-title">验证码限流当前样本 Key</div>
          <code>{{ overview?.tasks.authVerificationRateLimit.sampleKeys?.[0] || '--' }}</code>
        </div>
        <div class="admin-redis-panel__sample">
          <div class="admin-redis-panel__sample-title">登录限流当前样本 Key</div>
          <code>{{ overview?.tasks.authLoginRateLimit.sampleKeys?.[0] || '--' }}</code>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { RedisAdminOverviewConfig } from '@/api/system-config'

defineProps<{
  overview: RedisAdminOverviewConfig | null
  loading: boolean
  actionLoading: boolean
  onRefresh: () => void
  onClearScope: (scope: 'provider-model-catalog' | 'task-runtime') => void
}>()

const formatTtl = (ttlSeconds?: number) => {
  if (ttlSeconds === undefined || ttlSeconds === null) {
    return '--'
  }
  if (ttlSeconds === -2) {
    return '不存在'
  }
  if (ttlSeconds === -1) {
    return '永久'
  }
  return `${ttlSeconds}s`
}
</script>

<style scoped>
.admin-redis-panel__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.admin-redis-panel__content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.admin-redis-panel__summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.admin-redis-panel__summary-item,
.admin-redis-panel__metric,
.admin-redis-panel__sample {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px;
  border: 1px solid var(--line-divider, #00000014);
  border-radius: var(--admin-radius-control);
  background: var(--bg-surface);
}

.admin-redis-panel__label {
  color: var(--text-secondary);
  font-size: 12px;
}

.admin-redis-panel__message {
  color: var(--text-secondary);
  font-size: 13px;
}

.admin-redis-panel__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.admin-redis-panel__group {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.admin-redis-panel__group-head h5 {
  margin: 0;
  font-size: 15px;
  color: var(--text-primary);
}

.admin-redis-panel__metric-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.admin-redis-panel__metric span,
.admin-redis-panel__sample-title {
  color: var(--text-secondary);
  font-size: 12px;
}

.admin-redis-panel__metric strong,
.admin-redis-panel__summary-item strong {
  color: var(--text-primary);
  font-size: 20px;
}

.admin-redis-panel__metric small {
  color: var(--text-tertiary);
  font-size: 12px;
}

.admin-redis-panel__button-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.admin-redis-panel__samples {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.admin-redis-panel__sample code {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.is-success {
  color: #18b566 !important;
}

.is-danger {
  color: #f04438 !important;
}

.is-muted {
  color: var(--text-secondary) !important;
}

@media (max-width: 1080px) {
  .admin-redis-panel__summary,
  .admin-redis-panel__grid,
  .admin-redis-panel__samples,
  .admin-redis-panel__metric-list {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
