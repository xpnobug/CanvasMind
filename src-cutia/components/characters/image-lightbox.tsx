
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "@i18next-toolkit/nextjs-approuter";
import {
	Dialog,
	DialogContent,
	DialogTitle,
} from "@cutia/components/ui/dialog";
import { VisuallyHidden } from "radix-ui";
import { HugeiconsIcon } from "@hugeicons/react";
import {
	ArrowLeft02Icon,
	ArrowRight02Icon,
	Loading03Icon,
} from "@hugeicons/core-free-icons";
import { getCharacterImageBlob } from "@cutia/stores/character-store";

export type ImageSource =
	| { type: "blob"; blobKey: string; label: string }
	| { type: "url"; url: string; label: string };

interface LightboxState {
	sources: ImageSource[];
	currentIndex: number;
}

export function useImageLightbox() {
	const [state, setState] = useState<LightboxState | null>(null);

	const open = useCallback(
		({ sources, index }: { sources: ImageSource[]; index: number }) => {
			if (sources.length === 0) return;
			setState({ sources, currentIndex: Math.max(0, Math.min(index, sources.length - 1)) });
		},
		[],
	);

	const close = useCallback(() => setState(null), []);

	const prev = useCallback(() => {
		setState((s) => {
			if (!s || s.sources.length <= 1) return s;
			return {
				...s,
				currentIndex: (s.currentIndex - 1 + s.sources.length) % s.sources.length,
			};
		});
	}, []);

	const next = useCallback(() => {
		setState((s) => {
			if (!s || s.sources.length <= 1) return s;
			return {
				...s,
				currentIndex: (s.currentIndex + 1) % s.sources.length,
			};
		});
	}, []);

	return { state, open, close, prev, next };
}

export function ImageLightbox({
	state,
	onClose,
	onPrev,
	onNext,
}: {
	state: LightboxState | null;
	onClose: () => void;
	onPrev: () => void;
	onNext: () => void;
}) {
	const { t } = useTranslation();
	const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	const currentSource = state?.sources[state.currentIndex] ?? null;
	const totalCount = state?.sources.length ?? 0;
	const canNavigate = totalCount > 1;

	useEffect(() => {
		if (!currentSource) {
			setResolvedUrl(null);
			return;
		}

		if (currentSource.type === "url") {
			setResolvedUrl(currentSource.url);
			return;
		}

		let revoked = false;
		setIsLoading(true);
		setResolvedUrl(null);

		void getCharacterImageBlob({ id: currentSource.blobKey }).then((blob) => {
			if (revoked) return;
			if (blob) {
				setResolvedUrl(URL.createObjectURL(blob));
			}
			setIsLoading(false);
		});

		return () => {
			revoked = true;
			setResolvedUrl((prev) => {
				if (prev && currentSource.type === "blob") {
					URL.revokeObjectURL(prev);
				}
				return null;
			});
		};
	}, [currentSource]);

	useEffect(() => {
		if (!state || !canNavigate) return;

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "ArrowLeft") {
				event.preventDefault();
				onPrev();
			} else if (event.key === "ArrowRight") {
				event.preventDefault();
				onNext();
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [state, canNavigate, onPrev, onNext]);

	const handleOpenChange = useCallback(
		(open: boolean) => {
			if (!open) {
				if (resolvedUrl && currentSource?.type === "blob") {
					URL.revokeObjectURL(resolvedUrl);
				}
				onClose();
			}
		},
		[onClose, resolvedUrl, currentSource],
	);

	return (
		<Dialog open={state !== null} onOpenChange={handleOpenChange}>
			<DialogContent className="flex items-center justify-center border-none bg-transparent p-0 shadow-none sm:max-w-[90vw] max-h-[90vh]">
				<VisuallyHidden.Root>
					<DialogTitle>
						{currentSource?.label ?? t("Image Preview")}
					</DialogTitle>
				</VisuallyHidden.Root>

				{canNavigate && (
					<button
						type="button"
						tabIndex={-1}
						className="absolute left-2 top-1/2 -translate-y-1/2 z-10 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
						onClick={(event) => {
							event.stopPropagation();
							onPrev();
						}}
						title={t("Previous")}
					>
						<HugeiconsIcon icon={ArrowLeft02Icon} className="size-5" />
					</button>
				)}

				{isLoading && (
					<div className="flex items-center justify-center p-12">
						<HugeiconsIcon
							icon={Loading03Icon}
							className="size-8 animate-spin text-white"
						/>
					</div>
				)}

				{resolvedUrl && !isLoading && (
					/* biome-ignore lint: lightbox preview */
					<img
						src={resolvedUrl}
						alt={currentSource?.label ?? ""}
						className="max-h-[85vh] max-w-[88vw] rounded-lg object-contain"
					/>
				)}

				{canNavigate && (
					<button
						type="button"
						tabIndex={-1}
						className="absolute right-2 top-1/2 -translate-y-1/2 z-10 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
						onClick={(event) => {
							event.stopPropagation();
							onNext();
						}}
						title={t("Next")}
					>
						<HugeiconsIcon icon={ArrowRight02Icon} className="size-5" />
					</button>
				)}

				{canNavigate && (
					<div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs text-white">
						{(state?.currentIndex ?? 0) + 1} / {totalCount}
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}
