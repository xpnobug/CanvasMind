
import { AgentView } from "../assets/views/agent/agent-view";

export function AgentPanel() {
	return (
		<div
			className="panel bg-background flex h-full flex-col overflow-hidden rounded-sm border select-text"
			data-keybinding-free
		>
			<AgentView />
		</div>
	);
}
