/**
 * VideoEditor 入口组件 —— Cutia 视频编辑器在 CanvasMind 中的外部 API。
 *
 * 本文件等价于 cutia 原项目 app/[locale]/editor/[project_id]/page.tsx 的内容，
 * 区别：
 *   - projectId 通过 props 传入（不依赖 next/navigation useParams）
 *   - 移除 mobile 分支（POC 阶段仅支持桌面布局，后续 B8 拷贝 mobile 时恢复）
 *
 * 当被 Vue 组件用 React createRoot 挂载时，需保证此组件作为唯一根。
 */

import { ThemeProvider } from "next-themes";
import {
	ResizablePanelGroup,
	ResizablePanel,
	ResizableHandle,
} from "@cutia/components/ui/resizable";
import { TooltipProvider } from "@cutia/components/ui/tooltip";
import { AssetsPanel } from "@cutia/components/editor/panels/assets";
import { AgentPanel } from "@cutia/components/editor/panels/agent";
import { PropertiesPanel } from "@cutia/components/editor/panels/properties";
import { Timeline } from "@cutia/components/editor/panels/timeline";
import { PreviewPanel } from "@cutia/components/editor/panels/preview";
import { EditorHeader } from "@cutia/components/editor/editor-header";
import { EditorProvider } from "@cutia/components/providers/editor-provider";
import { MigrationDialog } from "@cutia/components/editor/dialogs/migration-dialog";
import { usePanelStore } from "@cutia/stores/panel-store";
import { useAgentStore } from "@cutia/stores/agent-store";

export interface VideoEditorProps {
	projectId: string;
}

export function VideoEditor({ projectId }: VideoEditorProps) {
	return (
		<ThemeProvider
			attribute="class"
			defaultTheme="dark"
			enableSystem={false}
			disableTransitionOnChange
		>
			<TooltipProvider>
				<EditorProvider projectId={projectId}>
					<EditorShell />
				</EditorProvider>
			</TooltipProvider>
		</ThemeProvider>
	);
}

function EditorShell() {
	return (
		<div className="cutia-root bg-background flex h-screen w-screen flex-col overflow-hidden">
			<EditorHeader />
			<div className="min-h-0 min-w-0 flex-1 px-3 pb-3">
				<EditorLayout />
			</div>
			<MigrationDialog />
		</div>
	);
}

function EditorLayout() {
	const { panels, setPanel } = usePanelStore();
	const isAgentOpen = useAgentStore((s) => s.isOpen);

	return (
		<ResizablePanelGroup
			direction="horizontal"
			className="size-full gap-[0.19rem]"
			onLayout={(sizes) => {
				if (isAgentOpen && sizes[1] != null) {
					setPanel("agent", sizes[1]);
				}
			}}
		>
			<ResizablePanel
				defaultSize={isAgentOpen ? 100 - panels.agent : 100}
				minSize={50}
				className="min-w-0"
			>
				<ResizablePanelGroup
					direction="vertical"
					className="size-full gap-[0.18rem]"
					onLayout={(sizes) => {
						setPanel("mainContent", sizes[0] ?? panels.mainContent);
						setPanel("timeline", sizes[1] ?? panels.timeline);
					}}
				>
					<ResizablePanel
						defaultSize={panels.mainContent}
						minSize={30}
						maxSize={85}
						className="min-h-0"
					>
						<ResizablePanelGroup
							direction="horizontal"
							className="size-full gap-[0.19rem]"
							onLayout={(sizes) => {
								setPanel("tools", sizes[0] ?? panels.tools);
								setPanel("preview", sizes[1] ?? panels.preview);
								setPanel("properties", sizes[2] ?? panels.properties);
							}}
						>
							<ResizablePanel
								defaultSize={panels.tools}
								minSize={15}
								maxSize={40}
								className="min-w-0"
							>
								<AssetsPanel />
							</ResizablePanel>

							<ResizableHandle withHandle />

							<ResizablePanel
								defaultSize={panels.preview}
								minSize={30}
								className="min-h-0 min-w-0 flex-1"
							>
								<PreviewPanel />
							</ResizablePanel>

							<ResizableHandle withHandle />

							<ResizablePanel
								defaultSize={panels.properties}
								minSize={15}
								maxSize={40}
								className="min-w-0"
							>
								<PropertiesPanel />
							</ResizablePanel>
						</ResizablePanelGroup>
					</ResizablePanel>

					<ResizableHandle withHandle />

					<ResizablePanel
						defaultSize={panels.timeline}
						minSize={15}
						maxSize={70}
						className="min-h-0"
					>
						<Timeline />
					</ResizablePanel>
				</ResizablePanelGroup>
			</ResizablePanel>

			{isAgentOpen && (
				<>
					<ResizableHandle withHandle />
					<ResizablePanel
						defaultSize={panels.agent}
						minSize={15}
						maxSize={35}
						className="min-w-0"
					>
						<AgentPanel />
					</ResizablePanel>
				</>
			)}
		</ResizablePanelGroup>
	);
}
