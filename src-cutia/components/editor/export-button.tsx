
import { useState, useRef } from "react";
import { TransitionTopIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@cutia/components/ui/popover";
import { Button } from "@cutia/components/ui/button";
import { Label } from "@cutia/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@cutia/components/ui/radio-group";
import { Progress } from "@cutia/components/ui/progress";
import { Checkbox } from "@cutia/components/ui/checkbox";
import { cn } from "@cutia/utils/ui";
import { getExportMimeType, getExportFileExtension } from "@cutia/lib/export";
import { Check, Copy, Download, RotateCcw } from "lucide-react";
import {
	EXPORT_FORMAT_VALUES,
	EXPORT_QUALITY_VALUES,
	type ExportFormat,
	type ExportQuality,
	type ExportResult,
} from "@cutia/types/export";
import { PropertyGroup } from "@cutia/components/editor/panels/properties/property-item";
import { useEditor } from "@cutia/hooks/use-editor";
import { DEFAULT_EXPORT_OPTIONS } from "@cutia/constants/export-constants";
import { useTranslation } from "@i18next-toolkit/nextjs-approuter";

export function ExportButton() {
	const { t } = useTranslation();
	const [isExportPopoverOpen, setIsExportPopoverOpen] = useState(false);
	const editor = useEditor();

	const handleExport = () => {
		setIsExportPopoverOpen(true);
	};

	const hasProject = !!editor.project.getActive();

	return (
		<Popover open={isExportPopoverOpen} onOpenChange={setIsExportPopoverOpen}>
			<PopoverTrigger asChild>
				<button
					type="button"
					className={cn(
						"flex items-center gap-1.5 rounded-lg border border-border bg-white px-3.5 py-1.5 text-sm font-medium text-gray-800 shadow-sm transition-colors hover:bg-gray-50 active:bg-gray-100",
						hasProject ? "cursor-pointer" : "cursor-not-allowed opacity-50",
					)}
					onClick={hasProject ? handleExport : undefined}
					disabled={!hasProject}
					onKeyDown={(event) => {
						if (hasProject && (event.key === "Enter" || event.key === " ")) {
							event.preventDefault();
							handleExport();
						}
					}}
				>
					<HugeiconsIcon icon={TransitionTopIcon} className="size-4" />
					<span>{t("Export")}</span>
				</button>
			</PopoverTrigger>
			{hasProject && <ExportPopover onOpenChange={setIsExportPopoverOpen} />}
		</Popover>
	);
}

function ExportPopover({
	onOpenChange,
}: {
	onOpenChange: (open: boolean) => void;
}) {
	const { t } = useTranslation();
	const editor = useEditor();
	const activeProject = editor.project.getActive();
	const [format, setFormat] = useState<ExportFormat>(
		DEFAULT_EXPORT_OPTIONS.format,
	);
	const [quality, setQuality] = useState<ExportQuality>(
		DEFAULT_EXPORT_OPTIONS.quality,
	);
	const [includeAudio, setIncludeAudio] = useState<boolean>(
		DEFAULT_EXPORT_OPTIONS.includeAudio || true,
	);
	const [isExporting, setIsExporting] = useState(false);
	const [progress, setProgress] = useState(0);
	const [exportResult, setExportResult] = useState<ExportResult | null>(null);
	const cancelRequestedRef = useRef(false);

	const handleExport = async () => {
		if (!activeProject) return;

		cancelRequestedRef.current = false;
		setIsExporting(true);
		setProgress(0);
		setExportResult(null);

		const result = await editor.project.export({
			options: {
				format,
				quality,
				fps: activeProject.settings.fps,
				includeAudio,
				onProgress: ({ progress }) => setProgress(progress),
				onCancel: () => cancelRequestedRef.current,
			},
		});

		setIsExporting(false);

		if (result.cancelled) {
			setExportResult(null);
			setProgress(0);
			return;
		}

		setExportResult(result);

		if (result.success && result.buffer) {
			const mimeType = getExportMimeType({ format });
			const extension = getExportFileExtension({ format });
			const blob = new Blob([result.buffer], { type: mimeType });
			const url = URL.createObjectURL(blob);

			const a = document.createElement("a");
			a.href = url;
			a.download = `${activeProject.metadata.name}${extension}`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);

			onOpenChange(false);
			setExportResult(null);
			setProgress(0);
		}
	};

	const handleCancel = () => {
		cancelRequestedRef.current = true;
	};

	return (
		<PopoverContent className="bg-background mr-4 flex w-80 flex-col p-0">
			{exportResult && !exportResult.success ? (
				<ExportError
					error={exportResult.error || "Unknown error occurred"}
					onRetry={handleExport}
				/>
			) : (
				<>
					<div className="flex items-center justify-between p-3 border-b">
						<h3 className="font-medium text-sm">
							{isExporting ? t("Exporting project") : t("Export project")}
						</h3>
					</div>

					<div className="flex flex-col gap-4">
						{!isExporting && (
							<>
								<div className="flex flex-col">
									<PropertyGroup
										title={t("Format")}
										defaultExpanded={false}
										hasBorderTop={false}
									>
										<RadioGroup
											className="gap-2.5 px-1 py-1"
											value={format}
											onValueChange={(value) => {
												if (isExportFormat(value)) {
													setFormat(value);
												}
											}}
										>
											<div className="flex items-center gap-3 py-1">
												<RadioGroupItem value="mp4" id="mp4" />
												<Label htmlFor="mp4" className="cursor-pointer">
													{t("MP4 (H.264) - Better compatibility")}
												</Label>
											</div>
											<div className="flex items-center gap-3 py-1">
												<RadioGroupItem value="webm" id="webm" />
												<Label htmlFor="webm" className="cursor-pointer">
													{t("WebM (VP9) - Smaller file size")}
												</Label>
											</div>
										</RadioGroup>
									</PropertyGroup>

									<PropertyGroup title={t("Quality")} defaultExpanded={false}>
										<RadioGroup
											className="gap-2.5 px-1 py-1"
											value={quality}
											onValueChange={(value) => {
												if (isExportQuality(value)) {
													setQuality(value);
												}
											}}
										>
											<div className="flex items-center gap-3 py-1">
												<RadioGroupItem value="low" id="low" />
												<Label htmlFor="low" className="cursor-pointer">
													{t("Low - Smallest file size")}
												</Label>
											</div>
											<div className="flex items-center gap-3 py-1">
												<RadioGroupItem value="medium" id="medium" />
												<Label htmlFor="medium" className="cursor-pointer">
													{t("Medium - Balanced")}
												</Label>
											</div>
											<div className="flex items-center gap-3 py-1">
												<RadioGroupItem value="high" id="high" />
												<Label htmlFor="high" className="cursor-pointer">
													{t("High - Recommended")}
												</Label>
											</div>
											<div className="flex items-center gap-3 py-1">
												<RadioGroupItem value="very_high" id="very_high" />
												<Label htmlFor="very_high" className="cursor-pointer">
													{t("Very High - Largest file size")}
												</Label>
											</div>
										</RadioGroup>
									</PropertyGroup>

									<PropertyGroup title={t("Audio")} defaultExpanded={false}>
										<div className="flex items-center gap-3 px-1 py-2">
											<Checkbox
												id="include-audio"
												checked={includeAudio}
												onCheckedChange={(checked) =>
													setIncludeAudio(!!checked)
												}
											/>
											<Label
												htmlFor="include-audio"
												className="cursor-pointer"
											>
												{t("Include audio in export")}
											</Label>
										</div>
									</PropertyGroup>
								</div>

								<div className="p-3 pt-0">
									<Button onClick={handleExport} className="w-full gap-2">
										<Download className="size-4" />
										{t("Export")}
									</Button>
								</div>
							</>
						)}

						{isExporting && (
							<div className="space-y-4 p-3">
								<div className="flex flex-col">
									<div className="flex items-center justify-between text-center">
										<p className="text-muted-foreground mb-2 text-sm">
											{Math.round(progress * 100)}%
										</p>
									</div>
									<Progress value={progress * 100} className="w-full" />
								</div>

								<Button
									variant="outline"
									className="w-full rounded-md"
									onClick={handleCancel}
								>
									{t("Cancel")}
								</Button>
							</div>
						)}
					</div>
				</>
			)}
		</PopoverContent>
	);
}

function isExportFormat(value: string): value is ExportFormat {
	return EXPORT_FORMAT_VALUES.some((formatValue) => formatValue === value);
}

function isExportQuality(value: string): value is ExportQuality {
	return EXPORT_QUALITY_VALUES.some((qualityValue) => qualityValue === value);
}

function ExportError({
	error,
	onRetry,
}: {
	error: string;
	onRetry: () => void;
}) {
	const { t } = useTranslation();
	const [copied, setCopied] = useState(false);

	const handleCopy = async () => {
		await navigator.clipboard.writeText(error);
		setCopied(true);
		setTimeout(() => setCopied(false), 1000);
	};

	return (
		<div className="space-y-4">
			<div className="flex flex-col gap-1.5">
				<p className="text-destructive text-sm font-medium">
					{t("Export failed")}
				</p>
				<p className="text-muted-foreground text-xs">{error}</p>
			</div>

			<div className="flex gap-2">
				<Button
					variant="outline"
					size="sm"
					className="h-8 flex-1 text-xs"
					onClick={handleCopy}
				>
					{copied ? <Check className="text-constructive" /> : <Copy />}
					{t("Copy")}
				</Button>
				<Button
					variant="outline"
					size="sm"
					className="h-8 flex-1 text-xs"
					onClick={onRetry}
				>
					<RotateCcw />
					{t("Retry")}
				</Button>
			</div>
		</div>
	);
}
