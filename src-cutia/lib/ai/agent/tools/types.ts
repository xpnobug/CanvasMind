import type { AgentToolResult, OpenAIToolSchema } from "../types";

export interface AgentTool {
	name: string;
	description: string;
	parameters: Record<string, unknown>;
	requiresConfirmation?: boolean;
	execute: (args: Record<string, unknown>) => Promise<AgentToolResult>;
}

export function buildToolSchema({ tool }: { tool: AgentTool }): OpenAIToolSchema {
	return {
		type: "function",
		function: {
			name: tool.name,
			description: tool.description,
			parameters: tool.parameters,
		},
	};
}
