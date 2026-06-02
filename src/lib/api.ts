import type { BooruPost, BooruTag, SearchResult } from "$lib/server/booru/types";
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
		(e): ApiError => ({ kind: "network", message: String(e) })
	).andThen((res) =>
		ResultAsync.fromPromise(
			res.json() as Promise<ApiResponse<T>>,
			(e): ApiError => ({ kind: "parse", message: String(e) })
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
	booru: string;
	tags?: string[];
	page?: number;
	limit?: number;
};

export function searchPosts(params: SearchParams): ResultAsync<SearchResult, ApiError> {
	return apiFetch<SearchResult>("/api/search", {
		booru: params.booru,
		...(params.tags?.length ? { tags: params.tags.join(",") } : {}),
		...(params.page !== undefined ? { page: String(params.page) } : {}),
		...(params.limit !== undefined ? { limit: String(params.limit) } : {})
	});
}

export function getPost(booru: string, id: string): ResultAsync<BooruPost, ApiError> {
	return apiFetch<BooruPost>("/api/post", { booru, id });
}

export function getTagMetadata(booru: string, names: string[]): ResultAsync<BooruTag[], ApiError> {
	return apiFetch<BooruTag[]>("/api/tags", {
		booru,
		names: names.join(" ")
	});
}
