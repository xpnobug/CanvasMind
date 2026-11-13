import { ElMessage } from 'element-plus'

/**
 * 后端暂无会话导出接口；保留同名入口，避免列表菜单接线失败。
 * 开启 managementPolicy.allowExportSessions 后仍会提示未实现，避免伪造成功。
 */
export const downloadAdminGenerationSessionExport = async (
  _sessionId: string,
  _title?: string,
): Promise<number> => {
  ElMessage.warning('当前环境尚未接入会话导出')
  throw new Error('会话导出未接入')
}
