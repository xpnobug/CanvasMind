import { Button } from "@cutia/components/ui/button";
import {
	Dialog,
	DialogBody,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@cutia/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@cutia/components/ui/alert";
import { Label } from "@cutia/components/ui/label";
import { Input } from "@cutia/components/ui/input";
import { useTranslation } from "@i18next-toolkit/nextjs-approuter";

export function DeleteProjectDialog({
	isOpen,
	onOpenChange,
	onConfirm,
	projectNames,
}: {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: () => void;
	projectNames: string[];
}) {
	const { t } = useTranslation();
	const count = projectNames.length;
	const isSingle = count === 1;
	const singleName = isSingle ? projectNames[0] : null;

	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent
				onOpenAutoFocus={(event) => {
					event.preventDefault();
					event.stopPropagation();
				}}
			>
				<DialogHeader>
					<DialogTitle>
						{singleName ? (
							t('Delete "{{name}}"?' , { name: singleName })
						) : (
							t("Delete {{num}} projects?", { num: count })
						)}
					</DialogTitle>
				</DialogHeader>
				<DialogBody>
					<Alert variant="destructive">
						<AlertTitle>{t('Warning')}</AlertTitle>
						<AlertDescription>
							{singleName
								? t('This will permanently delete "{{name}}" and all associated files.', { name: singleName })
								: t(
										"This will permanently delete {{num}} projects and all associated files.",
										{ num: count },
									)}
						</AlertDescription>
					</Alert>
					<div className="flex flex-col gap-3">
						<Label className="text-xs font-semibold text-slate-500">
							{t('Type "DELETE" to confirm')}
						</Label>
						<Input
							type="text"
							placeholder="DELETE"
							size="lg"
							variant="destructive"
						/>
					</div>
				</DialogBody>
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						{t('Cancel')}
					</Button>
					<Button variant="destructive" onClick={onConfirm}>
						{t('Delete project')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
