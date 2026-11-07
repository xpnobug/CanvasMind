
import { useTranslation } from "@i18next-toolkit/nextjs-approuter";
import { Input } from "@cutia/components/ui/input";
import { Label } from "@cutia/components/ui/label";
import { Switch } from "@cutia/components/ui/switch";
import { useAgentStore } from "@cutia/stores/agent-store";

export function AgentSettings() {
	const { t } = useTranslation();
	const config = useAgentStore((s) => s.config);
	const autoMode = useAgentStore((s) => s.autoMode);
	const setConfig = useAgentStore((s) => s.setConfig);
	const setAutoMode = useAgentStore((s) => s.setAutoMode);

	return (
		<div className="space-y-4">
			<div className="space-y-2">
				<Label htmlFor="agent-base-url">{t("API Base URL")}</Label>
				<Input
					id="agent-base-url"
					placeholder="https://api.openai.com/v1"
					value={config.baseUrl}
					onChange={(event) => setConfig({ baseUrl: event.target.value })}
				/>
			</div>

			<div className="space-y-2">
				<Label htmlFor="agent-api-key">{t("API Key")}</Label>
				<Input
					id="agent-api-key"
					type="password"
					placeholder="sk-..."
					value={config.apiKey}
					onChange={(event) => setConfig({ apiKey: event.target.value })}
				/>
			</div>

			<div className="space-y-2">
				<Label htmlFor="agent-model">{t("Model")}</Label>
				<Input
					id="agent-model"
					placeholder="gpt-5.2"
					value={config.model}
					onChange={(event) => setConfig({ model: event.target.value })}
				/>
			</div>

			<div className="flex items-center justify-between">
				<div className="space-y-0.5">
					<Label htmlFor="agent-auto-mode">{t("Auto Mode")}</Label>
					<p className="text-muted-foreground text-xs">
						{t("Skip confirmation for AI generation operations")}
					</p>
				</div>
				<Switch
					id="agent-auto-mode"
					checked={autoMode}
					onCheckedChange={setAutoMode}
				/>
			</div>
		</div>
	);
}
