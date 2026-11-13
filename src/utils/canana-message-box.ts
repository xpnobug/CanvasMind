import type { ElMessageBoxOptions } from 'element-plus'

export const CANANA_EP_MSGBOX_CLASS = 'canana-ep-message-box'
export const CANANA_EP_OVERLAY_CLASS = 'canana-ep-overlay'

/** MessageBox 默认主题：与 canana-ep-dialog 对齐的毛玻璃确认框 */
export const cananaMessageBoxTheme = {
  customClass: CANANA_EP_MSGBOX_CLASS,
  modalClass: CANANA_EP_OVERLAY_CLASS,
} satisfies Pick<ElMessageBoxOptions, 'customClass' | 'modalClass'>

export function cananaMessageBoxOptions<T extends Record<string, unknown>>(options?: T) {
  return {
    ...cananaMessageBoxTheme,
    ...options,
  }
}
