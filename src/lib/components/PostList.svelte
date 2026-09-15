<script lang="ts">
	import { gallery } from "$lib/gallery.svelte";
	import type { BooruPost } from "$lib/server/booru/types";
	import { indexOfMin } from "$lib/utils/array";
	import Play from "@lucide/svelte/icons/play";
	import { ElementSize, useIntersectionObserver } from "runed";
	import { onMount, tick } from "svelte";
	import LoadingSpinner from "./LoadingSpinner.svelte";
	import ProgressiveImage from "./ProgressiveImage.svelte";

	let {
		top
	}: {
		top: number;
	} = $props();

	const MAX_COLUMN_WIDTH = 500;
	const ROW_GAP = 8;
	const COLUMN_GAP = 8;
	const WINDOW_BUFFER_VH = 100;
	const POST_LOAD_BUFFER = 3000;

	let containerElement = $state<HTMLElement>();
	let loadSentinelElement = $state<HTMLElement>();
	const containerSize = new ElementSize(() => containerElement);

	let viewportHeight = $state(0);
	let scrollY = $state(0);

	let bufferHeight = $derived(WINDOW_BUFFER_VH * viewportHeight);
	let windowTop = $derived(scrollY - top - bufferHeight);
	let windowBottom = $derived(scrollY + viewportHeight - top + bufferHeight);

	let maxColumnWidth = $derived(
		containerSize.width > 0 ? Math.min(MAX_COLUMN_WIDTH, containerSize.width) : MAX_COLUMN_WIDTH
	);
	let columns = $derived(Math.ceil(Math.max(containerSize.width, 1) / maxColumnWidth));
	let columnWidth = $derived((containerSize.width - (columns - 1) * COLUMN_GAP) / columns);

	function getPostHeight(post: BooruPost) {
		return Math.min((post.height * columnWidth) / post.width, 1000);
	}

	// visibleItems is calculated separately for performance, since windowTop/Bottom
	// changes far more frequently; once per frame while scrolling

	let { items, contentHeight } = $derived.by(() => {
		const columnHeights = Array<number>(columns).fill(0);
		let contentHeight = 0;

		const items = gallery.posts.map((post, index) => {
			const column = indexOfMin(columnHeights);
			const height = getPostHeight(post);
			const top = columnHeights[column];
			const left = column * (columnWidth + COLUMN_GAP);

			columnHeights[column] += height + ROW_GAP;

			contentHeight = Math.max(contentHeight, top + height);

			return {
				index,
				post,
				column,
				top,
				left,
				height
			};
		});

		return { items, contentHeight };
	});

	let visibleItems = $derived.by(() => {
		const slideshowIdx = gallery.slideshowIndex;
		const slideshowItem = slideshowIdx >= 0 ? items.at(slideshowIdx) : undefined;

		let startIdx: number | undefined = undefined;

		for (let i = 0; i < items.length; i++) {
			const item = items[i];

			if (startIdx === undefined) {
				if (item.top + item.height >= windowTop) startIdx = i;
			} else {
				if (item.top > windowBottom) {
					const ret = items.slice(startIdx, i);

					if (slideshowItem && (slideshowIdx < startIdx || slideshowIdx >= i)) {
						ret.push(slideshowItem);
					}

					return ret;
				}
			}
		}

		startIdx = startIdx ?? 0;
		const ret = items.slice(startIdx);

		if (slideshowItem && slideshowIdx < startIdx) {
			ret.push(slideshowItem);
		}

		return ret;
	});

	useIntersectionObserver(
		() => loadSentinelElement,
		(entries) => {
			const entry = entries.at(0);
			if (!entry?.isIntersecting) return;

			void gallery.fetchNextPage();
		}
	);

	onMount(async () => {
		if (gallery.slideshowIndex === -1) return;

		await tick();

		const item = items.at(gallery.slideshowIndex);
		if (!item) return;

		window.scrollTo({
			top: Math.max(top + item.top + item.height / 2 - viewportHeight / 2, 0),
			behavior: "instant"
		});
	});
</script>

<svelte:window bind:innerHeight={viewportHeight} bind:scrollY />

<div
	class="relative mx-auto w-full max-w-400"
	style:height="{contentHeight}px"
	bind:this={containerElement}
>
	{#each visibleItems as item (item.post.id)}
		<button
			class="absolute cursor-pointer rounded"
			style:top="{item.top}px"
			style:left="{item.left}px"
			style:width="{columnWidth}px"
			style:height="{item.height}px"
			style:view-transition-name={item.index === gallery.slideshowIndex ? "post" : undefined}
			onclick={() => {
				gallery.openSlideshow(item.post);
			}}
		>
			<ProgressiveImage
				url={item.post.previewUrl}
				placeholderUrl={item.post.placeholderUrl}
				class="rounded"
			>
				{#if item.post.mediaType === "video"}
					<div class="absolute inset-0 place-self-center rounded-full bg-black/50 p-2">
						<Play class="text-white" />
					</div>
				{/if}
			</ProgressiveImage>
		</button>
	{/each}
	<div
		class="absolute"
		style:top="{contentHeight - POST_LOAD_BUFFER}px"
		bind:this={loadSentinelElement}
	></div>
</div>

{#if gallery.isLoading}
	<LoadingSpinner />
{/if}
