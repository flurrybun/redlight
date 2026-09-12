<script lang="ts">
	import { gallery } from "$lib/gallery.svelte";
	import type { BooruPost } from "$lib/server/booru/types";
	import { indexOfMin } from "$lib/utils/array";
	import Play from "@lucide/svelte/icons/play";
	import { ElementSize, useIntersectionObserver } from "runed";
	import { onMount, tick } from "svelte";
	import LoadingSpinner from "./LoadingSpinner.svelte";

	let {
		top
	}: {
		top: number;
	} = $props();

	const MAX_COLUMN_WIDTH = 500;
	const ROW_GAP = 8;
	const COLUMN_GAP = 8;
	const WINDOW_BUFFER = 50;

	let containerElement = $state<HTMLElement>();
	let loadSentinelElement = $state<HTMLElement>();
	const containerSize = new ElementSize(() => containerElement);

	let viewportHeight = $state(0);
	let scrollY = $state(0);
	let windowTop = $derived(scrollY - top - WINDOW_BUFFER);
	let windowBottom = $derived(scrollY + viewportHeight - top + WINDOW_BUFFER);

	let width = $derived(containerSize.width);
	let columns = $derived(Math.ceil(Math.max(width, 1) / MAX_COLUMN_WIDTH));
	let columnWidth = $derived((width - (columns - 1) * COLUMN_GAP) / columns);

	function getPostHeight(post: BooruPost) {
		if (!post.preview) return columnWidth;

		const { width, height } = post.preview;
		return Math.min((height * columnWidth) / width, 1000);
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
	class="relative mx-auto w-full max-w-300"
	style:height="{contentHeight}px"
	bind:this={containerElement}
>
	{#each visibleItems as item (item.post.id)}
		<button
			class="absolute cursor-pointer rounded bg-cover bg-center"
			style:top="{item.top}px"
			style:left="{item.left}px"
			style:width="{columnWidth}px"
			style:height="{item.height}px"
			style:background-image="url('{item.post.preview?.url}')"
			style:view-transition-name={item.index === gallery.slideshowIndex ? "post" : undefined}
			onclick={() => {
				gallery.openSlideshow(item.post);
			}}
		>
			{#if item.post.mediaType === "video"}
				<div class="absolute inset-0 place-self-center rounded-full bg-black/50 p-2">
					<Play class="text-white" />
				</div>
			{/if}
		</button>
	{/each}
	<div class="absolute" style:top="{contentHeight - 1000}px" bind:this={loadSentinelElement}></div>
</div>

{#if gallery.isLoading}
	<LoadingSpinner />
{/if}
