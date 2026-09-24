<script lang="ts">
	import { popoverIn, popoverOut } from "$lib/utils/transition";
	import type { LucideProps } from "@lucide/svelte";
	import Check from "@lucide/svelte/icons/check";
	import ChevronDown from "@lucide/svelte/icons/chevron-down";
	import { mergeProps, Select, type WithoutChildren } from "bits-ui";
	import { type Component } from "svelte";

	let {
		value = $bindable(),
		items,
		contentProps: restContentProps,
		placeholder,
		icon: Icon,
		...rootProps
	}: {
		items: { value: string; label: string; disabled?: boolean }[];
		contentProps?: WithoutChildren<Select.ContentProps>;
		placeholder?: string;
		icon?: Component<LucideProps>;
	} & WithoutChildren<Select.RootProps> = $props();

	let rootElement = $state<HTMLElement | null>(null);

	const contentProps = $derived(
		mergeProps(restContentProps, {
			class:
				"card-glass edge-top popover-overlay z-50 max-h-(--bits-select-content-available-height) w-(--bits-select-anchor-width) px-1 py-3 select-none",
			sideOffset: 4,
			forceMount: true
		})
	);

	function onOpenChange(isOpen: boolean) {
		if (!isOpen) rootElement?.blur();
	}
</script>

<Select.Root bind:value={value as never} {items} {onOpenChange} {...rootProps}>
	<Select.Trigger
		bind:ref={rootElement}
		class="input-glass inline-flex w-48 touch-none items-center select-none"
	>
		<Icon class="mr-2" />
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
		<Select.Content {...contentProps}>
			{#snippet child({ wrapperProps, props, open })}
				{#if open}
					<div {...wrapperProps}>
						<div {...props} in:popoverIn out:popoverOut>
							{#each items as item (item.value)}
								<Select.Item
									class="flex h-10 w-full cursor-pointer items-center rounded-control pr-3 pl-4 outline-hidden select-none data-disabled:opacity-50 data-highlighted:bg-card-surface"
									value={item.value}
									label={item.label}
									disabled={item.disabled}
								>
									{#snippet children({ selected })}
										{item.label}
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
					</div>
				{/if}
			{/snippet}
		</Select.Content>
	</Select.Portal>
</Select.Root>
