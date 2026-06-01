<script lang="ts">
	// import { searchPosts } from "$lib/api";
	import { gallery } from "$lib/gallery.svelte";
	// import type { BooruPost } from "$lib/server/booru/types";
	import { onMount } from "svelte";

	const booru = "gelbooru";

	// let results = $state<BooruPost[]>([]);
	// let error = $state<string | undefined>();

	let searchTags = $state<string>("lucky_star");
	let tags = $derived(searchTags.split(" ").filter(Boolean));

	async function handleSearch() {
		// const result = await searchPosts({
		// 	booru: "gelbooru",
		// 	tags: tags,
		// 	page: 0
		// });

		// console.log(result);

		// result.match(
		// 	(data) => {
		// 		results = data.posts;
		// 	},
		// 	(err) => {
		// 		error = err.kind === "http" ? `HTTP ${err.status}` : err.message;
		// 	}
		// );

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

<section>
	<input type="text" placeholder="Search tags (space-separated)" bind:value={searchTags} />
	<button onclick={handleSearch}>Search</button>

	{#if gallery.isLoading && gallery.posts.length === 0}
		<p>Loading...</p>
	{:else if gallery.error}
		<p>Error: {gallery.error.kind}</p>
	{:else if gallery.currentPost}
		<img src={gallery.currentPost.fileUrl} referrerpolicy="no-referrer" alt="hentai" />
		<p>
			{gallery.progress.current} / {gallery.progress.loaded}{gallery.progress.hasMore ? "+" : ""}
		</p>
	{/if}
</section>
