/**
 * JSON 配置文件下载工具（admin 导入导出共用）
 *
 * 消费方：密钥模板管理页、厂商配置管理页的导出功能。
 */

/** 把数据序列化为格式化 JSON 并触发浏览器下载 */
export const downloadJsonFile = (filename: string, data: unknown) => {
  const blob = new Blob([`${JSON.stringify(data, null, 2)}\n`], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

/** 生成带日期的导出文件名：{prefix}-YYYY-MM-DD.json */
export const buildExportFilename = (prefix: string) => {
  const date = new Date().toISOString().slice(0, 10)
  return `${prefix}-${date}.json`
}
