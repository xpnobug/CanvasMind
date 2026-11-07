import { i18next } from "@cutia/lib/i18n";
import { create } from "zustand";
import { toast } from "sonner";
import { EditorCore } from "@cutia/core";
import {
	isDevPlaceholderActive,
	generatePlaceholderImage,
} from "@cutia/lib/ai/placeholder";
import { getImageProvider } from "@cutia/lib/ai/providers";
import { processMediaAssets } from "@cutia/lib/media/processing";
import { uploadReferenceImage } from "@cutia/lib/media/upload-reference";
import { useAISettingsStore } from "./ai-settings-store";
import {
	createThumbnailDataUrl,
	storeHistoryImage,
	useAIGenerationHistoryStore,
} from "./ai-generation-history-store";
import { generateUUID } from "@cutia/utils/id";
import {
	useCharacterStore,
	resolveCharacterReferenceUrl,
	getCharacterImageBlob,
} from "./character-store";
import type { CharacterGeneration } from "@cutia/types/character";

export type AssetStatus = "pending" | "adding" | "added" | "failed";

export interface GeneratedImage {
	id: string;
	url: string;
	prompt: string;
	assetStatus: AssetStatus;
}

interface AIImageGenerationState {
	prompt: string;
	aspectRatio: string;
	referenceImage: File | null;
	referenceImagePreview: string | null;
	selectedCharacterId: string | null;
	isGenerating: boolean;
	generatedImages: GeneratedImage[];

	setPrompt: (prompt: string) => void;
	setAspectRatio: (aspectRatio: string) => void;
	setReferenceImage: (file: File | null) => void;
	setSelectedCharacterId: (id: string | null) => void;
	generate: () => Promise<void>;
	retryAddToAssets: (imageId: string) => void;
	clearImages: () => void;
}

const pendingBlobs = new Map<string, Blob>();

function updateImageStatus({
	imageId,
	status,
}: {
	imageId: string;
	status: AssetStatus;
}): void {
	useAIImageGenerationStore.setState((state) => ({
		generatedImages: state.generatedImages.map((image) =>
			image.id === imageId ? { ...image, assetStatus: status } : image,
		),
	}));
}

function dataUrlToBlob({ url }: { url: string }): Blob {
	const [header, base64Data] = url.split(",");
	const mimeType = header.match(/:(.*?);/)?.[1] || "image/png";
	const binaryString = atob(base64Data);
	const bytes = new Uint8Array(binaryString.length);
	for (let index = 0; index < binaryString.length; index++) {
		bytes[index] = binaryString.charCodeAt(index);
	}
	return new Blob([bytes], { type: mimeType });
}

function externalUrlToBlob({ url }: { url: string }): Promise<Blob> {
	return new Promise((resolve, reject) => {
		const image = new Image();
		image.crossOrigin = "anonymous";
		image.addEventListener("load", () => {
			try {
				const canvas = document.createElement("canvas");
				canvas.width = image.naturalWidth;
				canvas.height = image.naturalHeight;
				const context = canvas.getContext("2d");
				if (!context) {
					image.remove();
					reject(new Error("Could not get canvas context"));
					return;
				}
				context.drawImage(image, 0, 0);
				canvas.toBlob((blob) => {
					image.remove();
					if (blob) {
						resolve(blob);
					} else {
						reject(new Error("Failed to convert image to blob"));
					}
				}, "image/png");
			} catch (error) {
				image.remove();
				reject(
					error instanceof Error ? error : new Error("Failed to process image"),
				);
			}
		});
		image.addEventListener("error", () => {
			image.remove();
			reject(new Error("Failed to load image"));
		});
		image.src = url;
	});
}

function loadImageAsBlob({ url }: { url: string }): Promise<Blob> {
	if (url.startsWith("data:")) {
		return Promise.resolve(dataUrlToBlob({ url }));
	}
	return externalUrlToBlob({ url });
}

async function convertAndAddToAssets({
	imageId,
	imageUrl,
}: {
	imageId: string;
	imageUrl: string;
}): Promise<void> {
	const editor = EditorCore.getInstance();
	const project = editor.project.getActiveOrNull();
	if (!project) {
		updateImageStatus({ imageId, status: "failed" });
		return;
	}

	updateImageStatus({ imageId, status: "adding" });

	try {
		const blob = await loadImageAsBlob({ url: imageUrl });
		pendingBlobs.set(imageId, blob);

		const blobUrl = URL.createObjectURL(blob);
		useAIImageGenerationStore.setState((state) => ({
			generatedImages: state.generatedImages.map((image) =>
				image.id === imageId ? { ...image, url: blobUrl } : image,
			),
		}));

		const filename = `ai-generated-${imageId.slice(0, 8)}.png`;
		const file = new File([blob], filename, {
			type: blob.type || "image/png",
		});

		const processedAssets = await processMediaAssets({ files: [file] });

		await Promise.all(
			processedAssets.map((asset) =>
				editor.media.addMediaAsset({
					projectId: project.metadata.id,
					asset,
				}),
			),
		);

		updateImageStatus({ imageId, status: "added" });
		pendingBlobs.delete(imageId);
	} catch (error) {
		console.error("Failed to add AI image to assets:", error);
		updateImageStatus({ imageId, status: "failed" });
	}
}

async function addImageToHistory({
	imageUrl,
	prompt,
	providerName,
}: {
	imageUrl: string;
	prompt: string;
	providerName: string;
}): Promise<void> {
	const entryId = generateUUID();
	const createdAt = new Date().toISOString();

	let thumbnailUrl: string | undefined;
	try {
		thumbnailUrl = await createThumbnailDataUrl({ imageUrl });
	} catch {
		// proceed without thumbnail
	}

	try {
		const blob = await loadImageAsBlob({ url: imageUrl });
		await storeHistoryImage({ id: entryId, blob, createdAt });
	} catch {
		// proceed without storing blob
	}

	const isDataUrl = imageUrl.startsWith("data:");
	useAIGenerationHistoryStore.getState().addEntry({
		id: entryId,
		type: "image",
		prompt,
		url: isDataUrl ? "" : imageUrl,
		thumbnailUrl,
		provider: providerName,
	});
}

export const useAIImageGenerationStore = create<AIImageGenerationState>()(
	(set, get) => ({
		prompt: "",
		aspectRatio: "auto",
		referenceImage: null,
		referenceImagePreview: null,
		selectedCharacterId: null,
		isGenerating: false,
		generatedImages: [],

		setPrompt: (prompt) => set({ prompt }),
		setAspectRatio: (aspectRatio) => set({ aspectRatio }),
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

			const { prompt, aspectRatio } = get();
			const trimmedPrompt = prompt.trim();
			if (!trimmedPrompt) {
				toast.error(i18next.t("Please enter a prompt"));
				return;
			}

			if (isDevPlaceholderActive()) {
				set({ isGenerating: true });
				try {
					const file = await generatePlaceholderImage({
						prompt: trimmedPrompt,
						aspectRatio: aspectRatio === "auto" ? undefined : aspectRatio,
					});
					const blobUrl = URL.createObjectURL(file);
					const newImage: GeneratedImage = {
						id: generateUUID(),
						url: blobUrl,
						prompt: trimmedPrompt,
						assetStatus: "pending" as const,
					};
					set((state) => ({
						generatedImages: [newImage, ...state.generatedImages],
						isGenerating: false,
					}));
					toast.success(i18next.t("Generated {{num}} image(s)", { num: 1 }));
					void convertAndAddToAssets({
						imageId: newImage.id,
						imageUrl: blobUrl,
					});
				} catch (error) {
					const message =
						error instanceof Error
							? error.message
							: i18next.t("Image generation failed");
					toast.error(message);
					set({ isGenerating: false });
				}
				return;
			}

			const { imageProviderId, imageApiKey } = useAISettingsStore.getState();

			if (!imageProviderId) {
				toast.error(
					i18next.t("Please configure an image provider in Settings"),
				);
				return;
			}

			const provider = getImageProvider({ id: imageProviderId });
			if (!provider || !imageApiKey) {
				toast.error(
					i18next.t("Please configure an image provider in Settings"),
				);
				return;
			}

			const { referenceImage, selectedCharacterId } = get();

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

				const results = await provider.generateImage({
					request: {
						prompt: trimmedPrompt,
						aspectRatio: aspectRatio === "auto" ? undefined : aspectRatio,
						referenceImageUrl,
					},
					apiKey: imageApiKey,
				});

				const newImages: GeneratedImage[] = results.map((result) => ({
					id: generateUUID(),
					url: result.url,
					prompt: trimmedPrompt,
					assetStatus: "pending" as const,
				}));

				set((state) => ({
					generatedImages: [...newImages, ...state.generatedImages],
					isGenerating: false,
				}));

				toast.success(
					i18next.t("Generated {{num}} image(s)", {
						num: results.length,
					}),
				);

				for (const image of newImages) {
					void addImageToHistory({
						imageUrl: image.url,
						prompt: trimmedPrompt,
						providerName: provider.name,
					});
					void convertAndAddToAssets({
						imageId: image.id,
						imageUrl: image.url,
					});

					if (selectedCharacterId) {
						const generation: CharacterGeneration = {
							id: generateUUID(),
							type: "image",
							prompt: trimmedPrompt,
							url: image.url,
							provider: provider.name,
							createdAt: new Date().toISOString(),
						};
						useCharacterStore.getState().addGeneration({
							characterId: selectedCharacterId,
							generation,
						});
					}
				}
			} catch (error) {
				const message =
					error instanceof Error
						? error.message
						: i18next.t("Image generation failed");
				toast.error(message);
				set({ isGenerating: false });
			}
		},

		retryAddToAssets: (imageId) => {
			const image = get().generatedImages.find((img) => img.id === imageId);
			if (image) {
				void convertAndAddToAssets({
					imageId: image.id,
					imageUrl: image.url,
				});
			}
		},

		clearImages: () => {
			pendingBlobs.clear();
			set({ generatedImages: [] });
		},
	}),
);
