import { create } from "zustand";
import { persist } from "zustand/middleware";

const HISTORY_IMAGES_DB = "ai-generation-history-images";
const HISTORY_IMAGES_STORE = "images";
const MAX_STORAGE_BYTES = 50 * 1024 * 1024;

interface StoredImageRecord {
	id: string;
	blob: Blob;
	size: number;
	createdAt: string;
}

function openImageDB(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(HISTORY_IMAGES_DB, 1);
		request.onerror = () => reject(request.error);
		request.onsuccess = () => resolve(request.result);
		request.onupgradeneeded = (event) => {
			const db = (event.target as IDBOpenDBRequest).result;
			if (!db.objectStoreNames.contains(HISTORY_IMAGES_STORE)) {
				db.createObjectStore(HISTORY_IMAGES_STORE, {
					keyPath: "id",
				});
			}
		};
	});
}

function getAllRecords({
	db,
}: {
	db: IDBDatabase;
}): Promise<StoredImageRecord[]> {
	return new Promise((resolve, reject) => {
		const tx = db.transaction([HISTORY_IMAGES_STORE], "readonly");
		const store = tx.objectStore(HISTORY_IMAGES_STORE);
		const request = store.getAll();
		request.onerror = () => reject(request.error);
		request.onsuccess = () => resolve(request.result || []);
	});
}

async function evictOldest({
	db,
	incomingSize,
}: {
	db: IDBDatabase;
	incomingSize: number;
}): Promise<void> {
	const records = await getAllRecords({ db });
	let totalSize = records.reduce((sum, record) => sum + record.size, 0);

	if (totalSize + incomingSize <= MAX_STORAGE_BYTES) return;

	const sorted = [...records].sort((a, b) =>
		a.createdAt.localeCompare(b.createdAt),
	);
	const idsToRemove: string[] = [];

	for (const record of sorted) {
		if (totalSize + incomingSize <= MAX_STORAGE_BYTES) break;
		totalSize -= record.size;
		idsToRemove.push(record.id);
	}

	if (idsToRemove.length > 0) {
		await new Promise<void>((resolve, reject) => {
			const tx = db.transaction([HISTORY_IMAGES_STORE], "readwrite");
			const store = tx.objectStore(HISTORY_IMAGES_STORE);
			for (const id of idsToRemove) {
				store.delete(id);
			}
			tx.oncomplete = () => resolve();
			tx.onerror = () => reject(tx.error);
		});
	}
}

export async function storeHistoryImage({
	id,
	blob,
	createdAt,
}: {
	id: string;
	blob: Blob;
	createdAt: string;
}): Promise<void> {
	const db = await openImageDB();

	await evictOldest({ db, incomingSize: blob.size });

	await new Promise<void>((resolve, reject) => {
		const tx = db.transaction([HISTORY_IMAGES_STORE], "readwrite");
		const store = tx.objectStore(HISTORY_IMAGES_STORE);
		const request = store.put({
			id,
			blob,
			size: blob.size,
			createdAt,
		});
		request.onerror = () => reject(request.error);
		request.onsuccess = () => resolve();
	});
}

export async function getHistoryImageBlob({
	id,
}: {
	id: string;
}): Promise<Blob | null> {
	try {
		const db = await openImageDB();
		return await new Promise((resolve, reject) => {
			const tx = db.transaction([HISTORY_IMAGES_STORE], "readonly");
			const store = tx.objectStore(HISTORY_IMAGES_STORE);
			const request = store.get(id);
			request.onerror = () => reject(request.error);
			request.onsuccess = () => {
				const record = request.result as
					| StoredImageRecord
					| undefined;
				resolve(record?.blob ?? null);
			};
		});
	} catch {
		return null;
	}
}

async function removeHistoryImage({
	id,
}: {
	id: string;
}): Promise<void> {
	try {
		const db = await openImageDB();
		await new Promise<void>((resolve, reject) => {
			const tx = db.transaction([HISTORY_IMAGES_STORE], "readwrite");
			const store = tx.objectStore(HISTORY_IMAGES_STORE);
			const request = store.delete(id);
			request.onerror = () => reject(request.error);
			request.onsuccess = () => resolve();
		});
	} catch {
		// best-effort cleanup
	}
}

async function clearHistoryImages(): Promise<void> {
	try {
		const db = await openImageDB();
		await new Promise<void>((resolve, reject) => {
			const tx = db.transaction([HISTORY_IMAGES_STORE], "readwrite");
			const store = tx.objectStore(HISTORY_IMAGES_STORE);
			const request = store.clear();
			request.onerror = () => reject(request.error);
			request.onsuccess = () => resolve();
		});
	} catch {
		// best-effort cleanup
	}
}

// --- Thumbnail ---

export function createThumbnailDataUrl({
	imageUrl,
}: {
	imageUrl: string;
}): Promise<string> {
	return new Promise((resolve, reject) => {
		const image = new Image();
		image.crossOrigin = "anonymous";
		image.addEventListener("load", () => {
			try {
				const maxSize = 150;
				const ratio = Math.min(
					maxSize / image.naturalWidth,
					maxSize / image.naturalHeight,
				);
				const width = Math.round(image.naturalWidth * ratio);
				const height = Math.round(image.naturalHeight * ratio);

				const canvas = document.createElement("canvas");
				canvas.width = width;
				canvas.height = height;
				const context = canvas.getContext("2d");
				if (!context) {
					image.remove();
					reject(new Error("Could not get canvas context"));
					return;
				}
				context.drawImage(image, 0, 0, width, height);
				resolve(canvas.toDataURL("image/jpeg", 0.6));
				image.remove();
			} catch (error) {
				image.remove();
				reject(
					error instanceof Error
						? error
						: new Error("Failed to create thumbnail"),
				);
			}
		});
		image.addEventListener("error", () => {
			image.remove();
			reject(new Error("Failed to load image for thumbnail"));
		});
		image.src = imageUrl;
	});
}

// --- Zustand store ---

export interface AIGenerationHistoryEntry {
	id: string;
	type: "image" | "video";
	prompt: string;
	url: string;
	thumbnailUrl?: string;
	provider: string;
	createdAt: string;
}

interface AIGenerationHistoryState {
	entries: AIGenerationHistoryEntry[];

	addEntry: (
		entry: Omit<AIGenerationHistoryEntry, "createdAt">,
	) => void;
	removeEntry: (id: string) => void;
	clearHistory: () => void;
}

export const useAIGenerationHistoryStore =
	create<AIGenerationHistoryState>()(
		persist(
			(set) => ({
				entries: [],

				addEntry: (entry) => {
					const newEntry: AIGenerationHistoryEntry = {
						...entry,
						createdAt: new Date().toISOString(),
					};
					set((state) => ({
						entries: [newEntry, ...state.entries],
					}));
				},

				removeEntry: (id) => {
					void removeHistoryImage({ id });
					set((state) => ({
						entries: state.entries.filter(
							(entry) => entry.id !== id,
						),
					}));
				},

				clearHistory: () => {
					void clearHistoryImages();
					set({ entries: [] });
				},
			}),
			{
				name: "ai-generation-history",
			},
		),
	);
