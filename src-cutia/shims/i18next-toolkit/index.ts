/**
 * Shim for @i18next-toolkit/nextjs-approuter
 *
 * 用途：在 canana-vue（Vite + 双框架）环境下拦截 Cutia 源码对
 * "@i18next-toolkit/nextjs-approuter" 的引用，避免拉入 next.js。
 *
 * 通过 vite.config.ts 的 resolve.alias + tsconfig.json 的 paths 完成路径拦截。
 *
 * ===== 真实 i18n 实现 =====
 * cutia 源码里写 `t("Upload")`，i18next-toolkit 内部用 `k${crc32(text).toString(16)}`
 * 把 "Upload" 转成 hash key "k1011e329"，再查 translation.json 拿翻译。
 *
 * 本 shim 复刻该算法（来自 @i18next-toolkit/nextjs-approuter/lib/utils.js），
 * 用同目录的 zh.json 作为消息源，POC 阶段固定中文，无 locale 切换。
 * 后续接入 CanvasMind 主 i18n 时，只需要扩展 messages 加载逻辑即可，调用方零改动。
 *
 * 已覆盖 API（cutia 源码 69 处 import 中的常用子集）：
 *   - useTranslation()
 *   - useLocale()
 *   - useChangeLocale()
 *   - createI18nConfig()
 *   - I18nProviderProps（类型）
 *
 * 未覆盖（用到时再补）：
 *   - /navigation: createNavigation（已用 src-cutia/lib/navigation.tsx 替代）
 *   - /server: getMessages, getTranslation
 *   - /middleware: createI18nMiddleware
 */

import zhMessages from './zh.json'

export interface I18nProviderProps {
	locale: string
	messages?: Record<string, unknown>
	children?: unknown
}

export interface I18nConfig {
	locales: string[]
	defaultLocale: string
}

export function createI18nConfig(config: Partial<I18nConfig> = {}): I18nConfig {
	return {
		locales: config.locales ?? ['en'],
		defaultLocale: config.defaultLocale ?? 'en',
	}
}

// ============================================================================
// CRC32 实现 —— 等价于 npm crc 包的 crc32(buffer)，对字符串走 UTF-8 字节流。
// cutia 上游用 `crc` 包的 crc32 函数；这里内联无依赖版本，结果二进制一致。
// ============================================================================

const CRC32_TABLE = (() => {
	const table = new Uint32Array(256)
	for (let i = 0; i < 256; i++) {
		let c = i
		for (let k = 0; k < 8; k++) {
			c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
		}
		table[i] = c >>> 0
	}
	return table
})()

const utf8Encoder = new TextEncoder()

function crc32(text: string): number {
	const bytes = utf8Encoder.encode(text)
	let crc = 0xffffffff
	for (let i = 0; i < bytes.length; i++) {
		crc = (crc >>> 8) ^ CRC32_TABLE[(crc ^ bytes[i]) & 0xff]
	}
	return (crc ^ 0xffffffff) >>> 0
}

function hashKey(text: string): string {
	return `k${crc32(text).toString(16)}`
}

// ============================================================================
// t function —— 复刻 @i18next-toolkit/nextjs-approuter 的 createTFunction 逻辑
// ============================================================================

type Messages = Record<string, string>

const currentMessages: Messages = zhMessages as Messages

type TranslateOptions = Record<string, unknown> & { ns?: string }
type TranslateFn = (key: string, options?: TranslateOptions) => string

function translate(key: string, options?: TranslateOptions): string {
	try {
		const arr = key.split('::')
		let hk = hashKey(key)
		let defaultValue = key
		if (arr.length === 2) {
			defaultValue = arr[1]
			hk = hashKey(key)
		}
		const found = currentMessages[hk]
		if (found && found !== '') {
			let result = found
			if (options) {
				for (const [k, v] of Object.entries(options)) {
					if (k === 'ns') continue
					result = result.replace(
						new RegExp(`\\{\\{${k}\\}\\}`, 'g'),
						String(v),
					)
				}
			}
			return result
		}
		return defaultValue
	} catch (err) {
		// 避免 i18n 异常打断渲染：fallback 到原 key
		console.error('[i18n shim]', err)
		return key
	}
}

export function useTranslation(_namespace?: string): {
	t: TranslateFn
	i18n: { language: string; changeLanguage: (lng: string) => Promise<void> }
	ready: boolean
} {
	return {
		t: translate,
		ready: true,
		i18n: {
			language: 'zh',
			changeLanguage: async () => {},
		},
	}
}

/**
 * 当前 locale。POC 固定 'zh'，待 CanvasMind 接入主 i18n 后改为读取真值。
 */
export function useLocale(): string {
	return 'zh'
}

/**
 * 切换 locale 的函数。POC 阶段为空操作。
 */
export function useChangeLocale(): (locale: string) => void {
	return (_locale) => {}
}
