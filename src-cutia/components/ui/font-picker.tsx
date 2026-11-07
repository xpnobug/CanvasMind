import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@cutia/components/ui/select";
import { FONT_OPTIONS, type FontFamily } from "@cutia/constants/font-constants";
import { cn } from "@cutia/utils/ui";

interface FontPickerProps {
	defaultValue?: FontFamily;
	onValueChange?: (value: FontFamily) => void;
	className?: string;
}

export function FontPicker({
	defaultValue,
	onValueChange,
	className,
}: FontPickerProps) {
	return (
		<Select defaultValue={defaultValue} onValueChange={onValueChange}>
			<SelectTrigger
				className={cn("w-full", className)}
			>
				<SelectValue placeholder="Select a font" />
			</SelectTrigger>
			<SelectContent>
				{FONT_OPTIONS.map((font) => (
					<SelectItem
						key={font.value}
						value={font.value}
						style={{ fontFamily: font.value }}
					>
						{font.label}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}
