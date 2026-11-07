import { useEffect, useState } from "react";

/**
 * Radix Portal 默认挂到 document.body，会逃出 .cutia-root 容器的 scoped preflight,
 * 在 canana-vue 集成场景下导致 popover/dialog 等内容继承宿主项目(Element Plus)
 * 的全局样式（按钮带灰色背景边框、Radix 圆形控件被裁切等）。
 *
 * 用此 hook 提供 .cutia-root 作为 Portal 容器,让弹层内容也享受 cutia preflight 与
 * Tailwind utility。Radix 内部弹层用 position:fixed,portal 到 .cutia-root 内
 * 不会被 overflow:hidden 截掉。
 */
export function useCutiaPortalContainer(): HTMLElement | null {
	const [container, setContainer] = useState<HTMLElement | null>(null);
	useEffect(() => {
		setContainer(document.querySelector<HTMLElement>(".cutia-root"));
	}, []);
	return container;
}
