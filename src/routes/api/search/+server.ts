import { SearchParamsSchema } from "$lib/api/schemas";
import { createRequestHandler } from "$lib/server/api/handler";
import { getAdapter } from "$lib/server/booru/registry";

export const GET = createRequestHandler(SearchParamsSchema, async ({ booru, tags, page, limit }) =>
	getAdapter(booru).search({ tags, page, limit })
);
