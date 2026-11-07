import { Button } from "@cutia/components/ui/button";
import {
	Dialog,
	DialogBody,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@cutia/components/ui/dialog";
import { Input } from "@cutia/components/ui/input";
import { useState } from "react";
import { Label } from "@cutia/components/ui/label";
import { useTranslation } from "@i18next-toolkit/nextjs-approuter";

export function RenameProjectDialog({
	isOpen,
	onOpenChange,
	onConfirm,
	projectName,
}: {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: (newName: string) => void;
	projectName: string;
}) {
	const { t } = useTranslation();
	const [name, setName] = useState(projectName);

	const handleOpenChange = (open: boolean) => {
		if (open) {
			setName(projectName);
		}
		onOpenChange(open);
	};

	return (
		<Dialog open={isOpen} onOpenChange={handleOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{t('Rename project')}</DialogTitle>
				</DialogHeader>

				<DialogBody className="gap-3">
					<Label>{t('New name')}</Label>
					<Input
						value={name}
						onChange={(e) => setName(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								e.preventDefault();
								onConfirm(name);
							}
						}}
						placeholder={t('Enter a new name')}
					/>
				</DialogBody>

				<DialogFooter>
					<Button
						variant="outline"
						onClick={(e) => {
							e.preventDefault();
							e.stopPropagation();
							onOpenChange(false);
						}}
					>
						{t('Cancel')}
					</Button>
					<Button onClick={() => onConfirm(name)}>{t('Rename')}</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
