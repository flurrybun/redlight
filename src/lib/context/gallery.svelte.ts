import { getTagMetadata, searchPosts } from "$lib/api/client";
import type { BooruId } from "$lib/api/schemas";
import type { ApiError } from "$lib/api/types";
import type { BooruPost, BooruTag } from "$lib/server/booru/types";
import { chunk, uniqBy } from "$lib/utils/array";
import { createContext, tick } from "svelte";
import { SvelteMap, SvelteSet } from "svelte/reactivity";

export const [getGallery, setGallery] = createContext<Gallery>();

export class Gallery {
	readonly TAG_BATCH_SIZE = 250;

	posts = $state<BooruPost[]>([]);
	booru = $state<BooruId>("danbooru");
	isLoading = $state(false);
	hasMore = $state(true);
	error = $state<ApiError | undefined>(undefined);

	isSlideshowOpen = $state(false);
	slideshowState = $state<"open" | "closed" | "opening" | "closing">("closed");
	slideshowIndex = $state(-1);

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
			limit: 100
		});

		await result.match(
			async (data) => {
				this.posts = uniqBy([...this.posts, ...data.posts], (post) => post.id);
				this.hasMore = data.posts.length > 0;
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

	openSlideshow(post: BooruPost) {
		this.slideshowIndex = Math.max(
			this.posts.findIndex((p) => p.id === post.id),
			0
		);
		this.slideshowState = "opening";

		this.#changeView(
			() => {
				this.isSlideshowOpen = true;
			},
			() => {
				this.slideshowState = "open";
			}
		);
	}

	closeSlideshow() {
		this.slideshowState = "closing";

		this.#changeView(
			() => {
				this.isSlideshowOpen = false;
			},
			() => {
				this.slideshowState = "closed";
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

		const batches = chunk([...missing], this.TAG_BATCH_SIZE);

		for (const batch of batches) {
			const result = await getTagMetadata({
				booru: this.booru,
				names: batch,
				limit: this.TAG_BATCH_SIZE
			});
			if (result.isErr()) continue;

			result.value.forEach((tag) => booruTagMap.set(tag.name, tag));
		}
	}

	#changeView(before: () => void, after: () => void) {
		const transition = document.startViewTransition(async () => {
			before();
			await tick();
		});

		void transition.finished.then(() => {
			after();
		});
	}
}
