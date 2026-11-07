<template>
  <AdminDialog
    v-if="draft"
    :visible="visible"
    title="编辑顶部横幅"
    description="按模块配置活动标签、主文案、抢购按钮与背景，保存后立即同步前台。"
    panel-class="admin-theme-ops-dialog admin-theme-top-banner-dialog"
    @close="emit('close')"
  >
    <div class="admin-form admin-dialog__body admin-theme-ops-dialog__body admin-theme-top-banner-dialog__body">
      <section class="theme-ops-section">
        <div class="theme-ops-section__head">
          <div>
            <h4 class="theme-ops-section__title">基础</h4>
            <p class="theme-ops-section__desc">控制横幅总开关与基础尺寸。</p>
          </div>
          <ElSwitch v-model="draft.enabled" inline-prompt active-text="开" inactive-text="关" />
        </div>
        <div class="theme-ops-grid">
          <div class="theme-ops-field">
            <label class="theme-ops-label">横幅高度</label>
            <ElInputNumber v-model="draft.height" :min="0" :max="96" :step="1" controls-position="right" />
            <p class="theme-ops-hint">0 = 内容自适应；大于 0 固定高度</p>
          </div>
          <div class="theme-ops-field">
            <label class="theme-ops-label">显示关闭按钮</label>
            <div class="theme-ops-switch-card">
              <span>允许用户关闭横幅</span>
              <ElSwitch v-model="draft.showClose" inline-prompt active-text="开" inactive-text="关" />
            </div>
          </div>
        </div>
      </section>

      <section class="theme-ops-section">
        <div class="theme-ops-section__head">
          <div>
            <h4 class="theme-ops-section__title">左侧标签</h4>
            <p class="theme-ops-section__desc">静态文案或活动倒计时胶囊。</p>
          </div>
        </div>
        <div class="theme-ops-grid">
          <div class="theme-ops-field">
            <label class="theme-ops-label">标签模式</label>
            <AdminSelect v-model="draft.tagMode" :options="tagModeOptions" />
          </div>
          <div class="theme-ops-field">
            <label class="theme-ops-label">标签文案</label>
            <ElInput
              v-model.trim="draft.tagText"
              :placeholder="draft.tagMode === 'countdown' ? '默认：活动剩余' : '例如：旗舰模型'"
            />
          </div>
          <div class="theme-ops-field">
            <label class="theme-ops-label">标签文字色</label>
            <div class="theme-ops-color">
              <ElColorPicker
                v-model="draft.tagTextColor"
                teleported
                :popper-options="{ strategy: 'fixed' }"
                popper-class="admin-theme-ops-color-picker-popper"
              />
              <ElInput v-model.trim="draft.tagTextColor" placeholder="#FFFFFF" />
            </div>
          </div>
          <div class="theme-ops-field">
            <label class="theme-ops-label">标签底色</label>
            <div class="theme-ops-color">
              <ElColorPicker
                v-model="draft.tagBackgroundColor"
                teleported
                :popper-options="{ strategy: 'fixed' }"
                popper-class="admin-theme-ops-color-picker-popper"
              />
              <ElInput v-model.trim="draft.tagBackgroundColor" placeholder="#F50095" />
            </div>
          </div>
          <div class="theme-ops-field theme-ops-field--full">
            <div class="theme-ops-switch-card">
              <div>
                <div class="theme-ops-switch-card__title">显示沙漏图标</div>
                <div class="theme-ops-switch-card__desc">倒计时场景建议开启</div>
              </div>
              <ElSwitch v-model="draft.showTagIcon" inline-prompt active-text="开" inactive-text="关" />
            </div>
          </div>
        </div>

        <div v-if="draft.tagMode === 'countdown'" class="theme-ops-subpanel">
          <div class="theme-ops-subpanel__title">倒计时截止时间</div>
          <ElDatePicker
            v-model="draft.countdownEndAt"
            type="datetime"
            value-format="YYYY-MM-DDTHH:mm:ss"
            format="YYYY-MM-DD HH:mm:ss"
            placeholder="选择活动结束时间"
            clearable
            teleported
            :popper-options="{ strategy: 'fixed' }"
            popper-class="admin-theme-top-banner-datepicker-popper"
            style="width: 100%"
          />
          <ElInput
            v-model.trim="draft.countdownEndAt"
            class="theme-ops-subpanel__input"
            placeholder="或直接填写：2026-08-01T23:59:59"
          />
          <p class="theme-ops-hint">前台会实时显示「05时 28分 41秒」</p>
        </div>
      </section>

      <section class="theme-ops-section">
        <div class="theme-ops-section__head">
          <div>
            <h4 class="theme-ops-section__title">主文案</h4>
            <p class="theme-ops-section__desc">横幅中间的活动说明，支持 emoji。</p>
          </div>
        </div>
        <div class="theme-ops-grid">
          <div class="theme-ops-field theme-ops-field--full">
            <label class="theme-ops-label">横幅内容</label>
            <ElInput
              v-model.trim="draft.contentText"
              type="textarea"
              :rows="2"
              placeholder="例如：💥 Seedance 2.5 即将上线，抢先锁定｜积分超市开张啦，首充最高翻倍！"
            />
            <p class="theme-ops-hint">前台必须填写主文案才会展示；仅有标签 / 倒计时 / CTA 不够。后台预览在无文案时仍保留横幅壳便于编辑。</p>
          </div>
          <div class="theme-ops-field">
            <label class="theme-ops-label">内容文字色</label>
            <div class="theme-ops-color">
              <ElColorPicker
                v-model="draft.contentTextColor"
                teleported
                :popper-options="{ strategy: 'fixed' }"
                popper-class="admin-theme-ops-color-picker-popper"
              />
              <ElInput v-model.trim="draft.contentTextColor" placeholder="#000000" />
            </div>
          </div>
        </div>
      </section>

      <section class="theme-ops-section">
        <div class="theme-ops-section__head">
          <div>
            <h4 class="theme-ops-section__title">抢购按钮</h4>
            <p class="theme-ops-section__desc">右侧描边胶囊 CTA，可单独开关。</p>
          </div>
          <ElSwitch v-model="draft.ctaEnabled" inline-prompt active-text="开" inactive-text="关" />
        </div>
        <div v-if="draft.ctaEnabled" class="theme-ops-grid">
          <div class="theme-ops-field">
            <label class="theme-ops-label">按钮文案</label>
            <ElInput v-model.trim="draft.ctaText" placeholder="例如：限时抢购" />
          </div>
          <div class="theme-ops-field">
            <label class="theme-ops-label">按钮文字色</label>
            <div class="theme-ops-color">
              <ElColorPicker
                v-model="draft.ctaTextColor"
                teleported
                :popper-options="{ strategy: 'fixed' }"
                popper-class="admin-theme-ops-color-picker-popper"
              />
              <ElInput v-model.trim="draft.ctaTextColor" placeholder="#000000" />
            </div>
          </div>
          <div class="theme-ops-field">
            <label class="theme-ops-label">按钮描边色</label>
            <div class="theme-ops-color">
              <ElColorPicker
                v-model="draft.ctaBorderColor"
                teleported
                :popper-options="{ strategy: 'fixed' }"
                popper-class="admin-theme-ops-color-picker-popper"
              />
              <ElInput v-model.trim="draft.ctaBorderColor" placeholder="#000000" />
            </div>
          </div>
          <div class="theme-ops-field">
            <label class="theme-ops-label">按钮底色</label>
            <div class="theme-ops-color">
              <ElColorPicker
                v-model="draft.ctaBackgroundColor"
                teleported
                :popper-options="{ strategy: 'fixed' }"
                popper-class="admin-theme-ops-color-picker-popper"
              />
              <ElInput v-model.trim="draft.ctaBackgroundColor" placeholder="留空透明" />
            </div>
          </div>
        </div>
        <p v-else class="theme-ops-empty">关闭后前台不展示抢购按钮，整条横幅仍可按跳转配置点击。</p>
      </section>

      <section class="theme-ops-section">
        <div class="theme-ops-section__head">
          <div>
            <h4 class="theme-ops-section__title">背景</h4>
            <p class="theme-ops-section__desc">优先使用背景图；未选择时使用渐变色。</p>
          </div>
        </div>
        <div class="theme-ops-grid">
          <div class="theme-ops-field">
            <label class="theme-ops-label">渐变起始色</label>
            <div class="theme-ops-color">
              <ElColorPicker
                v-model="draft.gradientStart"
                teleported
                :popper-options="{ strategy: 'fixed' }"
                popper-class="admin-theme-ops-color-picker-popper"
              />
              <ElInput v-model.trim="draft.gradientStart" placeholder="#D5F5FF" />
            </div>
          </div>
          <div class="theme-ops-field">
            <label class="theme-ops-label">渐变结束色</label>
            <div class="theme-ops-color">
              <ElColorPicker
                v-model="draft.gradientEnd"
                teleported
                :popper-options="{ strategy: 'fixed' }"
                popper-class="admin-theme-ops-color-picker-popper"
              />
              <ElInput v-model.trim="draft.gradientEnd" placeholder="#D5F5FF" />
            </div>
          </div>
          <div class="theme-ops-field theme-ops-field--full">
            <label class="theme-ops-label">背景图 URL</label>
            <ElInput
              v-model.trim="draft.backgroundImageUrl"
              placeholder="图片 URL；未设置时使用上方渐变色"
            />
            <p class="theme-ops-hint">支持 PNG / JPG / WebP URL；未设置时使用上方渐变色</p>
          </div>
        </div>
      </section>

      <section class="theme-ops-section">
        <div class="theme-ops-section__head">
          <div>
            <h4 class="theme-ops-section__title">跳转</h4>
            <p class="theme-ops-section__desc">点击横幅或抢购按钮时的跳转目标。</p>
          </div>
        </div>
        <div class="theme-ops-grid">
          <div class="theme-ops-field">
            <label class="theme-ops-label">跳转类型</label>
            <AdminSelect v-model="draft.actionType" :options="actionTypeOptions" />
          </div>
          <div v-if="draft.actionType === 'dialog'" class="theme-ops-field">
            <label class="theme-ops-label">打开弹窗</label>
            <AdminSelect v-model="draft.actionValue" :options="dialogTargetOptions" />
          </div>
          <div v-else class="theme-ops-field">
            <label class="theme-ops-label">跳转地址</label>
            <ElInput
              v-model.trim="draft.actionValue"
              :disabled="draft.actionType === 'none'"
              :placeholder="actionValuePlaceholder"
            />
          </div>
        </div>
        <p v-if="draft.actionType === 'dialog'" class="theme-ops-hint" style="margin-top: 10px;">
          选择「会员中心」即可打开与侧边栏相同的会员/营销弹窗。
        </p>
      </section>

      <div class="admin-form__footer admin-theme-ops-dialog__footer">
        <button type="button" class="admin-button admin-button--secondary admin-theme-ops-dialog__footer-btn" @click="emit('close')">取消</button>
        <button type="button" class="admin-button admin-button--primary admin-theme-ops-dialog__footer-btn" @click="emit('submit')">保存顶部横幅</button>
      </div>
    </div>
  </AdminDialog>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import type { SystemHomeTopBannerConfig } from '@/api/system-config'
import AdminDialog from '@/components/admin/common/AdminDialog.vue'
import AdminSelect from '@/components/admin/common/AdminSelect.vue'

export interface ThemeTopBannerDialogDraft extends SystemHomeTopBannerConfig {}

const props = defineProps<{
  visible: boolean
  draft: ThemeTopBannerDialogDraft | null
}>()

const emit = defineEmits<{
  close: []
  submit: []
}>()

const tagModeOptions = [
  { value: 'static', label: '静态文案' },
  { value: 'countdown', label: '倒计时' },
]

const actionTypeOptions = [
  { value: 'route', label: '站内路由' },
  { value: 'url', label: '外链' },
  { value: 'dialog', label: '打开弹窗' },
  { value: 'none', label: '无跳转' },
]

const dialogTargetOptions = [
  { value: 'marketing', label: '会员中心（订阅计划）' },
  { value: 'marketing:checkin', label: '会员中心 · 签到' },
  { value: 'marketing:redeem', label: '会员中心 · 兑换' },
  { value: 'marketing:recharge', label: '积分充值弹窗' },
  { value: 'login', label: '登录弹窗' },
]

const dialogTargetValues = new Set(dialogTargetOptions.map((item) => item.value))

watch(
  () => props.draft?.actionType,
  (actionType) => {
    if (!props.draft || actionType !== 'dialog') {
      return
    }
    if (!dialogTargetValues.has(String(props.draft.actionValue || '').trim())) {
      props.draft.actionValue = 'marketing'
    }
  },
)

const actionValuePlaceholder = computed(() => {
  if (props.draft?.actionType === 'url') {
    return 'https://example.com'
  }
  if (props.draft?.actionType === 'route') {
    return '/generate'
  }
  if (props.draft?.actionType === 'dialog') {
    return 'marketing'
  }
  return '选择跳转类型后填写'
})

</script>

<style scoped>
.admin-theme-top-banner-dialog__body {
  padding-bottom: 4px;
}

.theme-ops-subpanel__input {
  margin-top: 2px;
}

.admin-theme-top-banner-dialog__body :deep(.el-input__wrapper),
.admin-theme-top-banner-dialog__body :deep(.el-textarea__inner),
.admin-theme-top-banner-dialog__body :deep(.el-input-number),
.admin-theme-top-banner-dialog__body :deep(.el-date-editor) {
  border-radius: var(--admin-radius-control);
}
</style>

<style>
/* 与 AdminDialog mask（50000）对齐，避免日期面板被遮罩盖住 */
.admin-theme-top-banner-datepicker-popper {
  z-index: 52000 !important;
}
</style>
