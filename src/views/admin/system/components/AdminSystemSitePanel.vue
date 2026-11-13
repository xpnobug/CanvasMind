<template>
  <div class="admin-system-panel">
    <form class="admin-system-form-grid" @submit.prevent="onSubmit">
      <div class="admin-card">
        <div class="admin-card__header">
          <div>
            <h4 class="admin-card__title">品牌基础</h4>
            <div class="admin-card__desc">配置站点名称、描述、Logo 与图标，统一前后台品牌感知。</div>
          </div>
        </div>
        <div class="admin-card__content">
          <div class="admin-form__grid">
            <div class="admin-form__field admin-form__field--full">
              <label class="admin-form__label" for="system-site-name">站点名称</label>
              <input id="system-site-name" v-model.trim="form.siteInfo.siteName" class="admin-input" type="text" placeholder="例如：Canana AI">
            </div>
            <div class="admin-form__field admin-form__field--full">
              <label class="admin-form__label" for="system-site-description">站点描述</label>
              <textarea
                id="system-site-description"
                v-model.trim="form.siteInfo.siteDescription"
                class="admin-textarea admin-system-site-description"
                placeholder="站点简介、SEO 描述或首页说明"
              />
            </div>
            <!-- CM 无 IconUrlField / 默认头像字段：用品牌卡片壳 + 普通 URL 输入对齐视觉 -->
            <div class="admin-form__field admin-form__field--full admin-system-site-brand">
              <label class="admin-form__label">品牌视觉</label>
              <div class="admin-system-site-brand__grid">
                <div class="admin-system-site-brand__card admin-system-site-brand__card--logo">
                  <div class="admin-system-site-brand__card-title">站点 Logo</div>
                  <input
                    id="system-site-logo"
                    v-model.trim="form.siteInfo.siteLogoUrl"
                    class="admin-input"
                    type="text"
                    placeholder="Logo 图片地址（可选）"
                  >
                  <p class="admin-system-site-brand__hint">用于导航栏、登录页等品牌展示</p>
                </div>
                <div class="admin-system-site-brand__card admin-system-site-brand__card--icon">
                  <div class="admin-system-site-brand__card-title">站点图标</div>
                  <input
                    id="system-site-icon"
                    v-model.trim="form.siteInfo.siteIconUrl"
                    class="admin-input"
                    type="text"
                    placeholder="favicon 地址（可选）"
                  >
                  <p class="admin-system-site-brand__hint">浏览器标签页 favicon</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="admin-card">
        <div class="admin-card__header">
          <div>
            <h4 class="admin-card__title">页脚与备案</h4>
            <div class="admin-card__desc">维护备案信息与版权文案，保证网站页脚信息完整合规。</div>
          </div>
        </div>
        <div class="admin-card__content">
          <div class="admin-form__grid">
            <div class="admin-form__field">
              <label class="admin-form__label" for="system-site-icp-text">备案文案</label>
              <input id="system-site-icp-text" v-model.trim="form.siteInfo.icpText" class="admin-input" type="text" placeholder="例如：粤ICP备xxxx号">
            </div>
            <div class="admin-form__field">
              <label class="admin-form__label" for="system-site-icp-link">备案链接</label>
              <input id="system-site-icp-link" v-model.trim="form.siteInfo.icpLink" class="admin-input" type="text" placeholder="https://beian.miit.gov.cn">
            </div>
            <div class="admin-form__field admin-form__field--full">
              <label class="admin-form__label" for="system-site-copyright">版权文案</label>
              <input id="system-site-copyright" v-model.trim="form.siteInfo.copyrightText" class="admin-input" type="text" placeholder="例如：© 2026 Canana. All rights reserved.">
            </div>
          </div>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { SystemConfigPayload } from '@/api/system-config'

defineProps({
  form: {
    type: Object as PropType<SystemConfigPayload>,
    required: true,
  },
  onSubmit: {
    type: Function as PropType<() => void>,
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

.admin-system-form-grid {
  display: grid;
  gap: 16px;
}

.admin-system-site-description {
  min-height: 96px;
}

.admin-system-site-brand__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.admin-system-site-brand__card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border: 1px solid var(--line-divider, #00000014);
  border-radius: var(--admin-radius-panel);
  background: var(--bg-block-secondary-default);
}

.admin-system-site-brand__card-title {
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 600;
}

.admin-system-site-brand__hint {
  margin: 0;
  color: var(--text-tertiary);
  font-size: 12px;
  line-height: 1.5;
}

@media (max-width: 900px) {
  .admin-system-site-brand__grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
