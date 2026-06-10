import type { BooruId } from "$lib/api/schemas";
import DanbooruAdapter from "./adapters/DanbooruAdapter";
import E621Adapter from "./adapters/E621Adapter";
import GelbooruAdapter from "./adapters/GelbooruAdapter";
import type BooruAdapter from "./BooruAdapter";
import { TagCache } from "./TagCache";

interface BooruEntry {
	adapter: BooruAdapter;
	tagCache: TagCache;
}

const registry = new Map<BooruId, BooruEntry>([
	[
		"gelbooru",
		(() => {
			const adapter = new GelbooruAdapter();
			return { adapter, tagCache: new TagCache(adapter) };
		})()
	],
	[
		"danbooru",
		(() => {
			const adapter = new DanbooruAdapter();
			return { adapter, tagCache: new TagCache(adapter) };
		})()
	],
	[
		"e621",
		(() => {
			const adapter = new E621Adapter();
			return { adapter, tagCache: new TagCache(adapter) };
		})()
	]
]);

export function getAdapter(id: BooruId): BooruAdapter {
	const entry = registry.get(id);
	if (!entry) throw new Error(`Unknown booru: "${id}"`);

	return entry.adapter;
}

export function getTagCache(id: BooruId): TagCache {
	const entry = registry.get(id);
	if (!entry) throw new Error(`Unknown booru: "${id}"`);

	return entry.tagCache;
}
