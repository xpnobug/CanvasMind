<template>
  <div class="admin-page-content">
    <div class="admin-page-stage">
      <RouterView v-if="routerViewAlive" v-slot="{ Component, route: viewRoute }">
        <KeepAlive :max="10" :exclude="keepAliveExcludeNames">
          <component
            v-if="Component"
            :is="Component"
            :key="viewRoute.path"
            class="admin-page-view"
          />
        </KeepAlive>
        <div
          v-if="!Component"
          class="admin-page-content__placeholder"
          aria-busy="true"
        />
      </RouterView>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAdminLayoutContext } from './useAdminLayout'
import { useAdminWorktabStore } from '@/stores/admin-worktab'
// 加载 .admin-page-view 高度链，列表页标题区 / sticky 表头 / 底部分页才能铺满
import '@/components/admin/styles/admin-router-transition.css'

const route = useRoute()
const { contentRefreshTick } = useAdminLayoutContext()
const { keepAliveExclude } = useAdminWorktabStore()

const routerViewAlive = ref(true)

const keepAliveExcludeNames = computed(() => {
  const names = [...keepAliveExclude.value]
  if (route.meta.keepAlive === false) {
    const routeName = typeof route.name === 'string' ? route.name : ''
    const cacheName = routeName === 'AdminLayout' ? 'AdminSystem' : routeName
    if (cacheName && !names.includes(cacheName)) {
      names.push(cacheName)
    }
  }
  return names
})

watch(
  () => contentRefreshTick.value,
  () => {
    routerViewAlive.value = false
    nextTick(() => {
      routerViewAlive.value = true
    })
  },
)
</script>

<style scoped>
.admin-page-content {
  flex: 1;
  min-height: 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.admin-page-stage {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.admin-page-content__placeholder {
  min-height: 120px;
}
</style>
