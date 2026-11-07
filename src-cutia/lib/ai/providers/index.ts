export type {
	AIImageProvider,
	AIVideoProvider,
	ImageGenerationRequest,
	ImageGenerationResult,
	VideoGenerationRequest,
	VideoTaskResult,
	VideoTaskStatus,
} from "./types";
export { IMAGE_PROVIDERS } from "./image-providers";
export { VIDEO_PROVIDERS } from "./video-providers";

import { IMAGE_PROVIDERS } from "./image-providers";
import { VIDEO_PROVIDERS } from "./video-providers";

export function getImageProvider({
	id,
}: {
	id: string;
}) {
	return IMAGE_PROVIDERS.find((provider) => provider.id === id) ?? null;
}

export function getVideoProvider({
	id,
}: {
	id: string;
}) {
	return VIDEO_PROVIDERS.find((provider) => provider.id === id) ?? null;
}
