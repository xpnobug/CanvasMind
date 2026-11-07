import type { StorageAdapter } from "./types";

export class IndexedDBAdapter<T> implements StorageAdapter<T> {
	private dbName: string;
	private storeName: string;
	private version: number;

	constructor(dbName: string, storeName: string, version = 1) {
		this.dbName = dbName;
		this.storeName = storeName;
		this.version = version;
	}

	private async getDB(): Promise<IDBDatabase> {
		return new Promise((resolve, reject) => {
			console.log("[CutiaPOC] IDB open ->", this.dbName);
			const request = indexedDB.open(this.dbName, this.version);
			let settled = false;
			const settle = (fn: () => void) => {
				if (settled) return;
				settled = true;
				fn();
			};

			request.onerror = () =>
				settle(() => {
					console.log("[CutiaPOC] IDB open ERROR", this.dbName, request.error);
					reject(request.error);
				});
			request.onsuccess = () =>
				settle(() => {
					console.log("[CutiaPOC] IDB open SUCCESS", this.dbName);
					resolve(request.result);
				});
			request.onblocked = () =>
				settle(() =>
					reject(new Error(`IndexedDB open blocked: ${this.dbName}`)),
				);

			request.onupgradeneeded = (event) => {
				console.log("[CutiaPOC] IDB onupgradeneeded", this.dbName);
				const db = (event.target as IDBOpenDBRequest).result;
				if (!db.objectStoreNames.contains(this.storeName)) {
					db.createObjectStore(this.storeName, { keyPath: "id" });
				}
			};

			// 兜底：5 秒无响应直接 reject
			setTimeout(() => {
				settle(() => {
					console.log("[CutiaPOC] IDB open TIMEOUT", this.dbName);
					reject(new Error(`IndexedDB open timeout: ${this.dbName}`));
				});
			}, 5000);
		});
	}

	async get(key: string): Promise<T | null> {
		const db = await this.getDB();
		const transaction = db.transaction([this.storeName], "readonly");
		const store = transaction.objectStore(this.storeName);

		return new Promise((resolve, reject) => {
			const request = store.get(key);
			request.onerror = () => reject(request.error);
			request.onsuccess = () => resolve(request.result || null);
		});
	}

	async set(key: string, value: T): Promise<void> {
		const db = await this.getDB();
		const transaction = db.transaction([this.storeName], "readwrite");
		const store = transaction.objectStore(this.storeName);

		return new Promise((resolve, reject) => {
			const request = store.put({ id: key, ...value });
			request.onerror = () => reject(request.error);
			request.onsuccess = () => resolve();
		});
	}

	async remove(key: string): Promise<void> {
		const db = await this.getDB();
		const transaction = db.transaction([this.storeName], "readwrite");
		const store = transaction.objectStore(this.storeName);

		return new Promise((resolve, reject) => {
			const request = store.delete(key);
			request.onerror = () => reject(request.error);
			request.onsuccess = () => resolve();
		});
	}

	async list(): Promise<string[]> {
		const db = await this.getDB();
		const transaction = db.transaction([this.storeName], "readonly");
		const store = transaction.objectStore(this.storeName);

		return new Promise((resolve, reject) => {
			const request = store.getAllKeys();
			request.onerror = () => reject(request.error);
			request.onsuccess = () => resolve(request.result as string[]);
		});
	}

	async getAll(): Promise<T[]> {
		const db = await this.getDB();
		const transaction = db.transaction([this.storeName], "readonly");
		const store = transaction.objectStore(this.storeName);

		return new Promise((resolve, reject) => {
			const request = store.getAll();
			request.onerror = () => reject(request.error);
			request.onsuccess = () => resolve(request.result || []);
		});
	}

	async clear(): Promise<void> {
		const db = await this.getDB();
		const transaction = db.transaction([this.storeName], "readwrite");
		const store = transaction.objectStore(this.storeName);

		return new Promise((resolve, reject) => {
			const request = store.clear();
			request.onerror = () => reject(request.error);
			request.onsuccess = () => resolve();
		});
	}
}

export async function deleteDatabase({
	dbName,
}: {
	dbName: string;
}): Promise<void> {
	return new Promise((resolve, reject) => {
		console.log("[CutiaPOC] IDB delete ->", dbName);
		const request = indexedDB.deleteDatabase(dbName);
		let settled = false;
		const settle = (fn: () => void) => {
			if (settled) return;
			settled = true;
			fn();
		};
		request.onsuccess = () =>
			settle(() => {
				console.log("[CutiaPOC] IDB delete SUCCESS", dbName);
				resolve();
			});
		request.onerror = () =>
			settle(() => {
				console.log("[CutiaPOC] IDB delete ERROR", dbName, request.error);
				reject(request.error);
			});
		request.onblocked = () =>
			settle(() => {
				console.log("[CutiaPOC] IDB delete BLOCKED ->", dbName, "(fallback resolve)");
				resolve();
			});
		// 兜底：某些环境（HMR/dev tools 占用）deleteDatabase 既不触发 success 也不 blocked
		// 2 秒后直接放行，避免无限挂起
		setTimeout(() => {
			settle(() => {
				console.log("[CutiaPOC] IDB delete TIMEOUT ->", dbName, "(skip)");
				resolve();
			});
		}, 2000);
	});
}
