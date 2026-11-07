"use client";

import { useTranslation } from "@i18next-toolkit/nextjs-approuter";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useEditor } from "@cutia/hooks/use-editor";
import { storageService } from "@cutia/services/storage/service";
import type {
	RemoteAssetDto,
	RemoteMediaSync,
} from "@cutia/services/storage/remote-media-sync-adapter";
import { DraggableItem } from "@cutia/components/editor/panels/assets/draggable-item";
import { PanelBaseView as BaseView } from "@cutia/components/editor/panels/panel-base-view";
import { Spinner } from "@cutia/components/ui/spinner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
	CloudIcon,
	Image02Icon,
	Video01Icon,
	MusicNote03Icon,
} from "@hugeicons/core-free-icons";
import type { MediaAsset, MediaType } from "@cutia/types/assets";

type AssetKind = "image" | "video" | "audio";

const ASSET_TABS: { value: AssetKind; label: string; icon: typeof Image02Icon }[] =
	[
		{ value: "image", label: "Image", icon: Image02Icon },
		{ value: "video", label: "Video", icon: Video01Icon },
		{ value: "audio", label: "Audio", icon: MusicNote03Icon },
	];

/**
 * 从 CanvasMind 主站 AssetItem 一键导入素材到当前项目。
 *
 * 数据流: GET /api/asset-items?scope=mine&assetType=... → 渲染卡片 →
 *        点击/拖到 timeline → editor.media.addMediaAsset({ id: item.id, url: item.fileUrl, ... })
 *        → MediaManager 加占位 MediaAsset → 后台 fetchRemoteMediaAsFile 拉文件到 OPFS → 转 uploaded
 *
 * 关键点: mediaId 直接复用 AssetItem.id, 项目 JSON 引用即"使用"该资产, 无需新建关联表。
 */
export function MyAssetsView() {
	const { t } = useTranslation();
	const [activeKind, setActiveKind] = useState<AssetKind>("image");

	const mediaSync = storageService.getMediaSync();

	if (!mediaSync) {
		return (
			<div className="text-muted-foreground p-4 text-sm">
				{t("My Assets is only available in CanvasMind integration mode.")}
			</div>
		);
	}

	return (
		<BaseView
			value={activeKind}
			onValueChange={(v) => {
				if (v === "image" || v === "video" || v === "audio") {
					setActiveKind(v);
				}
			}}
			tabs={ASSET_TABS.map((tab) => ({
				value: tab.value,
				label: t(tab.label),
				icon: <HugeiconsIcon icon={tab.icon} className="size-3" />,
				content: <AssetKindContent kind={tab.value} mediaSync={mediaSync} />,
			}))}
		/>
	);
}

function AssetKindContent({
	kind,
	mediaSync,
}: {
	kind: AssetKind;
	mediaSync: RemoteMediaSync;
}) {
	const { t } = useTranslation();
	const editor = useEditor();
	const [items, setItems] = useState<RemoteAssetDto[]>([]);
	const [loading, setLoading] = useState(true);
	const [importingId, setImportingId] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;
		setLoading(true);
		mediaSync
			.listMine({ assetType: kind, page: 1, pageSize: 60 })
			.then((res) => {
				if (cancelled) return;
				setItems(res.items);
			})
			.catch((err) => {
				if (cancelled) return;
				console.error("listMine assets failed:", err);
				toast.error(t("Failed to load my assets"));
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, [kind, mediaSync, t]);

	const handleImport = async (item: RemoteAssetDto) => {
		const project = editor.project.getActiveOrNull();
		if (!project) return;

		// 已经在项目内则跳过 (mediaId === AssetItem.id, 同名即同物)
		const existing = editor.media
			.getAssets()
			.find((a) => a.id === item.id);
		if (existing) {
			toast.info(t("Already imported"));
			return;
		}

		setImportingId(item.id);
		try {
			// 添加占位 MediaAsset: file 空, url 远端, uploadStatus=remote-only。
			// MediaManager 内部 addMediaAsset 时, 因为 mediaId 已有 assetItemId,
			// StorageService.saveMediaAsset 会标 uploaded, 不再触发上传。
			const placeholderFile = new File([], item.title || "untitled", {
				type: item.mimeType || "application/octet-stream",
			});
			const mediaType: MediaType =
				item.assetType === "audio"
					? "audio"
					: item.assetType === "video"
						? "video"
						: "image";
			const asset: Omit<MediaAsset, "id"> & { id?: string } = {
				id: item.id,
				name: item.title || "untitled",
				type: mediaType,
				file: placeholderFile,
				url: item.fileUrl,
				width: item.width,
				height: item.height,
				duration: item.durationSeconds,
				thumbnailUrl: item.thumbnailUrl,
				assetItemId: item.id,
				fileUrl: item.fileUrl,
				mimeType: item.mimeType,
				uploadStatus: "remote-only",
			};
			await editor.media.addMediaAsset({
				projectId: project.metadata.id,
				asset,
			});
			toast.success(t("Imported"));
		} catch (err) {
			console.error("import failed:", err);
			toast.error(t("Import failed"));
		} finally {
			setImportingId(null);
		}
	};

	if (loading) {
		return (
			<div className="flex h-full items-center justify-center p-4">
				<Spinner className="text-muted-foreground size-6" />
			</div>
		);
	}

	if (items.length === 0) {
		return (
			<div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-2 p-4 text-sm">
				<HugeiconsIcon icon={CloudIcon} className="size-8" />
				<p>{t("No assets yet")}</p>
			</div>
		);
	}

	return (
		<div className="grid grid-cols-2 gap-2 p-4">
			{items.map((item) => (
				<div key={item.id} className="relative">
					<DraggableItem
						name={item.title || "untitled"}
						preview={
							<AssetPreview item={item} isImporting={importingId === item.id} />
						}
						dragData={{
							id: item.id,
							type: "media",
							mediaType:
								item.assetType === "audio"
									? "audio"
									: item.assetType === "video"
										? "video"
										: "image",
							name: item.title || "untitled",
						}}
						aspectRatio={1}
						isRounded={true}
						variant="card"
						containerClassName="w-full"
						onClick={() => handleImport(item)}
						onAddToTimeline={() => handleImport(item)}
						isDraggable={importingId !== item.id}
					/>
				</div>
			))}
		</div>
	);
}

function AssetPreview({
	item,
	isImporting,
}: {
	item: RemoteAssetDto;
	isImporting: boolean;
}) {
	const previewUrl = item.thumbnailUrl || item.fileUrl;
	return (
		<div className="relative size-full">
			{item.assetType === "audio" ? (
				<div className="bg-accent flex size-full items-center justify-center">
					<HugeiconsIcon
						icon={MusicNote03Icon}
						className="text-muted-foreground size-6"
					/>
				</div>
			) : (
				<img
					src={previewUrl}
					alt={item.title || ""}
					className="size-full object-cover"
					loading="lazy"
				/>
			)}
			{isImporting && (
				<div className="absolute inset-0 flex items-center justify-center bg-black/40">
					<Spinner className="size-5 text-white" />
				</div>
			)}
		</div>
	);
}
