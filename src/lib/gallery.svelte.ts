import type { BooruId, BooruPost, BooruTag } from "$lib/server/booru/types";
import { SvelteMap, SvelteSet } from "svelte/reactivity";
import { getTagMetadata, searchPosts } from "./api/client";
import type { ApiError } from "./api/types";
import { chunk } from "./utils/array";

const PREFETCH_THRESHOLD = 5;
const TAG_BATCH_SIZE = 250;

class Gallery {
	posts = $state<BooruPost[]>([]);
	currentIndex = $state(0);
	isLoading = $state(false);
	hasMore = $state(true);
	error = $state<ApiError | undefined>(undefined);

	tagMap = $state(new SvelteMap<BooruId, SvelteMap<string, BooruTag>>());

	#booru: BooruId = "danbooru";
	#tags: string[] = [];
	#currentPage = 1;

	currentPost = $derived(this.posts.at(this.currentIndex));

	progress = $derived({
		current: this.currentIndex + 1,
		loaded: this.posts.length,
		hasMore: this.hasMore
	});

	currentTags = $derived(
		this.currentPost?.tags
			.map((name) => this.tagMap.get(this.#booru)?.get(name))
			.filter((tag) => tag !== undefined) ?? []
	);

	async search(booru: BooruId, tags: string[]) {
		this.posts = [];
		this.currentIndex = 0;
		this.hasMore = true;
		this.error = undefined;

		this.#booru = booru;
		this.#tags = tags;
		this.#currentPage = 1;

		await this.#fetchNextPage();
	}

	async next() {
		const nextIndex = this.currentIndex + 1;
		if (nextIndex >= this.posts.length && !this.hasMore) return;

		this.currentIndex = nextIndex;
		const postsRemaining = this.posts.length - nextIndex;

		if (postsRemaining <= PREFETCH_THRESHOLD) {
			await this.#fetchNextPage();
		}
	}

	previous() {
		this.currentIndex = Math.max(0, this.currentIndex - 1);
	}

	async #fetchNextPage() {
		if (this.isLoading || !this.hasMore) return;

		this.isLoading = true;
		this.error = undefined;

		const result = await searchPosts({
			booru: this.#booru,
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
		if (!this.tagMap.has(this.#booru)) {
			this.tagMap.set(this.#booru, new SvelteMap());
		}

		const booruTagMap = this.tagMap.get(this.#booru);
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
			const result = await getTagMetadata(this.#booru, batch, TAG_BATCH_SIZE);
			if (result.isErr()) continue;

			result.value.forEach((tag) => booruTagMap.set(tag.name, tag));
		}
	}
}

export const gallery = new Gallery();
