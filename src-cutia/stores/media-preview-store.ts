import { create } from "zustand";

interface MediaPreviewState {
	selectedMediaId: string | null;
	selectMedia: ({ mediaId }: { mediaId: string }) => void;
	clearSelection: () => void;
}

export const useMediaPreviewStore = create<MediaPreviewState>((set) => ({
	selectedMediaId: null,
	selectMedia: ({ mediaId }) => set({ selectedMediaId: mediaId }),
	clearSelection: () => set({ selectedMediaId: null }),
}));
