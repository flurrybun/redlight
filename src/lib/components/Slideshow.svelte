<script lang="ts">
	import { getGallery } from "$lib/context/gallery.svelte";
	import type { BooruPost } from "$lib/server/booru/types";
	import { takeNear } from "$lib/utils/array";
	import { isPropertyDefined } from "$lib/utils/types";
	import { ElementSize } from "runed";
	import LoadingSpinner from "./LoadingSpinner.svelte";
	import ProgressiveImage from "./ProgressiveImage.svelte";

	const gallery = getGallery();

	const NEAR_COUNT = 5;

	let post = $derived(gallery.posts.at(gallery.slideshowIndex));
	let nearPosts = $derived(
		takeNear(gallery.posts, gallery.slideshowIndex, NEAR_COUNT)
			.map((post, i) => ({ post, distance: i - NEAR_COUNT }))
			.filter(isPropertyDefined("post"))
	);
	// let isOpening = $derived(gallery.slideshowState === "opening");

	let touchElement = $state<HTMLElement>();
	let containerElement = $state<HTMLElement>();
	const containerSize = new ElementSize(() => containerElement);

	function getPostSize(post: BooruPost) {
		const containerWidth = containerSize.width - 16;
		const containerHeight = containerSize.height - 16;

		const containerRatio = containerWidth / containerHeight;
		const postRatio = post.width / post.height;

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

	async function next() {
		const nextIndex = gallery.slideshowIndex + 1;
		if (isTransitioning || (nextIndex >= gallery.posts.length && !gallery.hasMore)) return;

		isTransitioning = true;

		gallery.slideshowIndex = nextIndex;
		const postsRemaining = gallery.posts.length - nextIndex;

		if (postsRemaining <= NEAR_COUNT) {
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
			{#each nearPosts as { post, distance } (post.id)}
				{@const { width, height } = getPostSize(post)}
				{@const translateX = (gallery.slideshowIndex + distance) * containerSize.width}
				<div
					class="absolute"
					style:width="{width}px"
					style:height="{height}px"
					style:transform="translateX({translateX}px)"
					style:view-transition-name={distance === 0 ? "post" : undefined}
				>
					{#if post.mediaType === "image"}
						<ProgressiveImage url={post.url} placeholderUrl={post.placeholderUrl} class="rounded-lg"
						></ProgressiveImage>
					{:else}
						<!-- svelte-ignore a11y_media_has_caption -->
						<video class="h-full w-full rounded-lg" src={post.url} loop playsinline controls
						></video>
					{/if}
				</div>
			{/each}
		</div>
	</div>
{:else}
	<LoadingSpinner />
{/if}
