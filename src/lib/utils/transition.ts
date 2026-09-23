import { cubicOut } from "svelte/easing";
import type { TransitionConfig } from "svelte/transition";

export function popover(node: HTMLElement): TransitionConfig {
	const style = getComputedStyle(node);
	const initialOpacity = Number(style.opacity);
	const initialTransform = style.transform === "none" ? "" : style.transform;

	return {
		delay: 0,
		duration: 100,
		easing: cubicOut,
		css: (t: number) => {
			const scale = 0.95 + (1 - 0.95) * t;
			const opacity = t * initialOpacity;

			return `
				opacity: ${String(opacity)};
				transform: ${initialTransform} scale(${String(scale)});
			`;
		}
	};
}
