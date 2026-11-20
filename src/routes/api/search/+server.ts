import { SearchParamsSchema } from "#lib/api/schemas.ts";
import { createRequestHandler } from "#lib/server/api/handler.ts";
import { getAdapter } from "#lib/server/booru/registry.ts";

export const GET = createRequestHandler(SearchParamsSchema, async ({ booru, tags, page, limit }) =>
	getAdapter(booru).search({ tags, page, limit })
);
