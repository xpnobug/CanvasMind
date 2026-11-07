import { useAgentStore } from "@cutia/stores/agent-store";

export async function blobToDataUrl({ blob }: { blob: Blob }): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result as string);
		reader.onerror = () => reject(new Error("Failed to read blob"));
		reader.readAsDataURL(blob);
	});
}

export async function analyzeImageWithVision({
	imageDataUrl,
	analysisPrompt,
}: {
	imageDataUrl: string;
	analysisPrompt: string;
}): Promise<string> {
	const { config } = useAgentStore.getState();
	if (!config.apiKey) {
		throw new Error(
			"Agent LLM not configured. Please set up API key in Settings.",
		);
	}

	const baseUrl = (config.baseUrl || "https://api.openai.com/v1").replace(
		/\/+$/,
		"",
	);

	const response = await fetch(`${baseUrl}/chat/completions`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${config.apiKey}`,
		},
		body: JSON.stringify({
			model: config.model || "gpt-4.1",
			messages: [
				{
					role: "user",
					content: [
						{ type: "text", text: analysisPrompt },
						{
							type: "image_url",
							image_url: { url: imageDataUrl, detail: "high" },
						},
					],
				},
			],
			max_tokens: 1024,
		}),
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`Vision API error (${response.status}): ${errorText}`);
	}

	const data = (await response.json()) as {
		choices: Array<{ message: { content: string } }>;
	};
	return data.choices[0]?.message?.content ?? "";
}

export const DESCRIPTION_ANALYSIS_PROMPT = `Analyze this character reference image and provide a detailed visual description. Include:
1. Gender and approximate age
2. Hair: color, style, length
3. Eyes: color, shape
4. Skin tone
5. Build/body type
6. Clothing and accessories
7. Any distinguishing features (scars, tattoos, glasses, etc.)
8. Overall mood/expression

Write the description as a concise paragraph suitable for use as an AI image generation prompt. Focus on visual details only, no narrative or personality.`;

export const STYLE_ANALYSIS_PROMPT = `Analyze the art style of this image and provide a concise style description. Include:
1. Art style (photorealistic, anime, cartoon, watercolor, oil painting, 3D render, pixel art, etc.)
2. Color palette (warm/cool, muted/vibrant, specific dominant colors)
3. Lighting (soft, dramatic, flat, natural, studio, golden hour, etc.)
4. Rendering technique (smooth, textured, cel-shaded, sketch-like, etc.)
5. Overall aesthetic mood

Write the description as a concise paragraph suitable for use as an AI image generation style directive. Do not describe the character's appearance — only the art style and rendering.`;
