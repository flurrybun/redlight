<script lang="ts">
	import { Button, mergeProps } from "bits-ui";
	import type { HTMLButtonAttributes } from "svelte/elements";

	type ButtonVariant = "fluorescent" | "glass";

	let {
		variant = "glass",
		children,
		...restProps
	}: {
		variant?: ButtonVariant;
	} & HTMLButtonAttributes = $props();

	let buttonProps = $derived(
		mergeProps(restProps, {
			class: ["btn-expand shrink-0", variant === "fluorescent" ? "btn-fluorescent" : "btn-glass"]
		})
	);
</script>

<Button.Root {...buttonProps}>{@render children?.()}</Button.Root>
