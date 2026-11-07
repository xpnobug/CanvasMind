import type { EditorCore } from "@cutia/core";
import { buildUploadAudioElement, wouldElementOverlap } from "@cutia/lib/timeline";

export interface TtsResult {
	duration: number;
	buffer: AudioBuffer;
	blob: Blob;
}

function base64ToArrayBuffer({ base64 }: { base64: string }): ArrayBuffer {
	const binaryString = atob(base64);
	const bytes = new Uint8Array(binaryString.length);
	for (let i = 0; i < binaryString.length; i++) {
		bytes[i] = binaryString.charCodeAt(i);
	}
	return bytes.buffer;
}

export async function generateSpeechFromText({
	text,
	voice,
}: {
	text: string;
	voice?: string;
}): Promise<TtsResult> {
	const response = await fetch("/api/tts/generate", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ text, voice }),
	});

	if (!response.ok) {
		const error = await response.json().catch(() => null);
		throw new Error(error?.error ?? `TTS request failed: ${response.status}`);
	}

	const { audio } = (await response.json()) as { audio: string };
	const arrayBuffer = base64ToArrayBuffer({ base64: audio });
	const blob = new Blob([arrayBuffer], { type: "audio/mpeg" });

	const audioContext = new AudioContext();
	const buffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));

	return {
		duration: buffer.duration,
		buffer,
		blob,
	};
}

function findAvailableAudioTrack({
	editor,
	startTime,
	endTime,
}: {
	editor: EditorCore;
	startTime: number;
	endTime: number;
}): string {
	const audioTracks = editor.timeline
		.getTracks()
		.filter((t) => t.type === "audio");

	const available = audioTracks.find(
		(track) =>
			!wouldElementOverlap({
				elements: track.elements,
				startTime,
				endTime,
			}),
	);

	if (available) {
		return available.id;
	}

	return editor.timeline.addTrack({ type: "audio" });
}

export async function generateAndInsertSpeech({
	editor,
	text,
	startTime,
	voice,
}: {
	editor: EditorCore;
	text: string;
	startTime: number;
	voice?: string;
}): Promise<{ duration: number }> {
	const result = await generateSpeechFromText({ text, voice });

	const name = `TTS: ${text.slice(0, 30)}`;
	const file = new File([result.blob], `${name}.mp3`, {
		type: "audio/mpeg",
	});
	const url = URL.createObjectURL(result.blob);
	const projectId = editor.project.getActive().metadata.id;

	const mediaId = await editor.media.addMediaAsset({
		projectId,
		asset: {
			name,
			type: "audio",
			file,
			url,
			duration: result.duration,
			ephemeral: true,
		},
	});

	const audioElement = buildUploadAudioElement({
		mediaId,
		name,
		duration: result.duration,
		startTime,
		buffer: result.buffer,
	});

	const trackId = findAvailableAudioTrack({
		editor,
		startTime,
		endTime: startTime + result.duration,
	});

	editor.timeline.insertElement({
		placement: { mode: "explicit", trackId },
		element: audioElement,
	});

	return { duration: result.duration };
}
