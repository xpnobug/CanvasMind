/**
 * 全局键盘快捷键 composable
 *
 * 替代项目里散点的 window.addEventListener('keydown') 注册，统一处理：
 *   - chord 解析（支持 Cmd/Ctrl/CmdOrCtrl/Shift/Alt/Meta 修饰 + 字母键/方向键/Esc/Space/Enter/Delete/Backspace）
 *   - 跨平台修饰键映射：CmdOrCtrl → Mac 上 metaKey、Win/Linux 上 ctrlKey
 *   - 输入框焦点屏蔽：input/textarea/select/contenteditable 聚焦时默认跳过
 *   - 多组件注册同一 chord 时按 priority 互斥（高优先级先响应，可配 propagate 让多个 handler 都响应）
 *   - 组件 onBeforeUnmount 时自动解绑
 *
 * 不引入第三方依赖。
 */
import { onBeforeUnmount } from 'vue'

const IS_MAC = typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/i.test(navigator.platform)

export interface ShortcutOptions {
  /** 输入框（input/textarea/select/contenteditable）聚焦时跳过。默认 true */
  skipInInput?: boolean
  /** 优先级，越高越先匹配。默认 0 */
  priority?: number
  /** 是否阻止默认行为。默认 true */
  preventDefault?: boolean
  /** 是否阻止事件冒泡。默认 false */
  stopPropagation?: boolean
  /** 触发后是否让后续低优先级 handler 继续响应同一事件。默认 false（互斥） */
  propagate?: boolean
}

interface ParsedChord {
  key: string
  cmd: boolean
  ctrl: boolean
  cmdOrCtrl: boolean
  shift: boolean
  alt: boolean
  meta: boolean
}

interface RegisteredShortcut {
  chord: ParsedChord
  handler: (event: KeyboardEvent) => void
  opts: Required<ShortcutOptions>
}

const registry: RegisteredShortcut[] = []
let listenerAttached = false

function ensureListener() {
  if (listenerAttached || typeof window === 'undefined') return
  listenerAttached = true
  window.addEventListener('keydown', dispatch, false)
}

function dispatch(event: KeyboardEvent) {
  // 复制再排序，避免触发期间 push/splice 改动到原数组顺序
  const sorted = [...registry].sort((a, b) => b.opts.priority - a.opts.priority)
  for (const item of sorted) {
    if (!matchesChord(event, item.chord)) continue
    if (item.opts.skipInInput && isEditable(event.target)) continue
    if (item.opts.preventDefault) event.preventDefault()
    if (item.opts.stopPropagation) event.stopPropagation()
    item.handler(event)
    if (!item.opts.propagate) break
  }
}

function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName.toLowerCase()
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true
  if (target.isContentEditable) return true
  return false
}

function normalizeKey(raw: string): string {
  const k = raw.trim().toLowerCase()
  const map: Record<string, string> = {
    esc: 'escape',
    escape: 'escape',
    space: ' ',
    spacebar: ' ',
    enter: 'enter',
    return: 'enter',
    del: 'delete',
    delete: 'delete',
    backspace: 'backspace',
    tab: 'tab',
    up: 'arrowup',
    down: 'arrowdown',
    left: 'arrowleft',
    right: 'arrowright',
    arrowup: 'arrowup',
    arrowdown: 'arrowdown',
    arrowleft: 'arrowleft',
    arrowright: 'arrowright',
    plus: '+',
    minus: '-',
    eq: '=',
  }
  return map[k] ?? k
}

function parseChord(raw: string): ParsedChord {
  const parts = raw.split('+').map((p) => p.trim().toLowerCase()).filter(Boolean)
  const key = normalizeKey(parts[parts.length - 1] || '')
  const mods = parts.slice(0, -1)
  return {
    key,
    cmd: mods.includes('cmd'),
    ctrl: mods.includes('ctrl'),
    cmdOrCtrl: mods.includes('cmdorctrl') || mods.includes('mod'),
    shift: mods.includes('shift'),
    alt: mods.includes('alt') || mods.includes('option'),
    meta: mods.includes('meta'),
  }
}

function matchesChord(event: KeyboardEvent, c: ParsedChord): boolean {
  // 跨平台 cmdOrCtrl：Mac 上要按 metaKey 且不按 ctrlKey；其他平台反过来
  if (c.cmdOrCtrl) {
    if (IS_MAC) {
      if (!event.metaKey || event.ctrlKey) return false
    } else {
      if (!event.ctrlKey || event.metaKey) return false
    }
  } else {
    if (c.cmd !== event.metaKey) return false
    if (c.ctrl !== event.ctrlKey) return false
  }
  if (c.shift !== event.shiftKey) return false
  if (c.alt !== event.altKey) return false
  // meta 修饰用得少；只有当 chord 里没有 cmd / cmdOrCtrl 时才单独校验 meta
  if (!c.cmd && !c.cmdOrCtrl && c.meta && !event.metaKey) return false

  const eventKey = (event.key || '').toLowerCase()
  if (eventKey !== c.key) return false
  return true
}

/**
 * 注册一个或多个快捷键 chord，共用同一个 handler
 *
 * @example
 * useShortcut('CmdOrCtrl+Z', () => undo())
 * useShortcut(['CmdOrCtrl+Shift+Z', 'CmdOrCtrl+Y'], () => redo())
 * useShortcut('Escape', () => closePopover(), { priority: 10 })
 */
export function useShortcut(
  chord: string | string[],
  handler: (event: KeyboardEvent) => void,
  options?: ShortcutOptions,
): { stop: () => void } {
  const opts: Required<ShortcutOptions> = {
    skipInInput: options?.skipInInput ?? true,
    priority: options?.priority ?? 0,
    preventDefault: options?.preventDefault ?? true,
    stopPropagation: options?.stopPropagation ?? false,
    propagate: options?.propagate ?? false,
  }
  const chords = Array.isArray(chord) ? chord : [chord]
  const entries: RegisteredShortcut[] = chords.map((c) => ({
    chord: parseChord(c),
    handler,
    opts,
  }))
  for (const e of entries) registry.push(e)
  ensureListener()

  const stop = () => {
    for (const e of entries) {
      const idx = registry.indexOf(e)
      if (idx >= 0) registry.splice(idx, 1)
    }
  }

  // 在 setup / 生命周期内调用时自动解绑；非 setup 上下文调用时静默跳过
  try {
    onBeforeUnmount(stop)
  } catch {
    /* not in component setup; caller must stop() manually */
  }

  return { stop }
}

/**
 * 批量注册多个快捷键
 *
 * @example
 * useShortcuts([
 *   { chord: 'CmdOrCtrl+A', handler: selectAll },
 *   { chord: 'CmdOrCtrl+C', handler: copy },
 *   { chord: 'CmdOrCtrl+V', handler: paste },
 *   { chord: ['Delete', 'Backspace'], handler: deleteSelection },
 * ])
 */
export function useShortcuts(
  defs: Array<{
    chord: string | string[]
    handler: (event: KeyboardEvent) => void
    options?: ShortcutOptions
  }>,
): { stop: () => void } {
  const stops = defs.map((d) => useShortcut(d.chord, d.handler, d.options))
  return { stop: () => stops.forEach((s) => s.stop()) }
}

/** 仅在测试/调试时使用：查看当前已注册的快捷键数量 */
export function _debugShortcutRegistrySize(): number {
  return registry.length
}
