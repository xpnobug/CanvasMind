
import { Streamdown } from "streamdown";
import type {
	AgentMessage as AgentMessageType,
	AgentToolResult,
} from "@cutia/lib/ai/agent/types";
import { cn } from "@cutia/utils/ui";
import { AgentToolCall } from "./agent-tool-call";

interface AgentMessageProps {
	message: AgentMessageType;
	isStreaming?: boolean;
	streamingContent?: string;
	executingToolId?: string | null;
	toolResults?: Map<string, AgentToolResult>;
}

export function AgentMessage({
	message,
	isStreaming,
	streamingContent,
	executingToolId,
	toolResults,
}: AgentMessageProps) {
	if (message.role === "system" || message.role === "tool") return null;

	const isUser = message.role === "user";
	const displayContent = isStreaming
		? (streamingContent ?? "")
		: message.content;

	return (
		<div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
			<div
				className={cn(
					"max-w-[85%] rounded-lg px-3 py-1.5 text-sm",
					isUser ? "bg-primary text-primary-foreground" : "bg-muted",
				)}
			>
				{isUser ? (
					<p className="whitespace-pre-wrap">{displayContent}</p>
				) : (
					<div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 prose-p:my-1.5">
						<Streamdown
							mode={isStreaming ? "streaming" : "static"}
							isAnimating={isStreaming}
						>
							{displayContent || ""}
						</Streamdown>
					</div>
				)}

				{message.toolCalls && message.toolCalls.length > 0 && (
					<div className="mt-2">
						{message.toolCalls.map((toolCall) => (
							<AgentToolCall
								key={toolCall.id}
								name={toolCall.name}
								arguments={toolCall.arguments}
								result={toolResults?.get(toolCall.id)}
								isExecuting={executingToolId === toolCall.name}
							/>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
