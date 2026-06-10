import type { ApiError } from "$lib/api/types";
import type { BooruError } from "$lib/server/booru/types";
import { fromZod } from "$lib/utils/zod";
import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import type { Result } from "neverthrow";
import z from "zod";
import { booruErrorToApiError } from "./response";

type BooruCallback<TSchema extends z.ZodType, TData> = (
	params: z.infer<TSchema>
) => Promise<Result<TData, BooruError>>;

type ApiCallback<TSchema extends z.ZodType, TData> = (
	params: z.infer<TSchema>
) => Promise<Result<TData, ApiError>>;

function isBooruError(error: BooruError | ApiError): error is BooruError {
	return "detail" in error;
}

/**
 * Creates a SvelteKit request handler that validates query parameters using a Zod
 * schema and returns a JSON response. The handler supports both BooruError and
 * ApiError types for error handling.
 *
 * @param schema A Zod schema to validate the query parameters against
 * @param callback An async function that takes the validated parameters and returns
 * a Result with either the data or an error
 */
export function createRequestHandler<TSchema extends z.ZodType, TData>(
	schema: TSchema,
	callback: BooruCallback<TSchema, TData> | ApiCallback<TSchema, TData>
): RequestHandler {
	return async ({ url }) => {
		const params = parseSearchParams(url.searchParams, schema);
		if (params.isErr()) {
			return json({ error: params.error });
		}

		const result = await callback(params.value);

		return result.match(
			(data) => json({ data }),
			(error) => json({ error: isBooruError(error) ? booruErrorToApiError(error) : error })
		);
	};
}

/**
 * Parses URLSearchParams using a Zod schema, returning a Result with either the
 * parsed data or an ApiError if validation fails.
 *
 * @param searchParams The URLSearchParams to parse and validate
 * @param schema The Zod schema to validate against
 */
export function parseSearchParams<T extends z.ZodType>(
	searchParams: URLSearchParams,
	schema: T
): Result<z.infer<T>, ApiError> {
	const obj = Object.fromEntries(searchParams.entries());

	return fromZod(schema.safeDecode(obj as z.input<T>), (error) => ({
		title: "Invalid Parameters",
		message: z.prettifyError(error)
	}));
}
