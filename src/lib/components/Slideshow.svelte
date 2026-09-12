<script lang="ts">
	import { gallery } from "$lib/gallery.svelte";
	import { ElementSize } from "runed";
	import { SvelteMap } from "svelte/reactivity";
	import LoadingSpinner from "./LoadingSpinner.svelte";

	let post = $derived(gallery.posts.at(gallery.slideshowIndex));
	let isOpening = $derived(gallery.slideshowState === "opening");

	let containerElement = $state<HTMLElement>();
	const containerSize = new ElementSize(() => containerElement);

	const { postWidth, postHeight } = $derived.by(() => {
		if (!post?.file) return { postWidth: 0, postHeight: 0 };

		const containerRatio = containerSize.width / containerSize.height;
		const postRatio = post.file.width / post.file.height;

		if (postRatio > containerRatio) {
			return {
				postWidth: containerSize.width,
				postHeight: containerSize.width / postRatio
			};
		} else {
			return {
				postWidth: containerSize.height * postRatio,
				postHeight: containerSize.height
			};
		}
	});

	const preloadCache = new SvelteMap<string, HTMLImageElement>();
	const PRELOAD_COUNT = 5;

	let backgroundImage = $derived.by(() => {
		const fileUrl = post?.file?.url;
		const previewUrl = post?.preview?.url;

		const showFile = !isOpening && fileUrl && preloadCache.has(fileUrl);

		if (showFile) return `url('${fileUrl}')`;
		if (previewUrl) return `url('${previewUrl}')`;
		return undefined;
	});

	$effect(() => {
		if (isOpening) return;

		const upcomingPosts = gallery.posts.slice(
			Math.max(gallery.slideshowIndex + 1 - PRELOAD_COUNT, 0),
			Math.min(gallery.slideshowIndex + 1 + PRELOAD_COUNT, gallery.posts.length)
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
		if (event.key === "ArrowRight") void next();
		if (event.key === "ArrowLeft") previous();
		if (event.key === "Escape") gallery.closeSlideshow();
	};

	async function next() {
		const nextIndex = gallery.slideshowIndex + 1;
		if (nextIndex >= gallery.posts.length && !gallery.hasMore) return;

		gallery.slideshowIndex = nextIndex;
		const postsRemaining = gallery.posts.length - nextIndex;

		if (postsRemaining <= PRELOAD_COUNT) {
			await gallery.fetchNextPage();
		}
	}

	function previous() {
		gallery.slideshowIndex = Math.max(0, gallery.slideshowIndex - 1);
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if post}
	<div class="h-screen p-2">
		<div class="grid h-full w-full place-items-center" bind:this={containerElement}>
			{#if post.mediaType === "image"}
				<div
					class="rounded-lg bg-cover bg-center"
					style:background-image={backgroundImage}
					style:width="{postWidth}px"
					style:height="{postHeight}px"
					style:view-transition-name="post"
				></div>
			{:else}
				<!-- svelte-ignore a11y_media_has_caption -->
				<video
					class="rounded-lg"
					src={post.file?.url}
					style:width="{postWidth}px"
					style:height="{postHeight}px"
					style:view-transition-name="post"
					loop
					playsinline
					controls
				></video>
			{/if}
		</div>
	</div>
{:else}
	<LoadingSpinner />
{/if}
