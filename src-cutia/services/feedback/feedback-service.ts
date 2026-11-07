import { initOpenapiSDK, submitSurvey } from "tianji-client-sdk";
import {
	FEEDBACK_TIANJI_ENDPOINT,
	FEEDBACK_TIANJI_SURVEY_ID,
	FEEDBACK_TIANJI_WORKSPACE_ID,
} from "@cutia/constants/feedback-constants";

let initialized = false;

function ensureInitialized() {
	if (initialized) return;
	initOpenapiSDK(FEEDBACK_TIANJI_ENDPOINT);
	initialized = true;
}

export async function submitFeedback({
	content,
	contact,
}: {
	content: string;
	contact?: string;
}) {
	ensureInitialized();
	await submitSurvey(
		FEEDBACK_TIANJI_WORKSPACE_ID,
		FEEDBACK_TIANJI_SURVEY_ID,
		{
			content,
			contact: contact ?? "",
		},
	);
}

// Exposed only for tests; do not use from application code.
export function __resetForTests() {
	initialized = false;
}
