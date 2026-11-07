
import { type ReactElement, cloneElement, useState } from "react";
import { FeedbackDialog } from "./feedback-dialog";

export function FeedbackTrigger({
	children,
}: {
	children: ReactElement<{ onClick?: () => void }>;
}) {
	const [open, setOpen] = useState(false);

	const trigger = cloneElement(children, {
		onClick: () => setOpen(true),
	});

	return (
		<>
			{trigger}
			<FeedbackDialog open={open} onOpenChange={setOpen} />
		</>
	);
}
