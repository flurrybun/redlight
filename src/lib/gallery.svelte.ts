import type { BooruPost, BooruTag } from "$lib/server/booru/types";
import { SvelteMap, SvelteSet } from "svelte/reactivity";
import { getTagMetadata, searchPosts } from "./api/client";
import type { BooruId } from "./api/schemas";
import type { ApiError } from "./api/types";
import { chunk } from "./utils/array";

const TAG_BATCH_SIZE = 250;

class Gallery {
	posts = $state<BooruPost[]>([]);
	booru = $state<BooruId>("danbooru");
	isLoading = $state(false);
	hasMore = $state(true);
	error = $state<ApiError | undefined>(undefined);
	inGallery = $state(false);

	tagMap = $state(new SvelteMap<BooruId, SvelteMap<string, BooruTag>>());

	#tags: string[] = [];
	#currentPage = 1;

	async search(tags: string[]) {
		this.posts = [];
		this.hasMore = true;
		this.error = undefined;

		this.#tags = tags;
		this.#currentPage = 1;

		await this.fetchNextPage();
	}

	async fetchNextPage() {
		if (this.isLoading || !this.hasMore) return;

		this.isLoading = true;
		this.error = undefined;

		const result = await searchPosts({
			booru: this.booru,
			tags: this.#tags,
			page: this.#currentPage,
			limit: 20
		});

		await result.match(
			async (data) => {
				this.posts = [...this.posts, ...data.posts];
				this.hasMore = data.posts.length === 20;
				this.#currentPage += 1;
				this.isLoading = false;

				await this.#prefetchTags(data.posts);
			},
			(error) => {
				this.error = error;
				this.isLoading = false;
			}
		);
	}

	async #prefetchTags(posts: BooruPost[]) {
		if (!this.tagMap.has(this.booru)) {
			this.tagMap.set(this.booru, new SvelteMap());
		}

		const booruTagMap = this.tagMap.get(this.booru);
		if (!booruTagMap) return;

		const missing = new SvelteSet<string>();

		posts.forEach((post) => {
			post.tags.forEach((tag) => {
				if (booruTagMap.has(tag)) return;

				missing.add(tag);
			});
		});

		const batches = chunk([...missing], TAG_BATCH_SIZE);

		for (const batch of batches) {
			const result = await getTagMetadata({
				booru: this.booru,
				names: batch,
				limit: TAG_BATCH_SIZE
			});
			if (result.isErr()) continue;

			result.value.forEach((tag) => booruTagMap.set(tag.name, tag));
		}
	}
}

export const gallery = new Gallery();
