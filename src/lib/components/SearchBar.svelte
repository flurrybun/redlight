<script lang="ts">
	import { formatNumberCompact } from "$lib/utils/intl";
	import { Combobox } from "bits-ui";
	import { ElementSize, useThrottle } from "runed";
	import type { SvelteSet } from "svelte/reactivity";
	import {
		type AutocompleteTag,
		autocompleteTagsForQuery,
		shouldThrottleQuery
	} from "./SearchBarState.svelte";

	let {
		tags
	}: {
		tags: SvelteSet<string>;
	} = $props();

	let query = $state("");
	let isOpen = $state<boolean>(false);

	let autocompleteTags = $state<AutocompleteTag[]>([]);
	let highlightedTag = $state<AutocompleteTag | undefined>();

	let { startFill, endFill } = $derived.by(() => {
		if (query === "" || !highlightedTag || !isOpen) return {};

		const name = highlightedTag.antecedent ?? highlightedTag.name;

		const idx = name.indexOf(query);
		if (idx === -1) return {};

		return {
			startFill: name.substring(0, idx),
			endFill: name.substring(idx + query.length)
		};
	});

	let startFillElement = $state<HTMLElement>();
	const startFillSize = new ElementSize(() => startFillElement);

	$effect(() => {
		if (query == "") {
			autocompleteTags = [];
			highlightedTag = undefined;
			isOpen = false;
		} else {
			startFill = "";
			endFill = "";
			void onUpdateQuery();
		}
	});

	const onUpdateQuery = useThrottle(
		async () => {
			if (!query) {
				autocompleteTags = [];
				return;
			}

			const prevQuery = query;

			const tags = await autocompleteTagsForQuery(query).map((tags) =>
				tags.length === 0 ? [{ name: query }] : tags.slice(0, 10)
			);

			if (query !== prevQuery) return;

			autocompleteTags = tags.unwrapOr([]);
			isOpen = true;
		},
		() => (shouldThrottleQuery(query) ? 250 : 0) // ms
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
	bind:open={isOpen}
	onValueChange={(value: string) => {
		console.log(value, query);
		addTag((value || autocompleteTags.at(0)?.name) ?? query);
	}}
	onOpenChange={(open: boolean) => {
		if (!open) highlightedTag = undefined;
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
				<div class="relative w-full">
					<input
						class="w-full focus:outline-hidden"
						style:margin-left="{startFillSize.width}px"
						type="text"
						bind:value={query}
						placeholder={tags.size === 0 ? "Search" : undefined}
						onkeydown={onKeyDown}
						name="tagSearchInput"
						id="search-tag-input"
						aria-label="Search"
					/>
					<div class="pointer-events-none absolute inset-0 -z-10 flex" aria-hidden="true">
						<span class="rounded bg-gray-950 text-gray-500" bind:this={startFillElement}>
							{startFill}
						</span>
						<span class="opacity-0">{query}</span>
						<span class="rounded bg-gray-950 text-gray-500">
							{endFill}
						</span>
					</div>
				</div>
			</div>
		{/snippet}
	</Combobox.Input>
	{#if autocompleteTags.length > 0}
		<Combobox.Portal>
			<Combobox.Content
				class="z-50 max-h-(--bits-combobox-content-available-height) w-(--bits-combobox-anchor-width) min-w-(--bits-combobox-anchor-width) border border-gray-800 bg-black p-4 outline-hidden select-none"
				sideOffset={10}
				escapeKeydownBehavior="ignore"
			>
				{#each autocompleteTags as tag (tag)}
					<Combobox.Item
						class="px-2 py-1 outline-hidden select-none data-highlighted:bg-gray-800"
						value={tag.name}
						onHighlight={() => (highlightedTag = tag)}
					>
						{tag.antecedent ? `${tag.antecedent} → ${tag.name}` : tag.name}
						{#if tag.count !== undefined}
							<span class="text-sm text-gray-400">{formatNumberCompact(tag.count)}</span>
						{/if}
					</Combobox.Item>
				{/each}
			</Combobox.Content>
		</Combobox.Portal>
	{/if}
</Combobox.Root>
