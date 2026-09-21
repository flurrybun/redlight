<script lang="ts">
	import {
		type AutocompleteTag,
		autocompleteTagsForQuery,
		shouldThrottleQuery
	} from "$lib/booru/autocomplete";
	import { formatNumberCompact } from "$lib/utils/intl";
	import Search from "@lucide/svelte/icons/search";
	import X from "@lucide/svelte/icons/x";
	import { Combobox } from "bits-ui";
	import { ElementSize, useThrottle } from "runed";
	import type { SvelteSet } from "svelte/reactivity";

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

	let inputElement = $state<HTMLElement>();
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
		addTag((value || autocompleteTags.at(0)?.name) ?? query);
	}}
	onOpenChange={(open: boolean) => {
		if (!open) highlightedTag = undefined;
	}}
>
	<Combobox.Input placeholder="Search" aria-label="Search">
		{#snippet child({ props })}
			<div class="input-glass flex w-140 min-w-0 shrink items-center gap-1 edge-right" {...props}>
				<Search class="mr-2" />
				{#each tags as tagItem (tagItem)}
					<div class="flex shrink-0 items-center gap-0.5 rounded bg-card-surface py-0.5 pr-1 pl-2">
						<span class="text-nowrap">{tagItem}</span>
						<button
							class="rounded-sm p-0.5 transition-[background-color] duration-100 hover:bg-card-surface focus:outline-1 focus:outline-paper-dim"
							aria-label="Remove {tagItem}"
							onmousedown={(event) => {
								event.preventDefault();
							}}
							onclick={() => {
								inputElement?.focus();
								removeTag(tagItem);
							}}
						>
							<X class="size-3" />
						</button>
					</div>
				{/each}
				<div class="relative w-full">
					<input
						class="w-full focus:outline-hidden"
						style:margin-left="{startFillSize.width}px"
						type="text"
						bind:this={inputElement}
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
				class="card-glass popover-overlay z-50 max-h-(--bits-combobox-content-available-height) w-(--bits-combobox-anchor-width) min-w-(--bits-combobox-anchor-width) px-1 py-3 outline-hidden select-none"
				sideOffset={4}
				escapeKeydownBehavior="ignore"
			>
				{#each autocompleteTags as tag (tag)}
					<Combobox.Item
						class="flex h-10 cursor-pointer items-center rounded-control pr-3 pl-4 outline-hidden select-none data-highlighted:bg-card-surface"
						value={tag.name}
						onHighlight={() => (highlightedTag = tag)}
					>
						<p>
							{tag.antecedent ? `${tag.antecedent} → ${tag.name}` : tag.name}
							{#if tag.count !== undefined}
								<span class="text-sm text-gray-400">{formatNumberCompact(tag.count)}</span>
							{/if}
						</p>
					</Combobox.Item>
				{/each}
			</Combobox.Content>
		</Combobox.Portal>
	{/if}
</Combobox.Root>
