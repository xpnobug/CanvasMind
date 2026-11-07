
import { useTranslation } from "@i18next-toolkit/nextjs-approuter";
import { useMemo, useState } from "react";
import { Button } from "@cutia/components/ui/button";
import {
	Dialog,
	DialogBody,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@cutia/components/ui/dialog";
import { cn } from "@cutia/utils/ui";
import type { AICharacter } from "@cutia/types/character";
import { HugeiconsIcon } from "@hugeicons/react";
import {
	Image01Icon,
	Video01Icon,
} from "@hugeicons/core-free-icons";
import {
	ImageLightbox,
	useImageLightbox,
	type ImageSource,
} from "./image-lightbox";

export function CharacterDetailDialog({
	character,
	isOpen,
	onOpenChange,
	onEdit,
}: {
	character: AICharacter | null;
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	onEdit: () => void;
}) {
	const { t } = useTranslation();
	const lightbox = useImageLightbox();

	const allSources = useMemo<ImageSource[]>(() => {
		if (!character) return [];
		const refSources: ImageSource[] = character.images.map((img) => ({
			type: "blob",
			blobKey: img.blobKey,
			label: img.label,
		}));
		const genSources: ImageSource[] = character.generations
			.filter((g) => g.type === "image")
			.map((g) => ({
				type: "url",
				url: g.url,
				label: g.prompt,
			}));
		return [...refSources, ...genSources];
	}, [character]);

	if (!character) return null;

	const refImageCount = character.images.length;

	return (
		<>
			<Dialog open={isOpen} onOpenChange={onOpenChange}>
				<DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
					<DialogHeader>
						<div className="flex items-center justify-between pr-8">
							<DialogTitle>{character.name}</DialogTitle>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={onEdit}
								onKeyDown={(event) => {
									if (event.key === "Enter") onEdit();
								}}
							>
								{t("Edit")}
							</Button>
						</div>
					</DialogHeader>

					<DialogBody>
						{character.description && (
							<p className="text-muted-foreground text-sm">
								{character.description}
							</p>
						)}

						{character.styleDescription && (
							<div className="flex flex-col gap-1">
								<h4 className="text-sm font-medium">
									{t("Style Lock")}
								</h4>
								<p className="text-muted-foreground text-xs whitespace-pre-wrap rounded-md bg-muted/50 p-2">
									{character.styleDescription}
								</p>
							</div>
						)}

						<div className="flex flex-col gap-2">
							<h4 className="text-sm font-medium">
								{t("Reference Images ({{num}})", {
									num: refImageCount,
								})}
							</h4>
							{refImageCount === 0 ? (
								<p className="text-muted-foreground text-xs py-4 text-center">
									{t("No reference images yet")}
								</p>
							) : (
								<div className="grid grid-cols-3 gap-2">
									{character.images.map((image, index) => (
										<ReferenceImageCard
											key={image.id}
											image={image}
											onPreview={() =>
												lightbox.open({
													sources: allSources,
													index,
												})
											}
										/>
									))}
								</div>
							)}
						</div>

						{character.generations.length > 0 && (
							<div className="flex flex-col gap-2">
								<h4 className="text-sm font-medium">
									{t("Generated Content ({{num}})", {
										num: character.generations.length,
									})}
								</h4>
								<div className="grid grid-cols-2 gap-2">
									{character.generations.map(
										(generation, index) => (
											<GenerationCard
												key={generation.id}
												generation={generation}
												onPreview={() =>
													lightbox.open({
														sources: allSources,
														index:
															refImageCount +
															index,
													})
												}
											/>
										),
									)}
								</div>
							</div>
						)}
					</DialogBody>
				</DialogContent>
			</Dialog>

			<ImageLightbox
				state={lightbox.state}
				onClose={lightbox.close}
				onPrev={lightbox.prev}
				onNext={lightbox.next}
			/>
		</>
	);
}

function ReferenceImageCard({
	image,
	onPreview,
}: {
	image: AICharacter["images"][number];
	onPreview: () => void;
}) {
	const { t } = useTranslation();

	return (
		<div className="group relative overflow-hidden rounded-md border">
			<button
				type="button"
				className="relative aspect-video w-full cursor-pointer"
				onClick={onPreview}
				onKeyDown={(event) => {
					if (event.key === "Enter") onPreview();
				}}
				title={t("Click to view full image")}
			>
				{/* biome-ignore lint: data URL thumbnail */}
				<img
					src={image.thumbnailDataUrl}
					alt={image.label}
					className="size-full object-cover"
				/>
			</button>
			<div className="p-1.5">
				<p className="text-foreground truncate text-[10px] font-medium">
					{image.label}
				</p>
			</div>
		</div>
	);
}

function GenerationCard({
	generation,
	onPreview,
}: {
	generation: AICharacter["generations"][number];
	onPreview: () => void;
}) {
	const { t } = useTranslation();
	const [isLoaded, setIsLoaded] = useState(false);

	const isVideo = generation.type === "video";

	return (
		<div className="group relative overflow-hidden rounded-md border bg-muted/50">
			<button
				type="button"
				className="relative aspect-video w-full cursor-pointer"
				onClick={onPreview}
				onKeyDown={(event) => {
					if (event.key === "Enter") onPreview();
				}}
				title={t("Click to view full image")}
			>
				{isVideo ? (
					<video
						src={generation.url}
						className="size-full object-cover"
						preload="metadata"
					>
						<track kind="captions" />
					</video>
				) : (
					/* biome-ignore lint: external URL */
					<img
						src={generation.thumbnailDataUrl || generation.url}
						alt={generation.prompt}
						className={cn(
							"size-full object-cover transition-opacity",
							isLoaded ? "opacity-100" : "opacity-0",
						)}
						onLoad={() => setIsLoaded(true)}
					/>
				)}

				<div className="absolute top-1 left-1">
					<HugeiconsIcon
						icon={isVideo ? Video01Icon : Image01Icon}
						className="size-3.5 text-white drop-shadow"
					/>
				</div>
			</button>
			<div className="p-1.5">
				<p className="text-foreground line-clamp-1 text-[10px]">
					{generation.prompt}
				</p>
				<span className="text-muted-foreground text-[10px]">
					{generation.provider}
				</span>
			</div>
		</div>
	);
}
