<script lang="ts">
	import MediaViewer from "$lib/components/MediaViewer.svelte";
	import PostList from "$lib/components/PostList.svelte";
	import SearchBar from "$lib/components/SearchBar.svelte";
	import { gallery } from "$lib/gallery.svelte";
	import { onMount } from "svelte";
	import { SvelteSet } from "svelte/reactivity";

	let tags = new SvelteSet<string>();

	onMount(() => gallery.search([...tags]));
</script>

<svelte:head>
	<title>redlight</title>
	<meta name="description" content="Booru browser" />
</svelte:head>

<section class="p-4">
	<form
		class="mx-auto mt-10 mb-12 w-200"
		onsubmit={(event) => {
			event.preventDefault();
			void gallery.search([...tags]);
		}}
	>
		<div class="flex items-center gap-2">
			<SearchBar {tags} />
			<button class="bg-gray-800 px-2 py-1" type="submit">Search</button>
		</div>

		<fieldset>
			<input type="radio" name="booru" value="danbooru" bind:group={gallery.booru} id="danbooru" />
			<label for="danbooru">Danbooru</label>
			<input type="radio" name="booru" value="gelbooru" bind:group={gallery.booru} id="gelbooru" />
			<label for="gelbooru">Gelbooru</label>
			<input type="radio" name="booru" value="e621" bind:group={gallery.booru} id="e621" />
			<label for="e621">e621</label>
		</fieldset>
	</form>

	{#if gallery.inGallery}
		<MediaViewer />
	{:else}
		<PostList />
	{/if}
</section>
