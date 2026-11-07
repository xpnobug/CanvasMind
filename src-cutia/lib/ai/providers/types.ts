export interface ImageGenerationRequest {
	prompt: string;
	aspectRatio?: string;
	referenceImageUrl?: string;
}

export interface ImageGenerationResult {
	url: string;
}

export interface AIImageProvider {
	id: string;
	name: string;
	description: string;
	useProxy?: boolean;
	generateImage(params: {
		request: ImageGenerationRequest;
		apiKey: string;
	}): Promise<ImageGenerationResult[]>;
}

export interface VideoGenerationRequest {
	prompt: string;
	duration?: number;
	aspectRatio?: string;
	resolution?: string;
	referenceImageUrl?: string;
}

export type VideoTaskStatus =
	| "pending"
	| "running"
	| "succeeded"
	| "failed"
	| "cancelled";

export interface VideoTaskResult {
	taskId: string;
	status: VideoTaskStatus;
	videoUrl?: string;
	error?: string;
}

export interface AIVideoProvider {
	id: string;
	name: string;
	description: string;
	useProxy?: boolean;
	submitVideoTask(params: {
		request: VideoGenerationRequest;
		apiKey: string;
	}): Promise<VideoTaskResult>;
	getVideoTask(params: {
		taskId: string;
		apiKey: string;
	}): Promise<VideoTaskResult>;
}
