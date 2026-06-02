<script lang="ts">
	import { Gallery } from "$lib/gallery.svelte";
	import { onMount } from "svelte";

	const booru = "gelbooru";
	const gallery = new Gallery();

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

	{#if gallery.isLoading && gallery.posts.length === 0}
		<p>Loading...</p>
	{:else if gallery.error}
		<p>Error: {gallery.error.kind}</p>
	{:else if gallery.currentPost}
		<img src={gallery.currentPost.file?.url} alt="hentai" width="500" />
		<p>
			{gallery.progress.current} / {gallery.progress.loaded}{gallery.progress.hasMore ? "+" : ""}
		</p>
		<ul>
			{#each gallery.currentTags as tag (tag.name)}
				<li>{tag.name}: {tag.count}</li>
			{/each}
		</ul>
	{/if}
</section>
