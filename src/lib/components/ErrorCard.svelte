<script lang="ts">
	import type { ApiError } from "$lib/api/types";
	import TriangleAlert from "@lucide/svelte/icons/triangle-alert";

	let {
		error
	}: {
		error: ApiError;
	} = $props();
</script>

<div
	class="mx-auto flex w-fit flex-col items-center gap-2 rounded-xl border border-gray-800 bg-gray-950 px-12 py-8"
>
	<div class="flex max-w-prose items-center gap-2">
		<TriangleAlert />
		<p class="text-xl font-semibold">{error.title}</p>
	</div>
	<p class="max-w-prose text-gray-400">{error.message}</p>
</div>
