<script lang="ts">
	import favicon from "$lib/assets/favicon.svg";
	import { setLucideProps } from "@lucide/svelte";
	import type { Snippet } from "svelte";
	import "./layout.css";

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();

	setLucideProps({
		size: 24,
		strokeWidth: 1.5,
		color: "var(--color-icon)",
		class: "shrink-0"
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
{@render children()}
