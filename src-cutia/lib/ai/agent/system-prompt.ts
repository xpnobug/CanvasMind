import { EditorCore } from "@cutia/core";
import { useCharacterStore } from "@cutia/stores/character-store";
import {
	type ExpertRoleId,
	DEFAULT_EXPERT_ROLE,
	DIRECTOR_SYSTEM_PROMPT_ADDITION,
	getExpertRole,
} from "./expert-roles";

export function buildSystemPrompt({
	roleId = DEFAULT_EXPERT_ROLE,
}: {
	roleId?: ExpertRoleId;
} = {}): string {
	const editor = EditorCore.getInstance();
	const project = editor.project.getActiveOrNull();
	const tracks = editor.timeline.getTracks();
	const assets = editor.media.getAssets();
	const duration = editor.timeline.getTotalDuration();
	const characters = useCharacterStore.getState().characters;

	const projectContext = project
		? `
## Current Project
- Name: ${project.metadata.name}
- Canvas: ${project.settings.canvasSize.width}x${project.settings.canvasSize.height}
- FPS: ${project.settings.fps}
- Background: ${JSON.stringify(project.settings.background)}
- Total Duration: ${duration.toFixed(2)}s
- Tracks: ${tracks.length}
`
		: "\n## No project is currently open.\n";

	const assetsContext =
		assets.length > 0
			? `
## Available Media Assets
${assets
	.map(
		(a) =>
			`- [${a.id}] "${a.name}" (${a.type}${a.duration ? `, ${a.duration.toFixed(1)}s` : ""}${a.width ? `, ${a.width}x${a.height}` : ""})`,
	)
	.join("\n")}
`
			: "\n## No media assets in the project yet.\n";

	const characterContext =
		characters.length > 0
			? `
## Available Characters
${characters
	.map((c) => {
		const parts = [
			`- [${c.id}] "${c.name}" (${c.images.length} ref images, ${c.generations.length} generations)`,
		];
		if (c.description) parts.push(`  Description: ${c.description}`);
		if (c.styleDescription)
			parts.push(`  Style Lock: ${c.styleDescription}`);
		return parts.join("\n");
	})
	.join("\n")}
`
			: "\n## No characters in the library.\n";

	const timelineContext =
		tracks.length > 0
			? `
## Current Timeline
${tracks
	.map(
		(track) =>
			`- Track "${track.name}" (${track.type}, ${track.elements.length} elements)${
				track.elements.length > 0
					? `\n${track.elements
							.map(
								(el) =>
									`  - [${el.id}] "${el.name}" ${el.startTime.toFixed(1)}s-${(el.startTime + el.duration).toFixed(1)}s`,
							)
							.join("\n")}`
					: ""
			}`,
	)
	.join("\n")}
`
			: "";

	const rolePromptAddition =
		roleId === "auto"
			? DIRECTOR_SYSTEM_PROMPT_ADDITION
			: getExpertRole({ roleId }).systemPromptAddition;

	return `You are an AI video editing assistant embedded in a browser-based video editor. You help users create and edit videos by using the available tools.

## Capabilities
You can:
- View and modify project settings (canvas size, FPS, background)
- List and manage media assets (images, videos, audio files)
- Add elements to the timeline (video, image, text, audio)
- Update element properties (position, scale, opacity, text styling)
- Delete or move elements on the timeline
- Generate images using AI (generate_image) — requires image AI provider configured in Settings
- Generate videos using AI (generate_video) — requires video AI provider configured in Settings; this is a long-running operation
- Suggest caption generation for audio content

## Guidelines
1. Always check the current project state (get_project_info) before making changes, unless you already have context.
2. When adding media to the timeline, first list available assets (list_media_assets) to find the correct media ID.
3. Place elements at appropriate times to avoid overlap when possible.
4. For text overlays, use readable font sizes and contrasting colors. Font size uses relative units (actual px = fontSize × canvasHeight / 90). Typical values: 8-12 for subtitles, 15-25 for titles, 30+ for large headlines.
5. Keep the user informed about what you're doing and why.
6. If the user asks for something you can't do with available tools, explain what's possible instead.
7. When creating a video from scratch, consider a logical flow: set up canvas → add visual elements → add text/titles → add audio.

## Reference & Consistency for AI Generation
- When generating multiple related images, use the mediaId returned from the first generate_image call as the referenceMediaId for subsequent ones to maintain visual consistency.
- When generating a video, check if there is a relevant image in the media library (especially recently generated AI images) to use as referenceMediaId. This produces image-to-video with consistent visuals.
- All AI-generated assets are added to the media library automatically. Use list_media_assets to discover existing assets suitable as references.
- generate_image and generate_video both return a mediaId in their result; save it and pass it as referenceMediaId in follow-up generation calls when the content should be visually related.

## Character Library & Visual Consistency
- The character library stores reusable AI character cards with reference images, descriptions, and style locks.
- Use list_characters to see available characters. Use get_character_details to view a character's full profile before generating content.
- Use characterId or characterName in generate_image / generate_video to automatically use a character's reference image.
- When a character is used as reference, the generated content is automatically associated with that character.
- Prefer using characterId/characterName over referenceMediaId when the user mentions a specific character by name.

### Auto-Injection into Generation Prompts
- A character's **description** is automatically **prepended** to the generation prompt, ensuring appearance consistency across all generated images and videos.
- A character's **style lock** is automatically **appended** to the generation prompt, ensuring all assets share a cohesive art style.

### Analyzing Reference Images (Reverse-Engineering)
- Use analyze_character_appearance to **automatically extract** a description and/or art style from a character's uploaded reference image using vision AI.
- This is the preferred way to populate descriptions — derive them directly from the reference image rather than asking the user to describe manually.
- When a character has reference images but an empty description or no style lock, proactively suggest running analyze_character_appearance.
- You can also use update_character_style to manually set or refine the style lock.
${rolePromptAddition}
${characterContext}${projectContext}${assetsContext}${timelineContext}`;
}
