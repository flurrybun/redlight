import type { BooruId, BooruPost, BooruTag, SearchResult } from "$lib/server/booru/types";
import { ResultAsync } from "neverthrow";
import { apiResponseToResult, type ApiError, type ApiResponse } from "./types";

function apiFetch<T>(url: string, params: Record<string, string> = {}): ResultAsync<T, ApiError> {
	const fullUrl = `${url}?${new URLSearchParams(params)}`;

	return ResultAsync.fromPromise(
		fetch(fullUrl, { headers: { Accept: "application/json" } }),
		(error): ApiError => ({
			title: "Network Error",
			message: String(error)
		})
	)
		.andThen((res) =>
			ResultAsync.fromPromise(
				res.json() as Promise<ApiResponse<T>>,
				(error): ApiError => ({
					title: "Parse Error",
					message: String(error)
				})
			)
		)
		.andThen(apiResponseToResult);
}

export interface SearchParams {
	booru: BooruId;
	tags: string[];
	page: number;
	limit: number;
}

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
		names: names.join(","),
		limit: String(limit)
	});
}
