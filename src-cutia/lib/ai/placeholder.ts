import {
	Output,
	Mp4OutputFormat,
	BufferTarget,
	CanvasSource,
	QUALITY_LOW,
} from "mediabunny";
import { IS_DEV } from "@cutia/constants/editor-constants";
import { useAISettingsStore } from "@cutia/stores/ai-settings-store";

const PLACEHOLDER_BG = "#2a2a2a";
const PLACEHOLDER_TEXT_COLOR = "#888888";
const PLACEHOLDER_PROMPT_COLOR = "#aaaaaa";
const PLACEHOLDER_LABEL = "PLACEHOLDER";

function drawPlaceholderFrame({
	ctx,
	width,
	height,
	prompt,
}: {
	ctx: OffscreenCanvasRenderingContext2D;
	width: number;
	height: number;
	prompt: string;
}): void {
	ctx.fillStyle = PLACEHOLDER_BG;
	ctx.fillRect(0, 0, width, height);

	// dashed border
	ctx.strokeStyle = PLACEHOLDER_TEXT_COLOR;
	ctx.lineWidth = 2;
	ctx.setLineDash([8, 4]);
	const inset = 12;
	ctx.strokeRect(inset, inset, width - inset * 2, height - inset * 2);
	ctx.setLineDash([]);

	const labelSize = Math.max(14, Math.floor(height / 12));
	ctx.fillStyle = PLACEHOLDER_TEXT_COLOR;
	ctx.font = `600 ${labelSize}px sans-serif`;
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	ctx.fillText(PLACEHOLDER_LABEL, width / 2, height / 2 - labelSize);

	// prompt text with word-wrap
	const promptSize = Math.max(10, Math.floor(height / 20));
	ctx.fillStyle = PLACEHOLDER_PROMPT_COLOR;
	ctx.font = `${promptSize}px sans-serif`;

	const maxWidth = width - inset * 4;
	const lines = wrapText({ ctx, text: prompt, maxWidth });
	const maxLines = 4;
	const visibleLines = lines.slice(0, maxLines);
	if (lines.length > maxLines) {
		visibleLines[maxLines - 1] = `${visibleLines[maxLines - 1]}…`;
	}

	const lineHeight = promptSize * 1.4;
	const startY = height / 2 + labelSize * 0.4;
	for (let i = 0; i < visibleLines.length; i++) {
		ctx.fillText(visibleLines[i], width / 2, startY + i * lineHeight, maxWidth);
	}
}

function wrapText({
	ctx,
	text,
	maxWidth,
}: {
	ctx: OffscreenCanvasRenderingContext2D;
	text: string;
	maxWidth: number;
}): string[] {
	const words = text.split(/\s+/);
	const lines: string[] = [];
	let currentLine = "";

	for (const word of words) {
		const testLine = currentLine ? `${currentLine} ${word}` : word;
		if (ctx.measureText(testLine).width > maxWidth && currentLine) {
			lines.push(currentLine);
			currentLine = word;
		} else {
			currentLine = testLine;
		}
	}
	if (currentLine) {
		lines.push(currentLine);
	}
	return lines;
}

function resolveAspectDimensions({
	aspectRatio,
}: {
	aspectRatio?: string;
}): { width: number; height: number } {
	const mapping: Record<string, { width: number; height: number }> = {
		"16:9": { width: 640, height: 360 },
		"9:16": { width: 360, height: 640 },
		"1:1": { width: 480, height: 480 },
		"4:3": { width: 480, height: 360 },
		"3:4": { width: 360, height: 480 },
		"21:9": { width: 630, height: 270 },
	};
	return mapping[aspectRatio ?? ""] ?? { width: 640, height: 360 };
}

export async function generatePlaceholderImage({
	prompt,
	aspectRatio,
}: {
	prompt: string;
	aspectRatio?: string;
}): Promise<File> {
	const { width, height } = resolveAspectDimensions({ aspectRatio });
	const canvas = new OffscreenCanvas(width, height);
	const ctx = canvas.getContext("2d");
	if (!ctx) {
		throw new Error("Failed to get canvas context");
	}

	drawPlaceholderFrame({ ctx, width, height, prompt });

	const blob = await canvas.convertToBlob({ type: "image/png" });
	return new File([blob], `placeholder-${Date.now()}.png`, {
		type: "image/png",
	});
}

export async function generatePlaceholderVideo({
	prompt,
	durationSeconds = 3,
	aspectRatio,
	fps = 1,
}: {
	prompt: string;
	durationSeconds?: number;
	aspectRatio?: string;
	fps?: number;
}): Promise<File> {
	const { width, height } = resolveAspectDimensions({ aspectRatio });
	const canvas = new OffscreenCanvas(width, height);
	const ctx = canvas.getContext("2d");
	if (!ctx) {
		throw new Error("Failed to get canvas context");
	}

	const output = new Output({
		format: new Mp4OutputFormat(),
		target: new BufferTarget(),
	});

	const videoSource = new CanvasSource(canvas, {
		codec: "avc",
		bitrate: QUALITY_LOW,
	});

	output.addVideoTrack(videoSource, { frameRate: fps });
	await output.start();

	const frameCount = Math.max(1, Math.ceil(durationSeconds * fps));
	for (let i = 0; i < frameCount; i++) {
		drawPlaceholderFrame({ ctx, width, height, prompt });
		await videoSource.add(i / fps, 1 / fps);
	}

	videoSource.close();
	await output.finalize();

	const buffer = output.target.buffer;
	if (!buffer) {
		throw new Error("Failed to generate placeholder video");
	}

	return new File([new Blob([buffer])], `placeholder-${Date.now()}.mp4`, {
		type: "video/mp4",
	});
}

export function isDevPlaceholderAvailable(): boolean {
	return IS_DEV;
}

export function isDevPlaceholderActive(): boolean {
	if (!IS_DEV) return false;
	return useAISettingsStore.getState().devPlaceholderEnabled;
}
