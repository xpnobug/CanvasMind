import type { LanguageCode } from "./language";

export type TranscriptionLanguage = LanguageCode | "auto";

export type TranscriptionSubtask = "transcribe" | "translate";

export interface TranscriptionSegment {
	text: string;
	start: number;
	end: number;
}

export interface TranscriptionChunk {
	text: string;
	timestamp: [number, number | null];
	finalised: boolean;
	offset: number;
}

export interface TranscriptionStreamingData {
	text: string;
	chunks: TranscriptionChunk[];
	tps: number;
}

export interface TranscriptionResult {
	text: string;
	segments: TranscriptionSegment[];
	language: string;
	tps?: number;
}

export type TranscriptionStatus =
	| "idle"
	| "loading-model"
	| "transcribing"
	| "complete"
	| "error";

export interface TranscriptionProgress {
	status: TranscriptionStatus;
	progress: number;
	message?: string;
}

export type TranscriptionModelId =
	| "whisper-tiny"
	| "whisper-base"
	| "whisper-small"
	| "whisper-large-v3-turbo"
	| "distil-small.en";

export interface TranscriptionModel {
	id: TranscriptionModelId;
	name: string;
	huggingFaceId: string;
	description: string;
	encoderDtype: "fp16" | "fp32";
}

export interface CaptionChunk {
	text: string;
	startTime: number;
	duration: number;
}
