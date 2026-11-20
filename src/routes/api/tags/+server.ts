import { TagMetadataParamsSchema } from "#lib/api/schemas.ts";
import { createRequestHandler } from "#lib/server/api/handler.ts";
import { getTagCache } from "#lib/server/booru/registry.ts";

export const GET = createRequestHandler(TagMetadataParamsSchema, async ({ booru, names, limit }) =>
	getTagCache(booru).getTags(names, limit)
);
