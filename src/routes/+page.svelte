<script lang="ts">
	import MediaViewer from "$lib/components/MediaViewer.svelte";
	import { gallery } from "$lib/gallery.svelte";
	import { onMount } from "svelte";

	let booru = $state<string>("danbooru");
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

	<fieldset>
		<input type="radio" name="booru" value="danbooru" bind:group={booru} id="danbooru" />
		<label for="danbooru">Danbooru</label>
		<input type="radio" name="booru" value="gelbooru" bind:group={booru} id="gelbooru" />
		<label for="gelbooru">Gelbooru</label>
		<input type="radio" name="booru" value="e621" bind:group={booru} id="e621" />
		<label for="e621">e621</label>
	</fieldset>

	{#if gallery.currentPost}
		<MediaViewer post={gallery.currentPost} />
	{/if}
</section>
