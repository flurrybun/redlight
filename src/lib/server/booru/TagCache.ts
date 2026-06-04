import type { ResultAsync } from "neverthrow";
import { okAsync } from "neverthrow";
import type { BooruAdapter } from "./BooruAdapter";
import type { BooruError, BooruTag } from "./types";

export class TagCache {
	#cache = new Map<string, BooruTag>();
	#adapter: BooruAdapter;

	constructor(adapter: BooruAdapter) {
		this.#adapter = adapter;
	}

	getTags(names: string[]): ResultAsync<BooruTag[], BooruError> {
		const cached: BooruTag[] = [];
		const missing: string[] = [];

		names.forEach((name) => {
			const hit = this.#cache.get(name);

			if (hit) cached.push(hit);
			else missing.push(name);
		});

		if (missing.length === 0) {
			return okAsync(cached);
		}

		return this.#adapter.getTagMetadata(missing).map((fetched) => {
			fetched.forEach((tag) => {
				this.#cache.set(tag.name, tag);
			});

			return [...cached, ...fetched];
		});
	}

	autocompleteTag(tag: string, limit: number) {
		return this.#adapter.autocompleteTag(tag, limit);
	}

	invalidate() {
		this.#cache.clear();
	}
}
