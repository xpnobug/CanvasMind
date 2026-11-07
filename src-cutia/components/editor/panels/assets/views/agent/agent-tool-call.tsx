
import { useTranslation } from "@i18next-toolkit/nextjs-approuter";
import { useState } from "react";
import {
	ArrowDown01Icon,
	ArrowRight01Icon,
	CheckmarkCircle02Icon,
	Cancel01Icon,
	Loading03Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { AgentToolResult } from "@cutia/lib/ai/agent/types";
import { useEditor } from "@cutia/hooks/use-editor";

interface AgentToolCallProps {
	name: string;
	arguments: Record<string, unknown>;
	result?: AgentToolResult;
	isExecuting?: boolean;
}

function VideoPreview({ mediaId }: { mediaId: string }) {
	const editor = useEditor();
	const asset = editor.media.getAssets().find((a) => a.id === mediaId);
	const videoUrl = asset?.url;

	if (!videoUrl) return null;

	return (
		<video src={videoUrl} controls className="max-h-40 w-full rounded">
			<track kind="captions" />
		</video>
	);
}

function MediaPreview({ result }: { result: AgentToolResult }) {
	const previewUrls = result.data?.previewUrls as string[] | undefined;
	const mediaType = result.data?.mediaType as string | undefined;
	const mediaId = result.data?.mediaId as string | undefined;

	if (mediaType === "video" && mediaId) {
		return (
			<div className="mt-1.5 flex flex-wrap gap-1.5">
				<VideoPreview mediaId={mediaId} />
			</div>
		);
	}

	if (!previewUrls || previewUrls.length === 0) return null;

	return (
		<div className="mt-1.5 flex flex-wrap gap-1.5">
			{previewUrls.map((url) => (
				/* biome-ignore lint: blob URLs don't work with Next.js Image */
				<img
					key={url}
					src={url}
					alt="AI generated"
					className="max-h-40 rounded object-contain"
				/>
			))}
		</div>
	);
}

export function AgentToolCall({
	name,
	arguments: args,
	result,
	isExecuting,
}: AgentToolCallProps) {
	const { t } = useTranslation();
	const [isExpanded, setIsExpanded] = useState(false);

	const hasMediaPreview = Boolean(
		result?.success &&
			((Array.isArray(result.data?.previewUrls) &&
				(result.data.previewUrls as string[]).length > 0) ||
				(result.data?.mediaType === "video" && result.data?.mediaId)),
	);

	const statusIcon = isExecuting ? (
		<HugeiconsIcon
			icon={Loading03Icon}
			className="size-3.5 shrink-0 animate-spin"
		/>
	) : result?.success ? (
		<HugeiconsIcon
			icon={CheckmarkCircle02Icon}
			className="size-3.5 shrink-0 text-green-500"
		/>
	) : result ? (
		<HugeiconsIcon
			icon={Cancel01Icon}
			className="size-3.5 shrink-0 text-red-500"
		/>
	) : null;

	return (
		<div className="bg-muted/50 my-1 rounded-md border text-xs">
			<button
				type="button"
				className="flex w-full items-center gap-1.5 px-2 py-1.5"
				onClick={(event) => {
					setIsExpanded(!isExpanded);
					(event.currentTarget as HTMLElement).blur();
				}}
			>
				<HugeiconsIcon
					icon={isExpanded ? ArrowDown01Icon : ArrowRight01Icon}
					className="size-3.5 shrink-0"
				/>
				{statusIcon}
				<span className="truncate font-mono">{name}</span>
			</button>

			{hasMediaPreview && !isExpanded && result && (
				<div className="px-2 pb-1.5">
					<MediaPreview result={result} />
				</div>
			)}

			{isExpanded && (
				<div className="border-t px-2 py-1.5">
					<div className="space-y-1.5">
						{hasMediaPreview && result && (
							<MediaPreview result={result} />
						)}
						<div>
							<span className="text-muted-foreground text-xs font-medium">
								{t("Arguments")}
							</span>
							<pre className="bg-background mt-1 overflow-x-auto rounded p-2 text-xs">
								{JSON.stringify(args, null, 2)}
							</pre>
						</div>
						{result && (
							<div>
								<span className="text-muted-foreground text-xs font-medium">
									{t("Result")}
								</span>
								<pre className="bg-background mt-1 overflow-x-auto rounded p-2 text-xs">
									{JSON.stringify(result, null, 2)}
								</pre>
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
