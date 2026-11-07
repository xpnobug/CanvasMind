import type { TProject, TProjectMetadata } from "@cutia/types/project";
import { getProjectDurationFromScenes } from "@cutia/lib/scenes";
import type { MediaAsset } from "@cutia/types/assets";
import { fetchRemoteMediaAsFile } from "@cutia/lib/media/url-import";
import { IndexedDBAdapter } from "./indexeddb-adapter";
import { OPFSAdapter } from "./opfs-adapter";
import type {
	MediaAssetData,
	StorageConfig,
	SerializedProject,
	SerializedScene,
	StorageStats,
	ProjectStorageStats,
	StorageAdapter,
} from "./types";
import type { RemoteMediaSync } from "./remote-media-sync-adapter";
import { remoteAssetToMediaAssetData } from "./remote-media-sync-adapter";
import type { SavedSoundsData, SavedSound, SoundEffect } from "@cutia/types/sounds";
import {
	migrations,
	runStorageMigrations,
} from "@cutia/services/storage/migrations";
import type { TimelineTrack, TScene } from "@cutia/types/timeline";

// 项目存储 adapter 需要支持的接口:5 个 StorageAdapter 方法 + getAll(批量拉取)。
// IndexedDBAdapter 与 RemoteStorageAdapter(canana-vue 集成版)都实现此形态。
export type ProjectsStorageAdapter = StorageAdapter<SerializedProject> & {
	getAll(): Promise<SerializedProject[]>;
};

export interface StorageServiceOptions {
	// 可选注入项目存储 adapter(canana-vue 集成版用 RemoteStorageAdapter)。
	// 未提供时回退到默认 IndexedDBAdapter,保持 cutia 上游版本零变更。
	projectsAdapter?: ProjectsStorageAdapter;
	// 跳过 storage migrations。Remote 数据永远 v3 起步,migration runner 内部
	// 硬绑 IndexedDB('video-editor-projects'),与远程数据无关,故跳过。
	skipMigrations?: boolean;
	// 可选注入媒体远端同步层。canana-vue 集成时把 cutia 的素材上传到后端 AssetItem 表;
	// 未注入时 saveMediaAsset/loadAllMediaAssets 与改造前 100% 一致。
	mediaSync?: RemoteMediaSync;
}

// 媒体元数据更新事件 — saveMediaAsset 异步上传完成后,通过此回调通知 MediaManager
// 替换内存中对应项,刷新 UI 状态徽章。
type MediaUpdateListener = (event: {
	projectId: string;
	mediaId: string;
	metadata: MediaAssetData;
}) => void;

class StorageService {
	private projectsAdapter: ProjectsStorageAdapter;
	private savedSoundsAdapter: IndexedDBAdapter<SavedSoundsData>;
	private config: StorageConfig;
	private migrationsPromise: Promise<void> | null = null;
	private skipMigrations: boolean;
	private mediaSync: RemoteMediaSync | null;
	private mediaUpdateListeners = new Set<MediaUpdateListener>();

	constructor(options: StorageServiceOptions = {}) {
		this.config = {
			projectsDb: "video-editor-projects",
			mediaDb: "video-editor-media",
			savedSoundsDb: "video-editor-saved-sounds",
			version: 1,
		};

		this.projectsAdapter =
			options.projectsAdapter ??
			new IndexedDBAdapter<SerializedProject>(
				this.config.projectsDb,
				"projects",
				this.config.version,
			);

		this.savedSoundsAdapter = new IndexedDBAdapter<SavedSoundsData>(
			this.config.savedSoundsDb,
			"saved-sounds",
			this.config.version,
		);

		this.skipMigrations = options.skipMigrations ?? false;
		this.mediaSync = options.mediaSync ?? null;
	}

	// 订阅媒体元数据更新事件(异步上传完成后触发)。MediaManager 用此 hook 同步内存状态。
	subscribeMediaUpdates(listener: MediaUpdateListener): () => void {
		this.mediaUpdateListeners.add(listener);
		return () => {
			this.mediaUpdateListeners.delete(listener);
		};
	}

	// 暴露注入的 mediaSync 实例 (canana-vue 集成场景下用于"我的资产" tab 直接读取主站 AssetItem)。
	// cutia 上游模式下返回 null。
	getMediaSync(): RemoteMediaSync | null {
		return this.mediaSync;
	}

	// remote-only 状态下的占位素材后台回填: 从 fileUrl 拉文件 → 写 OPFS → 更新 metadata → notify。
	// 用于"从 AssetItem 导入"和"跨设备加载项目时 OPFS miss"两种场景, 调用后异步执行。
	// 同一 mediaId 多次调用会用 inflight Map 去重。
	private readonly backfillInflight = new Map<string, Promise<void>>();
	async backfillRemoteOnlyAsset({
		projectId,
		mediaId,
		fileUrl,
	}: {
		projectId: string;
		mediaId: string;
		fileUrl: string;
	}): Promise<void> {
		const key = `${projectId}::${mediaId}`;
		const existing = this.backfillInflight.get(key);
		if (existing) return existing;

		const task = (async () => {
			try {
				const file = await fetchRemoteMediaAsFile({ url: fileUrl });
				const { mediaMetadataAdapter, mediaAssetsAdapter } =
					this.getProjectMediaAdapters({ projectId });

				// 检查 metadata 是否还在(可能被并发 deleteMediaAsset 删除)
				const current = await mediaMetadataAdapter.get(mediaId);
				if (!current) return;

				await mediaAssetsAdapter.set(mediaId, file);

				const updated: MediaAssetData = {
					...current,
					size: file.size,
					lastModified: file.lastModified,
					uploadStatus: "uploaded",
					uploadError: undefined,
				};
				await mediaMetadataAdapter.set(mediaId, updated);
				this.notifyMediaUpdate({ projectId, mediaId, metadata: updated });
			} catch (err) {
				console.warn(`Backfill remote-only asset ${mediaId} failed:`, err);
			}
		})();

		this.backfillInflight.set(key, task);
		try {
			await task;
		} finally {
			this.backfillInflight.delete(key);
		}
	}

	private notifyMediaUpdate(event: {
		projectId: string;
		mediaId: string;
		metadata: MediaAssetData;
	}): void {
		for (const listener of this.mediaUpdateListeners) {
			try {
				listener(event);
			} catch (err) {
				console.warn("media update listener error:", err);
			}
		}
	}

	private async ensureMigrations(): Promise<void> {
		if (this.skipMigrations) return;

		if (this.migrationsPromise) {
			await this.migrationsPromise;
			return;
		}

		this.migrationsPromise = runStorageMigrations({ migrations }).then(
			() => undefined,
		);
		await this.migrationsPromise;
	}

	private getProjectMediaAdapters({ projectId }: { projectId: string }) {
		const mediaMetadataAdapter = new IndexedDBAdapter<MediaAssetData>(
			`${this.config.mediaDb}-${projectId}`,
			"media-metadata",
			this.config.version,
		);

		const mediaAssetsAdapter = new OPFSAdapter(`media-files-${projectId}`);

		return { mediaMetadataAdapter, mediaAssetsAdapter };
	}

	private stripAudioBuffers({
		tracks,
	}: {
		tracks: TimelineTrack[];
	}): TimelineTrack[] {
		return tracks.map((track) => {
			if (track.type !== "audio") return track;
			return {
				...track,
				elements: track.elements.map((element) => {
					const { buffer: _buffer, ...rest } = element;
					return rest;
				}),
			};
		});
	}

	async saveProject({ project }: { project: TProject }): Promise<void> {
		const duration =
			project.metadata.duration ??
			getProjectDurationFromScenes({ scenes: project.scenes });
		const serializedScenes: SerializedScene[] = project.scenes.map((scene) => ({
			id: scene.id,
			name: scene.name,
			isMain: scene.isMain,
			tracks: this.stripAudioBuffers({ tracks: scene.tracks }),
			bookmarks: scene.bookmarks,
			createdAt: scene.createdAt.toISOString(),
			updatedAt: scene.updatedAt.toISOString(),
		}));

		const serializedProject: SerializedProject = {
			metadata: {
				id: project.metadata.id,
				name: project.metadata.name,
				thumbnail: project.metadata.thumbnail,
				duration,
				createdAt: project.metadata.createdAt.toISOString(),
				updatedAt: project.metadata.updatedAt.toISOString(),
			},
			scenes: serializedScenes,
			currentSceneId: project.currentSceneId,
			settings: project.settings,
			version: project.version,
			timelineViewState: project.timelineViewState,
			agentMessages: project.agentMessages,
		};

		await this.projectsAdapter.set(project.metadata.id, serializedProject);
	}

	async loadProject({
		id,
	}: {
		id: string;
	}): Promise<{ project: TProject } | null> {
		await this.ensureMigrations();
		const serializedProject = await this.projectsAdapter.get(id);

		if (!serializedProject) return null;

		const scenes =
			serializedProject.scenes?.map((scene) => ({
				id: scene.id,
				name: scene.name,
				isMain: scene.isMain,
				tracks: (scene.tracks ?? []).map((track) =>
					track.type === "video"
						? { ...track, isMain: track.isMain ?? false, transitions: track.transitions ?? [] }
						: track,
				),
				bookmarks: scene.bookmarks ?? [],
				createdAt: new Date(scene.createdAt),
				updatedAt: new Date(scene.updatedAt),
			})) ?? [];

		const project: TProject = {
			metadata: {
				id: serializedProject.metadata.id,
				name: serializedProject.metadata.name,
				thumbnail: serializedProject.metadata.thumbnail,
				duration:
					serializedProject.metadata.duration ??
					getProjectDurationFromScenes({ scenes }),
				createdAt: new Date(serializedProject.metadata.createdAt),
				updatedAt: new Date(serializedProject.metadata.updatedAt),
			},
			scenes,
			currentSceneId: serializedProject.currentSceneId || "",
			settings: serializedProject.settings,
			version: serializedProject.version,
			timelineViewState: serializedProject.timelineViewState,
			agentMessages: serializedProject.agentMessages ?? [],
		};

		return { project };
	}

	async loadAllProjects(): Promise<TProject[]> {
		const projectIds = await this.projectsAdapter.list();
		const projects: TProject[] = [];

		for (const id of projectIds) {
			const result = await this.loadProject({ id });
			if (result?.project) {
				projects.push(result.project);
			}
		}

		return projects.sort(
			(a, b) => b.metadata.updatedAt.getTime() - a.metadata.updatedAt.getTime(),
		);
	}

	async loadAllProjectsMetadata(): Promise<TProjectMetadata[]> {
		await this.ensureMigrations();
		const serializedProjects = await this.projectsAdapter.getAll();

		const metadata = serializedProjects.map((serializedProject) => ({
			id: serializedProject.metadata.id,
			name: serializedProject.metadata.name,
			thumbnail: serializedProject.metadata.thumbnail,
			duration:
				serializedProject.metadata.duration ??
				getProjectDurationFromScenes({
					scenes: (serializedProject.scenes ?? []) as unknown as TScene[],
				}),
			createdAt: new Date(serializedProject.metadata.createdAt),
			updatedAt: new Date(serializedProject.metadata.updatedAt),
		}));

		return metadata.sort(
			(a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
		);
	}

	async deleteProject({ id }: { id: string }): Promise<void> {
		await this.projectsAdapter.remove(id);
	}

	async saveMediaAsset({
		projectId,
		mediaAsset,
	}: {
		projectId: string;
		mediaAsset: MediaAsset;
	}): Promise<void> {
		const { mediaMetadataAdapter, mediaAssetsAdapter } =
			this.getProjectMediaAdapters({ projectId });

		await mediaAssetsAdapter.set(mediaAsset.id, mediaAsset.file);

		// 优先尊重调用方显式传入的 uploadStatus(例如从 AssetItem 导入时传 'remote-only')。
		// 否则按规则推导:
		//   - ephemeral 素材不参与上传, 状态 undefined
		//   - 已有 assetItemId(且文件实存)→ uploaded
		//   - 否则需异步上传 → uploading
		const alreadyRemote = Boolean(mediaAsset.assetItemId);
		const initialStatus: MediaAssetData["uploadStatus"] =
			mediaAsset.uploadStatus ??
			(mediaAsset.ephemeral
				? undefined
				: alreadyRemote
					? "uploaded"
					: this.mediaSync
						? "uploading"
						: undefined);

		const metadata: MediaAssetData = {
			id: mediaAsset.id,
			name: mediaAsset.name,
			type: mediaAsset.type,
			size: mediaAsset.file.size,
			lastModified: mediaAsset.file.lastModified,
			width: mediaAsset.width,
			height: mediaAsset.height,
			duration: mediaAsset.duration,
			thumbnailUrl: mediaAsset.thumbnailUrl,
			ephemeral: mediaAsset.ephemeral,
			assetItemId: mediaAsset.assetItemId,
			fileUrl: mediaAsset.fileUrl,
			mimeType: mediaAsset.mimeType,
			uploadStatus: initialStatus,
		};

		await mediaMetadataAdapter.set(mediaAsset.id, metadata);

		// canana-vue 集成场景:异步触发云端上传,失败仅标 failed 不回滚本地。
		// cutia 上游(无 mediaSync 注入)直接返回, 行为与改造前一致。
		if (this.mediaSync && !mediaAsset.ephemeral && !alreadyRemote) {
			void this.triggerMediaUpload({ projectId, mediaAsset });
		}
	}

	private async triggerMediaUpload({
		projectId,
		mediaAsset,
	}: {
		projectId: string;
		mediaAsset: MediaAsset;
	}): Promise<void> {
		if (!this.mediaSync) return;
		const { mediaMetadataAdapter } = this.getProjectMediaAdapters({ projectId });

		try {
			const dto = await this.mediaSync.upload({
				assetType: mediaAsset.type,
				file: mediaAsset.file,
				name: mediaAsset.name,
				metadata: {
					width: mediaAsset.width,
					height: mediaAsset.height,
					duration: mediaAsset.duration,
					thumbnailUrl: mediaAsset.thumbnailUrl,
				},
			});

			// 回写前先检查 metadata 是否还在(可能被并发 deleteMediaAsset 删除)
			const current = await mediaMetadataAdapter.get(mediaAsset.id);
			if (!current) return;

			const updated: MediaAssetData = {
				...current,
				assetItemId: dto.id,
				fileUrl: dto.fileUrl,
				mimeType: dto.mimeType || current.mimeType,
				uploadStatus: "uploaded",
				uploadError: undefined,
			};
			await mediaMetadataAdapter.set(mediaAsset.id, updated);
			this.notifyMediaUpdate({ projectId, mediaId: mediaAsset.id, metadata: updated });
		} catch (err) {
			const current = await mediaMetadataAdapter.get(mediaAsset.id);
			if (!current) return;
			const errorMsg = err instanceof Error ? err.message : String(err);
			const updated: MediaAssetData = {
				...current,
				uploadStatus: "failed",
				uploadError: errorMsg,
			};
			await mediaMetadataAdapter.set(mediaAsset.id, updated);
			this.notifyMediaUpdate({ projectId, mediaId: mediaAsset.id, metadata: updated });
			console.warn(`Failed to upload media ${mediaAsset.id}:`, err);
		}
	}

	async loadMediaAsset({
		projectId,
		id,
	}: {
		projectId: string;
		id: string;
	}): Promise<MediaAsset | null> {
		const { mediaMetadataAdapter, mediaAssetsAdapter } =
			this.getProjectMediaAdapters({ projectId });

		const [file, metadata] = await Promise.all([
			mediaAssetsAdapter.get(id),
			mediaMetadataAdapter.get(id),
		]);

		if (!file || !metadata) return null;

		let url: string;
		if (metadata.type === "image" && (!file.type || file.type === "")) {
			try {
				const text = await file.text();
				if (text.trim().startsWith("<svg")) {
					const svgBlob = new Blob([text], { type: "image/svg+xml" });
					url = URL.createObjectURL(svgBlob);
				} else {
					url = URL.createObjectURL(file);
				}
			} catch {
				url = URL.createObjectURL(file);
			}
		} else {
			url = URL.createObjectURL(file);
		}

		return {
			id: metadata.id,
			name: metadata.name,
			type: metadata.type,
			file,
			url,
			width: metadata.width,
			height: metadata.height,
			duration: metadata.duration,
			thumbnailUrl: metadata.thumbnailUrl,
			ephemeral: metadata.ephemeral,
			assetItemId: metadata.assetItemId,
			fileUrl: metadata.fileUrl,
			mimeType: metadata.mimeType,
			uploadStatus: metadata.uploadStatus,
			uploadError: metadata.uploadError,
		};
	}

	async loadAllMediaAssets({
		projectId,
		mediaIds,
	}: {
		projectId: string;
		mediaIds?: string[];
	}): Promise<MediaAsset[]> {
		const { mediaMetadataAdapter, mediaAssetsAdapter } =
			this.getProjectMediaAdapters({ projectId });

		// canana-vue 集成: 优先用 mediaSync 拉权威列表(基于项目 JSON 中的 mediaId 反查)
		if (this.mediaSync && mediaIds && mediaIds.length > 0) {
			const remoteAssets = await this.mediaSync.fetchByIds(mediaIds).catch((err) => {
				console.warn("fetchByIds failed, fallback to local IDB:", err);
				return null;
			});

			if (remoteAssets) {
				const mediaItems: MediaAsset[] = [];

				for (const dto of remoteAssets) {
					const localFile = await mediaAssetsAdapter.get(dto.id);
					if (localFile) {
						// OPFS hit: 完整 MediaAsset
						const existing = await mediaMetadataAdapter.get(dto.id);
						const url = URL.createObjectURL(localFile);
						mediaItems.push({
							id: dto.id,
							name: dto.title || existing?.name || "untitled",
							type: dto.assetType,
							file: localFile,
							url,
							width: dto.width ?? existing?.width,
							height: dto.height ?? existing?.height,
							duration: dto.durationSeconds ?? existing?.duration,
							thumbnailUrl: dto.thumbnailUrl ?? existing?.thumbnailUrl,
							assetItemId: dto.id,
							fileUrl: dto.fileUrl,
							mimeType: dto.mimeType,
							uploadStatus: "uploaded",
						});
					} else {
						// OPFS miss: 占位 MediaAsset, 后续由 MediaManager 触发 fetchRemoteMediaAsFile 回填
						const placeholderData = remoteAssetToMediaAssetData(dto);
						const placeholderFile = new File([], placeholderData.name, {
							type: dto.mimeType || "application/octet-stream",
						});
						mediaItems.push({
							id: dto.id,
							name: placeholderData.name,
							type: dto.assetType,
							file: placeholderFile,
							url: dto.fileUrl,
							width: dto.width,
							height: dto.height,
							duration: dto.durationSeconds,
							thumbnailUrl: dto.thumbnailUrl,
							assetItemId: dto.id,
							fileUrl: dto.fileUrl,
							mimeType: dto.mimeType,
							uploadStatus: "remote-only",
						});
					}
				}

				return mediaItems;
			}
		}

		// 默认路径 (cutia 上游 / mediaSync 未注入 / fetchByIds 失败回退): 从本地 IDB 加载
		const localIds = await mediaMetadataAdapter.list();
		const mediaItems: MediaAsset[] = [];

		for (const id of localIds) {
			const item = await this.loadMediaAsset({ projectId, id });
			if (item) {
				mediaItems.push(item);
			}
		}

		return mediaItems;
	}

	async deleteMediaAsset({
		projectId,
		id,
	}: {
		projectId: string;
		id: string;
	}): Promise<void> {
		const { mediaMetadataAdapter, mediaAssetsAdapter } =
			this.getProjectMediaAdapters({ projectId });

		await Promise.all([
			mediaAssetsAdapter.remove(id),
			mediaMetadataAdapter.remove(id),
		]);
	}

	async deleteProjectMedia({
		projectId,
	}: {
		projectId: string;
	}): Promise<void> {
		const { mediaMetadataAdapter, mediaAssetsAdapter } =
			this.getProjectMediaAdapters({ projectId });

		await Promise.all([
			mediaMetadataAdapter.clear(),
			mediaAssetsAdapter.clear(),
		]);
	}

	async clearAllData(): Promise<void> {
		await this.projectsAdapter.clear();
		// project-specific media and timelines cleaned up when projects are deleted
	}

	async getStorageInfo(): Promise<{
		projects: number;
		isOPFSSupported: boolean;
		isIndexedDBSupported: boolean;
	}> {
		const projectIds = await this.projectsAdapter.list();

		return {
			projects: projectIds.length,
			isOPFSSupported: this.isOPFSSupported(),
			isIndexedDBSupported: this.isIndexedDBSupported(),
		};
	}

	async getProjectStorageInfo({ projectId }: { projectId: string }): Promise<{
		mediaItems: number;
	}> {
		const { mediaMetadataAdapter } = this.getProjectMediaAdapters({
			projectId,
		});

		const mediaIds = await mediaMetadataAdapter.list();

		return {
			mediaItems: mediaIds.length,
		};
	}

	async getDetailedStorageStats(): Promise<StorageStats> {
		const estimate = await navigator.storage.estimate();
		const quota = estimate.quota ?? 0;
		const usage = estimate.usage ?? 0;

		const serializedProjects = await this.projectsAdapter.getAll();
		const projects: ProjectStorageStats[] = [];

		for (const serializedProject of serializedProjects) {
			const projectId = serializedProject.metadata.id;
			const { mediaMetadataAdapter } = this.getProjectMediaAdapters({
				projectId,
			});

			try {
				const allMedia = await mediaMetadataAdapter.getAll();
				const byType: ProjectStorageStats["byType"] = {};
				let mediaSize = 0;

				for (const media of allMedia) {
					mediaSize += media.size ?? 0;
					const existing = byType[media.type];
					if (existing) {
						existing.size += media.size ?? 0;
						existing.count += 1;
					} else {
						byType[media.type] = { size: media.size ?? 0, count: 1 };
					}
				}

				projects.push({
					projectId,
					projectName: serializedProject.metadata.name,
					mediaSize,
					mediaCount: allMedia.length,
					byType,
				});
			} catch {
				projects.push({
					projectId,
					projectName: serializedProject.metadata.name,
					mediaSize: 0,
					mediaCount: 0,
					byType: {},
				});
			}
		}

		projects.sort((a, b) => b.mediaSize - a.mediaSize);

		return { quota, usage, projects };
	}

	async loadSavedSounds(): Promise<SavedSoundsData> {
		try {
			const savedSoundsData = await this.savedSoundsAdapter.get("user-sounds");
			return (
				savedSoundsData || {
					sounds: [],
					lastModified: new Date().toISOString(),
				}
			);
		} catch (error) {
			console.error("Failed to load saved sounds:", error);
			return { sounds: [], lastModified: new Date().toISOString() };
		}
	}

	async saveSoundEffect({
		soundEffect,
	}: {
		soundEffect: SoundEffect;
	}): Promise<void> {
		try {
			const currentData = await this.loadSavedSounds();

			if (currentData.sounds.some((sound) => sound.id === soundEffect.id)) {
				return; // Already saved
			}

			const savedSound: SavedSound = {
				id: soundEffect.id,
				name: soundEffect.name,
				username: soundEffect.username,
				previewUrl: soundEffect.previewUrl,
				downloadUrl: soundEffect.downloadUrl,
				duration: soundEffect.duration,
				tags: soundEffect.tags,
				license: soundEffect.license,
				savedAt: new Date().toISOString(),
			};

			const updatedData: SavedSoundsData = {
				sounds: [...currentData.sounds, savedSound],
				lastModified: new Date().toISOString(),
			};

			await this.savedSoundsAdapter.set("user-sounds", updatedData);
		} catch (error) {
			console.error("Failed to save sound effect:", error);
			throw error;
		}
	}

	async removeSavedSound({ soundId }: { soundId: number }): Promise<void> {
		try {
			const currentData = await this.loadSavedSounds();

			const updatedData: SavedSoundsData = {
				sounds: currentData.sounds.filter((sound) => sound.id !== soundId),
				lastModified: new Date().toISOString(),
			};

			await this.savedSoundsAdapter.set("user-sounds", updatedData);
		} catch (error) {
			console.error("Failed to remove saved sound:", error);
			throw error;
		}
	}

	async isSoundSaved({ soundId }: { soundId: number }): Promise<boolean> {
		try {
			const currentData = await this.loadSavedSounds();
			return currentData.sounds.some((sound) => sound.id === soundId);
		} catch (error) {
			console.error("Failed to check if sound is saved:", error);
			return false;
		}
	}

	async clearSavedSounds(): Promise<void> {
		try {
			await this.savedSoundsAdapter.remove("user-sounds");
		} catch (error) {
			console.error("Failed to clear saved sounds:", error);
			throw error;
		}
	}

	isOPFSSupported(): boolean {
		return OPFSAdapter.isSupported();
	}

	isIndexedDBSupported(): boolean {
		return "indexedDB" in window;
	}

	isFullySupported(): boolean {
		return this.isIndexedDBSupported() && this.isOPFSSupported();
	}
}

// 默认 storageService 单例,使用 IndexedDB(cutia 原生行为)。
// canana-vue 集成场景下,通过 __replaceStorageServiceForIntegration 替换为
// 注入了 RemoteStorageAdapter 的实例。cutia 内部所有 `import { storageService }`
// 都是标准命名 import,ES Module live binding 保证替换后内部代码零修改。
export let storageService = new StorageService();
export { StorageService };

// 集成专用:替换全局 storageService 单例。仅在 React mount 前(VideoEditor 挂载前)
// 调用一次即可。不要在运行时反复替换,会导致已经持有引用的代码使用旧实例。
export function __replaceStorageServiceForIntegration(svc: StorageService) {
	storageService = svc;
}
