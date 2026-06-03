<script lang="ts">
	import { gallery } from "$lib/gallery.svelte";
	import type { BooruPost } from "$lib/server/booru/types";
	import { SvelteMap } from "svelte/reactivity";

	let { post }: { post: BooruPost } = $props();

	const preloadCache = new SvelteMap<string, HTMLImageElement>();
	const PRELOAD_COUNT = 5;

	let displayedPost = $derived.by(() => {
		if (!post.file) return undefined;

		if (post.mediaType === "video") return post;

		const cached = preloadCache.get(post.file.url);
		if (cached) return post;

		const img = new Image();

		img.onload = () => {
			preloadCache.set(post.file!.url, img);
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
			gallery.currentIndex + 1,
			gallery.currentIndex + 1 + PRELOAD_COUNT
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
</script>

{#if displayedPost}
	<div>
		{#if displayedPost.mediaType === "image"}
			<!-- svelte-ignore a11y_missing_attribute -->
			<img src={displayedPost.file?.url} width="500" />
		{:else}
			<!-- svelte-ignore a11y_media_has_caption -->
			<video src={displayedPost.file?.url} loop playsinline controls></video>
		{/if}
	</div>
	<p>
		{gallery.progress.current} / {gallery.progress.loaded}{gallery.progress.hasMore ? "+" : ""}
	</p>
	<ul>
		{#each gallery.currentTags as tag (tag.name)}
			<li>{tag.name}: {tag.count}</li>
		{/each}
	</ul>
{:else}
	<div>Loading...</div>
{/if}
