<script lang="ts">
	import { popoverIn, popoverOut } from "#lib/utils/transition.ts";
	import type { LucideProps } from "@lucide/svelte";
	import ChevronDown from "@lucide/svelte/icons/chevron-down";
	import { Popover } from "bits-ui";
	import type { Component, Snippet } from "svelte";

	let {
		icon: Icon,
		label,
		children,
		...rootProps
	}: {
		icon?: Component<LucideProps>;
		label: string;
		children: Snippet;
	} & Popover.RootProps = $props();

	let triggerElement = $state<HTMLElement | null>(null);

	function onOpenChange(isOpen: boolean) {
		if (!isOpen) triggerElement?.blur();
	}
</script>

<Popover.Root {onOpenChange} {...rootProps}>
	<Popover.Trigger
		class="input-glass inline-flex w-48 touch-none items-center select-none"
		bind:ref={triggerElement}
	>
		<Icon class="mr-2" />
		<span>{label}</span>
		<ChevronDown class="ml-auto" />
	</Popover.Trigger>
	<Popover.Portal>
		<Popover.Content
			class="card-glass popover-overlay z-50 max-h-(--bits-popover-content-available-height) p-4 edge-top"
			sideOffset={4}
			forceMount
		>
			{#snippet child({ wrapperProps, props, open })}
				{#if open}
					<div {...wrapperProps}>
						<div {...props} in:popoverIn out:popoverOut>
							{@render children()}
						</div>
					</div>
				{/if}
			{/snippet}
		</Popover.Content>
	</Popover.Portal>
</Popover.Root>
