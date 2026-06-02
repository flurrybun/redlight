import type { BooruAdapter } from "./BooruAdapter";
import { TagCache } from "./TagCache";
import { GelbooruAdapter } from "./adapters/GelbooruAdapter";

interface BooruEntry {
	adapter: BooruAdapter;
	tagCache: TagCache;
}

const registry = new Map<string, BooruEntry>([
	[
		"gelbooru",
		(() => {
			const adapter = new GelbooruAdapter();
			return { adapter, tagCache: new TagCache(adapter) };
		})()
	]
]);

export function getAdapter(id: string): BooruAdapter {
	const entry = registry.get(id);
	if (!entry) throw new Error(`Unknown booru: "${id}"`);

	return entry.adapter;
}

export function getTagCache(id: string): TagCache {
	const entry = registry.get(id);
	if (!entry) throw new Error(`Unknown booru: "${id}"`);

	return entry.tagCache;
}
