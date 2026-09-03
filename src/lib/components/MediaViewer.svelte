<script lang="ts">
	import { gallery } from "$lib/gallery.svelte";
	import { SvelteMap } from "svelte/reactivity";
	import LoadingSpinner from "./LoadingSpinner.svelte";
	import MediaViewerState from "./MediaViewerState.svelte";

	const state = new MediaViewerState();
	let post = $derived(state.currentPost);

	const preloadCache = new SvelteMap<string, HTMLImageElement>();
	const PRELOAD_COUNT = 5;

	let displayedPost = $derived.by(() => {
		if (!post?.file) return undefined;

		if (post.mediaType === "video") return post;

		const cached = preloadCache.get(post.file.url);
		if (cached) return post;

		const img = new Image();

		img.onload = () => {
			if (!post.file) return;

			preloadCache.set(post.file.url, img);
			displayedPost = post;
		};

		img.onerror = () => {
			displayedPost = post;
		};

		img.src = post.file.url;

		return undefined;
	});

	$effect(() => {
		const upcomingPosts = gallery.posts.slice(
			state.currentIndex + 1,
			state.currentIndex + 1 + PRELOAD_COUNT
		);

		upcomingPosts.forEach((post) => {
			if (!post.file || post.mediaType !== "image" || preloadCache.has(post.file.url)) return;

			const img = new Image();

			img.onload = () => {
				if (!post.file) return;
				preloadCache.set(post.file.url, img);
			};

			img.src = post.file.url;
		});
	});

	const handleKeydown = (event: KeyboardEvent) => {
		if (event.key === "ArrowRight") void state.next();
		if (event.key === "ArrowLeft") state.previous();
		if (event.key === "Escape") gallery.inGallery = false;
	};
</script>

<svelte:window onkeydown={handleKeydown} />

{#if displayedPost}
	<div>
		{#if displayedPost.mediaType === "image"}
			<!-- svelte-ignore a11y_missing_attribute -->
			<img src={displayedPost.file?.url} class="mx-auto h-screen pt-8" />
		{:else}
			<!-- svelte-ignore a11y_media_has_caption -->
			<video src={displayedPost.file?.url} loop playsinline controls></video>
		{/if}
	</div>
{:else}
	<LoadingSpinner />
{/if}
