import { LANGUAGES } from "@cutia/constants/language-constants";
import type {
	TranscriptionModel,
	TranscriptionModelId,
} from "@cutia/types/transcription";
import type { LanguageCode } from "@cutia/types/language";

const SUPPORTED_TRANSCRIPTION_LANGS: ReadonlyArray<LanguageCode> = [
	"en",
	"es",
	"it",
	"fr",
	"de",
	"pt",
	"ru",
	"ja",
	"zh",
];

export const TRANSCRIPTION_LANGUAGES = LANGUAGES.filter((language) =>
	SUPPORTED_TRANSCRIPTION_LANGS.includes(language.code),
);

export const TRANSCRIPTION_MODELS: TranscriptionModel[] = [
	{
		id: "whisper-tiny",
		name: "Tiny",
		huggingFaceId: "onnx-community/whisper-tiny",
		description: "Fastest, lower accuracy (120MB)",
		encoderDtype: "fp32",
	},
	{
		id: "whisper-base",
		name: "Base",
		huggingFaceId: "onnx-community/whisper-base",
		description: "Fast with decent accuracy (206MB)",
		encoderDtype: "fp32",
	},
	{
		id: "whisper-small",
		name: "Small",
		huggingFaceId: "onnx-community/whisper-small",
		description: "Good balance of speed and accuracy (586MB)",
		encoderDtype: "fp32",
	},
	{
		id: "whisper-large-v3-turbo",
		name: "Large v3 Turbo",
		huggingFaceId: "onnx-community/whisper-large-v3-turbo",
		description: "Best accuracy, requires WebGPU (1604MB)",
		encoderDtype: "fp16",
	},
	{
		id: "distil-small.en",
		name: "Distil Small (English)",
		huggingFaceId: "onnx-community/distil-small.en",
		description: "Optimized for English only (538MB)",
		encoderDtype: "fp32",
	},
];

export const DEFAULT_TRANSCRIPTION_MODEL: TranscriptionModelId =
	"whisper-base";

export const DEFAULT_CHUNK_LENGTH_SECONDS = 30;
export const DEFAULT_STRIDE_SECONDS = 5;

export const DEFAULT_WORDS_PER_CAPTION = 3;
export const MIN_CAPTION_DURATION_SECONDS = 0.8;
