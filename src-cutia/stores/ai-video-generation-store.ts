import { i18next } from "@cutia/lib/i18n";
import { create } from "zustand";
import { toast } from "sonner";
import { EditorCore } from "@cutia/core";
import {
	isDevPlaceholderActive,
	generatePlaceholderVideo,
} from "@cutia/lib/ai/placeholder";
import { getVideoProvider } from "@cutia/lib/ai/providers";
import type { VideoTaskStatus } from "@cutia/lib/ai/providers/types";
import { pollVideoTask } from "@cutia/lib/ai/providers/seedance";
import { processMediaAssets } from "@cutia/lib/media/processing";
import { uploadReferenceImage } from "@cutia/lib/media/upload-reference";
import { fetchWithProxyFallback } from "@cutia/lib/media/url-import";
import { useAISettingsStore } from "./ai-settings-store";
import { useAIGenerationHistoryStore } from "./ai-generation-history-store";
import { generateUUID } from "@cutia/utils/id";
import {
	useCharacterStore,
	resolveCharacterReferenceUrl,
	getCharacterImageBlob,
} from "./character-store";
import type { CharacterGeneration } from "@cutia/types/character";

export type VideoAssetStatus = "pending" | "adding" | "added" | "failed";

export interface GeneratedVideo {
	id: string;
	prompt: string;
	taskId: string;
	taskStatus: VideoTaskStatus;
	videoUrl?: string;
	assetStatus: VideoAssetStatus;
	error?: string;
}

interface AIVideoGenerationState {
	prompt: string;
	duration: number;
	aspectRatio: string;
	resolution: string;
	referenceImage: File | null;
	referenceImagePreview: string | null;
	selectedCharacterId: string | null;
	isGenerating: boolean;
	generatedVideos: GeneratedVideo[];

	setPrompt: (prompt: string) => void;
	setDuration: (duration: number) => void;
	setAspectRatio: (aspectRatio: string) => void;
	setResolution: (resolution: string) => void;
	setReferenceImage: (file: File | null) => void;
	setSelectedCharacterId: (id: string | null) => void;
	generate: () => Promise<void>;
	retryAddToAssets: (videoId: string) => void;
	clearVideos: () => void;
}

function updateVideo({
	videoId,
	updates,
}: {
	videoId: string;
	updates: Partial<GeneratedVideo>;
}): void {
	useAIVideoGenerationStore.setState((state) => ({
		generatedVideos: state.generatedVideos.map((video) =>
			video.id === videoId ? { ...video, ...updates } : video,
		),
	}));
}

async function downloadAndAddToAssets({
	videoId,
	videoUrl,
}: {
	videoId: string;
	videoUrl: string;
}): Promise<void> {
	const editor = EditorCore.getInstance();
	const project = editor.project.getActiveOrNull();
	if (!project) {
		updateVideo({ videoId, updates: { assetStatus: "failed" } });
		return;
	}

	updateVideo({ videoId, updates: { assetStatus: "adding" } });

	try {
		const blob = await fetchWithProxyFallback({ url: videoUrl });
		const filename = `ai-video-${videoId.slice(0, 8)}.mp4`;
		const file = new File([blob], filename, {
			type: blob.type || "video/mp4",
		});

		const processedAssets = await processMediaAssets({ files: [file] });

		for (const asset of processedAssets) {
			await editor.media.addMediaAsset({
				projectId: project.metadata.id,
				asset,
			});
		}

		updateVideo({ videoId, updates: { assetStatus: "added" } });
	} catch (error) {
		console.error("Failed to add AI video to assets:", error);
		updateVideo({ videoId, updates: { assetStatus: "failed" } });
	}
}

export const useAIVideoGenerationStore = create<AIVideoGenerationState>()(
	(set, get) => ({
		prompt: "",
		duration: 5,
		aspectRatio: "16:9",
		resolution: "720p",
		referenceImage: null,
		referenceImagePreview: null,
		selectedCharacterId: null,
		isGenerating: false,
		generatedVideos: [],

		setPrompt: (prompt) => set({ prompt }),
		setDuration: (duration) => set({ duration }),
		setAspectRatio: (aspectRatio) => set({ aspectRatio }),
		setResolution: (resolution) => set({ resolution }),
		setSelectedCharacterId: (id) => {
			set({ selectedCharacterId: id });
			if (id) {
				const character = useCharacterStore.getState().getCharacterById({ id });
				if (character && character.images.length > 0) {
					const firstImage = character.images[0];
					void getCharacterImageBlob({ id: firstImage.blobKey }).then(
						(blob) => {
							if (blob) {
								const prev = get().referenceImagePreview;
								if (prev) URL.revokeObjectURL(prev);
								const file = new File([blob], `character-${id}.png`, {
									type: blob.type || "image/png",
								});
								set({
									referenceImage: file,
									referenceImagePreview: URL.createObjectURL(blob),
								});
							}
						},
					);
				}
			} else {
				const prev = get().referenceImagePreview;
				if (prev) URL.revokeObjectURL(prev);
				set({ referenceImage: null, referenceImagePreview: null });
			}
		},
		setReferenceImage: (file) => {
			const prev = get().referenceImagePreview;
			if (prev) URL.revokeObjectURL(prev);

			if (file) {
				set({
					referenceImage: file,
					referenceImagePreview: URL.createObjectURL(file),
				});
			} else {
				set({ referenceImage: null, referenceImagePreview: null });
			}
		},

		generate: async () => {
			if (get().isGenerating) return;

			const { prompt, duration, aspectRatio } = get();
			const trimmedPrompt = prompt.trim();
			if (!trimmedPrompt) {
				toast.error(i18next.t("Please enter a prompt"));
				return;
			}

			if (isDevPlaceholderActive()) {
				set({ isGenerating: true });
				try {
					const file = await generatePlaceholderVideo({
						prompt: trimmedPrompt,
						durationSeconds: duration,
						aspectRatio,
					});

					const editor = EditorCore.getInstance();
					const project = editor.project.getActiveOrNull();
					if (!project) {
						toast.error(i18next.t("No active project"));
						set({ isGenerating: false });
						return;
					}

					const processedAssets = await processMediaAssets({
						files: [file],
					});
					for (const asset of processedAssets) {
						await editor.media.addMediaAsset({
							projectId: project.metadata.id,
							asset,
						});
					}

					const videoId = generateUUID();
					const newVideo: GeneratedVideo = {
						id: videoId,
						prompt: trimmedPrompt,
						taskId: "placeholder",
						taskStatus: "succeeded",
						assetStatus: "added",
					};
					set((state) => ({
						generatedVideos: [newVideo, ...state.generatedVideos],
						isGenerating: false,
					}));
					toast.success(i18next.t("Video generation completed"));
				} catch (error) {
					const message =
						error instanceof Error
							? error.message
							: i18next.t("Video generation failed");
					toast.error(message);
					set({ isGenerating: false });
				}
				return;
			}

			const { videoProviderId, videoApiKey } = useAISettingsStore.getState();

			if (!videoProviderId) {
				toast.error(i18next.t("Please configure a video provider in Settings"));
				return;
			}

			const provider = getVideoProvider({ id: videoProviderId });
			if (!provider || !videoApiKey) {
				toast.error(i18next.t("Please configure a video provider in Settings"));
				return;
			}

			const { resolution, referenceImage, selectedCharacterId } = get();

			set({ isGenerating: true });

			try {
				let referenceImageUrl: string | undefined;
				if (selectedCharacterId) {
					referenceImageUrl = await resolveCharacterReferenceUrl({
						characterId: selectedCharacterId,
					});
				} else if (referenceImage) {
					referenceImageUrl = await uploadReferenceImage({
						file: referenceImage,
					});
				}

				const submitResult = await provider.submitVideoTask({
					request: {
						prompt: trimmedPrompt,
						duration,
						aspectRatio,
						resolution,
						referenceImageUrl,
					},
					apiKey: videoApiKey,
				});

				const videoId = generateUUID();
				const newVideo: GeneratedVideo = {
					id: videoId,
					prompt: trimmedPrompt,
					taskId: submitResult.taskId,
					taskStatus: submitResult.status,
					assetStatus: "pending",
				};

				set((state) => ({
					generatedVideos: [newVideo, ...state.generatedVideos],
					isGenerating: false,
				}));

				toast.success(i18next.t("Video generation task submitted"));

				void pollAndUpdate({
					provider,
					videoId,
					taskId: submitResult.taskId,
					apiKey: videoApiKey,
					characterId: selectedCharacterId,
				});
			} catch (error) {
				const message =
					error instanceof Error
						? error.message
						: i18next.t("Video generation failed");
				toast.error(message);
				set({ isGenerating: false });
			}
		},

		retryAddToAssets: (videoId) => {
			const video = get().generatedVideos.find((v) => v.id === videoId);
			if (video?.videoUrl) {
				void downloadAndAddToAssets({
					videoId: video.id,
					videoUrl: video.videoUrl,
				});
			}
		},

		clearVideos: () => {
			set({ generatedVideos: [] });
		},
	}),
);

async function pollAndUpdate({
	provider,
	videoId,
	taskId,
	apiKey,
	characterId,
}: {
	provider: ReturnType<typeof getVideoProvider>;
	videoId: string;
	taskId: string;
	apiKey: string;
	characterId?: string | null;
}): Promise<void> {
	if (!provider) return;

	try {
		const finalResult = await pollVideoTask({
			provider,
			taskId,
			apiKey,
			onProgress: (result) => {
				updateVideo({
					videoId,
					updates: {
						taskStatus: result.status,
						videoUrl: result.videoUrl,
						error: result.error,
					},
				});
			},
		});

		if (finalResult.status === "succeeded" && finalResult.videoUrl) {
			const currentVideo = useAIVideoGenerationStore
				.getState()
				.generatedVideos.find((v) => v.id === videoId);

			updateVideo({
				videoId,
				updates: {
					taskStatus: "succeeded",
					videoUrl: finalResult.videoUrl,
				},
			});

			toast.success(i18next.t("Video generation completed"));

			useAIGenerationHistoryStore.getState().addEntry({
				id: generateUUID(),
				type: "video",
				prompt: currentVideo?.prompt ?? "",
				url: finalResult.videoUrl,
				provider: provider?.name ?? "",
			});

			void downloadAndAddToAssets({
				videoId,
				videoUrl: finalResult.videoUrl,
			});

			if (characterId) {
				const generation: CharacterGeneration = {
					id: generateUUID(),
					type: "video",
					prompt: currentVideo?.prompt ?? "",
					url: finalResult.videoUrl,
					provider: provider?.name ?? "",
					createdAt: new Date().toISOString(),
				};
				useCharacterStore.getState().addGeneration({ characterId, generation });
			}
		} else if (finalResult.status === "failed") {
			updateVideo({
				videoId,
				updates: {
					taskStatus: "failed",
					error: finalResult.error ?? i18next.t("Video generation failed"),
				},
			});
			toast.error(finalResult.error ?? i18next.t("Video generation failed"));
		}
	} catch (error) {
		const message =
			error instanceof Error
				? error.message
				: i18next.t("Failed to check video status");
		updateVideo({
			videoId,
			updates: { taskStatus: "failed", error: message },
		});
		toast.error(message);
	}
}
