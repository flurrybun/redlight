import type { ApiError } from "$lib/api";
import { getTagMetadata, searchPosts } from "$lib/api";
import type { BooruPost, BooruTag } from "$lib/server/booru/types";

const PREFETCH_THRESHOLD = 5;

export class Gallery {
	posts = $state<BooruPost[]>([]);
	currentIndex = $state(0);
	isLoading = $state(false);
	hasMore = $state(true);
	error = $state<ApiError | undefined>(undefined);

	currentTags = $state<BooruTag[] | undefined>(undefined);
	tagsLoading = $state(false);
	tagsError = $state<ApiError | undefined>(undefined);

	#booru = "";
	#tags: string[] = [];
	#currentPage = 0;

	currentPost = $derived(this.posts.at(this.currentIndex));

	progress = $derived({
		current: this.currentIndex + 1,
		loaded: this.posts.length,
		hasMore: this.hasMore
	});

	constructor() {
		$effect(() => {
			const post = this.currentPost;

			this.currentTags = undefined;
			this.tagsError = undefined;

			if (!post || post.tags.length === 0) return;

			this.tagsLoading = true;
			const postId = post.id;

			getTagMetadata(this.#booru, post.tags).then((result) => {
				if (this.currentPost?.id !== postId) return;

				result.match(
					(tags) => {
						this.currentTags = tags;
						this.tagsLoading = false;
					},
					(error) => {
						this.tagsError = error;
						this.tagsLoading = false;
					}
				);
			});
		});
	}

	async search(booru: string, tags: string[]) {
		this.posts = [];
		this.currentIndex = 0;
		this.hasMore = true;
		this.error = undefined;

		this.currentTags = undefined;
		this.tagsError = undefined;

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
			},
			(error) => {
				this.error = error;
				this.isLoading = false;
			}
		);
	}
}
