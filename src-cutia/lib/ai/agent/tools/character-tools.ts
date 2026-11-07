import {
	useCharacterStore,
	getCharacterImageBlob,
} from "@cutia/stores/character-store";
import {
	analyzeImageWithVision,
	blobToDataUrl,
	DESCRIPTION_ANALYSIS_PROMPT,
	STYLE_ANALYSIS_PROMPT,
} from "@cutia/lib/ai/vision";
import type { AgentTool } from "./types";

export const listCharactersTool: AgentTool = {
	name: "list_characters",
	description:
		"List all AI characters in the character library. Returns each character's id, name, description, style description, and number of reference images. Use characterId in generate_image or generate_video to use a character's reference image for consistent visuals.",
	parameters: {
		type: "object",
		properties: {},
		required: [],
	},
	async execute() {
		const characters = useCharacterStore.getState().characters;

		if (characters.length === 0) {
			return {
				success: true,
				message: "No characters in the library yet.",
				data: { characters: [] },
			};
		}

		const characterList = characters.map((character) => ({
			id: character.id,
			name: character.name,
			description: character.description,
			styleDescription: character.styleDescription ?? null,
			imageCount: character.images.length,
			generationCount: character.generations.length,
		}));

		return {
			success: true,
			message: `Found ${characters.length} character(s) in the library.`,
			data: { characters: characterList },
		};
	},
};

export const getCharacterDetailsTool: AgentTool = {
	name: "get_character_details",
	description:
		"Get full details of a specific character including description, style description, all reference image labels/prompts, and generation history. Use this to understand a character's visual identity before generating content.",
	parameters: {
		type: "object",
		properties: {
			characterId: {
				type: "string",
				description: "The ID of the character to retrieve details for.",
			},
			characterName: {
				type: "string",
				description:
					"Alternative: the name of the character. Used if characterId is not provided.",
			},
		},
		required: [],
	},
	async execute(args) {
		const characterId = args.characterId as string | undefined;
		const characterName = args.characterName as string | undefined;

		const store = useCharacterStore.getState();
		let character = characterId
			? store.getCharacterById({ id: characterId })
			: undefined;

		if (!character && characterName) {
			character = store.getCharacterByName({ name: characterName });
		}

		if (!character) {
			return {
				success: false,
				message:
					"Character not found. Use list_characters to see available characters.",
			};
		}

		return {
			success: true,
			message: `Character "${character.name}" details retrieved.`,
			data: {
				id: character.id,
				name: character.name,
				description: character.description,
				styleDescription: character.styleDescription ?? null,
				referenceImages: character.images.map((img) => ({
					id: img.id,
					label: img.label,
					prompt: img.prompt,
				})),
				generations: character.generations.map((gen) => ({
					id: gen.id,
					type: gen.type,
					prompt: gen.prompt,
					provider: gen.provider,
				})),
				createdAt: character.createdAt,
				updatedAt: character.updatedAt,
			},
		};
	},
};

export const updateCharacterStyleTool: AgentTool = {
	name: "update_character_style",
	description:
		"Set or update a character's style description — defines the art style, color palette, lighting, and rendering approach to use when generating content for this character. This 'style lock' ensures all generated assets maintain a consistent visual style. The style description is automatically appended to generation prompts.",
	parameters: {
		type: "object",
		properties: {
			characterId: {
				type: "string",
				description: "The ID of the character to update.",
			},
			styleDescription: {
				type: "string",
				description:
					"Art style and rendering description. Include: art style (photorealistic, anime, watercolor, etc.), color palette (warm, cool, muted, vibrant), lighting (soft, dramatic, natural), and any other visual treatment. Example: 'Studio Ghibli anime style, soft watercolor textures, warm pastel color palette, gentle natural lighting with golden hour tones.'",
			},
		},
		required: ["characterId", "styleDescription"],
	},
	async execute(args) {
		const characterId = args.characterId as string;
		const styleDescription = args.styleDescription as string;

		const store = useCharacterStore.getState();
		const character = store.getCharacterById({ id: characterId });

		if (!character) {
			return {
				success: false,
				message: `Character "${characterId}" not found.`,
			};
		}

		store.updateCharacter({
			id: characterId,
			updates: { styleDescription },
		});

		return {
			success: true,
			message: `Style locked for "${character.name}". All future AI generations for this character will use this style.`,
		};
	},
};

export const analyzeCharacterAppearanceTool: AgentTool = {
	name: "analyze_character_appearance",
	description:
		"Analyze a character's reference image using vision AI to automatically generate a description and/or style description. This reverse-engineers the character's appearance and art style from the uploaded reference image. The results are saved to the character's profile and will be auto-injected into future generation prompts.",
	parameters: {
		type: "object",
		properties: {
			characterId: {
				type: "string",
				description:
					"The ID of the character whose reference image to analyze.",
			},
			characterName: {
				type: "string",
				description:
					"Alternative: the name of the character. Used if characterId is not provided.",
			},
			analyze: {
				type: "string",
				enum: ["both", "description", "style"],
				description:
					"What to analyze: 'description' for appearance only, 'style' for art style only, 'both' for both. Default: 'both'.",
			},
		},
		required: [],
	},
	async execute(args) {
		const characterId = args.characterId as string | undefined;
		const characterName = args.characterName as string | undefined;
		const analyze = (args.analyze as string) ?? "both";

		const store = useCharacterStore.getState();
		let character = characterId
			? store.getCharacterById({ id: characterId })
			: undefined;

		if (!character && characterName) {
			character = store.getCharacterByName({ name: characterName });
		}

		if (!character) {
			return {
				success: false,
				message:
					"Character not found. Use list_characters to see available characters.",
			};
		}

		if (character.images.length === 0) {
			return {
				success: false,
				message: `Character "${character.name}" has no reference images. Upload a reference image first.`,
			};
		}

		const firstImage = character.images[0];
		const blob = await getCharacterImageBlob({ id: firstImage.blobKey });
		if (!blob) {
			return {
				success: false,
				message: "Failed to load the reference image from storage.",
			};
		}

		const imageDataUrl = await blobToDataUrl({ blob });

		try {
			const updates: {
				description?: string;
				styleDescription?: string;
			} = {};

			if (analyze === "description" || analyze === "both") {
				updates.description = await analyzeImageWithVision({
					imageDataUrl,
					analysisPrompt: DESCRIPTION_ANALYSIS_PROMPT,
				});
			}

			if (analyze === "style" || analyze === "both") {
				updates.styleDescription = await analyzeImageWithVision({
					imageDataUrl,
					analysisPrompt: STYLE_ANALYSIS_PROMPT,
				});
			}

			store.updateCharacter({ id: character.id, updates });

			return {
				success: true,
				message: `Analyzed reference image for "${character.name}" and updated profile.`,
				data: { characterId: character.id, ...updates },
			};
		} catch (error) {
			return {
				success: false,
				message:
					error instanceof Error
						? error.message
						: "Failed to analyze character image",
			};
		}
	},
};

export const characterTools: AgentTool[] = [
	listCharactersTool,
	getCharacterDetailsTool,
	updateCharacterStyleTool,
	analyzeCharacterAppearanceTool,
];
