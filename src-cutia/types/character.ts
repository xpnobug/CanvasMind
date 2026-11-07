export interface CharacterImage {
	id: string;
	label: string;
	prompt: string;
	blobKey: string;
	thumbnailDataUrl: string;
	referenceUrl?: string;
	createdAt: string;
}

export type CharacterGenerationType = "image" | "video";

export interface CharacterGeneration {
	id: string;
	type: CharacterGenerationType;
	prompt: string;
	thumbnailDataUrl?: string;
	url: string;
	provider: string;
	projectId?: string;
	mediaId?: string;
	createdAt: string;
}

export interface AICharacter {
	id: string;
	name: string;
	description: string;
	styleDescription?: string;
	images: CharacterImage[];
	generations: CharacterGeneration[];
	thumbnailDataUrl?: string;
	createdAt: string;
	updatedAt: string;
}
