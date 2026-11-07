<template>
  <el-dialog
    v-model="visible"
    class="admin-nav-search-dialog"
    width="560px"
    :show-close="false"
    append-to-body
    @closed="keyword = ''"
  >
    <div class="admin-nav-search">
      <div class="admin-nav-search__input-wrap">
        <el-icon class="admin-nav-search__icon"><Search /></el-icon>
        <input
          ref="inputRef"
          v-model.trim="keyword"
          class="admin-nav-search__input"
          type="text"
          placeholder="搜索后台菜单..."
          @keydown.esc.prevent="close"
          @keydown.enter.prevent="openFirstMatch"
        >
        <kbd class="admin-nav-search__kbd">ESC</kbd>
      </div>
      <ul v-if="results.length" class="admin-nav-search__list">
        <li
          v-for="item in results"
          :key="item.path"
          class="admin-nav-search__item"
          @click="openItem(item.path)"
        >
          <strong>{{ item.label }}</strong>
          <span>{{ item.description }}</span>
        </li>
      </ul>
      <div v-else class="admin-nav-search__empty">没有匹配的菜单</div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Search } from '@element-plus/icons-vue'
import { useAdminNav } from './useAdminNav'

const visible = defineModel<boolean>('visible', { default: false })

const router = useRouter()
const { navGroups } = useAdminNav()
const keyword = ref('')
const inputRef = ref<HTMLInputElement | null>(null)

const flatItems = computed(() => navGroups.value.flatMap((group) => group.items))

const results = computed(() => {
  const query = keyword.value.trim().toLowerCase()
  if (!query) {
    return flatItems.value.slice(0, 12)
  }

  return flatItems.value
    .filter((item) => {
      const haystack = `${item.label} ${item.path} ${item.description}`.toLowerCase()
      return haystack.includes(query)
    })
    .slice(0, 12)
})

const openItem = async (path: string) => {
  visible.value = false
  await router.push(path)
}

const openFirstMatch = async () => {
  const first = results.value[0]
  if (first) {
    await openItem(first.path)
  }
}

const close = () => {
  visible.value = false
}

watch(visible, (open) => {
  if (!open) {
    return
  }

  void nextTick(() => {
    inputRef.value?.focus()
  })
})
</script>

<style scoped>
.admin-nav-search__input-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 14px;
  height: 44px;
  border: 1px solid var(--line-divider, #00000014);
  border-radius: var(--admin-radius-control);
  background: var(--bg-block-secondary-default);
}

.admin-nav-search__icon {
  color: var(--text-tertiary);
}

.admin-nav-search__input {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  color: var(--text-primary);
  font-size: 14px;
  outline: none;
}

.admin-nav-search__kbd {
  padding: 2px 6px;
  border-radius: var(--admin-radius-panel);
  border: 1px solid var(--line-divider, #00000014);
  color: var(--text-tertiary);
  font-size: 11px;
}

.admin-nav-search__list {
  margin: 14px 0 0;
  padding: 0;
  list-style: none;
  max-height: 320px;
  overflow: auto;
}

.admin-nav-search__item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  border-radius: var(--admin-radius-control);
  cursor: pointer;
}

.admin-nav-search__item:hover {
  background: var(--bg-block-secondary-hover);
}

.admin-nav-search__item strong {
  color: var(--text-primary);
  font-size: 14px;
}

.admin-nav-search__item span {
  color: var(--text-tertiary);
  font-size: 12px;
}

.admin-nav-search__empty {
  margin-top: 14px;
  color: var(--text-tertiary);
  font-size: 13px;
  text-align: center;
}
</style>
