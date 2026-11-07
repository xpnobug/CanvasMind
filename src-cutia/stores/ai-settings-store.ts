import { IS_DEV } from "@cutia/constants/editor-constants";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AISettingsState {
	imageProviderId: string | null;
	imageApiKey: string;
	videoProviderId: string | null;
	videoApiKey: string;
	devPlaceholderEnabled: boolean;

	setImageProvider: (providerId: string | null) => void;
	setImageApiKey: (apiKey: string) => void;
	setVideoProvider: (providerId: string | null) => void;
	setVideoApiKey: (apiKey: string) => void;
	setDevPlaceholderEnabled: (enabled: boolean) => void;
}

export const useAISettingsStore = create<AISettingsState>()(
	persist(
		(set) => ({
			imageProviderId: null,
			imageApiKey: "",
			videoProviderId: null,
			videoApiKey: "",
			devPlaceholderEnabled: IS_DEV,

			setImageProvider: (providerId) => set({ imageProviderId: providerId }),
			setImageApiKey: (apiKey) => set({ imageApiKey: apiKey }),
			setVideoProvider: (providerId) => set({ videoProviderId: providerId }),
			setVideoApiKey: (apiKey) => set({ videoApiKey: apiKey }),
			setDevPlaceholderEnabled: (enabled) =>
				set({ devPlaceholderEnabled: enabled }),
		}),
		{
			name: "ai-settings",
		},
	),
);
