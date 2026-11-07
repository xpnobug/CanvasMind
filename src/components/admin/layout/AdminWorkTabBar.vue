<template>
  <div v-if="opened.length" class="admin-worktab">
    <div ref="_scrollRef" class="admin-worktab__scroll">
      <ul
        ref="_listRef"
        class="admin-worktab__list"
        :style="{
          transform: `translateX(${translateX}px)`,
          transition,
        }"
      >
        <li v-for="tab in opened" :key="tab.path" class="admin-worktab__cell">
          <el-dropdown
            trigger="contextmenu"
            placement="bottom-start"
            @command="(command: string | number) => handleContextCommand(command, tab.path)"
          >
            <div
              class="admin-worktab__item"
              :class="{ 'is-active': tab.path === route.path }"
              :data-active="tab.path === route.path ? 'true' : undefined"
              :style="{ padding: tab.fixedTab ? '0 10px' : '0 8px 0 12px' }"
              @click="openTab(tab.path)"
            >
              <i
                v-if="isAdminRemixIcon(tab.icon)"
                class="admin-worktab__icon"
                :class="tab.icon"
                aria-hidden="true"
              />
              <span class="admin-worktab__label">{{ tab.title }}</span>
              <button
                v-if="hasMultipleTabs && !tab.fixedTab"
                class="admin-worktab__close"
                type="button"
                aria-label="关闭标签"
                @click.stop="closeTab(tab.path)"
              >
                <el-icon><Close /></el-icon>
              </button>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  command="refresh"
                  :disabled="tab.path !== route.path || refreshDisabled"
                >
                  刷新
                </el-dropdown-item>
                <el-dropdown-item command="toggle-fixed">
                  {{ tab.fixedTab ? '取消固定' : '固定标签' }}
                </el-dropdown-item>
                <el-dropdown-item divided command="close" :disabled="tab.fixedTab || !hasMultipleTabs">
                  关闭
                </el-dropdown-item>
                <el-dropdown-item command="close-left" :disabled="!canCloseLeft(tab.path)">
                  关闭左侧
                </el-dropdown-item>
                <el-dropdown-item command="close-right" :disabled="!canCloseRight(tab.path)">
                  关闭右侧
                </el-dropdown-item>
                <el-dropdown-item command="close-other" :disabled="!canCloseOther(tab.path)">
                  关闭其他
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </li>
      </ul>
    </div>

    <el-dropdown trigger="click" placement="bottom-end" @command="handleMenuCommand">
      <button class="admin-worktab__menu" type="button" aria-label="标签页菜单">
        <el-icon><ArrowDown /></el-icon>
      </button>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item command="refresh" :disabled="refreshDisabled">刷新当前页</el-dropdown-item>
          <el-dropdown-item command="toggle-fixed">{{ activeTabFixedLabel }}</el-dropdown-item>
          <el-dropdown-item divided command="close-left" :disabled="!canCloseLeft(route.path)">
            关闭左侧
          </el-dropdown-item>
          <el-dropdown-item command="close-right" :disabled="!canCloseRight(route.path)">
            关闭右侧
          </el-dropdown-item>
          <el-dropdown-item command="close-other" :disabled="!hasMultipleTabs">关闭其他</el-dropdown-item>
          <el-dropdown-item command="close-all" :disabled="!hasClosableTabs">关闭全部</el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<script setup lang="ts">
import { ArrowDown, Close } from '@element-plus/icons-vue'
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAdminLayoutContext } from './useAdminLayout'
import { useAdminWorktabScroll } from './useAdminWorktabScroll'
import { useAdminWorktabStore, type AdminWorkTab } from '@/stores/admin-worktab'
import { isAdminRemixIcon } from './admin-nav'

const route = useRoute()
const router = useRouter()
const { refreshPage } = useAdminLayoutContext()
const worktabStore = useAdminWorktabStore()
const { opened, hasMultipleTabs } = worktabStore
const {
  closeTab: closeWorktab,
  closeLeftTabs,
  closeRightTabs,
  closeOtherTabs,
  closeAllTabs,
  toggleFixedTab,
} = worktabStore

const refreshDisabled = computed(() => route.meta.allowAdminRefresh === false)

const activeTab = computed(() => opened.value.find((tab: AdminWorkTab) => tab.path === route.path))
const activeTabFixedLabel = computed(() => (activeTab.value?.fixedTab ? '取消固定' : '固定标签'))
const hasClosableTabs = computed(() => opened.value.some((tab: AdminWorkTab) => !tab.fixedTab))

const tabCount = computed(() => opened.value.length)
const { scrollRef: _scrollRef, listRef: _listRef, translateX, transition } = useAdminWorktabScroll(
  computed(() => route.path),
  tabCount,
)

let pendingTabPath: string | null = null
let pendingTabFrame = 0

const canCloseLeft = (path: string) => {
  const index = opened.value.findIndex((tab: AdminWorkTab) => tab.path === path)
  if (index <= 0) return false
  return opened.value.slice(0, index).some((tab: AdminWorkTab) => !tab.fixedTab)
}

const canCloseRight = (path: string) => {
  const index = opened.value.findIndex((tab: AdminWorkTab) => tab.path === path)
  if (index < 0 || index >= opened.value.length - 1) return false
  return opened.value.slice(index + 1).some((tab: AdminWorkTab) => !tab.fixedTab)
}

const canCloseOther = (path: string) => {
  const index = opened.value.findIndex((tab: AdminWorkTab) => tab.path === path)
  if (index < 0) return false
  return opened.value.some((tab: AdminWorkTab, i: number) => i !== index && !tab.fixedTab)
}

const navigateIfNeeded = async (path: string | null) => {
  if (path && path !== route.path) {
    await router.push(path).catch(() => undefined)
  }
}

const openTab = (path: string) => {
  if (path === route.path) {
    return
  }

  pendingTabPath = path
  if (pendingTabFrame) {
    cancelAnimationFrame(pendingTabFrame)
  }

  pendingTabFrame = requestAnimationFrame(() => {
    pendingTabFrame = 0
    const target = pendingTabPath
    pendingTabPath = null
    if (!target || target === route.path) {
      return
    }
    void router.push(target).catch(() => undefined)
  })
}

const closeTab = async (path: string) => {
  const nextPath = closeWorktab(path, route.path)
  await navigateIfNeeded(nextPath)
}

const runOnTab = async (path: string, action: string) => {
  if (path !== route.path && action !== 'close-left' && action !== 'close-right' && action !== 'close-other' && action !== 'close' && action !== 'close-all') {
    await router.push(path).catch(() => undefined)
  }

  switch (action) {
    case 'refresh':
      if (!refreshDisabled.value && path === route.path) {
        refreshPage()
      }
      break
    case 'toggle-fixed':
      toggleFixedTab(path)
      break
    case 'close':
      await navigateIfNeeded(closeWorktab(path, route.path))
      break
    case 'close-left':
      await navigateIfNeeded(closeLeftTabs(path, route.path))
      break
    case 'close-right':
      await navigateIfNeeded(closeRightTabs(path, route.path))
      break
    case 'close-other':
      await navigateIfNeeded(closeOtherTabs(path, route.path))
      break
    case 'close-all':
      await navigateIfNeeded(closeAllTabs(route.path))
      break
    default:
      break
  }
}

const handleMenuCommand = async (command: string | number) => {
  await runOnTab(route.path, String(command))
}

const handleContextCommand = async (command: string | number, path: string) => {
  await runOnTab(path, String(command))
}
</script>
