<!-- <script lang="ts">
	import { isPropertyDefined } from "#lib/utils/types.ts";
	import Check from "@lucide/svelte/icons/check";
	import ChevronDown from "@lucide/svelte/icons/chevron-down";
	import Image from "@lucide/svelte/icons/image";
	import Images from "@lucide/svelte/icons/images";
	import { mergeProps, Select, type WithoutChildren } from "bits-ui";

	let {
		value = $bindable(),
		items,
		contentProps,
		placeholder,
		...restProps
	}: {
		placeholder?: string;
		items: { value: string; label: string; disabled?: boolean }[];
		contentProps?: WithoutChildren<Select.ContentProps>;
	} & WithoutChildren<Select.RootProps> = $props();

	const groupedItems = $derived(
		Object.entries(
			Object.groupBy(items, (item) => {
				const idx = item.value.indexOf("/");
				return idx === -1 ? "" : item.value.substring(0, idx);
			})
		)
			.map(([group, items]) => ({
				group,
				items
			}))
			.filter(isPropertyDefined("items"))
	);

	const allContentProps = $derived(
		mergeProps(contentProps, {
			class:
				// w-(--bits-select-anchor-width)
				"card-glass popover-overlay z-50 w-72 max-h-(--bits-select-content-available-height) min-w-(--bits-select-anchor-width) px-1 py-3 select-none edge-top data-[side=bottom]:translate-y-2 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:-translate-x-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:translate-x-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:-translate-y-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
		})
	);

	let isCollections = $derived(typeof value === "string" && value.startsWith("collections/"));

	function onTriggerKeyDown(event: KeyboardEvent) {
		if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
		console.log("hey!");

		event.preventDefault();
	}
</script>

<Select.Root bind:value={value as never} {items} {...restProps}>
	<Select.Trigger
		class="input-glass inline-flex w-48 touch-none items-center select-none"
		onkeydown={onTriggerKeyDown}
	>
		{#if isCollections}
			<Images class="mr-2" />
		{:else}
			<Image class="mr-2" />
		{/if}
		<Select.Value {placeholder}>
			{#snippet child({ props })}
				<div {...props}>
					{items.find((item) => item.value === value)?.label ?? "Unknown"}
				</div>
			{/snippet}
		</Select.Value>
		<ChevronDown class="ml-auto" />
	</Select.Trigger>
	<Select.Portal>
		<Select.Content {...allContentProps}>
			<div class="flex w-full">
				{#each groupedItems as { group, items } (group)}
					<div class="flex-1">
						<p class="-mt-0.5 mb-2 pl-4 text-xs font-bold text-icon uppercase">{group}</p>
						{#each items as item (item.value)}
							<Select.Item
								class="flex h-10 w-full items-center rounded-control pr-3 pl-4 outline-hidden select-none data-disabled:opacity-50 data-highlighted:bg-card-surface"
								value={item.value}
								label={item.label}
								disabled={item.disabled}
							>
								{#snippet children({ selected })}
									<span class="text-sm">{item.label}</span>
									{#if selected}
										<div class="ml-auto">
											<Check
												class="size-4"
												color="var(--color-paper)"
												strokeWidth={2}
												aria-label="check"
											/>
										</div>
									{/if}
								{/snippet}
							</Select.Item>
						{/each}
					</div>
				{/each}
			</div>
		</Select.Content>
	</Select.Portal>
</Select.Root> -->
