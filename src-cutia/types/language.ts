import type { LANGUAGES } from "@cutia/constants/language-constants";

export type Language = (typeof LANGUAGES)[number];
export type LanguageCode = Language["code"];
