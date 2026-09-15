<script lang="ts">
	import { mergeProps } from "bits-ui";
	import { useIntersectionObserver } from "runed";
	import type { HTMLAttributes } from "svelte/elements";

	let {
		url,
		placeholderUrl,
		children,
		...restProps
	}: {
		url: string;
		placeholderUrl: string;
	} & HTMLAttributes<HTMLDivElement> = $props();

	const BLUR_AMOUNT = 4;
	const UNBLUR_DURATION_MS = 500;
	const INSTANT_LOAD_THRESHOLD_MS = 100;

	let target = $state<HTMLElement | null>(null);
	let isOnScreen = $state(false);
	let isLoaded = $state(false);
	let isBlurred = $state(true);
	let skipAnimation = $state(false);

	let currentUrl = $derived(isLoaded ? url : placeholderUrl);
	let blurAmount = $derived(isLoaded ? 0 : BLUR_AMOUNT);
	let transitionDuration = $derived(isOnScreen && !skipAnimation ? UNBLUR_DURATION_MS : 0);

	const img = new Image();

	$effect(() => {
		isBlurred = true;
		isLoaded = false;
		img.src = url;

		const startTime = performance.now();
		let cancelled = false;

		void img
			.decode()
			.then(() => {
				if (cancelled) return;

				const elapsed = performance.now() - startTime;
				if (elapsed < INSTANT_LOAD_THRESHOLD_MS) {
					skipAnimation = true;
					isBlurred = false;
				}

				isLoaded = true;
			})
			.catch(() => {
				/* empty */
			});

		return () => {
			img.src = "";
			cancelled = true;
		};
	});

	useIntersectionObserver(
		() => target,
		(entries) => {
			const entry = entries.at(0);
			if (!entry?.isIntersecting) return;

			isOnScreen = true;
		},
		{ once: true }
	);

	const mergedProps = $derived(
		mergeProps(restProps, {
			class: "absolute inset-0 overflow-hidden",
			role: "img"
		})
	);
</script>

<div bind:this={target} {...mergedProps}>
	<div
		class="absolute inset-0 bg-cover bg-center"
		style:background-image="url('{currentUrl}')"
		style:filter="blur({blurAmount}px)"
		style:transition="filter {transitionDuration}ms ease-out"
		ontransitionend={() => (isBlurred = false)}
	></div>
	{#if isBlurred}
		<div
			class="absolute -z-10 bg-cover bg-center"
			style:background-image="url('{currentUrl}')"
			style:filter="blur({BLUR_AMOUNT}px)"
			style:inset="-{BLUR_AMOUNT}px"
		></div>
	{/if}
</div>
{@render children?.()}
