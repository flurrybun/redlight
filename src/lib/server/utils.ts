import { json } from "@sveltejs/kit";
import type { Result } from "neverthrow";
import type { BooruError } from "./booru/types";

export function resultToResponse<T>(result: Result<T, BooruError>) {
	return result.match(
		(data) => json({ ok: true, data }),
		(error) => json({ ok: false, error }, { status: errorToStatus(error) })
	);
}

function errorToStatus(error: BooruError): number {
	switch (error.kind) {
		case "network":
			return 502;
		case "http":
			return error.status;
		case "parse":
			return 502;
		case "validation":
			return 500;
		case "rate-limit":
			return 429;
	}
}
