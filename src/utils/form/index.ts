/**
 * 表单工具模块统一导出
 *
 * @module utils/form
 */

// 导出验证工具
export {
  PasswordStrength,
  trimSpaces,
  validatePhone,
  validateTelPhone,
  validateAccount,
  validatePassword,
  validateStrongPassword,
  getPasswordStrength,
  validateIPv4Address,
  validateEmail,
  validateURL,
  validateChineseIDCard,
  validateBankCard
} from './validator'

// 导出响应式布局工具
export type { ResponsiveBreakpoint } from './responsive'
export { calculateResponsiveSpan, createResponsiveSpanCalculator } from './responsive'
