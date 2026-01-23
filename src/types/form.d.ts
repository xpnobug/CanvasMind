/**
 * 表单相关类型定义
 */

import type { Component, ComputedRef, VNode } from 'vue'
import type { FormInstance, FormItemRule } from 'element-plus'

/**
 * 响应式断点类型
 */
export type ResponsiveBreakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

/**
 * 表单项类型
 */
export type FormItemType =
  | 'input'
  | 'inputtag'
  | 'number'
  | 'select'
  | 'switch'
  | 'checkbox'
  | 'checkboxgroup'
  | 'radiogroup'
  | 'date'
  | 'daterange'
  | 'datetime'
  | 'datetimerange'
  | 'rate'
  | 'slider'
  | 'cascader'
  | 'timepicker'
  | 'timeselect'
  | 'treeselect'

/**
 * 表单项选项
 */
export interface FormItemOption {
  label: string
  value: string | number | boolean
  disabled?: boolean
  [key: string]: any
}

/**
 * 表单项配置
 */
export interface FormItem {
  /** 表单项唯一标识（必填） */
  key: string
  /** 标签文本或渲染函数 */
  label?: string | (() => VNode) | Component
  /** 标签宽度 */
  labelWidth?: string | number
  /** 表单项类型 */
  type?: FormItemType
  /** 自定义渲染函数或组件 */
  render?: (() => VNode) | Component
  /** 是否隐藏 */
  hidden?: boolean | ComputedRef<boolean>
  /** 列宽（基于24栅格） */
  span?: number
  /** 选项数据（用于select/radio/checkbox） */
  options?: FormItemOption[]
  /** 传递给组件的属性 */
  props?: Record<string, any>
  /** 插槽配置 */
  slots?: Record<string, any>
  /** 占位符 */
  placeholder?: string
  /** 验证规则 */
  rules?: FormItemRule | FormItemRule[]
  /** 其他自定义属性 */
  [key: string]: any
}

/**
 * ArtForm 组件 Props
 */
export interface ArtFormProps {
  /** 表单数据（必填） */
  modelValue: Record<string, any>
  /** 表单项配置数组（必填） */
  items: FormItem[]
  /** 默认列宽，默认6 */
  span?: number
  /** 列间距，默认12 */
  gutter?: number
  /** 标签位置（left/right/top），默认right */
  labelPosition?: 'left' | 'right' | 'top'
  /** 标签宽度，默认70px */
  labelWidth?: string | number
  /** 按钮左对齐阈值，默认2 */
  buttonLeftLimit?: number
  /** 显示重置按钮，默认true */
  showReset?: boolean
  /** 显示提交按钮，默认true */
  showSubmit?: boolean
  /** 禁用提交按钮，默认false */
  disabledSubmit?: boolean
}

/**
 * ArtForm 组件 Emits
 */
export interface ArtFormEmits {
  /** 表单数据更新 */
  (e: 'update:modelValue', value: Record<string, any>): void
  /** 重置表单 */
  (e: 'reset'): void
  /** 提交表单 */
  (e: 'submit'): void
}

/**
 * ArtForm 组件暴露的方法
 */
export interface ArtFormExposed {
  /** 验证表单 */
  validate: (callback?: (valid: boolean) => void) => Promise<boolean>
  /** 重置表单 */
  reset: () => void
  /** 表单实例 */
  formInstance: FormInstance | undefined
}

/**
 * 密码强度枚举
 */
export enum PasswordStrength {
  WEAK = '弱',
  MEDIUM = '中',
  STRONG = '强'
}

/**
 * 验证函数类型
 */
export type ValidatorFunction = (value: string) => boolean

/**
 * 响应式断点配置
 */
export interface BreakpointConfig {
  /** 阈值 */
  threshold: number
  /** 降级值 */
  fallback: number
}

/**
 * 响应式配置映射
 */
export type ResponsiveConfigMap = {
  [K in ResponsiveBreakpoint]: BreakpointConfig | null
}

/**
 * 发布表单数据类型
 */
export interface PublishFormData {
  /** 标题 */
  title: string
  /** 选中的平台 (3=抖音, 4=快手, 2=视频号, 1=小红书) */
  selectedPlatform: number
  /** 是否保存为草稿（仅视频号） */
  isDraft: boolean
  /** 选中的账号ID列表 */
  selectedAccounts: number[]
  /** 选中的话题列表 */
  selectedTopics: string[]
  /** 商品标题（仅抖音） */
  productTitle: string
  /** 商品链接（仅抖音） */
  productLink: string
  /** 是否启用定时发布 */
  scheduleEnabled: boolean
  /** 每天发布视频数量 */
  videosPerDay: number
  /** 每天发布时间点 */
  dailyTimes: string[]
  /** 开始天数（0=明天，1=后天） */
  startDays: number
}

/**
 * 文件信息类型
 */
export interface FileInfo {
  /** 文件名 */
  name: string
  /** 文件路径 */
  path: string
  /** 文件大小（字节） */
  size: number
  /** 预览URL */
  url?: string
}

/**
 * Tab数据类型
 */
export interface TabData extends PublishFormData {
  /** Tab名称 */
  name: string
  /** Tab标签 */
  label: string
  /** 文件列表 */
  fileList: FileInfo[]
  /** 是否正在发布 */
  publishing: boolean
}
