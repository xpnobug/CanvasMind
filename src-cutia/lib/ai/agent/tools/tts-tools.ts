import { EditorCore } from "@cutia/core";
import { VOICE_PACKS } from "@cutia/constants/tts-constants";
import { generateAndInsertSpeech } from "@cutia/lib/tts/service";
import type { TextElement, TimelineTrack } from "@cutia/types/timeline";
import type { AgentTool } from "./types";

const voiceIds = VOICE_PACKS.map((v) => v.id);

function findTextElement({
	editor,
	elementId,
}: {
	editor: EditorCore;
	elementId: string;
}): { track: TimelineTrack; element: TextElement } | null {
	for (const track of editor.timeline.getTracks()) {
		if (track.type !== "text") continue;
		const element = track.elements.find((el) => el.id === elementId);
		if (element) {
			return { track, element: element as TextElement };
		}
	}
	return null;
}

export const generateSpeechTool: AgentTool = {
	name: "generate_speech",
	description:
		"Generate speech audio from text using text-to-speech (TTS). The generated audio is automatically added to the project media library and inserted onto an audio track. When textElementId is provided, the text content and startTime are taken from that text element automatically, and alignTextDuration can be used to resize the text element to match the audio length — useful for subtitle alignment.",
	parameters: {
		type: "object",
		properties: {
			text: {
				type: "string",
				description:
					"The text content to convert to speech. Maximum 2000 characters. If textElementId is provided, this is optional and the element's content will be used instead.",
			},
			voice: {
				type: "string",
				description: `Voice to use for speech generation. Available voices: ${voiceIds.join(", ")}. Defaults to "default".`,
			},
			startTime: {
				type: "number",
				description:
					"Start time in seconds where the audio clip should be placed on the timeline. If textElementId is provided, defaults to the text element's start time. Otherwise defaults to the current playhead position.",
			},
			textElementId: {
				type: "string",
				description:
					"Optional. The ID of a text element on the timeline to associate with. When provided, the element's text content and start time are used automatically. Use list_elements or get_timeline_state to discover text element IDs.",
			},
			alignTextDuration: {
				type: "boolean",
				description:
					"When true and textElementId is provided, the text element's duration will be updated to match the generated audio duration. Useful for aligning subtitles with speech. Defaults to false.",
			},
		},
		required: [],
	},
	requiresConfirmation: true,
	async execute(args) {
		const editor = EditorCore.getInstance();
		const project = editor.project.getActiveOrNull();
		if (!project) {
			return {
				success: false,
				message: "No active project. Please create or open a project first.",
			};
		}

		const textElementId = args.textElementId as string | undefined;
		const alignTextDuration = (args.alignTextDuration as boolean) ?? false;

		let textContent = args.text as string | undefined;
		let startTime = args.startTime as number | undefined;
		let linkedTrackId: string | undefined;
		let linkedElementId: string | undefined;

		if (textElementId) {
			const found = findTextElement({ editor, elementId: textElementId });
			if (!found) {
				return {
					success: false,
					message: `Text element "${textElementId}" not found. Use list_elements or get_timeline_state to find valid text element IDs.`,
				};
			}
			linkedTrackId = found.track.id;
			linkedElementId = found.element.id;
			textContent ??= found.element.content;
			startTime ??= found.element.startTime;
		}

		textContent ??= "";
		startTime ??= editor.playback.getCurrentTime();

		if (!textContent.trim()) {
			return { success: false, message: "Text cannot be empty." };
		}
		if (textContent.length > 2000) {
			return {
				success: false,
				message: "Text exceeds the 2000 character limit.",
			};
		}

		const voice = (args.voice as string | undefined) ?? "default";

		try {
			const { duration } = await generateAndInsertSpeech({
				editor,
				text: textContent,
				startTime,
				voice,
			});

			if (alignTextDuration && linkedTrackId && linkedElementId) {
				editor.timeline.updateElementDuration({
					trackId: linkedTrackId,
					elementId: linkedElementId,
					duration,
				});
			}

			return {
				success: true,
				message: `Speech generated (${duration.toFixed(1)}s) and added to timeline at ${startTime.toFixed(1)}s.${alignTextDuration && linkedElementId ? ` Text element duration aligned to ${duration.toFixed(1)}s.` : ""}`,
				data: {
					duration,
					startTime,
					voice,
					textLength: textContent.length,
					linkedTextElementId: linkedElementId,
					textDurationAligned: alignTextDuration && !!linkedElementId,
				},
			};
		} catch (error) {
			return {
				success: false,
				message:
					error instanceof Error
						? error.message
						: "Speech generation failed",
			};
		}
	},
};

export const ttsTools: AgentTool[] = [generateSpeechTool];
