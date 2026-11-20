<script lang="ts">
	import { getAllMetadata } from "#lib/booru/metadata.ts";
	import Button from "#lib/components/Button.svelte";
	import ErrorCard from "#lib/components/ErrorCard.svelte";
	import PostList from "#lib/components/PostList.svelte";
	import SearchBar from "#lib/components/SearchBar.svelte";
	import Select from "#lib/components/Select.svelte";
	import Slideshow from "#lib/components/Slideshow.svelte";
	import { Gallery, setGallery } from "#lib/context/gallery.svelte.ts";
	import Image from "@lucide/svelte/icons/image";
	import { ElementSize } from "runed";
	import { MediaQuery, SvelteSet } from "svelte/reactivity";

	const gallery = setGallery(new Gallery());
	const isMobile = new MediaQuery("max-width: 767px", false);

	let header = $state<HTMLElement>();
	const headerSize = new ElementSize(() => header);

	let searchBar = $state<{
		focus: () => void;
		blur: () => void;
		commit: () => void;
	}>();

	let tags = new SvelteSet<string>();
	let showPosts = $state(false);
	let isEditing = $state(false);
	let searchQuery = $state("");

	let isSearchMode = $derived(isEditing && isMobile.current);

	function openSearch() {
		if (!isMobile.current) return;

		isEditing = true;
		searchBar?.focus();
	}

	function closeSearch() {
		isEditing = false;
		searchBar?.blur();
	}

	function onSubmit() {
		searchBar?.commit();

		showPosts = true;
		isEditing = false;
		searchBar?.blur();

		void gallery.search([...tags]);
	}

	function onKeyDown(event: KeyboardEvent) {
		if (event.key === "Escape" && isSearchMode) closeSearch();
	}

	$effect(() => {
		if (!isSearchMode) return;

		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";

		return () => {
			document.body.style.overflow = previousOverflow;
		};
	});

	const selectBooruItems = getAllMetadata().map((booru) => ({
		value: booru.id,
		label: booru.name
	}));
</script>

<svelte:head>
	<title>redlight</title>
	<meta name="description" content="Booru browser" />
</svelte:head>

<svelte:window onkeydown={onKeyDown} />

{#if gallery.isSlideshowOpen}
	<Slideshow />
{:else}
	{#if isSearchMode}
		<div class="fixed inset-0 z-40 touch-none bg-void md:hidden" aria-hidden="true"></div>
	{/if}

	<section
		class={[
			"relative flex flex-col items-center justify-center px-2 transition-transform duration-500 ease-out-quint",
			!showPosts && "max-md:min-h-dvh md:translate-y-[calc(50dvh-50%)]"
		]}
	>
		<div class="relative flex w-full flex-col items-center">
			{#if !showPosts}
				<h1 class="pointer-events-none absolute -top-8 text-4xl font-bold tracking-tight text-dim">
					redlight
				</h1>
			{/if}

			<form
				class={[
					"my-16 flex w-180 max-w-full flex-col items-center gap-2 px-2",
					isSearchMode &&
						"max-md:fixed max-md:inset-x-0 max-md:top-0 max-md:z-50 max-md:my-0 max-md:w-full max-md:bg-void max-md:px-2 max-md:pt-[calc(0.5rem+env(safe-area-inset-top))] max-md:pb-2"
				]}
				onsubmit={(event) => {
					event.preventDefault();
					onSubmit();
				}}
				bind:this={header}
			>
				<div class="flex w-full items-start gap-2">
					<SearchBar
						{tags}
						{onSubmit}
						onFocusIn={openSearch}
						onBack={isSearchMode ? closeSearch : undefined}
						showSubmit={isSearchMode}
						bind:query={searchQuery}
						bind:this={searchBar}
					/>
					<Button variant="fluorescent" class="h-input max-md:hidden" type="submit">Search</Button>
				</div>

				<div class="flex w-full justify-start gap-2">
					<Select
						type="single"
						bind:value={gallery.booru}
						items={selectBooruItems}
						placeholder="Select a booru"
						icon={Image}
					/>
				</div>
			</form>
		</div>
	</section>

	{#if showPosts}
		<section class="px-2" inert={isSearchMode}>
			{#if gallery.error}
				<ErrorCard error={gallery.error} />
			{:else}
				<PostList top={headerSize.height} />
			{/if}
		</section>
	{/if}
{/if}
