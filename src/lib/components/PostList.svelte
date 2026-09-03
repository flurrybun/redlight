<script lang="ts">
	import { gallery } from "$lib/gallery.svelte";
	import type { BooruPost } from "$lib/server/booru/types";
	import { indexOfMin } from "$lib/utils/array";
	import Play from "@lucide/svelte/icons/play";
	import { ElementRect, useIntersectionObserver } from "runed";
	import LoadingSpinner from "./LoadingSpinner.svelte";

	const MAX_COLUMN_WIDTH = 500;
	const ROW_GAP = 8;
	const COLUMN_GAP = 8;

	let containerElement = $state<HTMLElement>();
	let loadSentinelElement = $state<HTMLElement>();
	const containerRect = new ElementRect(() => containerElement);

	let width = $derived(containerRect.width);
	let columns = $derived(Math.ceil(Math.max(width, 1) / MAX_COLUMN_WIDTH));
	let columnWidth = $derived((width - (columns - 1) * COLUMN_GAP) / columns);

	function getPostHeight(post: BooruPost) {
		if (!post.preview) return columnWidth;

		const { width, height } = post.preview;
		return (height * columnWidth) / width;
	}

	let { items, contentHeight } = $derived.by(() => {
		const columnHeights = Array<number>(columns).fill(0);
		let contentHeight = 0;

		// todo: filter out off-screen posts

		const items = gallery.posts.map((post) => {
			const column = indexOfMin(columnHeights);
			const height = getPostHeight(post);
			const top = columnHeights[column];
			const left = column * (columnWidth + COLUMN_GAP);

			columnHeights[column] += height + ROW_GAP;

			contentHeight = Math.max(contentHeight, top + height);

			return {
				post,
				column,
				top,
				left,
				height
			};
		});

		return { items, contentHeight };
	});

	useIntersectionObserver(
		() => loadSentinelElement,
		(entries) => {
			const entry = entries.at(0);
			if (!entry?.isIntersecting) return;

			void gallery.fetchNextPage();
		}
	);
</script>

<div
	class="relative mx-auto w-full max-w-300"
	style:height="{contentHeight}px"
	bind:this={containerElement}
>
	{#each items as item (item.post.id)}
		<button
			class="absolute cursor-pointer rounded bg-cover bg-center"
			style:top="{item.top}px"
			style:left="{item.left}px"
			style:width="{columnWidth}px"
			style:height="{item.height}px"
			style:background-image="url('{item.post.preview?.url}')"
			onclick={() => (gallery.inGallery = true)}
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
