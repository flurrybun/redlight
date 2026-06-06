import { err, ok, type Result } from "neverthrow";
import z from "zod";

/**
 * Converts a Zod result into a Neverthrow Result, mapping errors using the
 * provided function.
 *
 * @param result The result of a Zod safeParse operation
 * @param mapError A function that takes a ZodError and maps it to the
 * desired error type
 */
export function fromZod<T, E>(
	result: ReturnType<z.ZodType["safeParse"]>,
	mapError: (error: z.ZodError) => E
): Result<T, E> {
	if (result.success) return ok(result.data as T);
	else return err(mapError(result.error));
}

/**
 * Creates a parser function that validates input against a Zod schema and
 * maps any validation errors to a custom error type.
 *
 * @param schema The Zod schema to validate against
 * @param mapError A function that takes a ZodError and maps it to the
 * desired error type
 */
export function zodParse<T extends z.ZodType, E>(
	schema: T,
	mapError: (error: z.ZodError) => E
): (value: unknown) => Result<z.infer<T>, E> {
	return (value: unknown) => fromZod(schema.safeParse(value), mapError);
}
