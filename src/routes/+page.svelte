<script lang="ts">
	import { getAllMetadata } from "$lib/booru/metadata";
	import Button from "$lib/components/Button.svelte";
	import ErrorCard from "$lib/components/ErrorCard.svelte";
	import PostList from "$lib/components/PostList.svelte";
	import SearchBar from "$lib/components/SearchBar.svelte";
	import Select from "$lib/components/Select.svelte";
	import Slideshow from "$lib/components/Slideshow.svelte";
	import { Gallery, setGallery } from "$lib/context/gallery.svelte";
	import Image from "@lucide/svelte/icons/image";
	import { ElementSize } from "runed";
	import { SvelteSet } from "svelte/reactivity";

	const gallery = setGallery(new Gallery());

	let header = $state<HTMLElement>();
	const headerSize = new ElementSize(() => header);

	let tags = new SvelteSet<string>();
	let showPosts = $state(false);

	function onSubmit(event: SubmitEvent) {
		event.preventDefault();

		showPosts = true;
		void gallery.search([...tags]);
	}

	const selectBooruItems = getAllMetadata().map((booru) => ({
		value: booru.id,
		label: booru.name
	}));
</script>

<svelte:head>
	<title>redlight</title>
	<meta name="description" content="Booru browser" />
</svelte:head>

{#if gallery.isSlideshowOpen}
	<Slideshow />
{:else}
	<section
		class="relative flex flex-col items-center justify-center px-2 transition-transform duration-500 ease-out-quint"
		style:transform={showPosts ? undefined : "translateY(calc(50dvh - 50%))"}
	>
		{#if !showPosts}
			<h1 class="absolute -top-8 text-4xl font-bold tracking-tight text-dim">redlight</h1>
		{/if}

		<form
			class="my-16 flex flex-col items-center gap-2 px-2"
			onsubmit={onSubmit}
			bind:this={header}
		>
			<div class="flex-start flex w-full justify-center gap-2">
				<SearchBar {tags} />
				<Button variant="fluorescent" class="h-input" type="submit">Search</Button>
			</div>

			<div class="flex w-full justify-start gap-2">
				<Select
					type="single"
					value={gallery.booru}
					items={selectBooruItems}
					placeholder="Select a booru"
					icon={Image}
				/>
			</div>
		</form>
	</section>

	{#if showPosts}
		<section class="px-2">
			{#if gallery.error}
				<ErrorCard error={gallery.error} />
			{:else}
				<PostList top={headerSize.height} />
			{/if}
		</section>
	{/if}
{/if}
