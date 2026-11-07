import type { AgentTool } from "./types";

export const generateCaptionsTool: AgentTool = {
	name: "generate_captions",
	description:
		"Auto-generate captions/subtitles from the audio in the timeline using speech-to-text. This is a long-running operation that uses the browser's transcription service.",
	parameters: {
		type: "object",
		properties: {
			language: {
				type: "string",
				description:
					"Language code for transcription (e.g. 'en', 'zh', 'ja', 'ko', 'es', 'fr', 'de', 'pt', 'ru', 'it'). Use 'auto' for automatic detection.",
			},
		},
		required: [],
	},
	requiresConfirmation: true,
	async execute() {
		return {
			success: true,
			message:
				"Caption generation needs to be triggered from the UI. Please use the Captions panel in the editor to generate captions.",
		};
	},
};

export const captionTools: AgentTool[] = [generateCaptionsTool];
