// 对象存储配置接口基础路径。
export const STORAGE_CONFIGS_BASE_PATH = '/api/storage/configs'

// 判断当前请求是否命中对象存储配置接口。
export const isStorageConfigsPath = (requestPath: string) => {
  // 支持列表、详情和激活操作路径。
  return requestPath === STORAGE_CONFIGS_BASE_PATH
    || requestPath.startsWith(`${STORAGE_CONFIGS_BASE_PATH}/`)
}
