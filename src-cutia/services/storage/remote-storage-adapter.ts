import type { SerializedProject, StorageAdapter } from "./types";

/**
 * Remote storage adapter — 把 cutia 的 SerializedProject 持久化到 canana-vue 后端。
 *
 * 仅在 canana-vue 集成环境下使用,通过 storage-bridge 注入到 StorageService。
 * cutia 原项目继续使用 IndexedDBAdapter,本文件不影响上游同步。
 *
 * API 契约:
 *   GET    /api/video-projects          — 列表(items 不含 scenes,节省带宽)
 *   GET    /api/video-projects/:id      — 单个项目完整数据
 *   PUT    /api/video-projects/:id      — 全量保存(upsert,含软删恢复)
 *   DELETE /api/video-projects/:id      — 软删除
 *
 * 鉴权: 同域 Cookie(canana_session)自动随 fetch 发送,后端 requireCurrentSessionUser 拦截。
 */
export class RemoteStorageAdapter
	implements StorageAdapter<SerializedProject>
{
	constructor(private readonly baseUrl: string = "/api/video-projects") {}

	async get(key: string): Promise<SerializedProject | null> {
		const res = await fetch(`${this.baseUrl}/${encodeURIComponent(key)}`, {
			credentials: "include",
			cache: "no-store",
		});
		if (res.status === 404) return null;
		if (!res.ok) {
			throw new Error(`Failed to load project ${key}: HTTP ${res.status}`);
		}
		const body = (await res.json()) as { data: SerializedProject };
		return body.data;
	}

	async set(key: string, value: SerializedProject): Promise<void> {
		const res = await fetch(`${this.baseUrl}/${encodeURIComponent(key)}`, {
			method: "PUT",
			credentials: "include",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(value),
		});
		if (!res.ok) {
			throw new Error(`Failed to save project ${key}: HTTP ${res.status}`);
		}
	}

	async remove(key: string): Promise<void> {
		const res = await fetch(`${this.baseUrl}/${encodeURIComponent(key)}`, {
			method: "DELETE",
			credentials: "include",
		});
		if (!res.ok && res.status !== 404) {
			throw new Error(`Failed to delete project ${key}: HTTP ${res.status}`);
		}
	}

	async list(): Promise<string[]> {
		const res = await fetch(`${this.baseUrl}?scope=mine&pageSize=120`, {
			credentials: "include",
			cache: "no-store",
		});
		if (!res.ok) {
			throw new Error(`Failed to list projects: HTTP ${res.status}`);
		}
		const body = (await res.json()) as {
			data: { items: Array<{ metadata: { id: string } }> };
		};
		return body.data.items.map((item) => item.metadata.id);
	}

	// 接口约定: clear 会删除所有项目。远程模式禁用,避免误删全用户数据。
	async clear(): Promise<void> {
		throw new Error("RemoteStorageAdapter.clear() is not supported");
	}

	// StorageService 的 loadAllProjectsMetadata 会调用 getAll;
	// 远程列表 items 不含 scenes,所以 fan-out 调 get 拉详细。项目数有限可接受。
	async getAll(): Promise<SerializedProject[]> {
		const ids = await this.list();
		const projects = await Promise.all(ids.map((id) => this.get(id)));
		return projects.filter((p): p is SerializedProject => p !== null);
	}
}
