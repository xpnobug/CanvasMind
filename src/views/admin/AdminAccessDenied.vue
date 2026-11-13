<template>
  <div class="admin-access-denied">
    <div class="admin-access-denied__card">
      <h1 class="admin-access-denied__title">没有后台访问权限</h1>
      <p class="admin-access-denied__desc">
        当前账号已登录，但未被授予管理员角色，因此无法进入后台管理页面。
      </p>
      <div class="admin-access-denied__actions">
        <button class="admin-button admin-button--secondary" type="button" @click="goHome">
          返回首页
        </button>
        <button class="admin-button admin-button--primary" type="button" @click="goAccount">
          前往账号页
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import '@/components/admin/styles/admin-primitives.css'
import './AdminAccessDenied.css'

const router = useRouter()

const goHome = () => {
  void router.push('/')
}

const goAccount = () => {
  void router.push('/account')
}
</script>
