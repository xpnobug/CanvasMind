
import { Button } from "../ui/button";
import { useRef, useState } from "react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { RenameProjectDialog } from "./dialogs/rename-project-dialog";
import { DeleteProjectDialog } from "./dialogs/delete-project-dialog";
import { useRouter } from "@cutia/lib/navigation";
import { ExportButton } from "./export-button";
import { ThemeToggle } from "../theme-toggle";
import { LanguageToggle } from "../language-toggle";
import { DEFAULT_LOGO_URL } from "@cutia/constants/site-constants";
import { toast } from "sonner";
import { useEditor } from "@cutia/hooks/use-editor";
import {
	ArrowLeft02Icon,
	BubbleChatIcon,
	CommandIcon,
	SparklesIcon,
} from "@hugeicons/core-free-icons";
import { FeedbackTrigger } from "@cutia/components/feedback/feedback-trigger";
import { HugeiconsIcon } from "@hugeicons/react";
import { ShortcutsDialog } from "./dialogs/shortcuts-dialog";
import { cn } from "@cutia/utils/ui";
import { useTranslation } from "@i18next-toolkit/nextjs-approuter";
import { useAgentStore } from "@cutia/stores/agent-store";

export function EditorHeader() {
	const { t } = useTranslation();
	return (
		<header className="bg-background flex h-[3.4rem] items-center justify-between px-3 pt-0.5">
			<div className="flex items-center gap-1">
				<ProjectDropdown />
				<EditableProjectName />
			</div>
			<nav className="flex items-center gap-2">
				<FeedbackTrigger>
					<Button
						type="button"
						variant="ghost"
						size="icon"
						aria-label={t("Feedback")}
						title={t("Feedback")}
					>
						<HugeiconsIcon icon={BubbleChatIcon} className="size-4" />
					</Button>
				</FeedbackTrigger>
				<LanguageToggle />
				<ThemeToggle />
				<AgentToggle />
				<ExportButton />
			</nav>
		</header>
	);
}

function ProjectDropdown() {
	const { t } = useTranslation();
	const [openDialog, setOpenDialog] = useState<
		"delete" | "rename" | "shortcuts" | null
	>(null);
	const [isExiting, setIsExiting] = useState(false);
	const router = useRouter();
	const editor = useEditor();
	const activeProject = editor.project.getActive();

	const handleExit = async () => {
		if (isExiting) return;
		setIsExiting(true);

		try {
			await editor.project.prepareExit();
			editor.project.closeProject();
		} catch (error) {
			console.error("Failed to prepare project exit:", error);
		} finally {
			editor.project.closeProject();
			router.push("/projects");
		}
	};

	const handleSaveProjectName = async (newName: string) => {
		if (
			activeProject &&
			newName.trim() &&
			newName !== activeProject.metadata.name
		) {
			try {
				await editor.project.renameProject({
					id: activeProject.metadata.id,
					name: newName.trim(),
				});
			} catch (error) {
				toast.error(t("Failed to rename project"), {
					description:
						error instanceof Error ? error.message : t("Please try again"),
				});
			} finally {
				setOpenDialog(null);
			}
		}
	};

	const handleDeleteProject = async () => {
		if (activeProject) {
			try {
				await editor.project.deleteProjects({
					ids: [activeProject.metadata.id],
				});
				router.push("/projects");
			} catch (error) {
				toast.error(t("Failed to delete project"), {
					description:
						error instanceof Error ? error.message : t("Please try again"),
				});
			} finally {
				setOpenDialog(null);
			}
		}
	};

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="ghost" size="icon" className="p-1 rounded-sm size-8">
						<img
							src={DEFAULT_LOGO_URL}
							alt="Project thumbnail"
							width={32}
							height={32}
							className="dark:invert size-5"
						/>
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="start" className="z-100 w-52">
					<DropdownMenuItem
						className="flex items-center gap-1.5"
						onClick={handleExit}
						disabled={isExiting}
					>
						<HugeiconsIcon icon={ArrowLeft02Icon} className="size-4" />
						{t("Exit project")}
					</DropdownMenuItem>

					<DropdownMenuSeparator />
					<DropdownMenuItem
						className="flex items-center gap-1.5"
						onClick={() => setOpenDialog("shortcuts")}
					>
						<HugeiconsIcon icon={CommandIcon} className="size-4" />
						{t("Keyboard shortcuts")}
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
			<RenameProjectDialog
				isOpen={openDialog === "rename"}
				onOpenChange={(isOpen) => setOpenDialog(isOpen ? "rename" : null)}
				onConfirm={(newName) => handleSaveProjectName(newName)}
				projectName={activeProject?.metadata.name || ""}
			/>
			<DeleteProjectDialog
				isOpen={openDialog === "delete"}
				onOpenChange={(isOpen) => setOpenDialog(isOpen ? "delete" : null)}
				onConfirm={handleDeleteProject}
				projectNames={[activeProject?.metadata.name || ""]}
			/>
			<ShortcutsDialog
				isOpen={openDialog === "shortcuts"}
				onOpenChange={(isOpen) => setOpenDialog(isOpen ? "shortcuts" : null)}
			/>
		</>
	);
}

function EditableProjectName() {
	const { t } = useTranslation();
	const editor = useEditor();
	const activeProject = editor.project.getActive();
	const [isEditing, setIsEditing] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);
	const originalNameRef = useRef("");

	const projectName = activeProject?.metadata.name || "";

	const startEditing = () => {
		if (isEditing) return;
		originalNameRef.current = projectName;
		setIsEditing(true);

		requestAnimationFrame(() => {
			inputRef.current?.select();
		});
	};

	const saveEdit = async () => {
		if (!inputRef.current || !activeProject) return;
		const newName = inputRef.current.value.trim();
		setIsEditing(false);

		if (!newName) {
			inputRef.current.value = originalNameRef.current;
			return;
		}

		if (newName !== originalNameRef.current) {
			try {
				await editor.project.renameProject({
					id: activeProject.metadata.id,
					name: newName,
				});
			} catch (error) {
				toast.error(t("Failed to rename project"), {
					description:
						error instanceof Error ? error.message : t("Please try again"),
				});
			}
		}
	};

	const handleKeyDown = (event: React.KeyboardEvent) => {
		if (event.key === "Enter") {
			event.preventDefault();
			inputRef.current?.blur();
		} else if (event.key === "Escape") {
			event.preventDefault();
			if (inputRef.current) {
				inputRef.current.value = originalNameRef.current;
			}
			setIsEditing(false);
			inputRef.current?.blur();
		}
	};

	return (
		<input
			ref={inputRef}
			type="text"
			defaultValue={projectName}
			readOnly={!isEditing}
			onClick={startEditing}
			onBlur={saveEdit}
			onKeyDown={handleKeyDown}
			style={{ fieldSizing: "content" }}
			className={cn(
				"text-[0.9rem] h-8 px-2 py-1 rounded-sm bg-transparent outline-none cursor-pointer hover:bg-accent hover:text-accent-foreground",
				isEditing && "ring-1 ring-ring cursor-text hover:bg-transparent",
			)}
		/>
	);
}

function AgentToggle() {
	const { t } = useTranslation();
	const isOpen = useAgentStore((s) => s.isOpen);
	const togglePanel = useAgentStore((s) => s.togglePanel);

	return (
		<Button
			variant={isOpen ? "secondary" : "ghost"}
			size="icon"
			onClick={togglePanel}
			title={t("AI Agent")}
			className="size-8"
		>
			<HugeiconsIcon icon={SparklesIcon} className="size-4" />
		</Button>
	);
}
