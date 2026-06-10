import { TagMetadataParamsSchema } from "$lib/api/schemas";
import { createRequestHandler } from "$lib/server/api/handler";
import { getTagCache } from "$lib/server/booru/registry";

export const GET = createRequestHandler(TagMetadataParamsSchema, async ({ booru, names, limit }) =>
	getTagCache(booru).getTags(names, limit)
);
