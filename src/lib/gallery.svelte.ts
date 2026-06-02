import type { ApiError } from "$lib/api";
import { getTagMetadata, searchPosts } from "$lib/api";
import type { BooruPost, BooruTag } from "$lib/server/booru/types";
import { SvelteMap, SvelteSet } from "svelte/reactivity";

const PREFETCH_THRESHOLD = 5;

export class Gallery {
	posts = $state<BooruPost[]>([]);
	currentIndex = $state(0);
	isLoading = $state(false);
	hasMore = $state(true);
	error = $state<ApiError | undefined>(undefined);

	tagMap = $state(new SvelteMap<string, BooruTag>());

	#booru = "";
	#tags: string[] = [];
	#currentPage = 0;

	currentPost = $derived(this.posts.at(this.currentIndex));

	progress = $derived({
		current: this.currentIndex + 1,
		loaded: this.posts.length,
		hasMore: this.hasMore
	});

	currentTags = $derived(
		this.currentPost?.tags
			.map((name) => this.tagMap.get(name))
			.filter((tag) => tag !== undefined) ?? []
	);

	async search(booru: string, tags: string[]) {
		this.posts = [];
		this.currentIndex = 0;
		this.hasMore = true;
		this.error = undefined;

		this.#booru = booru;
		this.#tags = tags;
		this.#currentPage = 0;

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

		result.match(
			(data) => {
				this.posts = [...this.posts, ...data.posts];
				this.hasMore = data.posts.length === 20;
				this.#currentPage += 1;
				this.isLoading = false;

				this.#prefetchTags(data.posts);
			},
			(error) => {
				this.error = error;
				this.isLoading = false;
			}
		);
	}

	async #prefetchTags(posts: BooruPost[]) {
		const missing = new SvelteSet<string>();

		for (const post of posts) {
			for (const tag of post.tags) {
				if (this.tagMap.has(tag)) continue;

				missing.add(tag);
			}
		}

		if (missing.size === 0) return;

		const result = await getTagMetadata(this.#booru, [...missing]);

		if (result.isErr()) return;

		for (const tag of result.value) {
			this.tagMap.set(tag.name, tag);
		}
	}
}
