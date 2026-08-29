<script lang="ts">
	import { autocompleteTag } from "$lib/api/client";
	import { gallery } from "$lib/gallery.svelte";
	import type { BooruTag } from "$lib/server/booru/types";
	import { formatNumberCompact } from "$lib/utils/intl";
	import { Combobox } from "bits-ui";
	import { useThrottle } from "runed";
	import type { SvelteSet } from "svelte/reactivity";

	let {
		tags
	}: {
		tags: SvelteSet<string>;
	} = $props();

	let query = $state("");
	let autocompleteTags = $state<BooruTag[]>([]);

	const updateQuery = useThrottle(
		() => {
			if (!query) {
				autocompleteTags = [];
				return;
			}

			autocompleteTag({
				booru: gallery.booru,
				tag: query,
				limit: 10
			}).then((result) => {
				autocompleteTags = result.unwrapOr([]);
			});
		},
		500 // ms
	);

	function onKeyDown(event: KeyboardEvent) {
		if (event.key === "Backspace" && query === "" && tags.size > 0) {
			event.preventDefault();

			const lastTag = [...tags].at(-1);
			if (!lastTag) return;

			removeTag(lastTag);
			query = lastTag;
		}
	}

	function addTag(tag: string) {
		if (tag == "" || tags.has(tag)) return;

		tags.add(tag);
		query = "";
	}

	function removeTag(tag: string) {
		tags.delete(tag);
	}
</script>

<Combobox.Root
	type="single"
	name="tagSearchBar"
	bind:value={query}
	onValueChange={(value: string) => {
		addTag(value);
	}}
>
	<Combobox.Input placeholder="Search" aria-label="Search">
		{#snippet child({ props })}
			<div
				class="flex grow items-center gap-1 border border-gray-600 p-2 focus-within:border-gray-400"
				{...props}
			>
				{#each tags as tagItem (tagItem)}
					<button class="shrink-0 rounded bg-gray-800 px-1" type="button">
						{tagItem}
						<span
							class="cursor-pointer"
							role="button"
							tabindex="-1"
							onpointerdown={(event) => {
								event.preventDefault();
								removeTag(tagItem);
							}}
						>
							&#215;
						</span>
					</button>
				{/each}
				<input
					class="w-full focus:outline-hidden"
					type="text"
					bind:value={
						() => query,
						(v: string) => {
							query = v;
							void updateQuery();
						}
					}
					onkeydown={onKeyDown}
					name="tagSearchInput"
					id="search-tag-input"
					placeholder={tags.size === 0 ? "Search" : undefined}
					aria-label="Search"
				/>
			</div>
		{/snippet}
	</Combobox.Input>
	{#if autocompleteTags.length > 0}
		<Combobox.Portal>
			<Combobox.Content
				class="z-50 max-h-(--bits-combobox-content-available-height) w-(--bits-combobox-anchor-width) min-w-(--bits-combobox-anchor-width) border border-gray-800 bg-black p-4 outline-hidden select-none"
				sideOffset={10}
			>
				{#each autocompleteTags as tag (tag)}
					<Combobox.Item
						class="px-2 py-1 outline-hidden select-none data-highlighted:bg-gray-800"
						value={tag.name}
					>
						{tag.name}
						<span class="text-sm text-gray-400">{formatNumberCompact(tag.count)}</span>
					</Combobox.Item>
				{/each}
			</Combobox.Content>
		</Combobox.Portal>
	{/if}
</Combobox.Root>
