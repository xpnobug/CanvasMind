import { useSyncExternalStore, useMemo } from "react";
import { useEditor } from "@cutia/hooks/use-editor";
import { cn } from "@cutia/utils/ui";
import type {
	TimelineElement,
	VideoElement,
	ImageElement,
	TextElement,
	StickerElement,
	ElementType,
} from "@cutia/types/timeline";
import type { MediaAsset } from "@cutia/types/assets";
import { FONT_SIZE_SCALE_REFERENCE } from "@cutia/constants/text-constants";
import { isBottomAlignedSubtitleText } from "@cutia/lib/timeline/text-utils";

type ScaleHandle = "top-left" | "top-right" | "bottom-left" | "bottom-right";
type ResizeHandle = "left" | "right";

const HANDLE_SIZE = 10;
const RESIZE_HANDLE_WIDTH = 6;
const RESIZE_HANDLE_HEIGHT = 24;

const SCALE_HANDLES: ScaleHandle[] = [
	"top-left",
	"top-right",
	"bottom-left",
	"bottom-right",
];

interface ElementBounds {
	left: number;
	top: number;
	width: number;
	height: number;
	rotate: number;
}

function getHandlePosition({ handle }: { handle: ScaleHandle }) {
	switch (handle) {
		case "top-left":
			return { left: -HANDLE_SIZE / 2, top: -HANDLE_SIZE / 2 };
		case "top-right":
			return { right: -HANDLE_SIZE / 2, top: -HANDLE_SIZE / 2 };
		case "bottom-left":
			return { left: -HANDLE_SIZE / 2, bottom: -HANDLE_SIZE / 2 };
		case "bottom-right":
			return { right: -HANDLE_SIZE / 2, bottom: -HANDLE_SIZE / 2 };
	}
}

function getHandleCursor({ handle }: { handle: ScaleHandle }) {
	switch (handle) {
		case "top-left":
		case "bottom-right":
			return "nwse-resize";
		case "top-right":
		case "bottom-left":
			return "nesw-resize";
	}
}

function computeMediaBounds({
	element,
	media,
	canvasWidth,
	canvasHeight,
	displayScale,
}: {
	element: VideoElement | ImageElement;
	media: MediaAsset | undefined;
	canvasWidth: number;
	canvasHeight: number;
	displayScale: number;
}): ElementBounds | null {
	if (!media) return null;

	const mediaW = media.width || canvasWidth;
	const mediaH = media.height || canvasHeight;
	const containScale = Math.min(canvasWidth / mediaW, canvasHeight / mediaH);
	const scaledW = mediaW * containScale * element.transform.scale;
	const scaledH = mediaH * containScale * element.transform.scale;

	const canvasX =
		canvasWidth / 2 + element.transform.position.x - scaledW / 2;
	const canvasY =
		canvasHeight / 2 + element.transform.position.y - scaledH / 2;

	return {
		left: canvasX * displayScale,
		top: canvasY * displayScale,
		width: scaledW * displayScale,
		height: scaledH * displayScale,
		rotate: element.transform.rotate,
	};
}

function computeTextBounds({
	element,
	canvasWidth,
	canvasHeight,
	displayScale,
}: {
	element: TextElement;
	canvasWidth: number;
	canvasHeight: number;
	displayScale: number;
}): ElementBounds {
	const scaleFactor = canvasHeight / FONT_SIZE_SCALE_REFERENCE;
	const scaledFontSize = element.fontSize * scaleFactor;

	const elementBoxWidth = element.boxWidth;
	const hasBoxWidth =
		elementBoxWidth !== undefined && elementBoxWidth > 0;
	const scaledBoxWidth = hasBoxWidth ? elementBoxWidth * scaleFactor : 0;

	let estimatedWidth: number;
	let estimatedHeight: number;
	const elementScale = element.transform.scale;

	if (hasBoxWidth) {
		estimatedWidth = scaledBoxWidth;
		const lineHeight = scaledFontSize * 1.3;
		const charsPerLine = Math.max(
			1,
			Math.floor(scaledBoxWidth / (scaledFontSize * 0.6)),
		);
		const lineCount = Math.max(
			1,
			Math.ceil(element.content.length / charsPerLine),
		);
		estimatedHeight = lineCount * lineHeight;
	} else {
		estimatedWidth = element.content.length * scaledFontSize * 0.6;
		estimatedHeight = scaledFontSize * 1.4;
	}

	const centerX = canvasWidth / 2 + element.transform.position.x;
	const baseY = canvasHeight / 2 + element.transform.position.y;
	const isBottomAligned = isBottomAlignedSubtitleText({ element });
	const scaledEstimatedWidth = estimatedWidth * elementScale;
	const scaledEstimatedHeight = estimatedHeight * elementScale;
	const topY = isBottomAligned
		? baseY - scaledEstimatedHeight
		: baseY - scaledEstimatedHeight / 2;

	return {
		left: (centerX - scaledEstimatedWidth / 2) * displayScale,
		top: topY * displayScale,
		width: scaledEstimatedWidth * displayScale,
		height: scaledEstimatedHeight * displayScale,
		rotate: element.transform.rotate,
	};
}

function computeStickerBounds({
	element,
	canvasWidth,
	canvasHeight,
	displayScale,
}: {
	element: StickerElement;
	canvasWidth: number;
	canvasHeight: number;
	displayScale: number;
}): ElementBounds {
	const stickerSource = 200;
	const containScale = Math.min(
		canvasWidth / stickerSource,
		canvasHeight / stickerSource,
	);
	const stickerSize = stickerSource * containScale * element.transform.scale;

	const centerX = canvasWidth / 2 + element.transform.position.x;
	const centerY = canvasHeight / 2 + element.transform.position.y;

	return {
		left: (centerX - stickerSize / 2) * displayScale,
		top: (centerY - stickerSize / 2) * displayScale,
		width: stickerSize * displayScale,
		height: stickerSize * displayScale,
		rotate: element.transform.rotate,
	};
}

function computeElementBounds({
	element,
	media,
	canvasWidth,
	canvasHeight,
	displayScale,
}: {
	element: TimelineElement;
	media: MediaAsset | undefined;
	canvasWidth: number;
	canvasHeight: number;
	displayScale: number;
}): ElementBounds | null {
	switch (element.type) {
		case "video":
		case "image":
			return computeMediaBounds({
				element,
				media,
				canvasWidth,
				canvasHeight,
				displayScale,
			});
		case "text":
			return computeTextBounds({
				element,
				canvasWidth,
				canvasHeight,
				displayScale,
			});
		case "sticker":
			return computeStickerBounds({
				element,
				canvasWidth,
				canvasHeight,
				displayScale,
			});
		default:
			return null;
	}
}

function ElementOverlay({
	bounds,
	elementType,
	isTransforming,
	onScaleStart,
	onResizeStart,
}: {
	bounds: ElementBounds;
	elementType: ElementType;
	isTransforming: boolean;
	onScaleStart: ({
		event,
		handle,
	}: { event: React.PointerEvent; handle: ScaleHandle }) => void;
	onResizeStart?: ({
		event,
		handle,
	}: { event: React.PointerEvent; handle: ResizeHandle }) => void;
}) {
	const showResizeHandles = elementType === "text" && onResizeStart;

	return (
		<div
			className="pointer-events-none absolute"
			style={{
				left: bounds.left,
				top: bounds.top,
				width: bounds.width,
				height: bounds.height,
				transform: bounds.rotate !== 0 ? `rotate(${bounds.rotate}deg)` : undefined,
				transformOrigin: "center center",
				zIndex: 1000,
			}}
		>
			{/* Selection border */}
			<div
				className={cn(
					"absolute inset-0 rounded border-2",
					isTransforming ? "border-primary/70" : "border-primary",
				)}
			/>

			{/* Corner handles (proportional scale) */}
			{SCALE_HANDLES.map((handle) => (
				<div
					key={handle}
					className="bg-primary border-background pointer-events-auto absolute rounded-sm border"
					style={{
						width: HANDLE_SIZE,
						height: HANDLE_SIZE,
						cursor: getHandleCursor({ handle }),
						...getHandlePosition({ handle }),
					}}
					onPointerDown={(event) => {
						event.stopPropagation();
						onScaleStart({ event, handle });
					}}
				/>
			))}

			{/* Side handles for text width resize */}
			{showResizeHandles && (
				<>
					{/* Left handle */}
					<div
						className="bg-primary border-background pointer-events-auto absolute rounded-sm border"
						style={{
							width: RESIZE_HANDLE_WIDTH,
							height: RESIZE_HANDLE_HEIGHT,
							cursor: "ew-resize",
							left: -RESIZE_HANDLE_WIDTH / 2,
							top: "50%",
							transform: "translateY(-50%)",
						}}
						onPointerDown={(event) => {
							event.stopPropagation();
							onResizeStart({ event, handle: "left" });
						}}
					/>
					{/* Right handle */}
					<div
						className="bg-primary border-background pointer-events-auto absolute rounded-sm border"
						style={{
							width: RESIZE_HANDLE_WIDTH,
							height: RESIZE_HANDLE_HEIGHT,
							cursor: "ew-resize",
							right: -RESIZE_HANDLE_WIDTH / 2,
							top: "50%",
							transform: "translateY(-50%)",
						}}
						onPointerDown={(event) => {
							event.stopPropagation();
							onResizeStart({ event, handle: "right" });
						}}
					/>
				</>
			)}
		</div>
	);
}

export function SelectionOverlay({
	displaySize,
	onScaleStart,
	onResizeStart,
	isTransforming,
}: {
	displaySize: { width: number; height: number };
	onScaleStart: ({
		event,
		handle,
		element,
		trackId,
	}: {
		event: React.PointerEvent;
		handle: ScaleHandle;
		element: TimelineElement;
		trackId: string;
	}) => void;
	onResizeStart: ({
		event,
		handle,
		element,
		trackId,
	}: {
		event: React.PointerEvent;
		handle: ResizeHandle;
		element: TimelineElement;
		trackId: string;
	}) => void;
	isTransforming: boolean;
}) {
	const editor = useEditor();

	const selectedElements = useSyncExternalStore(
		(listener) => editor.selection.subscribe(listener),
		() => editor.selection.getSelectedElements(),
	);

	const currentTime = editor.playback.getCurrentTime();
	const activeProject = editor.project.getActive();
	const mediaAssets = editor.media.getAssets();
	const canvasWidth = activeProject?.settings.canvasSize.width ?? 0;
	const canvasHeight = activeProject?.settings.canvasSize.height ?? 0;
	const displayScale = canvasWidth > 0 ? displaySize.width / canvasWidth : 1;

	const mediaMap = useMemo(
		() => new Map(mediaAssets.map((asset) => [asset.id, asset])),
		[mediaAssets],
	);

	const elementsWithTracks = editor.timeline.getElementsWithTracks({
		elements: selectedElements,
	});

	const visibleElements = elementsWithTracks.filter(({ element }) => {
		if (element.type === "audio") return false;
		return (
			currentTime >= element.startTime &&
			currentTime < element.startTime + element.duration
		);
	});

	if (visibleElements.length === 0 || displaySize.width === 0) {
		return null;
	}

	return (
		<>
			{visibleElements.map(({ track, element }) => {
				const media =
					"mediaId" in element
						? mediaMap.get(element.mediaId)
						: undefined;

				const bounds = computeElementBounds({
					element,
					media,
					canvasWidth,
					canvasHeight,
					displayScale,
				});

				if (!bounds) return null;

				return (
					<ElementOverlay
						key={element.id}
						bounds={bounds}
						elementType={element.type}
						isTransforming={isTransforming}
						onScaleStart={({ event, handle }) =>
							onScaleStart({
								event,
								handle,
								element,
								trackId: track.id,
							})
						}
						onResizeStart={({ event, handle }) =>
							onResizeStart({
								event,
								handle,
								element,
								trackId: track.id,
							})
						}
					/>
				);
			})}
		</>
	);
}
