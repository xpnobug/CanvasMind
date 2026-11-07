import type { MediaType } from "@cutia/types/assets";
import type { MediaAssetData } from "./types";

/**
 * 编辑器素材远端同步层 — 把 MediaManager 写本地 OPFS+IDB 的同时旁路上传到 canana-vue 后端。
 *
 * 仅在 canana-vue 集成环境下使用,通过 storage-bridge 注入到 StorageService。
 * cutia 上游不感知此 sync 通道,所有方法都是 optional,失败仅 warn 不阻塞本地。
 *
 * 后端接口:
 *   GET  /api/asset-items?ids=a,b,c[&scope=mine]  — batch 反查
 *   POST /api/asset-items/upload                  — raw binary + headers 上传
 */

export interface RemoteAssetDto {
	id: string;
	assetType: "image" | "video" | "audio";
	title: string;
	fileUrl: string;
	thumbnailUrl?: string;
	mimeType?: string;
	width?: number;
	height?: number;
	durationSeconds?: number;
	fileSizeBytes?: number;
	source: string;
}

export interface RemoteMediaSync {
	/** 根据 mediaId 集合反查 AssetItem(用于加载项目时把项目 JSON 的 mediaId 还原成 RemoteAssetDto) */
	fetchByIds(ids: string[]): Promise<RemoteAssetDto[]>;
	/** 上传 file 到后端,内部走 /api/asset-items/upload */
	upload(input: {
		assetType: MediaType;
		file: File;
		name: string;
		metadata: Record<string, unknown>;
	}): Promise<RemoteAssetDto>;
	/** 拉取当前用户的全部 AssetItem 列表(供"我的资产" tab 使用,与 mediaSync 同源) */
	listMine(query: {
		assetType: MediaType;
		page: number;
		pageSize: number;
	}): Promise<{ items: RemoteAssetDto[]; total: number }>;
}

export class RemoteMediaSyncAdapter implements RemoteMediaSync {
	// 同 mediaId 上传去重: 同时来的多次 upload 共享一个 Promise,避免重复传文件
	private readonly inflight = new Map<string, Promise<RemoteAssetDto>>();

	constructor(
		private readonly uploadUrl: string,
		private readonly listUrl: string,
	) {}

	async fetchByIds(ids: string[]): Promise<RemoteAssetDto[]> {
		if (ids.length === 0) return [];
		const idsParam = encodeURIComponent(ids.join(","));
		const res = await fetch(`${this.listUrl}?scope=mine&ids=${idsParam}`, {
			credentials: "include",
			cache: "no-store",
		});
		if (!res.ok) {
			throw new Error(`Failed to fetch asset items by ids: HTTP ${res.status}`);
		}
		const body = (await res.json()) as { data: { items: RemoteAssetDto[] } };
		return body.data.items;
	}

	async listMine(query: {
		assetType: MediaType;
		page: number;
		pageSize: number;
	}): Promise<{ items: RemoteAssetDto[]; total: number }> {
		const params = new URLSearchParams({
			scope: "mine",
			assetType: query.assetType,
			page: String(query.page),
			pageSize: String(query.pageSize),
		});
		const res = await fetch(`${this.listUrl}?${params}`, {
			credentials: "include",
			cache: "no-store",
		});
		if (!res.ok) {
			throw new Error(`Failed to list my asset items: HTTP ${res.status}`);
		}
		const body = (await res.json()) as {
			data: { items: RemoteAssetDto[]; summary: { totalCount: number } };
		};
		return { items: body.data.items, total: body.data.summary.totalCount };
	}

	async upload(input: {
		assetType: MediaType;
		file: File;
		name: string;
		metadata: Record<string, unknown>;
	}): Promise<RemoteAssetDto> {
		// 用文件签名 (name+size+lastModified) 做 in-flight 去重 key
		const dedupeKey = `${input.name}::${input.file.size}::${input.file.lastModified}`;
		const existing = this.inflight.get(dedupeKey);
		if (existing) return existing;

		const promise = this.doUpload(input);
		this.inflight.set(dedupeKey, promise);
		try {
			return await promise;
		} finally {
			this.inflight.delete(dedupeKey);
		}
	}

	private async doUpload(input: {
		assetType: MediaType;
		file: File;
		name: string;
		metadata: Record<string, unknown>;
	}): Promise<RemoteAssetDto> {
		const metaJson = JSON.stringify({
			width: input.metadata.width,
			height: input.metadata.height,
			durationSeconds: input.metadata.duration,
			thumbnailUrl: input.metadata.thumbnailUrl,
			title: input.name,
		});
		// x-media-meta 用 base64 编码,避免 headers 不允许非 ASCII 字符的问题
		const metaBase64 = btoa(unescape(encodeURIComponent(metaJson)));

		const res = await fetch(this.uploadUrl, {
			method: "POST",
			credentials: "include",
			headers: {
				"Content-Type": input.file.type || "application/octet-stream",
				"x-asset-type": input.assetType,
				"x-upload-filename": encodeURIComponent(input.name),
				"x-media-meta": metaBase64,
			},
			body: input.file,
		});
		if (!res.ok) {
			let detail = `HTTP ${res.status}`;
			try {
				const json = (await res.json()) as { message?: string };
				if (json?.message) detail = json.message;
			} catch {
				// 忽略响应解析失败
			}
			throw new Error(`Upload failed: ${detail}`);
		}
		const body = (await res.json()) as { data: RemoteAssetDto };
		return body.data;
	}
}

// 把 RemoteAssetDto 转为 cutia MediaAssetData(占位 File 的 size/lastModified 由调用方注入)
export function remoteAssetToMediaAssetData(
	dto: RemoteAssetDto,
	overrides: { size: number; lastModified: number } = { size: 0, lastModified: Date.now() },
): MediaAssetData {
	return {
		id: dto.id,
		name: dto.title || "untitled",
		type: dto.assetType,
		size: overrides.size,
		lastModified: overrides.lastModified,
		width: dto.width,
		height: dto.height,
		duration: dto.durationSeconds,
		thumbnailUrl: dto.thumbnailUrl,
		assetItemId: dto.id,
		fileUrl: dto.fileUrl,
		mimeType: dto.mimeType,
		uploadStatus: "remote-only",
	};
}
