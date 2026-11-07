import type {
	AIVideoProvider,
	VideoGenerationRequest,
	VideoTaskResult,
	VideoTaskStatus,
} from "./types";

const ARK_API_BASE =
	"https://ark.ap-southeast.bytepluses.com/api/v3/contents/generations/tasks";
const DEFAULT_MODEL = "seedance-1-5-pro-251215";

const POLL_INTERVAL_MS = 5000;
const MAX_POLL_ATTEMPTS = 120;

function normalizeStatus({ status }: { status: string }): VideoTaskStatus {
	const lower = status.toLowerCase();
	if (lower === "succeeded" || lower === "completed" || lower === "success") {
		return "succeeded";
	}
	if (lower === "failed" || lower === "error") {
		return "failed";
	}
	if (lower === "cancelled" || lower === "canceled") {
		return "cancelled";
	}
	if (lower === "running" || lower === "processing" || lower === "in_progress") {
		return "running";
	}
	return "pending";
}

function extractVideoUrl({
	data,
}: {
	data: Record<string, unknown>;
}): string | undefined {
	const content = data.content as
		| { video_url?: string; file_url?: string }
		| undefined;
	if (content?.video_url) return content.video_url;
	if (content?.file_url) return content.file_url;

	if (typeof data.video_url === "string") return data.video_url;
	return undefined;
}

async function postDirect({
	url,
	apiKey,
	body,
}: {
	url: string;
	apiKey: string;
	body: Record<string, unknown>;
}): Promise<Response> {
	return fetch(url, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${apiKey}`,
		},
		body: JSON.stringify(body),
	});
}

async function getDirect({
	url,
	apiKey,
}: {
	url: string;
	apiKey: string;
}): Promise<Response> {
	return fetch(url, {
		method: "GET",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${apiKey}`,
		},
	});
}

async function fetchViaProxy({
	url,
	apiKey,
	body,
}: {
	url: string;
	apiKey: string;
	body: Record<string, unknown>;
}): Promise<Response> {
	return fetch("/api/ai/video/generate", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			url,
			headers: { Authorization: `Bearer ${apiKey}` },
			body,
		}),
	});
}

async function fetchTaskViaProxy({
	taskId,
	apiKey,
}: {
	taskId: string;
	apiKey: string;
}): Promise<Response> {
	const params = new URLSearchParams({
		providerId: "seedance",
		taskId,
	});
	return fetch(`/api/ai/video/task?${params.toString()}`, {
		headers: { Authorization: `Bearer ${apiKey}` },
	});
}

function sleep({ ms }: { ms: number }): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export const seedanceProvider: AIVideoProvider = {
	id: "seedance",
	name: "Seedance (ByteDance Ark)",
	description: "ByteDance Ark API - Seedance 1.5 Pro video generation",
	useProxy: true,

	async submitVideoTask({
		request,
		apiKey,
	}: {
		request: VideoGenerationRequest;
		apiKey: string;
	}): Promise<VideoTaskResult> {
		if (!apiKey) {
			throw new Error("ARK_API_KEY is not configured");
		}

		const contentParts: Array<Record<string, unknown>> = [];

		if (request.referenceImageUrl) {
			contentParts.push({
				type: "image_url",
				image_url: { url: request.referenceImageUrl },
			});
		}

		contentParts.push({
			type: "text",
			text: request.prompt,
		});

		const payload: Record<string, unknown> = {
			model: DEFAULT_MODEL,
			content: contentParts,
		};

		if (request.duration !== undefined) {
			payload.duration = request.duration;
		}
		if (request.aspectRatio) {
			payload.ratio = request.aspectRatio;
		}
		if (request.resolution) {
			payload.resolution = request.resolution;
		}

		const doPost = this.useProxy ? fetchViaProxy : postDirect;
		const response = await doPost({
			url: ARK_API_BASE,
			apiKey,
			body: payload,
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(
				`Seedance API error: ${response.status} - ${errorText}`,
			);
		}

		const data = await response.json();
		const taskId = data.id ?? data.data?.task_id ?? data.task_id;

		if (!taskId) {
			throw new Error("Seedance API returned no task ID");
		}

		const status = data.status ?? data.data?.status ?? "pending";

		return {
			taskId,
			status: normalizeStatus({ status }),
		};
	},

	async getVideoTask({
		taskId,
		apiKey,
	}: {
		taskId: string;
		apiKey: string;
	}): Promise<VideoTaskResult> {
		if (!apiKey) {
			throw new Error("ARK_API_KEY is not configured");
		}

		const response = this.useProxy
			? await fetchTaskViaProxy({ taskId, apiKey })
			: await getDirect({ url: `${ARK_API_BASE}/${taskId}`, apiKey });

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(
				`Seedance API error: ${response.status} - ${errorText}`,
			);
		}

		const data = await response.json();
		const status = data.status ?? "pending";
		const normalizedStatus = normalizeStatus({ status });

		const result: VideoTaskResult = {
			taskId,
			status: normalizedStatus,
		};

		if (normalizedStatus === "succeeded") {
			result.videoUrl = extractVideoUrl({ data });
		}

		if (normalizedStatus === "failed") {
			const errorObj = data.error as
				| { message?: string; code?: string }
				| undefined;
			result.error =
				errorObj?.message ?? "Video generation failed";
		}

		return result;
	},
};

export async function pollVideoTask({
	provider,
	taskId,
	apiKey,
	onProgress,
}: {
	provider: AIVideoProvider;
	taskId: string;
	apiKey: string;
	onProgress?: (result: VideoTaskResult) => void;
}): Promise<VideoTaskResult> {
	for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
		await sleep({ ms: POLL_INTERVAL_MS });

		const result = await provider.getVideoTask({ taskId, apiKey });
		onProgress?.(result);

		if (
			result.status === "succeeded" ||
			result.status === "failed" ||
			result.status === "cancelled"
		) {
			return result;
		}
	}

	return {
		taskId,
		status: "failed",
		error: "Video generation timed out",
	};
}
