import { parseSearchParams } from "$lib/server/api/handler";
import { error } from "@sveltejs/kit";
import z from "zod";
import type { RequestHandler } from "./$types";

const ALLOWED_HOSTS = new Set(["gelbooru.com", "img2.gelbooru.com"]);

// some headers can set cookies or alter security policies,
// which should never be blindly forwarded.

const FORWARDED_RESPONSE_HEADERS = [
	"content-type",
	"content-length",
	"content-range",
	"accept-ranges",
	"cache-control",
	"last-modified",
	"etag"
];

const FORWARDED_REQUEST_HEADERS = ["range", "if-range", "if-modified-since", "if-none-match"];

const SearchParamsSchema = z.object({
	url: z.url()
});

export const GET: RequestHandler = async ({ url, request }) => {
	const parseResult = parseSearchParams(url.searchParams, SearchParamsSchema);
	if (parseResult.isErr()) error(400, parseResult.error.message);

	const { url: imageUrl } = parseResult.value;

	let parsedUrl: URL;

	try {
		parsedUrl = new URL(imageUrl);
	} catch {
		error(400, "Invalid URL parameter");
	}

	if (parsedUrl.protocol !== "https:") {
		error(400, "Only HTTPS URLs are allowed");
	}

	if (!ALLOWED_HOSTS.has(parsedUrl.hostname)) {
		error(403, `Host ${parsedUrl.hostname} is not allowed`);
	}

	const upstreamHeaders = new Headers();
	for (const header of FORWARDED_REQUEST_HEADERS) {
		const value = request.headers.get(header);
		if (value === null) continue;

		upstreamHeaders.set(header, value);
	}

	const forwardedHeaders = FORWARDED_REQUEST_HEADERS.reduce<Record<string, string>>(
		(acc, header) => {
			const value = request.headers.get(header);
			if (value !== null) acc[header] = value;

			return acc;
		},
		{}
	);

	let upstreamResponse: Response;

	try {
		upstreamResponse = await fetch(imageUrl, {
			headers: {
				// i am just a browser, i swear :)
				Referer: "https://gelbooru.com/",
				"User-Agent":
					"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36",
				Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
				"Accept-Language": "en-US,en;q=0.9",

				// forward the range header from the client (video seeking)
				...forwardedHeaders
			},
			redirect: "follow"
		});
	} catch {
		error(502, "Failed to fetch upstream resource");
	}

	if (!upstreamResponse.ok && upstreamResponse.status !== 206) {
		error(
			upstreamResponse.status,
			`Upstream server returned HTTP ${String(upstreamResponse.status)}`
		);
	}

	const responseHeaders = new Headers();

	for (const header of FORWARDED_RESPONSE_HEADERS) {
		const value = upstreamResponse.headers.get(header);
		if (value === null) continue;

		responseHeaders.set(header, value);
	}

	return new Response(upstreamResponse.body, {
		status: upstreamResponse.status,
		headers: responseHeaders
	});
};
