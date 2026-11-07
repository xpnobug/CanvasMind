
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useTranslation } from "@i18next-toolkit/nextjs-approuter";
import {
	Dialog,
	DialogBody,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@cutia/components/ui/dialog";
import { Button } from "@cutia/components/ui/button";
import { Input } from "@cutia/components/ui/input";
import { Textarea } from "@cutia/components/ui/textarea";
import { Label } from "@cutia/components/ui/label";
import { submitFeedback } from "@cutia/services/feedback/feedback-service";
import {
	FEEDBACK_CONTACT_MAX_LENGTH,
	FEEDBACK_CONTENT_MAX_LENGTH,
} from "@cutia/constants/feedback-constants";

const feedbackSchema = z.object({
	content: z
		.string()
		.trim()
		.min(1, "required")
		.max(FEEDBACK_CONTENT_MAX_LENGTH),
	contact: z
		.string()
		.trim()
		.max(FEEDBACK_CONTACT_MAX_LENGTH)
		.optional()
		.or(z.literal("")),
});

type FeedbackFormValues = z.infer<typeof feedbackSchema>;

export function FeedbackDialog({
	open,
	onOpenChange,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const { t } = useTranslation();
	const [isSubmitting, setIsSubmitting] = useState(false);

	const {
		register,
		handleSubmit,
		reset,
		watch,
		formState: { errors },
	} = useForm<FeedbackFormValues>({
		// monorepo has both zod v3 and v4 installed; @hookform/resolvers@3.10.0
		// type signature collapses to a different zod instance than the schema's,
		// so cast through unknown to bridge the structurally-identical types.
		resolver: zodResolver(
			feedbackSchema as unknown as Parameters<typeof zodResolver>[0],
		),
		defaultValues: { content: "", contact: "" },
	});

	const contentValue = watch("content") ?? "";
	const contentError = errors.content;

	const onSubmit = async (values: FeedbackFormValues) => {
		if (isSubmitting) return;
		setIsSubmitting(true);
		try {
			await submitFeedback({
				content: values.content,
				contact: values.contact ?? "",
			});
			toast.success(t("Thanks for your feedback!"));
			reset();
			onOpenChange(false);
		} catch {
			toast.error(t("Failed to submit feedback. Please try again."));
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[520px]">
				<form onSubmit={handleSubmit(onSubmit)}>
					<DialogHeader className="pb-5">
						<DialogTitle>{t("Share your feedback")}</DialogTitle>
						<DialogDescription>
							{t(
								"Help us improve Cutia — let us know what's working, what's not, or what you'd like to see.",
							)}
						</DialogDescription>
					</DialogHeader>

					<DialogBody className="gap-5">
						<div className="flex flex-col gap-2">
							<Label htmlFor="feedback-content">
								{t("What's on your mind?")}
							</Label>
							<Textarea
								id="feedback-content"
								rows={6}
								maxLength={FEEDBACK_CONTENT_MAX_LENGTH}
								placeholder={t("What's on your mind?")}
								aria-invalid={contentError ? "true" : "false"}
								className="min-h-32 resize-y"
								{...register("content")}
							/>
							<div className="flex items-center justify-between text-xs">
								<span className="text-destructive">
									{contentError ? t("Please share your feedback") : null}
								</span>
								<span className="text-muted-foreground tabular-nums">
									{contentValue.length}/{FEEDBACK_CONTENT_MAX_LENGTH}
								</span>
							</div>
						</div>

						<div className="flex flex-col gap-2">
							<Label htmlFor="feedback-contact">
								{t("Your email or social handle (optional)")}
							</Label>
							<Input
								id="feedback-contact"
								type="text"
								maxLength={FEEDBACK_CONTACT_MAX_LENGTH}
								placeholder={t("Your email or social handle (optional)")}
								{...register("contact")}
							/>
							<span className="text-muted-foreground text-xs">
								{t("We'll only use this to follow up on your feedback.")}
							</span>
						</div>
					</DialogBody>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={isSubmitting}
						>
							{t("Cancel")}
						</Button>
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting ? t("Submitting...") : t("Submit")}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
