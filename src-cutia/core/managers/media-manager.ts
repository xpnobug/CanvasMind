import type { EditorCore } from "@cutia/core";
import type { MediaAsset } from "@cutia/types/assets";
import { storageService } from "@cutia/services/storage/service";
import { generateUUID } from "@cutia/utils/id";
import { videoCache } from "@cutia/services/video-cache/service";
import { hasMediaId } from "@cutia/lib/timeline/element-utils";

export class MediaManager {
	private assets: MediaAsset[] = [];
	private isLoading = false;
	private listeners = new Set<() => void>();

	constructor(private editor: EditorCore) {
		// 订阅存储层的媒体更新事件 (异步上传完成后, StorageService 通知刷新元数据)。
		// canana-vue 集成时由 RemoteMediaSyncAdapter 触发, cutia 上游下永远不触发。
		// MediaManager 是 EditorCore 单例的组件, 生命周期与编辑器一致, 无需保存 unsubscribe。
		storageService.subscribeMediaUpdates((event) => {
				const idx = this.assets.findIndex((a) => a.id === event.mediaId);
				if (idx === -1) return;
				const old = this.assets[idx];
				if (!old) return;
				const updated: MediaAsset = {
					...old,
					assetItemId: event.metadata.assetItemId ?? old.assetItemId,
					fileUrl: event.metadata.fileUrl ?? old.fileUrl,
					mimeType: event.metadata.mimeType ?? old.mimeType,
					uploadStatus: event.metadata.uploadStatus ?? old.uploadStatus,
					uploadError: event.metadata.uploadError,
				};
				this.assets = [
					...this.assets.slice(0, idx),
					updated,
					...this.assets.slice(idx + 1),
				];
				this.notify();
			},
		);
	}

	async addMediaAsset({
		projectId,
		asset,
	}: {
		projectId: string;
		asset: Omit<MediaAsset, "id"> & { id?: string };
	}): Promise<string> {
		// 从 AssetItem 导入素材时, 直接复用 AssetItem.id 作 mediaId (避免双 id 系统)。
		// 其它场景生成新 UUID。
		const newAsset: MediaAsset = {
			...asset,
			id: asset.id || generateUUID(),
		};

		this.assets = [...this.assets, newAsset];
		this.notify();

		try {
			await storageService.saveMediaAsset({ projectId, mediaAsset: newAsset });
		} catch (error) {
			console.error("Failed to save media asset:", error);
			this.assets = this.assets.filter((asset) => asset.id !== newAsset.id);
			this.notify();
		}

		// remote-only 素材后台拉文件回填 OPFS, 完成后通过事件订阅自动更新内存状态
		this.triggerBackfillIfRemoteOnly({ projectId, asset: newAsset });

		return newAsset.id;
	}

	// 检查素材是否需要后台回填(remote-only + 有 fileUrl), 异步触发不阻塞调用方
	private triggerBackfillIfRemoteOnly({
		projectId,
		asset,
	}: {
		projectId: string;
		asset: MediaAsset;
	}): void {
		if (asset.uploadStatus !== "remote-only" || !asset.fileUrl) return;
		void storageService.backfillRemoteOnlyAsset({
			projectId,
			mediaId: asset.id,
			fileUrl: asset.fileUrl,
		});
	}

	async removeMediaAsset({
		projectId,
		id,
	}: {
		projectId: string;
		id: string;
	}): Promise<void> {
		const asset = this.assets.find((asset) => asset.id === id);

		videoCache.clearVideo({ mediaId: id });

		if (asset?.url) {
			URL.revokeObjectURL(asset.url);
			if (asset.thumbnailUrl) {
				URL.revokeObjectURL(asset.thumbnailUrl);
			}
		}

		this.assets = this.assets.filter((asset) => asset.id !== id);
		this.notify();

		const tracks = this.editor.timeline.getTracks();
		const elementsToRemove: Array<{ trackId: string; elementId: string }> = [];

		for (const track of tracks) {
			for (const element of track.elements) {
				if (hasMediaId(element) && element.mediaId === id) {
					elementsToRemove.push({ trackId: track.id, elementId: element.id });
				}
			}
		}

		if (elementsToRemove.length > 0) {
			this.editor.timeline.deleteElements({ elements: elementsToRemove });
		}

		try {
			await storageService.deleteMediaAsset({ projectId, id });
		} catch (error) {
			console.error("Failed to delete media asset:", error);
		}
	}

	async loadProjectMedia({ projectId }: { projectId: string }): Promise<void> {
		this.isLoading = true;
		this.notify();

		try {
			// 从当前 active project 的 timeline elements 提取所有 mediaId 集合,
			// 用于 RemoteMediaSyncAdapter 反查 AssetItem (canana-vue 集成场景)。
			// cutia 上游模式下,storageService 会忽略此参数走本地 IDB 列表。
			const mediaIds = this.collectMediaIdsFromActiveProject();
			const mediaAssets = await storageService.loadAllMediaAssets({
				projectId,
				mediaIds,
			});
			this.assets = mediaAssets;
			this.notify();

			// 跨设备恢复场景: 扫描 remote-only 素材, 后台拉文件回填 OPFS
			for (const asset of mediaAssets) {
				this.triggerBackfillIfRemoteOnly({ projectId, asset });
			}
		} catch (error) {
			console.error("Failed to load media assets:", error);
		} finally {
			this.isLoading = false;
			this.notify();
		}
	}

	// 遍历当前 project 的所有 scene → track → element, 提取去重的 mediaId 集合。
	// 返回空数组时,loadAllMediaAssets 会退回本地 IDB 列表(兼容无项目场景)。
	private collectMediaIdsFromActiveProject(): string[] {
		const project = this.editor.project.getActiveOrNull();
		if (!project) return [];
		const ids = new Set<string>();
		for (const scene of project.scenes) {
			for (const track of scene.tracks) {
				for (const element of track.elements) {
					if (hasMediaId(element) && element.mediaId) {
						ids.add(element.mediaId);
					}
				}
			}
		}
		return [...ids];
	}

	async clearProjectMedia({ projectId }: { projectId: string }): Promise<void> {
		this.assets.forEach((asset) => {
			if (asset.url) {
				URL.revokeObjectURL(asset.url);
			}
			if (asset.thumbnailUrl) {
				URL.revokeObjectURL(asset.thumbnailUrl);
			}
		});

		const mediaIds = this.assets.map((asset) => asset.id);
		this.assets = [];
		this.notify();

		try {
			await Promise.all(
				mediaIds.map((id) =>
					storageService.deleteMediaAsset({ projectId, id }),
				),
			);
		} catch (error) {
			console.error("Failed to clear media assets from storage:", error);
		}
	}

	clearAllAssets(): void {
		videoCache.clearAll();

		this.assets.forEach((asset) => {
			if (asset.url) {
				URL.revokeObjectURL(asset.url);
			}
			if (asset.thumbnailUrl) {
				URL.revokeObjectURL(asset.thumbnailUrl);
			}
		});

		this.assets = [];
		this.notify();
	}

	getAssets(): MediaAsset[] {
		return this.assets;
	}

	setAssets({ assets }: { assets: MediaAsset[] }): void {
		this.assets = assets;
		this.notify();
	}

	isLoadingMedia(): boolean {
		return this.isLoading;
	}

	subscribe(listener: () => void): () => void {
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	}

	private notify(): void {
		this.listeners.forEach((fn) => fn());
	}
}
