<template>
  <header class="admin-header">
    <div class="admin-header__left">
      <div class="admin-header__tools">
        <button
          class="admin-header__menu"
          type="button"
          :aria-label="isMobile ? '打开侧边栏' : '折叠侧边栏'"
          :aria-expanded="isMobile ? mobileSidebarOpen : undefined"
          aria-controls="admin-sidebar"
          @click="toggleSidebar"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        <button
          class="admin-header__icon-btn"
          type="button"
          title="刷新当前页"
          aria-label="刷新当前页"
          :disabled="refreshDisabled"
          @click="refreshPage"
        >
          ↻
        </button>
      </div>
      <div class="admin-header__meta">
        <AdminBreadcrumb :items="breadcrumbItems" />
        <h2 class="admin-header__title">{{ title }}</h2>
        <div v-if="description" class="admin-header__description">{{ description }}</div>
      </div>
    </div>

    <div class="admin-header__right">
      <span class="admin-header__tag">管理后台</span>
      <AdminUserMenu />
    </div>
  </header>
</template>

<script setup lang="ts">
import AdminBreadcrumb from './AdminBreadcrumb.vue'
import AdminUserMenu from './AdminUserMenu.vue'
import { useAdminLayoutContext } from './useAdminLayout'
import type { AdminBreadcrumbItem } from './useAdminBreadcrumb'

defineProps<{
  title: string
  description: string
  breadcrumbItems: AdminBreadcrumbItem[]
  refreshDisabled?: boolean
}>()

const { toggleSidebar, refreshPage, isMobile, mobileSidebarOpen } = useAdminLayoutContext()
</script>
