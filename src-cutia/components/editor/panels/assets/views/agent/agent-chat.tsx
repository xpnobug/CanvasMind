
import { useTranslation } from "@i18next-toolkit/nextjs-approuter";
import { Fragment, useCallback, useEffect, useRef } from "react";
import { Button } from "@cutia/components/ui/button";
import { ScrollArea } from "@cutia/components/ui/scroll-area";
import { useAgentStore } from "@cutia/stores/agent-store";
import type { AgentMessage as AgentMessageType } from "@cutia/lib/ai/agent/types";
import {
	type ExpertRoleId,
	getExpertRole,
} from "@cutia/lib/ai/agent/expert-roles";
import { AgentMessage } from "./agent-message";
import {
	CheckmarkCircle02Icon,
	Cancel01Icon,
	Loading03Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

const SCROLL_BOTTOM_THRESHOLD = 40;

function getSuccessfulRoleSwitch({
	message,
	toolResultMap,
}: {
	message: AgentMessageType;
	toolResultMap: Map<string, { success: boolean; message: string }>;
}): ExpertRoleId | null {
	if (!message.toolCalls) return null;
	const switchCall = message.toolCalls.find(
		(tc) => tc.name === "switch_expert_role",
	);
	if (!switchCall) return null;
	const result = toolResultMap.get(switchCall.id);
	if (!result?.success) return null;
	return (switchCall.arguments as { role?: string }).role as ExpertRoleId;
}

function RoleSwitchIndicator({ roleId }: { roleId: ExpertRoleId }) {
	const { t } = useTranslation();
	const role = getExpertRole({ roleId });

	return (
		<div className="flex items-center gap-2 py-1">
			<div className="bg-border h-px flex-1" />
			<span className="text-muted-foreground bg-muted rounded-full px-2.5 py-0.5 text-xs whitespace-nowrap">
				{t("Switched to {{role}}", { role: role.getLabel() })}
			</span>
			<div className="bg-border h-px flex-1" />
		</div>
	);
}

export function AgentChat() {
	const { t } = useTranslation();
	const messages = useAgentStore((s) => s.messages);
	const status = useAgentStore((s) => s.status);
	const streamingContent = useAgentStore((s) => s.streamingContent);
	const currentToolCall = useAgentStore((s) => s.currentToolCall);
	const pendingConfirmation = useAgentStore((s) => s.pendingConfirmation);
	const confirmToolCall = useAgentStore((s) => s.confirmToolCall);
	const skipToolCall = useAgentStore((s) => s.skipToolCall);

	const scrollRef = useRef<HTMLDivElement>(null);
	const bottomRef = useRef<HTMLDivElement>(null);
	const isUserScrolledUp = useRef(false);
	const prevMessageCount = useRef(0);

	const scrollToBottom = useCallback(() => {
		bottomRef.current?.scrollIntoView({ block: "end" });
	}, []);

	const handleScroll = useCallback(() => {
		const el = scrollRef.current;
		if (!el) return;
		const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
		isUserScrolledUp.current = distanceFromBottom > SCROLL_BOTTOM_THRESHOLD;
	}, []);

	if (messages.length !== prevMessageCount.current) {
		prevMessageCount.current = messages.length;
		isUserScrolledUp.current = false;
		queueMicrotask(scrollToBottom);
	}

	useEffect(() => {
		if (!isUserScrolledUp.current && streamingContent) {
			scrollToBottom();
		}
	}, [streamingContent, scrollToBottom]);

	useEffect(() => {
		if (!isUserScrolledUp.current && status !== "idle") {
			queueMicrotask(scrollToBottom);
		}
	}, [status, scrollToBottom]);

	useEffect(() => {
		if (!isUserScrolledUp.current && pendingConfirmation) {
			queueMicrotask(scrollToBottom);
		}
	}, [pendingConfirmation, scrollToBottom]);

	useEffect(() => {
		if (status === "idle") {
			return;
		}

		const handler = (event: BeforeUnloadEvent) => {
			event.preventDefault();
		};

		window.addEventListener("beforeunload", handler);
		return () => window.removeEventListener("beforeunload", handler);
	}, [status]);

	const toolResultMap = new Map<
		string,
		{ success: boolean; message: string }
	>();
	for (const m of messages) {
		if (m.role === "tool" && m.toolCallId) {
			try {
				toolResultMap.set(m.toolCallId, JSON.parse(m.content));
			} catch {
				toolResultMap.set(m.toolCallId, {
					success: false,
					message: m.content,
				});
			}
		}
	}

	const visibleMessages = messages.filter(
		(m: AgentMessageType) => m.role !== "system" && m.role !== "tool",
	);

	return (
		<ScrollArea className="flex-1" ref={scrollRef} onScroll={handleScroll}>
			<div className="space-y-3 p-4">
				{visibleMessages.length === 0 && status === "idle" && (
					<div className="text-muted-foreground py-8 text-center text-sm">
						{t(
							"Describe what kind of video you want to create, and the AI agent will help you build it step by step.",
						)}
					</div>
				)}

				{visibleMessages.map((message: AgentMessageType) => {
					const switchedRole = getSuccessfulRoleSwitch({
						message,
						toolResultMap,
					});
					return (
						<Fragment key={message.id}>
							<AgentMessage
								message={message}
								executingToolId={currentToolCall}
								toolResults={toolResultMap}
							/>
							{switchedRole && (
								<RoleSwitchIndicator roleId={switchedRole} />
							)}
						</Fragment>
					);
				})}

				{status === "thinking" && streamingContent && (
					<AgentMessage
						message={{
							id: "streaming",
							role: "assistant",
							content: "",
							timestamp: Date.now(),
						}}
						isStreaming
						streamingContent={streamingContent}
					/>
				)}

				{status === "thinking" && !streamingContent && (
					<div className="flex items-center gap-2 text-sm text-muted-foreground">
						<HugeiconsIcon
							icon={Loading03Icon}
							className="h-4 w-4 animate-spin"
						/>
						{t("Thinking...")}
					</div>
				)}

				{status === "executing" && currentToolCall && (
					<div className="flex items-center gap-2 text-sm text-muted-foreground">
						<HugeiconsIcon
							icon={Loading03Icon}
							className="h-4 w-4 animate-spin"
						/>
						{t("Executing: {{tool}}", { tool: currentToolCall })}
					</div>
				)}

				{status === "awaiting-confirmation" && pendingConfirmation && (
					<div className="bg-muted rounded-lg border p-3">
						<p className="mb-2 text-sm font-medium">
							{pendingConfirmation.toolCalls.length > 1
								? t("Confirm {{count}} operations", {
										count: pendingConfirmation.toolCalls.length,
									})
								: t("Confirm operation")}
						</p>
						<div className="mb-3 space-y-2">
							{pendingConfirmation.toolCalls.map((tc) => (
								<div key={tc.toolCallId}>
									<p className="text-muted-foreground mb-1 text-xs">
										{tc.description}
									</p>
									<pre className="bg-background overflow-x-auto rounded p-2 text-xs">
										{JSON.stringify(tc.arguments, null, 2)}
									</pre>
								</div>
							))}
						</div>
						<div className="flex gap-2">
							<Button type="button" size="sm" onClick={confirmToolCall}>
								<HugeiconsIcon
									icon={CheckmarkCircle02Icon}
									className="mr-1 h-3.5 w-3.5"
								/>
								{pendingConfirmation.toolCalls.length > 1
									? t("Confirm all")
									: t("Confirm")}
							</Button>
							<Button
								type="button"
								size="sm"
								variant="outline"
								onClick={skipToolCall}
							>
								<HugeiconsIcon
									icon={Cancel01Icon}
									className="mr-1 h-3.5 w-3.5"
								/>
								{t("Skip")}
							</Button>
						</div>
					</div>
				)}
				<div ref={bottomRef} />
			</div>
		</ScrollArea>
	);
}
