
import { useTranslation } from "@i18next-toolkit/nextjs-approuter";
import { useCallback, useState } from "react";
import { Button } from "@cutia/components/ui/button";
import { Textarea } from "@cutia/components/ui/textarea";
import type { AgentStatus } from "@cutia/lib/ai/agent/types";
import {
	ArrowUp02Icon,
	Cancel01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

interface AgentInputProps {
	status: AgentStatus;
	onSend: (message: string) => void;
	onCancel: () => void;
}

export function AgentInput({ status, onSend, onCancel }: AgentInputProps) {
	const { t } = useTranslation();
	const [input, setInput] = useState("");
	const isBusy = status !== "idle" && status !== "error";

	const handleSend = useCallback(() => {
		const trimmed = input.trim();
		if (!trimmed || isBusy) return;
		onSend(trimmed);
		setInput("");
	}, [input, isBusy, onSend]);

	const handleKeyDown = useCallback(
		(event: React.KeyboardEvent) => {
			if (event.key === "Enter" && !event.shiftKey) {
				event.preventDefault();
				handleSend();
			}
		},
		[handleSend],
	);

	return (
		<div className="border-t p-3">
			<div className="flex gap-2">
				<Textarea
					value={input}
					onChange={(event) => setInput(event.target.value)}
					onKeyDown={handleKeyDown}
					placeholder={t("Describe what you want to create...")}
					className="min-h-[60px] resize-none"
				/>
				<div className="flex flex-col gap-1">
					{isBusy ? (
						<Button
							type="button"
							size="icon"
							variant="destructive"
							onClick={onCancel}
							title={t("Stop")}
						>
							<HugeiconsIcon icon={Cancel01Icon} className="h-4 w-4" />
						</Button>
					) : (
						<Button
							type="button"
							size="icon"
							onClick={handleSend}
							disabled={!input.trim()}
							title={t("Send")}
						>
							<HugeiconsIcon icon={ArrowUp02Icon} className="h-4 w-4" />
						</Button>
					)}
				</div>
			</div>
		</div>
	);
}
