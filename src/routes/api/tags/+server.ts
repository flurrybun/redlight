import { getTagCache } from "$lib/server/booru/registry";
import { parseBooruId } from "$lib/server/booru/types";
import { resultToResponse } from "$lib/server/utils";
import { error, json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ url }) => {
	const booruId = parseBooruId(url.searchParams.get("booru"));
	if (booruId.isErr()) error(400, `Invalid booru ID: ${url.searchParams.get("booru")}`);

	const names = url.searchParams.get("names")?.split(" ").filter(Boolean) ?? [];
	const limit = Number(url.searchParams.get("limit") ?? "250");

	if (names.length === 0) {
		return json({ ok: true, data: [] });
	}

	const tagCache = getTagCache(booruId.value);
	return resultToResponse(await tagCache.getTags(names, limit));
};
