import { createRequestHandler } from "$lib/server/api/handler";
import { getAdapter } from "$lib/server/booru/registry";
import { BooruIdSchema } from "$lib/server/booru/types";
import z from "zod";

const SearchParamsSchema = z.strictObject({
	booru: BooruIdSchema,
	tags: z.string().transform((tags) => tags.split(",").filter(Boolean)),
	page: z.coerce.number().int().min(1),
	limit: z.coerce.number().int().min(1)
});

export const GET = createRequestHandler(SearchParamsSchema, async ({ booru, tags, page, limit }) =>
	getAdapter(booru).search({ tags, page, limit })
);
