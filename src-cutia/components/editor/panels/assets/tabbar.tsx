
import { useTranslation } from "@i18next-toolkit/nextjs-approuter";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@cutia/components/ui/tooltip";
import { Button } from "@cutia/components/ui/button";
import { cn } from "@cutia/utils/ui";
import {
	TAB_KEYS,
	tabs,
	useAssetsPanelStore,
} from "@cutia/stores/assets-panel-store";

export function TabBar() {
	const { t } = useTranslation();
	const { activeTab, setActiveTab } = useAssetsPanelStore();

	// i18next-toolkit: forces extraction of tab labels (dead code, extract-only)
	if (false as boolean) {
		t("Media");
		t("Sounds");
		t("Text");
		t("Stickers");
		t("Effects");
		t("Transitions");
		t("Captions");
		t("Filters");
		t("Adjustment");
		t("AI");
		t("Settings");
	}
	const [showTopFade, setShowTopFade] = useState(false);
	const [showBottomFade, setShowBottomFade] = useState(false);
	const scrollRef = useRef<HTMLDivElement>(null);

	const checkScrollPosition = useCallback(() => {
		const element = scrollRef.current;
		if (!element) return;

		const { scrollTop, scrollHeight, clientHeight } = element;
		setShowTopFade(scrollTop > 0);
		setShowBottomFade(scrollTop < scrollHeight - clientHeight - 1);
	}, []);

	useEffect(() => {
		const element = scrollRef.current;
		if (!element) return;

		checkScrollPosition();
		element.addEventListener("scroll", checkScrollPosition);

		const resizeObserver = new ResizeObserver(checkScrollPosition);
		resizeObserver.observe(element);

		return () => {
			element.removeEventListener("scroll", checkScrollPosition);
			resizeObserver.disconnect();
		};
	}, [checkScrollPosition]);

	return (
		<div className="relative flex">
			<div
				ref={scrollRef}
				className="scrollbar-hidden relative flex size-full p-2 flex-col items-center justify-start gap-1.5 overflow-y-auto"
			>
				{TAB_KEYS.map((tabKey) => {
					const tab = tabs[tabKey];
					return (
						<Tooltip key={tabKey} delayDuration={10}>
							<TooltipTrigger asChild>
								<Button
									variant={activeTab === tabKey ? "secondary" : "text"}
									aria-label={t(tab.label)}
									className={cn(
										"flex-col !p-1.5 !rounded-sm !h-auto [&_svg]:size-4.5",
										activeTab !== tabKey && "border border-transparent text-muted-foreground",
									)}
									onClick={() => setActiveTab(tabKey)}
								>
									<tab.icon />
								</Button>
							</TooltipTrigger>
							<TooltipContent
								side="right"
								align="center"
								variant="sidebar"
								sideOffset={8}
							>
								<div className="text-foreground text-sm leading-none font-medium">
									{t(tab.label)}
								</div>
							</TooltipContent>
						</Tooltip>
					);
				})}
			</div>

			<FadeOverlay direction="top" show={showTopFade} />
			<FadeOverlay direction="bottom" show={showBottomFade} />
		</div>
	);
}

function FadeOverlay({
	direction,
	show,
}: {
	direction: "top" | "bottom";
	show: boolean;
}) {
	return (
		<div
			className={cn(
				"pointer-events-none absolute right-0 left-0 h-6",
				direction === "top" && show
					? "from-background top-0 bg-gradient-to-b to-transparent"
					: "from-background bottom-0 bg-gradient-to-t to-transparent",
			)}
		/>
	);
}
