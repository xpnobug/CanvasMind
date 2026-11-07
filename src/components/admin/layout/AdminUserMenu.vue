<template>
  <el-dropdown trigger="click" placement="bottom-end" @command="handleCommand">
    <button class="admin-user-menu__trigger" type="button" aria-label="用户菜单">
      <span class="admin-user-menu__avatar">{{ avatarText }}</span>
      <span v-if="displayName" class="admin-user-menu__name">{{ displayName }}</span>
    </button>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item disabled class="admin-user-menu__profile">
          <strong>{{ displayName }}</strong>
          <span v-if="profileHint">{{ profileHint }}</span>
        </el-dropdown-item>
        <el-dropdown-item divided command="account">账号设置</el-dropdown-item>
        <el-dropdown-item command="home">返回前台</el-dropdown-item>
        <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const displayName = computed(() => {
  const name = authStore.currentUser.value?.name?.trim()
  if (name) {
    return name
  }

  return authStore.loginButtonText.value || '管理员'
})

const profileHint = computed(() => {
  const user = authStore.currentUser.value
  return user?.maskedEmail || user?.maskedPhone || ''
})

const avatarText = computed(() => displayName.value.slice(0, 1).toUpperCase())

const handleCommand = async (command: string | number) => {
  if (command === 'account') {
    await router.push('/account')
    return
  }

  if (command === 'home') {
    await router.push('/')
    return
  }

  if (command === 'logout') {
    await authStore.logout()
  }
}
</script>

<style scoped>
.admin-user-menu__trigger {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  padding: 0 12px 0 4px;
  border: 1px solid var(--line-divider, #00000014);
  border-radius: 999px;
  background: var(--bg-surface);
  color: var(--text-primary);
  cursor: pointer;
}

.admin-user-menu__avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--brand-main-block-default);
  color: var(--brand-main-default);
  font-size: 14px;
  font-weight: 700;
}

.admin-user-menu__name {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  font-weight: 600;
}

:deep(.admin-user-menu__profile) {
  display: flex;
  flex-direction: column;
  gap: 4px;
  line-height: 1.5;
  cursor: default;
}

:deep(.admin-user-menu__profile strong) {
  color: var(--text-primary);
  font-weight: 600;
}

:deep(.admin-user-menu__profile span) {
  color: var(--text-tertiary);
  font-size: 12px;
}

@media (max-width: 960px) {
  .admin-user-menu__name {
    display: none;
  }

  .admin-user-menu__trigger {
    padding: 0 4px;
  }
}
</style>
