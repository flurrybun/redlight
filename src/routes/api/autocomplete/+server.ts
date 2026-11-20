import { AutocompleteParamsSchema } from "#lib/api/schemas.ts";
import { createRequestHandler } from "#lib/server/api/handler.ts";
import { getAdapter } from "#lib/server/booru/registry.ts";

export const GET = createRequestHandler(AutocompleteParamsSchema, async ({ booru, tag, limit }) =>
	getAdapter(booru).autocompleteTag(tag, limit)
);
