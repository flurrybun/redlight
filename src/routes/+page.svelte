<script lang="ts">
	import MediaViewer from "$lib/components/MediaViewer.svelte";
	import { gallery } from "$lib/gallery.svelte";
	import { onMount } from "svelte";

	const booru = "gelbooru";

	let searchTags = $state<string>("lucky_star");
	let tags = $derived(searchTags.split(" ").filter(Boolean));

	async function handleSearch() {
		gallery.search(booru, tags);
	}

	onMount(() => gallery.search(booru, tags));

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === "ArrowRight") gallery.next();
		if (e.key === "ArrowLeft") gallery.previous();
	}
</script>

<svelte:head>
	<title>Home</title>
	<meta name="description" content="Svelte demo app" />
</svelte:head>

<svelte:window onkeydown={handleKeydown} />

<section class="p-4">
	<input type="text" placeholder="Search tags (space-separated)" bind:value={searchTags} />
	<button onclick={handleSearch}>Search</button>

	{#if gallery.currentPost}
		<MediaViewer post={gallery.currentPost} />
	{/if}
</section>
