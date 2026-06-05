import { getTagCache } from "$lib/server/booru/registry";
import { resultToResponse } from "$lib/server/utils";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ url }) => {
	const booruId = url.searchParams.get("booru") ?? "gelbooru";
	const names = url.searchParams.get("names")?.split(" ").filter(Boolean) ?? [];
	const limit = Number(url.searchParams.get("limit") ?? "250");

	if (names.length === 0) {
		return json({ ok: true, data: [] });
	}

	const tagCache = getTagCache(booruId);
	return resultToResponse(await tagCache.getTags(names, limit));
};
