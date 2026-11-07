<template>
  <div class="relative box-border flex h-screen w-full items-center justify-center bg-[var(--bg-body)] p-0 md:p-5">
    <div
      :class="[
        'relative box-border flex flex-col overflow-hidden bg-[var(--bg-surface)] transition-[width,height] duration-500 md:rounded-xl',
        step === 0
          ? 'h-full w-full'
          : 'h-full w-full md:max-w-6xl',
      ]"
    >
      <div class="z-10 flex w-full items-center justify-between px-4 py-4 md:px-6 md:py-6">
        <div class="flex items-center gap-3">
          <div class="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#19112f] via-[#432b7d] to-[#7b61ff] text-lg font-bold text-white shadow-[0_12px_28px_rgba(52,30,107,0.35)]">
            {{ brandInitial }}
          </div>
          <div>
            <div class="text-xl font-semibold leading-6 text-[var(--text-primary)]">{{ currentSiteName }}</div>
            <div class="mt-1 text-sm text-[var(--text-tertiary)]">version：{{ appVersion }}</div>
          </div>
        </div>

<!--        <div class="flex items-center gap-3">-->
<!--          <el-dropdown trigger="click" placement="bottom-end">-->
<!--            <el-button plain size="small">-->
<!--              简体中文-->
<!--              <span class="ml-2 text-[10px] text-[var(--text-tertiary)]">CN</span>-->
<!--            </el-button>-->
<!--            <template #dropdown>-->
<!--              <el-dropdown-menu>-->
<!--                <el-dropdown-item>简体中文</el-dropdown-item>-->
<!--              </el-dropdown-menu>-->
<!--            </template>-->
<!--          </el-dropdown>-->
<!--        </div>-->
      </div>

      <div
        v-if="step === 0"
        class="flex h-full flex-1 items-center justify-center px-4 py-6 md:px-6 md:py-10"
      >
        <InstallWelcome
          key="intro"
          :site-name="currentSiteName"
          @start="step = 1"
          @home="openDocumentation"
        />
      </div>

      <div v-else class="flex min-h-0 flex-1 flex-col overflow-hidden">
        <el-scrollbar class="h-full">
          <div class="flex h-full flex-col justify-center box-border px-4 py-6 md:px-6 md:pt-2 md:pb-10">
            <InstallAdminForm
              v-if="step === 1"
              key="admin"
              :form="adminForm"
              :errors="adminErrors"
              :visible="adminPanelVisible"
              @update-field="handleAdminFieldUpdate"
            />

            <InstallWebsiteForm
              v-else-if="step === 2"
              key="site"
              :form="websiteForm"
              :site-name="currentSiteName"
              :brand-initial="brandInitial"
              :site-name-error="siteNameError"
              :uploading-logo="uploadingLogo"
              :uploading-icon="uploadingIcon"
              @update-field="handleWebsiteFieldUpdate"
              @pick-logo="openFilePicker('logo')"
              @pick-icon="openFilePicker('icon')"
            />

            <InstallSuccess
              v-else
              key="success"
              :username="adminForm.username"
              :name="adminForm.name"
              :site-name="currentSiteName"
              :site-description="websiteForm.siteDescription"
              @home="goHome"
              @dashboard="goDashboard"
            />
          </div>
        </el-scrollbar>
      </div>

      <div
        v-if="step !== 0 && step !== 3"
        class="box-border flex w-full items-center justify-between gap-4 border-t border-[var(--stroke-primary)]/70 px-4 py-4 md:px-6 md:py-5 max-md:flex-col max-md:items-stretch"
      >
        <div class="flex min-w-0 items-center gap-3 text-sm text-[var(--text-secondary)]">
          <span class="font-medium text-[var(--text-primary)]">步骤 {{ step }}/2</span>
          <span class="inline-flex h-1.5 w-20 overflow-hidden rounded-full bg-[var(--bg-block-primary-default)]">
            <span
              class="h-full rounded-full bg-[var(--brand-main-default)] transition-all duration-300"
              :style="{ width: step === 1 ? '50%' : '100%' }"
            />
          </span>
        </div>
        <div class="grid w-full max-w-[360px] shrink-0 grid-cols-2 gap-3 max-md:max-w-none max-md:grid-cols-1">
          <InstallActionButton
            variant="secondary"
            size="large"
            block
            :disabled="submitting"
            @click="handlePrevStep"
          >
            上一步
          </InstallActionButton>
          <InstallActionButton
            v-if="step === 1"
            variant="primary"
            size="large"
            block
            :disabled="!canGoNextStep || submitting"
            @click="step = 2"
          >
            下一步
            <template #icon>
              <el-icon><ArrowRight /></el-icon>
            </template>
          </InstallActionButton>
          <InstallActionButton
            v-else
            variant="primary"
            size="large"
            block
            :loading="submitting"
            :disabled="!canSubmit || submitting"
            @click="handleSubmit"
          >
            完成配置
            <template #icon>
              <el-icon v-if="!submitting"><Check /></el-icon>
            </template>
          </InstallActionButton>
        </div>
      </div>
    </div>

    <input
      ref="logoInputRef"
      class="hidden"
      type="file"
      accept="image/*"
      @change="handleFileChange($event, 'logo')"
    >
    <input
      ref="iconInputRef"
      class="hidden"
      type="file"
      accept="image/*"
      @change="handleFileChange($event, 'icon')"
    >
  </div>
</template>

<script setup lang="ts">
import { ArrowRight, Check } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { buildAssetUrl } from '@/api/http'
import { uploadStorageFile } from '@/api/storage'
import { useAuthStore } from '@/stores/auth'
import { useSystemInitStore } from '@/stores/system-init'
import { useSystemSettingsStore } from '@/stores/system-settings'
import InstallAdminForm, { type InstallAdminFormModel } from './components/InstallAdminForm.vue'
import InstallActionButton from './components/InstallActionButton.vue'
import InstallSuccess from './components/InstallSuccess.vue'
import InstallWebsiteForm, { type InstallWebsiteFormModel } from './components/InstallWebsiteForm.vue'
import InstallWelcome from './components/InstallWelcome.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const systemInitStore = useSystemInitStore()
const systemSettingsStore = useSystemSettingsStore()

const step = ref(0)
const appVersion = '1.0.2'
const logoInputRef = ref<HTMLInputElement | null>(null)
const iconInputRef = ref<HTMLInputElement | null>(null)
const uploadingLogo = ref(false)
const uploadingIcon = ref(false)
const adminPanelVisible = ref(false)
let adminPanelTimer: number | null = null

const adminForm = reactive<InstallAdminFormModel>({
  username: '',
  name: '超级管理员',
  password: '',
  confirmPassword: '',
  email: '',
})

const websiteForm = reactive<InstallWebsiteFormModel>({
  siteName: 'CananaMind',
  siteDescription: '',
  siteLogoUrl: '',
  siteIconUrl: '',
})

const submitting = computed(() => systemInitStore.systemInitLoading.value)
const currentSiteName = computed(() => websiteForm.siteName || systemSettingsStore.siteName.value || 'CananaMind')
const brandInitial = computed(() => currentSiteName.value.slice(0, 1).toUpperCase() || 'C')

const usernameError = computed(() => {
  if (!adminForm.username) return ''
  return /^[a-zA-Z][a-zA-Z0-9_-]{3,31}$/.test(adminForm.username)
    ? ''
    : '账号需为 4-32 位，并以字母开头'
})

const nameError = computed(() => {
  if (!adminForm.name) return ''
  return adminForm.name.trim() ? '' : '请输入管理员昵称'
})

const passwordError = computed(() => {
  if (!adminForm.password) return ''
  return adminForm.password.length >= 8 && adminForm.password.length <= 64
    ? ''
    : '密码长度需为 8-64 位'
})

const confirmPasswordError = computed(() => {
  if (!adminForm.confirmPassword) return ''
  return adminForm.password === adminForm.confirmPassword ? '' : '两次输入的密码不一致'
})

const emailError = computed(() => {
  if (!adminForm.email) return ''
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminForm.email) ? '' : '请输入正确的邮箱地址'
})

const siteNameError = computed(() => {
  if (!websiteForm.siteName) return ''
  return websiteForm.siteName.trim() ? '' : '请输入网站名称'
})

const adminErrors = computed(() => ({
  usernameError: usernameError.value,
  nameError: nameError.value,
  passwordError: passwordError.value,
  confirmPasswordError: confirmPasswordError.value,
  emailError: emailError.value,
}))

const canGoNextStep = computed(() => {
  return Boolean(adminForm.username)
    && Boolean(adminForm.name.trim())
    && Boolean(adminForm.password)
    && Boolean(adminForm.confirmPassword)
    && !usernameError.value
    && !nameError.value
    && !passwordError.value
    && !confirmPasswordError.value
    && !emailError.value
})

const canSubmit = computed(() => canGoNextStep.value && Boolean(websiteForm.siteName.trim()) && !siteNameError.value)

watch(step, (nextStep) => {
  if (adminPanelTimer) {
    window.clearTimeout(adminPanelTimer)
    adminPanelTimer = null
  }

  if (nextStep === 1) {
    adminPanelVisible.value = false
    adminPanelTimer = window.setTimeout(() => {
      adminPanelVisible.value = true
      adminPanelTimer = null
    }, 500)
    return
  }

  adminPanelVisible.value = false
}, { immediate: true })

onBeforeUnmount(() => {
  if (adminPanelTimer) {
    window.clearTimeout(adminPanelTimer)
    adminPanelTimer = null
  }
})

const resolveRedirect = () => String(route.query.redirect || '').trim()

const handleAdminFieldUpdate = (field: keyof InstallAdminFormModel, value: string) => {
  adminForm[field] = value
}

const handleWebsiteFieldUpdate = (field: keyof InstallWebsiteFormModel, value: string) => {
  websiteForm[field] = value
}

const openFilePicker = (type: 'logo' | 'icon') => {
  if (type === 'logo') {
    logoInputRef.value?.click()
    return
  }

  iconInputRef.value?.click()
}

const handleFileChange = async (event: Event, type: 'logo' | 'icon') => {
  const input = event.target as HTMLInputElement | null
  const file = input?.files?.[0]
  if (!file) {
    return
  }

  try {
    if (type === 'logo') {
      uploadingLogo.value = true
    } else {
      uploadingIcon.value = true
    }

    const uploaded = await uploadStorageFile(file, 'asset')
    const publicUrl = buildAssetUrl(uploaded.publicUrl || uploaded.filePath || '')

    if (type === 'logo') {
      websiteForm.siteLogoUrl = publicUrl
    } else {
      websiteForm.siteIconUrl = publicUrl
    }
  } catch (error: any) {
    ElMessage.error(error?.message || '上传图片失败')
  } finally {
    if (input) {
      input.value = ''
    }

    if (type === 'logo') {
      uploadingLogo.value = false
    } else {
      uploadingIcon.value = false
    }
  }
}

const handlePrevStep = () => {
  if (step.value <= 0) {
    return
  }

  step.value -= 1
}

const handleSubmit = async () => {
  if (!canSubmit.value) {
    ElMessage.warning('请先完成当前步骤必填项')
    return
  }

  try {
    await systemInitStore.runInitialize({
      username: adminForm.username,
      password: adminForm.password,
      confirmPassword: adminForm.confirmPassword,
      name: adminForm.name,
      email: adminForm.email,
      siteName: websiteForm.siteName,
      siteDescription: websiteForm.siteDescription,
      siteLogoUrl: websiteForm.siteLogoUrl,
      siteIconUrl: websiteForm.siteIconUrl,
    })

    await Promise.all([
      authStore.loadSession(true),
      authStore.loadMethods(true),
      systemSettingsStore.loadPublicSettings(true),
    ])

    step.value = 3
  } catch (error: any) {
    ElMessage.error(error?.message || '初始化失败')
  }
}

const goHome = async () => {
  await router.replace('/')
}

const openDocumentation = () => {
  window.open('https://github.com/xpnobug/CanvasMind', '_blank', 'noopener,noreferrer')
}

const goDashboard = async () => {
  await router.replace(resolveRedirect() || '/admin/dashboard')
}
</script>
