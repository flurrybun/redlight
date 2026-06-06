import { getAdapter } from "$lib/server/booru/registry";
import { parseBooruId } from "$lib/server/booru/types";
import { resultToResponse } from "$lib/server/utils";
import { error } from "@sveltejs/kit";

export async function GET({ url }) {
	const booruId = parseBooruId(url.searchParams.get("booru"));
	if (booruId.isErr()) error(400, `Invalid booru ID: ${url.searchParams.get("booru")}`);

	const tags = url.searchParams.get("tags")?.split(",") ?? [];
	const page = Number(url.searchParams.get("page") ?? 1);
	const limit = Number(url.searchParams.get("limit") ?? 20);

	const adapter = getAdapter(booruId.value);

	return resultToResponse(await adapter.search({ tags, page, limit }));
}
