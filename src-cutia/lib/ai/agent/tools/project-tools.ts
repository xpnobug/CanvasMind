import { EditorCore } from "@cutia/core";
import type { AgentTool } from "./types";

export const getProjectInfoTool: AgentTool = {
	name: "get_project_info",
	description:
		"Get the current project state including canvas size, FPS, duration, track summary, and available media assets.",
	parameters: {
		type: "object",
		properties: {},
		required: [],
	},
	async execute() {
		const editor = EditorCore.getInstance();
		const project = editor.project.getActiveOrNull();
		if (!project) {
			return { success: false, message: "No active project" };
		}

		const tracks = editor.timeline.getTracks();
		const assets = editor.media.getAssets();
		const duration = editor.timeline.getTotalDuration();

		const trackSummary = tracks.map((track) => ({
			id: track.id,
			type: track.type,
			name: track.name,
			elementCount: track.elements.length,
			isMain: "isMain" in track ? track.isMain : false,
		}));

		const assetSummary = assets.map((asset) => ({
			id: asset.id,
			name: asset.name,
			type: asset.type,
			duration: asset.duration,
			width: asset.width,
			height: asset.height,
		}));

		return {
			success: true,
			message: "Project info retrieved",
			data: {
				name: project.metadata.name,
				canvasSize: project.settings.canvasSize,
				fps: project.settings.fps,
				background: project.settings.background,
				duration,
				tracks: trackSummary,
				mediaAssets: assetSummary,
			},
		};
	},
};

export const updateProjectSettingsTool: AgentTool = {
	name: "update_project_settings",
	description:
		"Update project settings such as canvas size (width/height), FPS, or background color.",
	parameters: {
		type: "object",
		properties: {
			width: {
				type: "number",
				description: "Canvas width in pixels",
			},
			height: {
				type: "number",
				description: "Canvas height in pixels",
			},
			fps: {
				type: "number",
				description: "Frames per second (e.g. 24, 30, 60)",
			},
			backgroundColor: {
				type: "string",
				description: "Background color as hex string (e.g. '#000000')",
			},
		},
		required: [],
	},
	async execute(args) {
		const editor = EditorCore.getInstance();
		const project = editor.project.getActiveOrNull();
		if (!project) {
			return { success: false, message: "No active project" };
		}

		const updates: Record<string, unknown> = {};
		const width = args.width as number | undefined;
		const height = args.height as number | undefined;

		if (width || height) {
			updates.canvasSize = {
				width: width ?? project.settings.canvasSize.width,
				height: height ?? project.settings.canvasSize.height,
			};
		}

		if (args.fps) {
			updates.fps = args.fps;
		}

		if (args.backgroundColor) {
			updates.background = {
				type: "color",
				color: args.backgroundColor,
			};
		}

		if (Object.keys(updates).length === 0) {
			return { success: false, message: "No settings to update" };
		}

		editor.project.updateSettings({ settings: updates });
		return {
			success: true,
			message: `Project settings updated: ${Object.keys(updates).join(", ")}`,
		};
	},
};

export const projectTools: AgentTool[] = [
	getProjectInfoTool,
	updateProjectSettingsTool,
];
