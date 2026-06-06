import { err, errAsync, ok, okAsync, Result, ResultAsync } from "neverthrow";
import z from "zod";
import type { BooruError, SearchResult } from "./types";
import { zodParse } from "$lib/utils/zod";

export function parseJson(res: Response): ResultAsync<unknown, BooruError> {
	return ResultAsync.fromPromise(
		res.json(),
		(error): BooruError => ({ kind: "parse", message: String(error) })
	);
}

export function parseXml(res: Response): ResultAsync<Document, BooruError> {
	return ResultAsync.fromPromise(
		res.text(),
		(error): BooruError => ({ kind: "parse", message: String(error) })
	).andThen((text) => {
		const parser = new DOMParser();
		const doc = parser.parseFromString(text, "application/xml");
		const errorNode = doc.querySelector("parsererror");

		if (!errorNode) return ok(doc);

		return err<Document, BooruError>({
			kind: "parse",
			message: errorNode.textContent
		});
	});
}

export function validate<T extends z.ZodTypeAny>(
	schema: T
): (data: unknown) => Result<z.infer<T>, BooruError> {
	return zodParse(schema, () => ({
		kind: "validation",
		message: "Schema validation failed"
	}));
}

export function checkRateLimit(res: Response): ResultAsync<Response, BooruError> {
	if (res.status !== 429) return okAsync(res);

	const retryAfter = res.headers.get("retry-after");
	const retryDate = retryAfter && new Date(Date.now() + Number(retryAfter) * 1000);

	return errAsync<Response, BooruError>({
		kind: "rate-limit",
		retryDate: retryDate || undefined
	});
}

export function processSearchResult(
	result: ResultAsync<SearchResult, BooruError>
): ResultAsync<SearchResult, BooruError> {
	return result.map(deduplicatePostTags);
}

function deduplicatePostTags(result: SearchResult): SearchResult {
	return {
		...result,
		posts: result.posts.map((post) => ({
			...post,
			tags: [...new Set(post.tags)]
		}))
	};
}
