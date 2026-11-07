import { EditorCore } from "@cutia/core";
import type { AgentTool } from "./types";

export const listMediaAssetsTool: AgentTool = {
	name: "list_media_assets",
	description:
		"List all media assets available in the current project (images, videos, audio files) with their properties.",
	parameters: {
		type: "object",
		properties: {},
		required: [],
	},
	async execute() {
		const editor = EditorCore.getInstance();
		const assets = editor.media.getAssets();

		const assetList = assets.map((asset) => ({
			id: asset.id,
			name: asset.name,
			type: asset.type,
			duration: asset.duration,
			width: asset.width,
			height: asset.height,
		}));

		return {
			success: true,
			message: `Found ${assetList.length} media asset(s)`,
			data: { assets: assetList },
		};
	},
};

export const mediaTools: AgentTool[] = [listMediaAssetsTool];
