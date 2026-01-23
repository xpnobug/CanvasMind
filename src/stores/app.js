import { ref } from 'vue'

// 创建单例状态
const isAccountRefreshing = ref(false)
const materials = ref([])
const theme = ref('dark')

/**
 * 应用全局状态管理（单例模式）
 */
export function useAppStore() {
  function setAccountRefreshing(value) {
    isAccountRefreshing.value = value
  }

  function setMaterials(data) {
    materials.value = data.map(item => ({
      id: item[0],
      filename: item[1],
      filesize: item[2],
      file_path: item[3],
      upload_time: item[4] || ''
    }))
  }

  function setTheme(newTheme) {
    theme.value = newTheme
    document.documentElement.setAttribute('data-theme', newTheme)
  }

  return {
    isAccountRefreshing,
    materials,
    theme,
    setAccountRefreshing,
    setMaterials,
    setTheme
  }
}
