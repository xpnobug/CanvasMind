import type { TimelineElement, Transform } from "@cutia/types/timeline";
import type { MediaAsset } from "@cutia/types/assets";
import { FONT_SIZE_SCALE_REFERENCE } from "@cutia/constants/text-constants";
import { isBottomAlignedSubtitleText } from "@cutia/lib/timeline/text-utils";

export interface ElementHalfSize {
	halfWidth: number;
	halfHeight: number;
}

export function getElementHalfSize({
	element,
	transform,
	mediaMap,
	canvasWidth,
	canvasHeight,
}: {
	element: TimelineElement;
	transform: Transform;
	mediaMap: Map<string, MediaAsset>;
	canvasWidth: number;
	canvasHeight: number;
}): ElementHalfSize | null {
	if (element.type === "video" || element.type === "image") {
		const media = mediaMap.get(element.mediaId);
		const mediaW = media?.width || canvasWidth;
		const mediaH = media?.height || canvasHeight;
		const containScale = Math.min(canvasWidth / mediaW, canvasHeight / mediaH);
		return {
			halfWidth: (mediaW * containScale * transform.scale) / 2,
			halfHeight: (mediaH * containScale * transform.scale) / 2,
		};
	}

	if (element.type === "text") {
		const scaleFactor = canvasHeight / FONT_SIZE_SCALE_REFERENCE;
		const scaledFontSize = element.fontSize * scaleFactor;
		const elementScale = element.transform.scale;

		const elementBoxWidth = element.boxWidth;
		const hasBoxWidth =
			elementBoxWidth !== undefined && elementBoxWidth > 0;

		if (hasBoxWidth) {
			const scaledBoxWidth = elementBoxWidth * scaleFactor;
			const lineHeight = scaledFontSize * 1.3;
			const charsPerLine = Math.max(
				1,
				Math.floor(scaledBoxWidth / (scaledFontSize * 0.6)),
			);
			const lineCount = Math.max(
				1,
				Math.ceil(element.content.length / charsPerLine),
			);
			return {
				halfWidth: (scaledBoxWidth * elementScale) / 2,
				halfHeight: ((lineCount * lineHeight) * elementScale) / 2,
			};
		}

		return {
			halfWidth:
				(element.content.length * scaledFontSize * 0.6 * elementScale) / 2,
			halfHeight: ((scaledFontSize * 1.4) * elementScale) / 2,
		};
	}

	if (element.type === "sticker") {
		const stickerSource = 200;
		const containScale = Math.min(
			canvasWidth / stickerSource,
			canvasHeight / stickerSource,
		);
		const half = (stickerSource * containScale * transform.scale) / 2;
		return { halfWidth: half, halfHeight: half };
	}

	return null;
}

/**
 * Returns the element center in absolute canvas coordinates.
 * position is relative to canvas center; this converts to absolute (0,0 = top-left).
 */
export function getElementCenterInCanvas({
	element,
	transform,
	canvasWidth,
	canvasHeight,
	halfSize,
}: {
	element: TimelineElement;
	transform: Transform;
	canvasWidth: number;
	canvasHeight: number;
	halfSize: ElementHalfSize;
}): { x: number; y: number } {
	const isBottomAlignedText =
		element.type === "text" && isBottomAlignedSubtitleText({ element });

	const centerY = isBottomAlignedText
		? canvasHeight / 2 + transform.position.y - halfSize.halfHeight
		: canvasHeight / 2 + transform.position.y;

	return {
		x: canvasWidth / 2 + transform.position.x,
		y: centerY,
	};
}
