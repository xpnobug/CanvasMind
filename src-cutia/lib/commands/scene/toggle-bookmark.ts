import { Command } from "@cutia/lib/commands/base-command";
import { EditorCore } from "@cutia/core";
import type { TScene } from "@cutia/types/timeline";
import { updateSceneInArray } from "@cutia/lib/scenes";
import { getFrameTime, toggleBookmarkInArray } from "@cutia/lib/timeline/bookmarks";

export class ToggleBookmarkCommand extends Command {
	private savedScenes: TScene[] | null = null;
	private frameTime: number = 0;

	constructor(private time: number) {
		super();
	}

	execute(): void {
		const editor = EditorCore.getInstance();
		const activeScene = editor.scenes.getActiveScene();
		const activeProject = editor.project.getActive();

		if (!activeScene || !activeProject) {
			return;
		}

		const scenes = editor.scenes.getScenes();
		this.savedScenes = [...scenes];

		this.frameTime = getFrameTime({
			time: this.time,
			fps: activeProject.settings.fps,
		});

		const updatedBookmarks = toggleBookmarkInArray({
			bookmarks: activeScene.bookmarks,
			frameTime: this.frameTime,
		});

		const updatedScenes = updateSceneInArray({
			scenes,
			sceneId: activeScene.id,
			updates: { bookmarks: updatedBookmarks },
		});

		editor.scenes.setScenes({ scenes: updatedScenes });
	}

	undo(): void {
		if (this.savedScenes) {
			const editor = EditorCore.getInstance();
			editor.scenes.setScenes({ scenes: this.savedScenes });
		}
	}
}
