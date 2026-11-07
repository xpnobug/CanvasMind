
import { useTranslation } from "@i18next-toolkit/nextjs-approuter";
import { memo, useCallback, useMemo, useState } from "react";
import { PanelBaseView as BaseView } from "@cutia/components/editor/panels/panel-base-view";
import { Input } from "@cutia/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@cutia/components/ui/select";
import {
	BLUR_INTENSITY_PRESETS,
	CANVAS_SIZE_PRESETS,
	DEFAULT_BLUR_INTENSITY,
	DEFAULT_COLOR,
	FPS_PRESETS,
} from "@cutia/constants/project-constants";
import { patternCraftGradients } from "@cutia/data/colors/pattern-craft";
import { colors } from "@cutia/data/colors/solid";
import { syntaxUIGradients } from "@cutia/data/colors/syntax-ui";
import { useEditor } from "@cutia/hooks/use-editor";
import {
	IMAGE_PROVIDERS,
	VIDEO_PROVIDERS,
} from "@cutia/lib/ai/providers";
import { useAISettingsStore } from "@cutia/stores/ai-settings-store";
import { cn } from "@cutia/utils/ui";
import {
	PropertyGroup,
	PropertyItem,
	PropertyItemLabel,
	PropertyItemValue,
} from "@cutia/components/editor/panels/properties/property-item";
import { isDevPlaceholderAvailable } from "@cutia/lib/ai/placeholder";
import { Switch } from "@cutia/components/ui/switch";
import { Label } from "@cutia/components/ui/label";

export function SettingsView() {
	return <ProjectSettingsTabs />;
}

function ProjectSettingsTabs() {
	const { t } = useTranslation();

	return (
		<BaseView
			defaultTab="project-info"
			tabs={[
				{
					value: "project-info",
					label: t("Project info"),
					content: (
						<div className="p-5">
							<ProjectInfoView />
						</div>
					),
				},
				{
					value: "background",
					label: t("Background"),
					content: (
						<div className="flex h-full flex-col justify-between">
							<div className="flex-1">
								<BackgroundView />
							</div>
						</div>
					),
				},
				{
					value: "ai",
					label: t("AI"),
					content: (
						<div className="p-5">
							<AISettingsView />
						</div>
					),
				},
			]}
			className="flex h-full flex-col justify-between p-0"
		/>
	);
}

const CANVAS_FIT_VALUE = "fit";
const CANVAS_CUSTOM_VALUE = "custom";

function resolveCanvasSizePresetValue({
	width,
	height,
	originalCanvasSize,
}: {
	width: number;
	height: number;
	originalCanvasSize: { width: number; height: number } | null;
}): string {
	const isOriginalMatch =
		originalCanvasSize &&
		originalCanvasSize.width === width &&
		originalCanvasSize.height === height;
	if (isOriginalMatch) {
		return CANVAS_FIT_VALUE;
	}

	for (const preset of CANVAS_SIZE_PRESETS) {
		if (preset.width === width && preset.height === height) {
			return preset.label;
		}
	}

	return CANVAS_CUSTOM_VALUE;
}

function ProjectInfoView() {
	const { t } = useTranslation();
	const editor = useEditor();
	const activeProject = editor.project.getActive();

	const currentCanvasSize = activeProject.settings.canvasSize;
	const originalCanvasSize = activeProject.settings.originalCanvasSize ?? null;

	const selectedValue = resolveCanvasSizePresetValue({
		width: currentCanvasSize.width,
		height: currentCanvasSize.height,
		originalCanvasSize,
	});

	const isCustom = selectedValue === CANVAS_CUSTOM_VALUE;
	const [customWidth, setCustomWidth] = useState(currentCanvasSize.width);
	const [customHeight, setCustomHeight] = useState(currentCanvasSize.height);

	const handleCanvasSizeChange = ({ value }: { value: string }) => {
		if (value === CANVAS_FIT_VALUE) {
			const canvasSize = originalCanvasSize ?? currentCanvasSize;
			editor.project.updateSettings({ settings: { canvasSize } });
			return;
		}

		if (value === CANVAS_CUSTOM_VALUE) {
			setCustomWidth(currentCanvasSize.width);
			setCustomHeight(currentCanvasSize.height);
			return;
		}

		const matched = CANVAS_SIZE_PRESETS.find(
			(preset) => preset.label === value,
		);
		if (matched) {
			editor.project.updateSettings({
				settings: { canvasSize: { width: matched.width, height: matched.height } },
			});
		}
	};

	const applyCustomSize = ({
		width,
		height,
	}: {
		width: number;
		height: number;
	}) => {
		const clampedWidth = Math.max(1, Math.round(width));
		const clampedHeight = Math.max(1, Math.round(height));
		editor.project.updateSettings({
			settings: { canvasSize: { width: clampedWidth, height: clampedHeight } },
		});
	};

	const handleFpsChange = (value: string) => {
		const fps = parseFloat(value);
		editor.project.updateSettings({ settings: { fps } });
	};

	return (
		<div className="flex flex-col gap-4">
			<PropertyItem direction="column">
				<PropertyItemLabel>{t("Name")}</PropertyItemLabel>
				<PropertyItemValue>{activeProject.metadata.name}</PropertyItemValue>
			</PropertyItem>

			<PropertyItem direction="column">
				<PropertyItemLabel>{t("Canvas size")}</PropertyItemLabel>
				<PropertyItemValue>
					<Select
						value={selectedValue}
						onValueChange={(value) => handleCanvasSizeChange({ value })}
					>
						<SelectTrigger>
							<SelectValue placeholder={t("Select canvas size")} />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value={CANVAS_FIT_VALUE}>
								{originalCanvasSize
									? t("Fit ({{width}}×{{height}})", {
											width: originalCanvasSize.width,
											height: originalCanvasSize.height,
										})
									: t("Fit")}
							</SelectItem>
							{CANVAS_SIZE_PRESETS.map((preset) => (
								<SelectItem key={preset.label} value={preset.label}>
									{preset.label} ({preset.width}×{preset.height})
								</SelectItem>
							))}
							<SelectItem value={CANVAS_CUSTOM_VALUE}>
								{t("Custom")}
							</SelectItem>
						</SelectContent>
					</Select>
				</PropertyItemValue>
			</PropertyItem>

			{isCustom && (
				<div className="flex items-center gap-2">
					<Input
						type="number"
						min={1}
						value={customWidth}
						onChange={(event) => {
							const value = Number(event.target.value);
							setCustomWidth(value);
						}}
						onBlur={() => applyCustomSize({ width: customWidth, height: customHeight })}
						onKeyDown={(event) => {
							if (event.key === "Enter") {
								applyCustomSize({ width: customWidth, height: customHeight });
							}
						}}
						className="w-0 flex-1"
						aria-label={t("Canvas width")}
					/>
					<span className="text-muted-foreground text-xs">×</span>
					<Input
						type="number"
						min={1}
						value={customHeight}
						onChange={(event) => {
							const value = Number(event.target.value);
							setCustomHeight(value);
						}}
						onBlur={() => applyCustomSize({ width: customWidth, height: customHeight })}
						onKeyDown={(event) => {
							if (event.key === "Enter") {
								applyCustomSize({ width: customWidth, height: customHeight });
							}
						}}
						className="w-0 flex-1"
						aria-label={t("Canvas height")}
					/>
				</div>
			)}

			<PropertyItem direction="column">
				<PropertyItemLabel>{t("Frame rate")}</PropertyItemLabel>
				<PropertyItemValue>
					<Select
						value={activeProject.settings.fps.toString()}
						onValueChange={handleFpsChange}
					>
						<SelectTrigger>
							<SelectValue placeholder={t("Select a frame rate")} />
						</SelectTrigger>
						<SelectContent>
							{FPS_PRESETS.map((preset) => (
								<SelectItem key={preset.value} value={preset.value}>
									{preset.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</PropertyItemValue>
			</PropertyItem>
		</div>
	);
}

const BlurPreview = memo(
	({
		blur,
		isSelected,
		onSelect,
		t,
	}: {
		blur: { label: string; value: number };
		isSelected: boolean;
		onSelect: () => void;
		t: (key: string, options?: Record<string, string>) => string;
	}) => (
		<button
			className={cn(
				"border-foreground/15 hover:border-primary relative aspect-square size-20 cursor-pointer overflow-hidden rounded-sm border",
				isSelected && "border-primary border-2",
			)}
			onClick={onSelect}
			type="button"
			aria-label={t("Select {{label}} blur", { label: blur.label })}
		>
			<img
				src="https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
				alt={`Blur preview ${blur.label}`}
				className="object-cover"
				style={{ filter: `blur(${blur.value}px)` }}
				loading="eager"
			/>
			<div className="absolute right-1 bottom-1 left-1 text-center">
				<span className="rounded bg-black/50 px-1 text-xs text-white">
					{t(blur.label)}
				</span>
			</div>
		</button>
	),
);

BlurPreview.displayName = "BlurPreview";

const BackgroundPreviews = memo(
	({
		backgrounds,
		currentBackgroundColor,
		isColorBackground,
		handleColorSelect,
		useBackgroundColor = false,
	}: {
		backgrounds: string[];
		currentBackgroundColor: string;
		isColorBackground: boolean;
		handleColorSelect: ({ bg }: { bg: string }) => void;
		useBackgroundColor?: boolean;
	}) => {
		return useMemo(
			() =>
				backgrounds.map((bg, index) => (
					<button
						key={`${index}-${bg}`}
						className={cn(
							"border-foreground/15 hover:border-primary aspect-square size-20 cursor-pointer rounded-sm border",
							isColorBackground &&
								bg === currentBackgroundColor &&
								"border-primary border-2",
						)}
						style={
							useBackgroundColor
								? { backgroundColor: bg }
								: {
										background: bg,
										backgroundSize: "cover",
										backgroundPosition: "center",
										backgroundRepeat: "no-repeat",
									}
						}
						onClick={() => handleColorSelect({ bg })}
						type="button"
						aria-label={`Select background ${useBackgroundColor ? bg : index + 1}`}
					/>
				)),
			[
				backgrounds,
				isColorBackground,
				currentBackgroundColor,
				handleColorSelect,
				useBackgroundColor,
			],
		);
	},
);

BackgroundPreviews.displayName = "BackgroundPreviews";

function BackgroundView() {
	const { t } = useTranslation();
	const editor = useEditor();
	const activeProject = editor.project.getActive();
	const blurLevels = useMemo(() => BLUR_INTENSITY_PRESETS, []);

	const handleBlurSelect = useCallback(
		async ({ blurIntensity }: { blurIntensity: number }) => {
			await editor.project.updateSettings({
				settings: { background: { type: "blur", blurIntensity } },
			});
		},
		[editor.project],
	);

	const handleColorSelect = useCallback(
		async ({ color }: { color: string }) => {
			await editor.project.updateSettings({
				settings: { background: { type: "color", color } },
			});
		},
		[editor.project],
	);

	const currentBlurIntensity =
		activeProject.settings.background.type === "blur"
			? activeProject.settings.background.blurIntensity
			: DEFAULT_BLUR_INTENSITY;

	const currentBackgroundColor =
		activeProject.settings.background.type === "color"
			? activeProject.settings.background.color
			: DEFAULT_COLOR;

	const isBlurBackground = activeProject.settings.background.type === "blur";
	const isColorBackground = activeProject.settings.background.type === "color";

	const blurPreviews = useMemo(
		() =>
			blurLevels.map((blur) => (
				<BlurPreview
					key={blur.value}
					blur={blur}
					isSelected={isBlurBackground && currentBlurIntensity === blur.value}
					onSelect={() => handleBlurSelect({ blurIntensity: blur.value })}
					t={t}
				/>
			)),
		[blurLevels, isBlurBackground, currentBlurIntensity, handleBlurSelect, t],
	);

	const backgroundSections = [
		{ title: t("Colors"), backgrounds: colors, useBackgroundColor: true },
		{ title: t("Pattern craft"), backgrounds: patternCraftGradients },
		{ title: t("Syntax UI"), backgrounds: syntaxUIGradients },
	];

	return (
		<div className="flex h-full flex-col">
			<PropertyGroup
				title={t("Blur")}
				hasBorderTop={false}
				defaultExpanded={false}
			>
				<div className="flex flex-wrap gap-2">{blurPreviews}</div>
			</PropertyGroup>

			{backgroundSections.map((section) => (
				<PropertyGroup
					key={section.title}
					title={section.title}
					defaultExpanded={false}
				>
					<div className="flex flex-wrap gap-2">
						<BackgroundPreviews
							backgrounds={section.backgrounds}
							currentBackgroundColor={currentBackgroundColor}
							isColorBackground={isColorBackground}
							handleColorSelect={({ bg }) => handleColorSelect({ color: bg })}
							useBackgroundColor={section.useBackgroundColor}
						/>
					</div>
				</PropertyGroup>
			))}
		</div>
	);
}

const NO_PROVIDER = "__none__";

function AISettingsView() {
	const { t } = useTranslation();
	const {
		imageProviderId,
		imageApiKey,
		videoProviderId,
		videoApiKey,
		devPlaceholderEnabled,
		setImageProvider,
		setImageApiKey,
		setVideoProvider,
		setVideoApiKey,
		setDevPlaceholderEnabled,
	} = useAISettingsStore();

	const handleImageProviderChange = (value: string) => {
		setImageProvider(value === NO_PROVIDER ? null : value);
	};

	const handleVideoProviderChange = (value: string) => {
		setVideoProvider(value === NO_PROVIDER ? null : value);
	};

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-3">
				<span className="text-foreground text-xs font-medium">
					{t("Image Provider")}
				</span>
				<PropertyItem direction="column">
					<PropertyItemLabel>{t("Provider")}</PropertyItemLabel>
					<PropertyItemValue>
						<Select
							value={imageProviderId ?? NO_PROVIDER}
							onValueChange={handleImageProviderChange}
						>
							<SelectTrigger>
								<SelectValue placeholder={t("Select a provider")} />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value={NO_PROVIDER}>{t("None")}</SelectItem>
								{IMAGE_PROVIDERS.map((provider) => (
									<SelectItem key={provider.id} value={provider.id}>
										{provider.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</PropertyItemValue>
				</PropertyItem>
				<PropertyItem direction="column">
					<PropertyItemLabel>{t("API Key")}</PropertyItemLabel>
					<PropertyItemValue>
						<Input
							type="password"
							placeholder={t("Enter API key")}
							value={imageApiKey}
							onChange={(event) => setImageApiKey(event.target.value)}
						/>
					</PropertyItemValue>
				</PropertyItem>
			</div>

			<div className="flex flex-col gap-3">
				<span className="text-foreground text-xs font-medium">
					{t("Video Provider")}
				</span>
				<PropertyItem direction="column">
					<PropertyItemLabel>{t("Provider")}</PropertyItemLabel>
					<PropertyItemValue>
						<Select
							value={videoProviderId ?? NO_PROVIDER}
							onValueChange={handleVideoProviderChange}
						>
							<SelectTrigger>
								<SelectValue placeholder={t("Select a provider")} />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value={NO_PROVIDER}>{t("None")}</SelectItem>
								{VIDEO_PROVIDERS.map((provider) => (
									<SelectItem key={provider.id} value={provider.id}>
										{provider.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</PropertyItemValue>
				</PropertyItem>
				<PropertyItem direction="column">
					<PropertyItemLabel>{t("API Key")}</PropertyItemLabel>
					<PropertyItemValue>
						<Input
							type="password"
							placeholder={t("Enter API key")}
							value={videoApiKey}
							onChange={(event) => setVideoApiKey(event.target.value)}
						/>
					</PropertyItemValue>
				</PropertyItem>
			</div>

			{isDevPlaceholderAvailable() && (
				<div className="border-foreground/10 flex flex-col gap-3 border-t pt-4">
					<span className="text-foreground text-xs font-medium">
						{t("Development")}
					</span>
					<div className="flex items-center justify-between">
						<div className="space-y-0.5">
							<Label htmlFor="dev-placeholder-mode">
								{t("Placeholder Mode")}
							</Label>
							<p className="text-muted-foreground text-xs">
								{t(
									"Replace AI generation with placeholder assets to save costs",
								)}
							</p>
						</div>
						<Switch
							id="dev-placeholder-mode"
							checked={devPlaceholderEnabled}
							onCheckedChange={setDevPlaceholderEnabled}
						/>
					</div>
				</div>
			)}
		</div>
	);
}
