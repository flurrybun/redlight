import { createRequestHandler } from "$lib/server/api/handler";
import { getTagCache } from "$lib/server/booru/registry";
import { BooruIdSchema } from "$lib/server/booru/types";
import z from "zod";

const SearchParamsSchema = z.strictObject({
	booru: BooruIdSchema,
	names: z.string().transform((tags) => tags.split(",").filter(Boolean)),
	limit: z.coerce.number().int().min(1)
});

export const GET = createRequestHandler(SearchParamsSchema, async ({ booru, names, limit }) =>
	getTagCache(booru).getTags(names, limit)
);
