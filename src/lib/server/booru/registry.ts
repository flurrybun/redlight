import type { BooruAdapter } from "./BooruAdapter";
import { GelbooruAdapter } from "./adapters/GelbooruAdapter";

const adapters: Map<string, BooruAdapter> = new Map([["gelbooru", new GelbooruAdapter()]]);

export function getAdapter(id: string): BooruAdapter {
	const adapter = adapters.get(id);
	if (!adapter) throw new Error(`Unknown booru: "${id}"`);
	return adapter;
}

export function getAllAdapters(): BooruAdapter[] {
	return [...adapters.values()];
}
