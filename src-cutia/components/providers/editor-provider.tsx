
import { useEffect, useState } from "react";
import { useRouter } from "@cutia/lib/navigation";
import { Loader2 } from "lucide-react";
import { useEditor } from "@cutia/hooks/use-editor";
import {
	useKeybindingsListener,
	useKeybindingDisabler,
} from "@cutia/hooks/use-keybindings";
import { useEditorActions } from "@cutia/hooks/actions/use-editor-actions";

interface EditorProviderProps {
	projectId: string;
	children: React.ReactNode;
}

export function EditorProvider({ projectId, children }: EditorProviderProps) {
	const editor = useEditor();
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const { disableKeybindings, enableKeybindings } = useKeybindingDisabler();
	const activeProject = editor.project.getActiveOrNull();

	// 【canana-vue 适配】
	// Cutia 原实现：项目不存在时调用 createNewProject 然后 router.replace(/editor/${id})
	// 依赖 Next.js App Router 重新匹配路由并以新 projectId 重挂载组件。
	// 在我们的 SPA 嵌入场景下 router.replace 仅改 history，不触发组件 remount，
	// 导致 useEffect 不重跑、永远卡 Loading。
	// 折中：用内部 state 持有「有效 projectId」，新建项目后更新此 state，
	// useEffect 依赖会重跑 loadProject 用新 id，并最终 setIsLoading(false)。
	// router.replace 仍执行（让 URL 与 state 同步，便于用户分享 URL），但不再依赖它做副作用。
	const [effectiveProjectId, setEffectiveProjectId] = useState(projectId);
	useEffect(() => {
		setEffectiveProjectId(projectId);
	}, [projectId]);

	useEffect(() => {
		if (isLoading) {
			disableKeybindings();
		} else {
			enableKeybindings();
		}
	}, [isLoading, disableKeybindings, enableKeybindings]);

	useEffect(() => {
		let cancelled = false;

		const loadProject = async () => {
			console.log("[CutiaPOC] loadProject start, id=", effectiveProjectId);
			try {
				setIsLoading(true);
				await editor.project.loadProject({ id: effectiveProjectId });
				console.log("[CutiaPOC] loadProject success");

				if (cancelled) return;

				setIsLoading(false);
			} catch (err) {
				console.log("[CutiaPOC] loadProject caught:", err);
				if (cancelled) return;

				const isNotFound =
					err instanceof Error &&
					(err.message.includes("not found") ||
						err.message.includes("does not exist"));
				console.log("[CutiaPOC] isNotFound=", isNotFound);

				if (isNotFound) {
					try {
						console.log("[CutiaPOC] calling createNewProject...");
						const newProjectId = await editor.project.createNewProject({
							name: "Untitled Project",
						});
						console.log("[CutiaPOC] createNewProject returned id=", newProjectId);
						if (cancelled) return;
						router.replace(`/editor/${newProjectId}`);
						setEffectiveProjectId(newProjectId);
						console.log("[CutiaPOC] effectiveProjectId updated; expect re-run");
					} catch (createErr) {
						console.error("[CutiaPOC] createNewProject FAILED:", createErr);
						setError("Failed to create project");
						setIsLoading(false);
					}
				} else {
					setError(
						err instanceof Error ? err.message : "Failed to load project",
					);
					setIsLoading(false);
				}
			}
		};

		loadProject();

		return () => {
			cancelled = true;
		};
	}, [effectiveProjectId, editor, router]);

	if (error) {
		return (
			<div className="bg-background flex h-screen w-screen items-center justify-center">
				<div className="flex flex-col items-center gap-4">
					<p className="text-destructive text-sm">{error}</p>
				</div>
			</div>
		);
	}

	if (isLoading) {
		return (
			<div className="bg-background flex h-screen w-screen items-center justify-center">
				<div className="flex flex-col items-center gap-4">
					<Loader2 className="text-muted-foreground size-8 animate-spin" />
					<p className="text-muted-foreground text-sm">Loading project...</p>
				</div>
			</div>
		);
	}

	if (!activeProject) {
		return (
			<div className="bg-background flex h-screen w-screen items-center justify-center">
				<div className="flex flex-col items-center gap-4">
					<Loader2 className="text-muted-foreground size-8 animate-spin" />
					<p className="text-muted-foreground text-sm">Exiting project...</p>
				</div>
			</div>
		);
	}

	return (
		<>
			<EditorRuntimeBindings />
			{children}
		</>
	);
}

function EditorRuntimeBindings() {
	const editor = useEditor();

	useEffect(() => {
		const handleBeforeUnload = (event: BeforeUnloadEvent) => {
			if (!editor.save.getIsDirty()) return;
			event.preventDefault();
			(event as unknown as { returnValue: string }).returnValue = "";
		};

		window.addEventListener("beforeunload", handleBeforeUnload);
		return () => window.removeEventListener("beforeunload", handleBeforeUnload);
	}, [editor]);

	useEditorActions();
	useKeybindingsListener();
	return null;
}
