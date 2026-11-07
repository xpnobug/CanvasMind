import {
	type ComponentPropsWithoutRef,
	type CSSProperties,
	forwardRef,
} from "react";

interface AspectRatioProps extends ComponentPropsWithoutRef<"div"> {
	ratio?: number;
}

// 使用 CSS 原生 aspect-ratio 属性，避免 Radix padding-bottom hack 在
// CSS Grid 容器内塌缩的问题（见贴纸面板卡片显示不全的回归）
const AspectRatio = forwardRef<HTMLDivElement, AspectRatioProps>(
	({ ratio = 1, style, ...props }, ref) => {
		const mergedStyle: CSSProperties = {
			position: "relative",
			width: "100%",
			aspectRatio: String(ratio),
			...style,
		};
		return <div ref={ref} style={mergedStyle} {...props} />;
	},
);
AspectRatio.displayName = "AspectRatio";

export { AspectRatio };
