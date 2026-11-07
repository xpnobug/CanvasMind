import { EditorCore } from "@cutia/core";
import {
	isDevPlaceholderActive,
	generatePlaceholderImage,
	generatePlaceholderVideo,
} from "@cutia/lib/ai/placeholder";
import { getImageProvider, getVideoProvider } from "@cutia/lib/ai/providers";
import type { AIVideoProvider } from "@cutia/lib/ai/providers/types";
import { pollVideoTask } from "@cutia/lib/ai/providers/seedance";
import { processMediaAssets } from "@cutia/lib/media/processing";
import { uploadMediaAssetAsReference } from "@cutia/lib/media/upload-reference";
import { fetchWithProxyFallback } from "@cutia/lib/media/url-import";
import {
	createThumbnailDataUrl,
	storeHistoryImage,
	useAIGenerationHistoryStore,
} from "@cutia/stores/ai-generation-history-store";
import { useAISettingsStore } from "@cutia/stores/ai-settings-store";
import {
	useCharacterStore,
	resolveCharacterReferenceUrl,
} from "@cutia/stores/character-store";
import type { CharacterGeneration } from "@cutia/types/character";
import { generateUUID } from "@cutia/utils/id";
import type { AgentTool } from "./types";

function getConfiguredImageProvider() {
	const { imageProviderId, imageApiKey } = useAISettingsStore.getState();
	if (!imageProviderId || !imageApiKey) return null;
	const provider = getImageProvider({ id: imageProviderId });
	if (!provider) return null;
	return { provider, apiKey: imageApiKey };
}

function getConfiguredVideoProvider() {
	const { videoProviderId, videoApiKey } = useAISettingsStore.getState();
	if (!videoProviderId || !videoApiKey) return null;
	const provider = getVideoProvider({ id: videoProviderId });
	if (!provider) return null;
	return { provider, apiKey: videoApiKey };
}

async function urlToFile({
	url,
	filename,
	mimeType,
}: {
	url: string;
	filename: string;
	mimeType: string;
}): Promise<File> {
	if (url.startsWith("data:")) {
		const [header, base64Data] = url.split(",");
		const detectedMime = header.match(/:(.*?);/)?.[1] || mimeType;
		const binaryString = atob(base64Data);
		const bytes = new Uint8Array(binaryString.length);
		for (let index = 0; index < binaryString.length; index++) {
			bytes[index] = binaryString.charCodeAt(index);
		}
		return new File([bytes], filename, { type: detectedMime });
	}

	const blob = await fetchWithProxyFallback({ url });
	return new File([blob], filename, { type: blob.type || mimeType });
}

async function addFileToProject({
	file,
}: {
	file: File;
}): Promise<{ mediaId: string; name: string; previewUrl: string }> {
	const editor = EditorCore.getInstance();
	const project = editor.project.getActiveOrNull();
	if (!project) {
		throw new Error("No active project");
	}

	const processedAssets = await processMediaAssets({ files: [file] });
	if (processedAssets.length === 0) {
		throw new Error("Failed to process media file");
	}

	const asset = processedAssets[0];
	const mediaId = await editor.media.addMediaAsset({
		projectId: project.metadata.id,
		asset,
	});

	const previewUrl = asset.thumbnailUrl ?? URL.createObjectURL(file);
	return { mediaId, name: asset.name, previewUrl };
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
		const blob = await fetchWithProxyFallback({ url: imageUrl });
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

async function resolveReferenceImageUrl({
	mediaId,
}: {
	mediaId: string | undefined;
}): Promise<string | undefined> {
	if (!mediaId) return undefined;
	return uploadMediaAssetAsReference({ mediaId });
}

function resolveCharacterId({
	characterId,
	characterName,
}: {
	characterId?: string;
	characterName?: string;
}): string | undefined {
	if (characterId) {
		const character = useCharacterStore
			.getState()
			.getCharacterById({ id: characterId });
		if (character) return character.id;
	}
	if (characterName) {
		const character = useCharacterStore
			.getState()
			.getCharacterByName({ name: characterName });
		if (character) return character.id;
	}
	return undefined;
}

function buildEnhancedPrompt({
	prompt,
	characterId,
}: {
	prompt: string;
	characterId: string | undefined;
}): string {
	if (!characterId) return prompt;

	const character = useCharacterStore
		.getState()
		.getCharacterById({ id: characterId });
	if (!character) return prompt;

	const parts: string[] = [];

	if (character.description) {
		parts.push(`[Character: ${character.name}] ${character.description}`);
	}

	parts.push(prompt);

	if (character.styleDescription) {
		parts.push(`[Style: ${character.styleDescription}]`);
	}

	return parts.join("\n\n");
}

export const generateImageTool: AgentTool = {
	name: "generate_image",
	description:
		"Generate an image using AI based on a text prompt. The generated image is automatically added to the project's media library and its mediaId is returned in the result. Use that mediaId as referenceMediaId in subsequent generate_image or generate_video calls to maintain visual consistency. Optionally accepts a reference image from the media library to guide style/content. Requires an image AI provider configured in Settings.",
	parameters: {
		type: "object",
		properties: {
			prompt: {
				type: "string",
				description:
					"Detailed text description of the image to generate. Be specific about style, content, colors, composition, etc.",
			},
			aspectRatio: {
				type: "string",
				description:
					"Aspect ratio of the generated image (e.g. '16:9', '1:1', '9:16', '4:3'). Defaults to auto.",
			},
			referenceMediaId: {
				type: "string",
				description:
					"Optional. The media asset ID of an image to use as a reference/style guide. Can be a previously generated image's mediaId or any image asset in the project. Use list_media_assets to discover available IDs.",
			},
			characterId: {
				type: "string",
				description:
					"Optional. The ID of a character from the character library to use as a visual reference. The character's reference image will be used automatically. Use list_characters to discover available characters.",
			},
			characterName: {
				type: "string",
				description:
					"Optional. The name of a character from the character library. Alternative to characterId for convenience.",
			},
		},
		required: ["prompt"],
	},
	requiresConfirmation: true,
	async execute(args) {
		const prompt = args.prompt as string;
		const aspectRatio = args.aspectRatio as string | undefined;

		if (isDevPlaceholderActive()) {
			const file = await generatePlaceholderImage({ prompt, aspectRatio });
			const added = await addFileToProject({ file });
			return {
				success: true,
				message: `[DEV PLACEHOLDER] Generated placeholder image and added to media library`,
				data: {
					mediaType: "image",
					previewUrls: [added.previewUrl],
					assets: [{ mediaId: added.mediaId, name: added.name }],
					provider: "placeholder",
					characterId: undefined,
				},
			};
		}

		const configured = getConfiguredImageProvider();
		if (!configured) {
			return {
				success: false,
				message:
					"No image AI provider configured. Please set up an image provider and API key in Settings.",
			};
		}

		const { provider, apiKey } = configured;
		const referenceMediaId = args.referenceMediaId as string | undefined;
		const resolvedCharacterId = resolveCharacterId({
			characterId: args.characterId as string | undefined,
			characterName: args.characterName as string | undefined,
		});

		try {
			let referenceImageUrl: string | undefined;
			if (resolvedCharacterId) {
				referenceImageUrl = await resolveCharacterReferenceUrl({
					characterId: resolvedCharacterId,
				});
			} else {
				referenceImageUrl = await resolveReferenceImageUrl({
					mediaId: referenceMediaId,
				});
			}

			const enhancedPrompt = buildEnhancedPrompt({
				prompt,
				characterId: resolvedCharacterId,
			});

			const results = await provider.generateImage({
				request: {
					prompt: enhancedPrompt,
					aspectRatio,
					referenceImageUrl,
				},
				apiKey,
			});

			if (results.length === 0) {
				return { success: false, message: "No images were generated" };
			}

			const addedAssets: Array<{
				mediaId: string;
				name: string;
				previewUrl: string;
			}> = [];

			for (const result of results) {
				const id = generateUUID().slice(0, 8);
				const file = await urlToFile({
					url: result.url,
					filename: `ai-image-${id}.png`,
					mimeType: "image/png",
				});

				const added = await addFileToProject({ file });
				addedAssets.push(added);

				void addImageToHistory({
					imageUrl: result.url,
					prompt,
					providerName: provider.name,
				});

				if (resolvedCharacterId) {
					const generation: CharacterGeneration = {
						id: generateUUID(),
						type: "image",
						prompt,
						url: result.url,
						provider: provider.name,
						mediaId: added.mediaId,
						createdAt: new Date().toISOString(),
					};
					useCharacterStore.getState().addGeneration({
						characterId: resolvedCharacterId,
						generation,
					});
				}
			}

			return {
				success: true,
				message: `Generated ${addedAssets.length} image(s) and added to media library`,
				data: {
					mediaType: "image",
					previewUrls: addedAssets.map((a) => a.previewUrl),
					assets: addedAssets.map((a) => ({
						mediaId: a.mediaId,
						name: a.name,
					})),
					provider: provider.name,
					characterId: resolvedCharacterId,
				},
			};
		} catch (error) {
			return {
				success: false,
				message:
					error instanceof Error ? error.message : "Image generation failed",
			};
		}
	},
};

export const generateVideoTool: AgentTool = {
	name: "generate_video",
	description:
		"Generate a video using AI based on a text prompt. This is a long-running operation that submits a task and polls for completion. The generated video is automatically added to the media library with its mediaId returned. Strongly recommended: provide a referenceMediaId pointing to an image asset (e.g. from a previous generate_image call) to produce an image-to-video result with consistent visuals. Requires a video AI provider configured in Settings.",
	parameters: {
		type: "object",
		properties: {
			prompt: {
				type: "string",
				description:
					"Detailed text description of the video to generate. Describe the scene, action, style, camera movement, etc.",
			},
			duration: {
				type: "number",
				description: "Video duration in seconds (default: 5)",
			},
			aspectRatio: {
				type: "string",
				description:
					"Aspect ratio of the video (e.g. '16:9', '1:1', '9:16'). Default: '16:9'.",
			},
			resolution: {
				type: "string",
				description:
					"Video resolution (e.g. '720p', '1080p'). Default: '720p'.",
			},
			referenceMediaId: {
				type: "string",
				description:
					"The media asset ID of an image to use as the first frame / visual reference for video generation (image-to-video). Strongly recommended for visual consistency — use a mediaId from a previous generate_image result or any image in the media library.",
			},
			characterId: {
				type: "string",
				description:
					"Optional. The ID of a character from the character library to use as a visual reference. The character's reference image will be used automatically. Use list_characters to discover available characters.",
			},
			characterName: {
				type: "string",
				description:
					"Optional. The name of a character from the character library. Alternative to characterId for convenience.",
			},
		},
		required: ["prompt"],
	},
	requiresConfirmation: true,
	async execute(args) {
		const prompt = args.prompt as string;
		const duration = (args.duration as number) ?? 5;
		const aspectRatio = (args.aspectRatio as string) ?? "16:9";

		if (isDevPlaceholderActive()) {
			const file = await generatePlaceholderVideo({
				prompt,
				durationSeconds: duration,
				aspectRatio,
			});
			const added = await addFileToProject({ file });
			return {
				success: true,
				message: `[DEV PLACEHOLDER] Generated placeholder video and added to media library as '${added.name}'`,
				data: {
					mediaType: "video",
					mediaId: added.mediaId,
					previewUrls: [added.previewUrl],
					name: added.name,
					provider: "placeholder",
					characterId: undefined,
				},
			};
		}

		const configured = getConfiguredVideoProvider();
		if (!configured) {
			return {
				success: false,
				message:
					"No video AI provider configured. Please set up a video provider and API key in Settings.",
			};
		}

		const { provider, apiKey } = configured;
		const resolution = (args.resolution as string) ?? "720p";
		const referenceMediaId = args.referenceMediaId as string | undefined;
		const resolvedCharacterId = resolveCharacterId({
			characterId: args.characterId as string | undefined,
			characterName: args.characterName as string | undefined,
		});

		try {
			let referenceImageUrl: string | undefined;
			if (resolvedCharacterId) {
				referenceImageUrl = await resolveCharacterReferenceUrl({
					characterId: resolvedCharacterId,
				});
			} else {
				referenceImageUrl = await resolveReferenceImageUrl({
					mediaId: referenceMediaId,
				});
			}

			const enhancedPrompt = buildEnhancedPrompt({
				prompt,
				characterId: resolvedCharacterId,
			});

			const submitResult = await provider.submitVideoTask({
				request: {
					prompt: enhancedPrompt,
					duration,
					aspectRatio,
					resolution,
					referenceImageUrl,
				},
				apiKey,
			});

			if (submitResult.status === "failed") {
				return {
					success: false,
					message: submitResult.error ?? "Video task submission failed",
				};
			}

			const finalResult = await pollVideoTask({
				provider: provider as AIVideoProvider,
				taskId: submitResult.taskId,
				apiKey,
			});

			if (finalResult.status !== "succeeded" || !finalResult.videoUrl) {
				return {
					success: false,
					message: finalResult.error ?? "Video generation failed or timed out",
				};
			}

			const id = generateUUID().slice(0, 8);
			const file = await urlToFile({
				url: finalResult.videoUrl,
				filename: `ai-video-${id}.mp4`,
				mimeType: "video/mp4",
			});

			const added = await addFileToProject({ file });

			useAIGenerationHistoryStore.getState().addEntry({
				id: generateUUID(),
				type: "video",
				prompt,
				url: finalResult.videoUrl,
				provider: provider.name,
			});

			if (resolvedCharacterId) {
				const generation: CharacterGeneration = {
					id: generateUUID(),
					type: "video",
					prompt,
					url: finalResult.videoUrl,
					provider: provider.name,
					mediaId: added.mediaId,
					createdAt: new Date().toISOString(),
				};
				useCharacterStore.getState().addGeneration({
					characterId: resolvedCharacterId,
					generation,
				});
			}

			return {
				success: true,
				message: `Video generated and added to media library as '${added.name}'`,
				data: {
					mediaType: "video",
					mediaId: added.mediaId,
					previewUrls: [added.previewUrl],
					name: added.name,
					provider: provider.name,
					characterId: resolvedCharacterId,
				},
			};
		} catch (error) {
			return {
				success: false,
				message:
					error instanceof Error ? error.message : "Video generation failed",
			};
		}
	},
};

export const aiGenerationTools: AgentTool[] = [
	generateImageTool,
	generateVideoTool,
];
