
import { Button } from "./ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { cn } from "@cutia/utils/ui";
import {
	useLocale,
	useChangeLocale,
} from "@i18next-toolkit/nextjs-approuter";
import { Languages, Check } from "lucide-react";

const SUPPORTED_LANGUAGES = [
	{ code: "en", label: "English" },
	{ code: "zh", label: "中文" },
	{ code: "ja", label: "日本語" },
	{ code: "ko", label: "한국어" },
	{ code: "es", label: "Español" },
	{ code: "pt", label: "Português" },
	{ code: "fr", label: "Français" },
	{ code: "de", label: "Deutsch" },
	{ code: "id", label: "Bahasa Indonesia" },
	{ code: "vi", label: "Tiếng Việt" },
	{ code: "ru", label: "Русский" },
	{ code: "it", label: "Italiano" },
] as const;

interface LanguageToggleProps {
	className?: string;
	iconClassName?: string;
}

export function LanguageToggle({
	className,
	iconClassName,
}: LanguageToggleProps) {
	const currentLanguage = useLocale();
	const changeLocale = useChangeLocale();

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					size="icon"
					variant="ghost"
					type="button"
					className={cn("size-8", className)}
				>
					<Languages className={cn("!size-[1.1rem]", iconClassName)} />
					<span className="sr-only">Switch language</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				{SUPPORTED_LANGUAGES.map((language) => (
					<DropdownMenuItem
						key={language.code}
						className="flex items-center justify-between gap-2"
						onClick={() => changeLocale(language.code)}
					>
						{language.label}
						{currentLanguage === language.code && (
							<Check className="size-3.5" />
						)}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
