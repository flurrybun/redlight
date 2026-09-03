<div class="mt-12 mb-10 flex items-center justify-center gap-2">
	<div class="animation flex gap-1">
		<div></div>
		<div></div>
		<div></div>
	</div>
	<p class="text-gray-400">Loading...</p>
</div>

<style>
	@reference "tailwindcss";

	.animation * {
		@apply size-2 rounded-full bg-gray-200;
		animation: bounce 1200ms infinite;
		transform: translateY(0.2rem);
		opacity: 0.2;
	}

	.animation :nth-child(1) {
		animation-delay: 0ms;
	}

	.animation :nth-child(2) {
		animation-delay: 300ms;
	}

	.animation :nth-child(3) {
		animation-delay: 600ms;
	}

	@keyframes bounce {
		0%,
		70%,
		100% {
			transform: translateY(0.2rem);
			opacity: 0.2;
			animation-timing-function: ease-out;
		}
		35% {
			transform: translateY(-0.2rem);
			opacity: 1;
			animation-timing-function: ease-in;
		}
	}
</style>
