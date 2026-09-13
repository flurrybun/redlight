<script lang="ts">
	import { gallery } from "$lib/gallery.svelte";
	import type { BooruPost } from "$lib/server/booru/types";
	import { takeNear, takeNearClamped } from "$lib/utils/array";
	import { ElementSize } from "runed";
	import { SvelteMap } from "svelte/reactivity";
	import LoadingSpinner from "./LoadingSpinner.svelte";

	let post = $derived(gallery.posts.at(gallery.slideshowIndex));
	let nearPosts = $derived(takeNear(gallery.posts, gallery.slideshowIndex, 1));
	let isOpening = $derived(gallery.slideshowState === "opening");

	let touchElement = $state<HTMLElement>();
	let containerElement = $state<HTMLElement>();
	const containerSize = new ElementSize(() => containerElement);

	function getPostSize(post: BooruPost) {
		if (!post.file) return { width: 0, height: 0 };

		const containerWidth = containerSize.width - 16;
		const containerHeight = containerSize.height - 16;

		const containerRatio = containerWidth / containerHeight;
		const postRatio = post.file.width / post.file.height;

		if (postRatio > containerRatio) {
			return {
				width: containerWidth,
				height: containerWidth / postRatio
			};
		} else {
			return {
				width: containerHeight * postRatio,
				height: containerHeight
			};
		}
	}

	const preloadCache = new SvelteMap<string, HTMLImageElement>();
	const PRELOAD_COUNT = 5;

	function getBackgroundImageForPost(post: BooruPost) {
		const fileUrl = post.file?.url;
		const previewUrl = post.preview?.url;

		const showFile = !isOpening && fileUrl && preloadCache.has(fileUrl);

		if (showFile) return `url('${fileUrl}')`;
		if (previewUrl) return `url('${previewUrl}')`;
		return undefined;
	}

	$effect(() => {
		if (isOpening) return;

		const upcomingPosts = takeNearClamped(gallery.posts, gallery.slideshowIndex, PRELOAD_COUNT);

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

	async function next() {
		const nextIndex = gallery.slideshowIndex + 1;
		if (isTransitioning || (nextIndex >= gallery.posts.length && !gallery.hasMore)) return;

		isTransitioning = true;

		gallery.slideshowIndex = nextIndex;
		const postsRemaining = gallery.posts.length - nextIndex;

		if (postsRemaining <= PRELOAD_COUNT) {
			await gallery.fetchNextPage();
		}
	}

	function previous() {
		if (isTransitioning || gallery.slideshowIndex < 1) return;
		isTransitioning = true;

		gallery.slideshowIndex = gallery.slideshowIndex - 1;
	}

	const LOCK_THRESHOLD = 10;
	let startTime = 0;

	let start = { x: 0, y: 0 };
	let dragOrigin = { x: 0, y: 0 };
	let delta = $state({ x: 0, y: 0 });
	let direction = $state<"x" | "y" | undefined>(undefined);
	let pointerId = $state<number | undefined>(undefined);
	let isTransitioning = $state(false);

	function onPointerDown(event: PointerEvent) {
		if (event.pointerType !== "touch") return;

		if (isTransitioning && containerElement) {
			const matrix = new DOMMatrixReadOnly(getComputedStyle(containerElement).transform);
			delta.x = matrix.m41 + containerSize.width * gallery.slideshowIndex;
			isTransitioning = false;
			direction = "x";
		} else {
			direction = undefined;
			delta = { x: 0, y: 0 };
		}

		start = { x: event.clientX, y: event.clientY };
		dragOrigin = { x: delta.x, y: delta.y };
		startTime = performance.now();

		pointerId = event.pointerId;
		touchElement?.setPointerCapture(event.pointerId);
	}

	function onPointerMove(event: PointerEvent) {
		if (event.pointerType !== "touch" || event.pointerId !== pointerId) return;

		const dx = event.clientX - start.x;
		const dy = event.clientY - start.y;

		if (direction === undefined) {
			if (Math.abs(dx) < LOCK_THRESHOLD && Math.abs(dy) < LOCK_THRESHOLD) return;
			direction = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
		}

		if (direction === "x") {
			const atStart = gallery.slideshowIndex === 0 && dx > 0;
			const atEnd = gallery.slideshowIndex === gallery.posts.length - 1 && dx < 0;
			delta.x = dragOrigin.x + (atStart || atEnd ? dx * 0.35 : dx);
		} else {
			delta.y = dragOrigin.y + dy;
		}
	}

	function onPointerUp(event: PointerEvent) {
		if (event.pointerType !== "touch" || event.pointerId !== pointerId) return;

		const elapsed = Math.max(performance.now() - startTime, 1);

		if (direction === "x") {
			const shouldSwipe =
				Math.abs(delta.x) > containerSize.width / 2 || Math.abs(delta.x / elapsed) > 2;

			if (shouldSwipe) {
				if (delta.x < 0) void next();
				else previous();
			}
		} else if (direction === "y") {
			const shouldDismiss =
				Math.abs(delta.y) > containerSize.height * 0.2 || Math.abs(delta.y / elapsed) > 1.5;

			if (shouldDismiss) {
				gallery.closeSlideshow();
				pointerId = undefined;
				touchElement?.releasePointerCapture(event.pointerId);
				return;
			}
		}

		isTransitioning = true;
		delta = { x: 0, y: 0 };
		direction = undefined;

		pointerId = undefined;
		touchElement?.releasePointerCapture(event.pointerId);
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === "ArrowRight") {
			void next();
		} else if (event.key === "ArrowLeft") {
			previous();
		} else if (event.key === "Escape") {
			gallery.closeSlideshow();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if post}
	<div
		class="h-screen overflow-hidden"
		onpointerdown={onPointerDown}
		onpointermove={onPointerMove}
		onpointerup={onPointerUp}
		onpointercancel={onPointerUp}
		ontransitionend={() => (isTransitioning = false)}
		bind:this={touchElement}
		role="presentation"
	>
		<div
			class="grid h-full touch-none place-items-center will-change-transform"
			style:transform="translateX({delta.x - containerSize.width * gallery.slideshowIndex}px)
			translateY({delta.y}px)"
			style:transition={isTransitioning ? "transform 300ms ease-in-out" : undefined}
			bind:this={containerElement}
		>
			{#each nearPosts as post, i (post?.id ?? `null-${String(i)}`)}
				{#if post !== undefined}
					{@const { width, height } = getPostSize(post)}
					<div
						class="absolute rounded-lg bg-cover"
						style:background-image={getBackgroundImageForPost(post)}
						style:width="{width}px"
						style:height="{height}px"
						style:transform="translateX({(gallery.slideshowIndex + i - 1) * containerSize.width}px)"
						style:view-transition-name={i === 1 ? "post" : undefined}
					>
						{#if post.mediaType === "video"}
							<!-- svelte-ignore a11y_media_has_caption -->
							<video class="h-full w-full" src={post.file?.url} loop playsinline controls></video>
						{/if}
					</div>
				{/if}
			{/each}
		</div>
	</div>
{:else}
	<LoadingSpinner />
{/if}
