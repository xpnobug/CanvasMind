
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@cutia/components/ui/dialog";
import { useEditor } from "@cutia/hooks/use-editor";
import { Loader2 } from "lucide-react";
import { useTranslation } from "@i18next-toolkit/nextjs-approuter";

export function MigrationDialog() {
	const { t } = useTranslation();
	const editor = useEditor();
	const migrationState = editor.project.getMigrationState();

	if (!migrationState.isMigrating) return null;

	const title = migrationState.projectName
		? t('Updating project')
		: t('Updating projects');
	const description = migrationState.projectName
		? t('Upgrading "{{name}}" from v{{from}} to v{{to}}', {
				name: migrationState.projectName,
				from: migrationState.fromVersion,
				to: migrationState.toVersion,
			})
		: t('Upgrading projects from v{{from}} to v{{to}}', {
				from: migrationState.fromVersion,
				to: migrationState.toVersion,
			});

	return (
		<Dialog open={true}>
			<DialogContent
				className="sm:max-w-md"
				onPointerDownOutside={(event) => event.preventDefault()}
				onEscapeKeyDown={(event) => event.preventDefault()}
			>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>

				<div className="flex items-center justify-center py-4">
					<Loader2 className="text-muted-foreground size-8 animate-spin" />
				</div>
			</DialogContent>
		</Dialog>
	);
}
