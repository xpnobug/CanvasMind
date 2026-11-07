import { create } from "zustand";
import { persist } from "zustand/middleware";
import { generateUUID } from "@cutia/utils/id";
import { uploadReferenceImage } from "@cutia/lib/media/upload-reference";
import type {
	AICharacter,
	CharacterImage,
	CharacterGeneration,
} from "@cutia/types/character";

const CHARACTER_IMAGES_DB = "ai-character-images";
const CHARACTER_IMAGES_STORE = "images";

function openCharacterImageDB(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(CHARACTER_IMAGES_DB, 1);
		request.onerror = () => reject(request.error);
		request.onsuccess = () => resolve(request.result);
		request.onupgradeneeded = (event) => {
			const db = (event.target as IDBOpenDBRequest).result;
			if (!db.objectStoreNames.contains(CHARACTER_IMAGES_STORE)) {
				db.createObjectStore(CHARACTER_IMAGES_STORE, { keyPath: "id" });
			}
		};
	});
}

export async function storeCharacterImageBlob({
	id,
	blob,
}: {
	id: string;
	blob: Blob;
}): Promise<void> {
	const db = await openCharacterImageDB();
	await new Promise<void>((resolve, reject) => {
		const tx = db.transaction([CHARACTER_IMAGES_STORE], "readwrite");
		const store = tx.objectStore(CHARACTER_IMAGES_STORE);
		const request = store.put({ id, blob, size: blob.size });
		request.onerror = () => reject(request.error);
		request.onsuccess = () => resolve();
	});
}

export async function getCharacterImageBlob({
	id,
}: {
	id: string;
}): Promise<Blob | null> {
	try {
		const db = await openCharacterImageDB();
		return await new Promise((resolve, reject) => {
			const tx = db.transaction([CHARACTER_IMAGES_STORE], "readonly");
			const store = tx.objectStore(CHARACTER_IMAGES_STORE);
			const request = store.get(id);
			request.onerror = () => reject(request.error);
			request.onsuccess = () => {
				const record = request.result as
					| { id: string; blob: Blob }
					| undefined;
				resolve(record?.blob ?? null);
			};
		});
	} catch {
		return null;
	}
}

async function removeCharacterImageBlob({
	id,
}: {
	id: string;
}): Promise<void> {
	try {
		const db = await openCharacterImageDB();
		await new Promise<void>((resolve, reject) => {
			const tx = db.transaction([CHARACTER_IMAGES_STORE], "readwrite");
			const store = tx.objectStore(CHARACTER_IMAGES_STORE);
			const request = store.delete(id);
			request.onerror = () => reject(request.error);
			request.onsuccess = () => resolve();
		});
	} catch {
		// best-effort cleanup
	}
}

export function createImageThumbnailDataUrl({
	blob,
}: {
	blob: Blob;
}): Promise<string> {
	return new Promise((resolve, reject) => {
		const url = URL.createObjectURL(blob);
		const image = new Image();
		image.addEventListener("load", () => {
			try {
				const maxSize = 200;
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
					reject(new Error("Could not get canvas context"));
					return;
				}
				context.drawImage(image, 0, 0, width, height);
				resolve(canvas.toDataURL("image/jpeg", 0.7));
			} catch (error) {
				reject(
					error instanceof Error
						? error
						: new Error("Failed to create thumbnail"),
				);
			} finally {
				image.remove();
				URL.revokeObjectURL(url);
			}
		});
		image.addEventListener("error", () => {
			image.remove();
			URL.revokeObjectURL(url);
			reject(new Error("Failed to load image for thumbnail"));
		});
		image.src = url;
	});
}

interface CharacterStoreState {
	characters: AICharacter[];

	addCharacter: (params: {
		name: string;
		description: string;
	}) => string;

	updateCharacter: (params: {
		id: string;
		updates: Partial<
			Pick<AICharacter, "name" | "description" | "styleDescription">
		>;
	}) => void;

	deleteCharacter: (params: { id: string }) => void;

	addImage: (params: {
		characterId: string;
		image: CharacterImage;
	}) => void;

	removeImage: (params: {
		characterId: string;
		imageId: string;
	}) => void;

	addGeneration: (params: {
		characterId: string;
		generation: CharacterGeneration;
	}) => void;

	removeGeneration: (params: {
		characterId: string;
		generationId: string;
	}) => void;

	getCharacterById: (params: { id: string }) => AICharacter | undefined;

	getCharacterByName: (params: {
		name: string;
	}) => AICharacter | undefined;
}

export const useCharacterStore = create<CharacterStoreState>()(
	persist(
		(set, get) => ({
			characters: [],

			addCharacter: ({ name, description }) => {
				const now = new Date().toISOString();
				const id = generateUUID();
				const character: AICharacter = {
					id,
					name,
					description,
					images: [],
					generations: [],
					createdAt: now,
					updatedAt: now,
				};
				set((state) => ({
					characters: [character, ...state.characters],
				}));
				return id;
			},

			updateCharacter: ({ id, updates }) => {
				set((state) => ({
					characters: state.characters.map((character) =>
						character.id === id
							? {
									...character,
									...updates,
									updatedAt: new Date().toISOString(),
								}
							: character,
					),
				}));
			},

			deleteCharacter: ({ id }) => {
				const character = get().characters.find((c) => c.id === id);
				if (character) {
					for (const image of character.images) {
						void removeCharacterImageBlob({ id: image.blobKey });
					}
				}
				set((state) => ({
					characters: state.characters.filter((c) => c.id !== id),
				}));
			},

			addImage: ({ characterId, image }) => {
				set((state) => ({
					characters: state.characters.map((character) => {
						if (character.id !== characterId) return character;
						const isFirstImage = character.images.length === 0;
						return {
							...character,
							images: [...character.images, image],
							thumbnailDataUrl: isFirstImage
								? image.thumbnailDataUrl
								: character.thumbnailDataUrl,
							updatedAt: new Date().toISOString(),
						};
					}),
				}));
			},

			removeImage: ({ characterId, imageId }) => {
				const character = get().characters.find(
					(c) => c.id === characterId,
				);
				const image = character?.images.find((i) => i.id === imageId);
				if (image) {
					void removeCharacterImageBlob({ id: image.blobKey });
				}
				set((state) => ({
					characters: state.characters.map((c) => {
						if (c.id !== characterId) return c;
						const updatedImages = c.images.filter(
							(i) => i.id !== imageId,
						);
						return {
							...c,
							images: updatedImages,
							thumbnailDataUrl:
								updatedImages.length > 0
									? updatedImages[0].thumbnailDataUrl
									: undefined,
							updatedAt: new Date().toISOString(),
						};
					}),
				}));
			},

			addGeneration: ({ characterId, generation }) => {
				set((state) => ({
					characters: state.characters.map((character) =>
						character.id === characterId
							? {
									...character,
									generations: [
										generation,
										...character.generations,
									],
									updatedAt: new Date().toISOString(),
								}
							: character,
					),
				}));
			},

			removeGeneration: ({ characterId, generationId }) => {
				set((state) => ({
					characters: state.characters.map((character) =>
						character.id === characterId
							? {
									...character,
									generations: character.generations.filter(
										(g) => g.id !== generationId,
									),
									updatedAt: new Date().toISOString(),
								}
							: character,
					),
				}));
			},

			getCharacterById: ({ id }) => {
				return get().characters.find((c) => c.id === id);
			},

			getCharacterByName: ({ name }) => {
				const lowerName = name.toLowerCase();
				return get().characters.find(
					(c) => c.name.toLowerCase() === lowerName,
				);
			},
		}),
		{
			name: "ai-characters",
		},
	),
);

export async function resolveCharacterReferenceUrl({
	characterId,
}: {
	characterId: string;
}): Promise<string> {
	const character = useCharacterStore
		.getState()
		.getCharacterById({ id: characterId });

	if (!character || character.images.length === 0) {
		throw new Error(
			`Character '${characterId}' not found or has no reference images`,
		);
	}

	const firstImage = character.images[0];

	if (firstImage.referenceUrl) {
		return firstImage.referenceUrl;
	}

	const blob = await getCharacterImageBlob({ id: firstImage.blobKey });
	if (!blob) {
		throw new Error("Character reference image blob not found in storage");
	}

	const file = new File([blob], `character-${characterId}.png`, {
		type: blob.type || "image/png",
	});

	const url = await uploadReferenceImage({ file });

	useCharacterStore.setState((state) => ({
		characters: state.characters.map((c) => {
			if (c.id !== characterId) return c;
			return {
				...c,
				images: c.images.map((img) =>
					img.id === firstImage.id
						? { ...img, referenceUrl: url }
						: img,
				),
			};
		}),
	}));

	return url;
}
