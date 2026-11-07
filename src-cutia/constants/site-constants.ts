export const SITE_URL = "https://cutia.msgbyte.com";

export const SITE_INFO = {
	title: "Cutia",
	description:
		"Cutia is an AI-native, open-source video editor in your browser — a free, privacy-first alternative to CapCut. AI-powered editing, multi-track timeline, MP4/WebM export with no uploads.",
	url: SITE_URL,
	openGraphImage: "/icon.svg",
	twitterImage: "/icon.svg",
	favicon: "/logos/cutia/svg/logo.svg",
};

export type ExternalTool = {
	name: string;
	description: string;
	url: string;
	icon: React.ElementType;
};

export const EXTERNAL_TOOLS: ExternalTool[] = [];

export const DEFAULT_LOGO_URL = "/logos/cutia/svg/logo.svg";

export const SOCIAL_LINKS = {
	x: "https://x.com/moonrailgun",
	github: "https://github.com/msgbyte/cutia",
	discord: "",
};
