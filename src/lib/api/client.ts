import type { BooruTag, SearchResult } from "$lib/server/booru/types";
import { errAsync, ResultAsync } from "neverthrow";
import z from "zod";
import { SearchParamsSchema, TagMetadataParamsSchema } from "./schemas";
import { apiResponseToResult, type ApiError, type ApiResponse } from "./types";

export const searchPosts = createFetcher<SearchResult>("/api/search", SearchParamsSchema);
export const getTagMetadata = createFetcher<BooruTag[]>("/api/tags", TagMetadataParamsSchema);

/**
 * Creates a function that fetches data from the given URL with query parameters
 * validated by the provided Zod schema. The function returns a ResultAsync with
 * either the parsed response data or an ApiError.
 *
 * @param url The API endpoint to fetch data from
 * @param schema A Zod schema to validate and encode the query parameters
 */
function createFetcher<
	TResponse,
	T extends z.ZodObject<z.ZodRawShape> = z.ZodObject<z.ZodRawShape>
>(url: string, schema: T): (params: z.infer<T>) => ResultAsync<TResponse, ApiError> {
	return (params: z.output<T>): ResultAsync<TResponse, ApiError> => {
		const encoded = schema.safeEncode(params);

		if (!encoded.success) {
			return errAsync({
				title: "Invalid Parameters",
				message: z.prettifyError(encoded.error)
			});
		}

		// unsafe cast is necessary because typescript can't deduce that
		// the output of the encoder is always a Record<string, string>

		const query = new URLSearchParams(encoded.data as Record<string, string>);
		const fullUrl = `${url}?${query}`;

		return ResultAsync.fromPromise(
			fetch(fullUrl, { headers: { Accept: "application/json" } }),
			(error): ApiError => ({ title: "Network Error", message: String(error) })
		)
			.andThen((res) =>
				ResultAsync.fromPromise(
					res.json() as Promise<ApiResponse<TResponse>>,
					(error): ApiError => ({ title: "Parse Error", message: String(error) })
				)
			)
			.andThen(apiResponseToResult);
	};
}
