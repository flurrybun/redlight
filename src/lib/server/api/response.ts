import type { ApiError } from "$lib/api/types";
import type { BooruError } from "$lib/server/booru/types";

export function booruErrorToApiError(error: BooruError): ApiError {
	switch (error.kind) {
		case "network":
			return {
				title: "Network Error",
				message: "Failed to reach the booru. Please check your connection and try again."
			};
		case "http":
			return {
				title: `HTTP ${String(error.status)}`,
				message:
					error.status === 404
						? "The requested resource was not found."
						: `The booru returned an error: ${error.statusText}`
			};
		case "parse":
			return {
				title: "Parse Error",
				message: "The booru returned a response we couldn't understand."
			};
		case "validation":
			return {
				title: "Validation Error",
				message: "The booru returned data in an unexpected format. This may indicate an API change."
			};
		case "rate-limit": {
			const seconds = error.retryDate
				? Math.ceil((error.retryDate.getTime() - Date.now()) / 1000)
				: undefined;

			return {
				title: "Rate Limited",
				message: `Too many requests. Please wait ${seconds ? `${String(seconds)} seconds` : ""} before trying again.`
			};
		}
	}
}
