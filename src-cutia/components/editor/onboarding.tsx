
import { ArrowRightIcon } from "lucide-react";
import { useTranslation } from "@i18next-toolkit/nextjs-approuter";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { SOCIAL_LINKS } from "@cutia/constants/site-constants";
import { useLocalStorage } from "@cutia/hooks/storage/use-local-storage";
import { Button } from "../ui/button";
import { Dialog, DialogBody, DialogContent, DialogTitle } from "../ui/dialog";

export function Onboarding() {
	const { t } = useTranslation();
	const [step, setStep] = useState(0);
	const [hasSeenOnboarding, setHasSeenOnboarding] = useLocalStorage({
		key: "hasSeenOnboarding",
		defaultValue: false,
	});

	const isOpen = !hasSeenOnboarding;

	const handleNext = () => {
		setStep(step + 1);
	};

	const handleClose = () => {
		setHasSeenOnboarding({ value: true });
	};

	const getStepTitle = () => {
		switch (step) {
			case 0:
				return t('Welcome to Cutia Beta! 🎉');
			case 1:
				return t('⚠️ This is a super early beta!');
			case 2:
				return t('🦋 Have fun testing!');
			default:
				return t('Cutia Onboarding');
		}
	};

	const renderStepContent = () => {
		switch (step) {
			case 0:
				return (
					<div className="space-y-5">
						<div className="space-y-3">
						<Title title={t('Welcome to Cutia Beta! 🎉')} />
						<Description description={t("You're among the first to try Cutia - the fully open source CapCut alternative.")} />
						</div>
						<NextButton onClick={handleNext}>{t('Next')}</NextButton>
					</div>
				);
			case 1:
				return (
					<div className="space-y-5">
						<div className="space-y-3">
							<Title title={getStepTitle()} />
							<Description description={t("There's still a ton of things to do to make this editor amazing.")} />
							<Description description={t("A lot of features are still missing. We're working hard to build them out!")} />
							<Description description={t("If you're curious, check out our roadmap [here](https://cutia.msgbyte.com/roadmap)")} />
						</div>
						<NextButton onClick={handleNext}>{t('Next')}</NextButton>
					</div>
				);
			case 2:
				return (
					<div className="space-y-5">
						<div className="space-y-3">
							<Title title={getStepTitle()} />
							<Description
								description={t('Join our [Discord]({{url}}), chat with cool people and share feedback to help make Cutia the best editor ever.', { url: SOCIAL_LINKS.discord })}
							/>
						</div>
						<NextButton onClick={handleClose}>{t('Finish')}</NextButton>
					</div>
				);
			default:
				return null;
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={handleClose}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogTitle>
					<span className="sr-only">{getStepTitle()}</span>
				</DialogTitle>
				<DialogBody>{renderStepContent()}</DialogBody>
			</DialogContent>
		</Dialog>
	);
}

function Title({ title }: { title: string }) {
	return <h2 className="text-lg font-bold md:text-xl">{title}</h2>;
}

function Description({ description }: { description: string }) {
	return (
		<div className="text-muted-foreground">
			<ReactMarkdown
				components={{
					p: ({ children }) => <p className="mb-0">{children}</p>,
					a: ({ href, children }) => (
						<a
							href={href}
							target="_blank"
							rel="noopener noreferrer"
							className="text-foreground hover:text-foreground/80 underline"
						>
							{children}
						</a>
					),
				}}
			>
				{description}
			</ReactMarkdown>
		</div>
	);
}

function NextButton({
	children,
	onClick,
}: {
	children: React.ReactNode;
	onClick: () => void;
}) {
	return (
		<Button onClick={onClick} variant="default" className="w-full">
			{children}
			<ArrowRightIcon className="size-4" />
		</Button>
	);
}
