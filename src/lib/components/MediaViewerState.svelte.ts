import { gallery } from "$lib/gallery.svelte";

const PREFETCH_THRESHOLD = 5;

export default class MediaViewerState {
	currentIndex = $state(0);
	currentPost = $derived(gallery.posts.at(this.currentIndex));

	async next() {
		const nextIndex = this.currentIndex + 1;
		if (nextIndex >= gallery.posts.length && !gallery.hasMore) return;

		this.currentIndex = nextIndex;
		const postsRemaining = gallery.posts.length - nextIndex;

		if (postsRemaining <= PREFETCH_THRESHOLD) {
			await gallery.fetchNextPage();
		}
	}

	previous() {
		this.currentIndex = Math.max(0, this.currentIndex - 1);
	}
}
