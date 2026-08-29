import { AutocompleteParamsSchema } from "$lib/api/schemas";
import { createRequestHandler } from "$lib/server/api/handler";
import { getAdapter } from "$lib/server/booru/registry";

export const GET = createRequestHandler(AutocompleteParamsSchema, async ({ booru, tag, limit }) =>
	getAdapter(booru).autocompleteTag(tag, limit)
);
