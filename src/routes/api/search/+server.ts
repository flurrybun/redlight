import { getAdapter } from "$lib/server/booru/registry";
import { resultToResponse } from "$lib/server/utils";

export async function GET({ url }) {
	const booruId = url.searchParams.get("booru") ?? "danbooru";
	const tags = url.searchParams.get("tags")?.split(",") ?? [];
	const page = Number(url.searchParams.get("page") ?? 1);
	const limit = Number(url.searchParams.get("limit") ?? 20);

	const adapter = getAdapter(booruId);

	return resultToResponse(await adapter.search({ tags, page, limit }));
}
