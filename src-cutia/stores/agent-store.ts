import { create } from "zustand";
import { persist } from "zustand/middleware";
import { generateUUID } from "@cutia/utils/id";
import {
	type ExpertRoleId,
	DEFAULT_EXPERT_ROLE,
} from "@cutia/lib/ai/agent/expert-roles";
import { runAgentLoop } from "@cutia/lib/ai/agent/service";
import type {
	AgentLLMConfig,
	AgentMessage,
	AgentStatus,
	PendingToolConfirmation,
} from "@cutia/lib/ai/agent/types";

interface AgentPersistedState {
	config: AgentLLMConfig;
	autoMode: boolean;
	isOpen: boolean;
	expertRole: ExpertRoleId;
}

interface AgentState extends AgentPersistedState {
	isOpen: boolean;
	messages: AgentMessage[];
	status: AgentStatus;
	currentToolCall: string | null;
	pendingConfirmation: PendingToolConfirmation | null;
	streamingContent: string;

	initMessages: (messages: AgentMessage[]) => void;
	getMessages: () => AgentMessage[];
	togglePanel: () => void;
	sendMessage: (content: string) => Promise<void>;
	confirmToolCall: () => void;
	skipToolCall: () => void;
	cancel: () => void;
	clearMessages: () => void;
	setAutoMode: (enabled: boolean) => void;
	setConfig: (config: Partial<AgentLLMConfig>) => void;
	setExpertRole: (roleId: ExpertRoleId) => void;
}

let abortController: AbortController | null = null;
let confirmationResolver: ((confirmed: boolean) => void) | null = null;

export const useAgentStore = create<AgentState>()(
	persist(
		(set, get) => ({
			config: {
				baseUrl: "",
				apiKey: "",
				model: "",
			},
			autoMode: false,
			isOpen: true,
			expertRole: DEFAULT_EXPERT_ROLE,
			messages: [],
			status: "idle" as AgentStatus,
			currentToolCall: null,
			pendingConfirmation: null,
			streamingContent: "",

			initMessages: (messages: AgentMessage[]) => {
				set({
					messages,
					status: "idle",
					currentToolCall: null,
					pendingConfirmation: null,
					streamingContent: "",
				});
			},

			getMessages: () => get().messages,

			togglePanel: () => {
				set((prev) => ({ isOpen: !prev.isOpen }));
			},

			sendMessage: async (content: string) => {
				const state = get();
				if (state.status !== "idle") return;
				if (!state.config.apiKey) return;

				const userMessage: AgentMessage = {
					id: generateUUID(),
					role: "user",
					content,
					timestamp: Date.now(),
				};

				const currentMessages = [...state.messages, userMessage];
				set({
					messages: currentMessages,
					status: "thinking",
					streamingContent: "",
				});

				abortController = new AbortController();

				try {
					const updatedMessages = await runAgentLoop({
						config: state.config,
						messages: currentMessages,
						autoMode: state.autoMode,
						roleId: state.expertRole,
						signal: abortController.signal,
						callbacks: {
							onMessageStart: () => {
								set({ status: "thinking", streamingContent: "" });
							},
							onContentDelta: (delta) => {
								set((prev) => ({
									streamingContent: prev.streamingContent + delta,
								}));
							},
							onContentDone: () => {
								set({ streamingContent: "" });
							},
							onMessagesUpdated: (messages) => {
								set({ messages: [...messages] });
							},
							onToolCallStart: (toolCall) => {
								set({
									status: "executing",
									currentToolCall: toolCall.name,
								});
							},
							onToolCallResult: (_toolCall) => {
								set({ currentToolCall: null });
							},
							onConfirmationRequired: (
								confirmation: PendingToolConfirmation,
							) => {
								return new Promise<boolean>((resolve) => {
									confirmationResolver = resolve;
									set({
										status: "awaiting-confirmation",
										pendingConfirmation: confirmation,
									});
								});
							},
							onDone: () => {},
							onError: (error) => {
								if (error.name !== "AbortError") {
									console.error("Agent error:", error);
								}
							},
						},
					});

					set({
						messages: updatedMessages,
						status: "idle",
						currentToolCall: null,
						pendingConfirmation: null,
						streamingContent: "",
					});
				} catch (error) {
					if (error instanceof Error && error.name === "AbortError") {
						set({ status: "idle", streamingContent: "" });
						return;
					}

					const errorMessage: AgentMessage = {
						id: generateUUID(),
						role: "assistant",
						content: `Error: ${error instanceof Error ? error.message : "Something went wrong"}`,
						timestamp: Date.now(),
					};

					set((prev) => ({
						messages: [...prev.messages, errorMessage],
						status: "error",
						streamingContent: "",
					}));
				} finally {
					abortController = null;
				}
			},

			confirmToolCall: () => {
				if (confirmationResolver) {
					confirmationResolver(true);
					confirmationResolver = null;
				}
				set({
					status: "executing",
					pendingConfirmation: null,
				});
			},

			skipToolCall: () => {
				if (confirmationResolver) {
					confirmationResolver(false);
					confirmationResolver = null;
				}
				set({
					status: "executing",
					pendingConfirmation: null,
				});
			},

			cancel: () => {
				if (abortController) {
					abortController.abort();
					abortController = null;
				}
				if (confirmationResolver) {
					confirmationResolver(false);
					confirmationResolver = null;
				}
				set({
					status: "idle",
					currentToolCall: null,
					pendingConfirmation: null,
					streamingContent: "",
				});
			},

			clearMessages: () => {
				set({ messages: [], status: "idle", streamingContent: "" });
			},

			setAutoMode: (enabled) => {
				set({ autoMode: enabled });
			},

			setConfig: (config) => {
				set((prev) => ({
					config: { ...prev.config, ...config },
				}));
			},

			setExpertRole: (roleId) => {
				set({ expertRole: roleId });
			},
		}),
		{
			name: "agent-settings",
			partialize: (state): AgentPersistedState => ({
				config: state.config,
				autoMode: state.autoMode,
				isOpen: state.isOpen,
				expertRole: state.expertRole,
			}),
			merge: (persisted, current) => ({
				...(current as AgentState),
				...(persisted as Partial<AgentPersistedState>),
			}),
		},
	),
);
