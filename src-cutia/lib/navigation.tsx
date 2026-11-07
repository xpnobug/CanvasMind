/**
 * Replacement for the original Cutia lib/navigation.ts
 * (which was based on @i18next-toolkit/nextjs-approuter/navigation + Next.js App Router).
 *
 * 当前为最小可用 stub：
 *   - Link: 退化为带 className 的原生 <a>，不参与客户端导航
 *   - useRouter: 提供 push/replace/back，基于 window.history（无 SPA 路由时也能跑）
 *   - usePathname: 读 window.location.pathname
 *   - redirect: 同步重定向
 *
 * 后续接入 react-router-dom 时，把这些实现指向 RR 的对应 API 即可，调用方零改动。
 */

import type { ComponentProps, ReactNode } from "react";

export interface LinkProps
	extends Omit<ComponentProps<"a">, "href"> {
	href: string;
	locale?: string;
	prefetch?: boolean;
	children?: ReactNode;
}

export function Link({
	href,
	locale: _locale,
	prefetch: _prefetch,
	onClick,
	...rest
}: LinkProps) {
	const handleClick: ComponentProps<"a">["onClick"] = (event) => {
		onClick?.(event);
		if (event.defaultPrevented) return;
		if (
			event.metaKey ||
			event.ctrlKey ||
			event.shiftKey ||
			event.altKey ||
			event.button !== 0
		)
			return;
		if (
			rest.target &&
			rest.target !== "_self"
		)
			return;
		// 内链：用 history.pushState 模拟 SPA 跳转，避免整页刷新
		if (href.startsWith("/")) {
			event.preventDefault();
			window.history.pushState({}, "", href);
			window.dispatchEvent(new PopStateEvent("popstate"));
		}
	};

	return (
		<a href={href} onClick={handleClick} {...rest} />
	);
}

export interface RouterApi {
	push: (path: string) => void;
	replace: (path: string) => void;
	back: () => void;
	forward: () => void;
	refresh: () => void;
}

/**
 * 模块级单例，确保每次 useRouter() 返回完全相同的对象引用。
 *
 * 这非常关键：EditorProvider 等组件把 router 放进 useEffect 依赖数组，
 * 若 useRouter() 每次返回新对象，会导致 useEffect 死循环触发
 * （"Maximum update depth exceeded"）。
 *
 * 【POC 阶段】push/replace 改为 no-op：
 *   原 stub 通过 window.history + popstate 模拟 SPA 跳转，但 Vue Router 监听了
 *   popstate，会把 URL 变成 Cutia 风格的 /editor/${id}（CanvasMind 没注册此路由），
 *   导致 FullEditorPage 被卸载、React root unmount，编辑器永远渲染不出来。
 *   POC 阶段只让 EditorProvider 内部状态流转完成即可，URL 同步留待真正接入
 *   CanvasMind 路由（/video-editor/:projectId）时实现。
 */
const ROUTER_SINGLETON: RouterApi = {
	push(path) {
		console.log("[CutiaPOC] router.push (no-op):", path);
	},
	replace(path) {
		console.log("[CutiaPOC] router.replace (no-op):", path);
	},
	back() {
		window.history.back();
	},
	forward() {
		window.history.forward();
	},
	refresh() {
		window.location.reload();
	},
};

export function useRouter(): RouterApi {
	return ROUTER_SINGLETON;
}

export function usePathname(): string {
	if (typeof window === "undefined") return "/";
	return window.location.pathname;
}

export function redirect(path: string): never {
	if (typeof window !== "undefined") {
		window.location.href = path;
	}
	// 让 TS 满足 never 返回类型（实际不可达）
	throw new Error(`redirect(${path})`);
}
