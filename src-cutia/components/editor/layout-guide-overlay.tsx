import { useEditorStore } from "@cutia/stores/editor-store";

function TikTokGuide() {
	return (
		<div className="pointer-events-none absolute inset-0">
			<img
				src="/platform-guides/tiktok-blueprint.png"
				alt="TikTok layout guide"
				className="absolute inset-0 size-full object-contain"
				draggable={false}
			/>
		</div>
	);
}

export function LayoutGuideOverlay() {
	const { layoutGuide } = useEditorStore();

	if (layoutGuide.platform === null) return null;
	if (layoutGuide.platform === "tiktok") return <TikTokGuide />;

	return null;
}
