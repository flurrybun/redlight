import type { BooruId, BooruPost, BooruTag, SearchResult } from "$lib/server/booru/types";
import { ResultAsync, errAsync, okAsync } from "neverthrow";

export type ApiError =
	| { kind: "network"; message: string }
	| { kind: "http"; status: number; statusText: string }
	| { kind: "parse"; message: string };

type ApiResponse<T> = { ok: true; data: T } | { ok: false; error: ApiError };

function apiFetch<T>(url: string, params: Record<string, string> = {}): ResultAsync<T, ApiError> {
	const fullUrl = Object.keys(params).length > 0 ? `${url}?${new URLSearchParams(params)}` : url;

	return ResultAsync.fromPromise(
		fetch(fullUrl, { headers: { Accept: "application/json" } }),
		(error): ApiError => ({ kind: "network", message: String(error) })
	).andThen((res) =>
		ResultAsync.fromPromise(
			res.json() as Promise<ApiResponse<T>>,
			(error): ApiError => ({ kind: "parse", message: String(error) })
		).andThen((body) => {
			if (!res.ok) {
				return errAsync<T, ApiError>(
					body.ok === false
						? body.error
						: { kind: "http", status: res.status, statusText: res.statusText }
				);
			}

			return body.ok ? okAsync<T, ApiError>(body.data) : errAsync<T, ApiError>(body.error);
		})
	);
}

export type SearchParams = {
	booru: BooruId;
	tags: string[];
	page: number;
	limit: number;
};

export function searchPosts(params: SearchParams): ResultAsync<SearchResult, ApiError> {
	return apiFetch<SearchResult>("/api/search", {
		booru: params.booru,
		tags: params.tags.join(","),
		page: String(params.page),
		limit: String(params.limit)
	});
}

export function getPost(booru: BooruId, id: string): ResultAsync<BooruPost, ApiError> {
	return apiFetch<BooruPost>("/api/post", { booru, id });
}

export function getTagMetadata(
	booru: BooruId,
	names: string[],
	limit: number
): ResultAsync<BooruTag[], ApiError> {
	return apiFetch<BooruTag[]>("/api/tags", {
		booru,
		names: names.join(" "),
		limit: String(limit)
	});
}
