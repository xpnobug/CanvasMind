
import { useState } from "react";
import { useTranslation } from "@i18next-toolkit/nextjs-approuter";
import { i18next } from "@cutia/lib/i18n";
import { toast } from "sonner";
import { Button } from "@cutia/components/ui/button";
import { Checkbox } from "@cutia/components/ui/checkbox";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@cutia/components/ui/select";
import { PanelBaseView } from "@cutia/components/editor/panels/panel-base-view";
import {
	PropertyGroup,
	PropertyItem,
	PropertyItemLabel,
	PropertyItemValue,
} from "./property-item";
import { useEditor } from "@cutia/hooks/use-editor";
import { generateAndInsertSpeech } from "@cutia/lib/tts/service";
import {
	VOICE_PACKS,
	DEFAULT_VOICE_PACK,
} from "@cutia/constants/tts-constants";
import type { TextElement } from "@cutia/types/timeline";

interface TextElementRef {
	element: TextElement;
	trackId: string;
}

export function TextSpeechPanel({
	elements: elementRefs,
}: {
	elements: TextElementRef[];
}) {
	const { t } = useTranslation();
	const editor = useEditor();
	const [selectedVoice, setSelectedVoice] = useState(DEFAULT_VOICE_PACK);
	const [alignDuration, setAlignDuration] = useState(false);
	const [isGenerating, setIsGenerating] = useState(false);

	const handleGenerate = async () => {
		if (elementRefs.length === 0) return;

		setIsGenerating(true);
		const toastId = "tts-generate";

		toast.loading(
			i18next.t("Generating speech..."),
			{ id: toastId },
		);

		let successCount = 0;
		let failCount = 0;

		for (const { element, trackId: textTrackId } of elementRefs) {
			try {
				const { duration } = await generateAndInsertSpeech({
					editor,
					text: element.content,
					startTime: element.startTime,
					voice: selectedVoice,
				});

				if (alignDuration) {
					editor.timeline.updateElementDuration({
						trackId: textTrackId,
						elementId: element.id,
						duration,
					});
				}

				successCount++;
			} catch (error) {
				console.error("TTS generation failed:", error);
				failCount++;
			}
		}

		if (failCount === 0) {
			toast.success(
				i18next.t("Speech generated successfully"),
				{ id: toastId },
			);
		} else {
			toast.warning(
				i18next.t("{{success}} generated, {{fail}} failed", {
					success: successCount,
					fail: failCount,
				}),
				{ id: toastId },
			);
		}

		setIsGenerating(false);
	};

	return (
		<PanelBaseView className="p-0">
			<PropertyGroup
				title={t("Text to Speech")}
				hasBorderTop={false}
				collapsible={false}
			>
				<div className="space-y-6">
					<PropertyItem direction="column">
						<PropertyItemLabel>{t("Voice")}</PropertyItemLabel>
						<PropertyItemValue>
							<Select
								value={selectedVoice}
								onValueChange={setSelectedVoice}
							>
								<SelectTrigger>
									<SelectValue
										placeholder={t("Select a voice")}
									/>
								</SelectTrigger>
								<SelectContent>
									{VOICE_PACKS.map((voice) => (
										<SelectItem
											key={voice.id}
											value={voice.id}
										>
											{voice.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</PropertyItemValue>
					</PropertyItem>

					<div className="flex items-center gap-2">
						<Checkbox
							id="align-text-duration"
							checked={alignDuration}
							onCheckedChange={(checked) =>
								setAlignDuration(checked === true)
							}
						/>
						<label
							htmlFor="align-text-duration"
							className="cursor-pointer text-sm"
						>
							{t("Align text duration")}
						</label>
					</div>

					<Button
						type="button"
						className="w-full"
						disabled={isGenerating || elementRefs.length === 0}
						onClick={handleGenerate}
					>
						{isGenerating
							? t("Generating...")
							: t("Generate Speech")}
					</Button>
				</div>
			</PropertyGroup>
		</PanelBaseView>
	);
}
