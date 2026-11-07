import { EditorCore } from "@cutia/core";

export async function uploadReferenceImage({
	file,
}: {
	file: File;
}): Promise<string> {
	const formData = new FormData();
	formData.append("file", file);

	const response = await fetch("/api/upload/image", {
		method: "POST",
		body: formData,
	});

	if (!response.ok) {
		const errorData = await response.json().catch(() => null);
		const message = errorData?.error ?? `Upload failed with status ${response.status}`;
		throw new Error(message);
	}

	const result = await response.json();
	return result.url as string;
}

export async function uploadMediaAssetAsReference({
	mediaId,
}: {
	mediaId: string;
}): Promise<string> {
	const editor = EditorCore.getInstance();
	const assets = editor.media.getAssets();
	const asset = assets.find((a) => a.id === mediaId);

	if (!asset) {
		throw new Error(`Media asset '${mediaId}' not found`);
	}

	if (asset.type !== "image") {
		throw new Error(`Media asset '${mediaId}' is not an image (type: ${asset.type})`);
	}

	return uploadReferenceImage({ file: asset.file });
}
