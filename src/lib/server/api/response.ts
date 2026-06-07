import type { ApiError } from "$lib/api/types";
import type { BooruError } from "$lib/server/booru/types";

export function booruErrorToApiError(error: BooruError): ApiError {
	const { name } = error.info;

	switch (error.detail.kind) {
		case "network":
			return {
				title: "Network Error",
				message: `Unable to reach ${name}. Try again later.`
			};
		case "http":
			return {
				title: `${String(error.detail.status)} ${statusCodeToTitle[error.detail.status]}`,
				message: errorMessageForCode(error.detail.status, name)
			};
		case "parse":
			return {
				title: "Parse Error",
				message: `Unable to parse response from ${name}. Please report this issue.`
			};
		case "validation":
			return {
				title: "Validation Error",
				message: `Recieved unexpected data from ${name}, likely due to an API change. Please report this issue.`
			};
		case "rate-limit":
			return {
				title: "Rate Limited",
				message: `Too many requests were sent to ${name}. Try again in ${secondsUntil(error.detail.retryDate)}.`
			};
	}
}

function secondsUntil(date: Date | undefined): string {
	if (!date) return "a few moments";

	const seconds = Math.ceil((date.getTime() - Date.now()) / 1000);

	// no clue if rate limiting ever lasts more than a
	// second or two but it can't hurt to be prepared

	if (seconds <= 1) return "a second";
	else if (seconds < 60) return `${String(seconds)} seconds`;
	else if (seconds < 3600) return `${String(Math.ceil(seconds / 60))} minutes`;
	else if (seconds < 86400) return `${String(Math.ceil(seconds / 3600))} hours`;
	else return `${String(Math.ceil(seconds / 86400))} days`;
}

function errorMessageForCode(code: number, name: string): string {
	switch (code) {
		case 400:
			return `The request was rejected by ${name}. Try simplifying your search query.`;
		case 401:
			return `${name} requires authorization. API credentials may be missing or incorrect.`;
		case 403:
			return `${name} denied access to this resource.`;
		case 404:
			return `The requested resource was not found on ${name}.`;
		case 410:
			return `This resource no longer exists on ${name}. You may have reached the end of available results.`;
		case 500:
			return `${name} encountered an internal error. Please try again later.`;
		case 502:
		case 503:
		case 504:
			return `${name} is currently unavailable. Please try again later.`;
		default:
			return `An error occurred from ${name}. Please try again later.`;
	}
}

// inlined from https://github.com/jshttp/statuses/blob/master/codes.json

const statusCodeToTitle: Record<number, string> = {
	100: "Continue",
	101: "Switching Protocols",
	102: "Processing",
	103: "Early Hints",
	200: "OK",
	201: "Created",
	202: "Accepted",
	203: "Non-Authoritative Information",
	204: "No Content",
	205: "Reset Content",
	206: "Partial Content",
	207: "Multi-Status",
	208: "Already Reported",
	226: "IM Used",
	300: "Multiple Choices",
	301: "Moved Permanently",
	302: "Found",
	303: "See Other",
	304: "Not Modified",
	305: "Use Proxy",
	307: "Temporary Redirect",
	308: "Permanent Redirect",
	400: "Bad Request",
	401: "Unauthorized",
	402: "Payment Required",
	403: "Forbidden",
	404: "Not Found",
	405: "Method Not Allowed",
	406: "Not Acceptable",
	407: "Proxy Authentication Required",
	408: "Request Timeout",
	409: "Conflict",
	410: "Gone",
	411: "Length Required",
	412: "Precondition Failed",
	413: "Payload Too Large",
	414: "URI Too Long",
	415: "Unsupported Media Type",
	416: "Range Not Satisfiable",
	417: "Expectation Failed",
	418: "I'm a Teapot",
	421: "Misdirected Request",
	422: "Unprocessable Entity",
	423: "Locked",
	424: "Failed Dependency",
	425: "Too Early",
	426: "Upgrade Required",
	428: "Precondition Required",
	429: "Too Many Requests",
	431: "Request Header Fields Too Large",
	451: "Unavailable For Legal Reasons",
	500: "Internal Server Error",
	501: "Not Implemented",
	502: "Bad Gateway",
	503: "Service Unavailable",
	504: "Gateway Timeout",
	505: "HTTP Version Not Supported",
	506: "Variant Also Negotiates",
	507: "Insufficient Storage",
	508: "Loop Detected",
	509: "Bandwidth Limit Exceeded",
	510: "Not Extended",
	511: "Network Authentication Required"
};
