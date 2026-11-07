import type { OpenAIToolSchema } from "../types";
import { aiGenerationTools } from "./ai-generation-tools";
import { captionTools } from "./caption-tools";
import { characterTools } from "./character-tools";
import { mediaTools } from "./media-tools";
import { projectTools } from "./project-tools";
import { timelineTools } from "./timeline-tools";
import { ttsTools } from "./tts-tools";
import { type AgentTool, buildToolSchema } from "./types";

const ALL_TOOLS: AgentTool[] = [
	...projectTools,
	...mediaTools,
	...timelineTools,
	...captionTools,
	...aiGenerationTools,
	...characterTools,
	...ttsTools,
];

const toolMap = new Map<string, AgentTool>(
	ALL_TOOLS.map((tool) => [tool.name, tool]),
);

export function getToolByName({
	name,
}: {
	name: string;
}): AgentTool | undefined {
	return toolMap.get(name);
}

export function getAllTools(): AgentTool[] {
	return ALL_TOOLS;
}

export function getAllToolSchemas(): OpenAIToolSchema[] {
	return ALL_TOOLS.map((tool) => buildToolSchema({ tool }));
}
