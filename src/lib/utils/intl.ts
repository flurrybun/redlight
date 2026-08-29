import { page } from "$app/state";

export function formatNumber(value: number) {
	return new Intl.NumberFormat(page.data.locale).format(value);
}

export function formatNumberCompact(value: number) {
	return new Intl.NumberFormat(page.data.locale, {
		notation: "compact"
	}).format(value);
}
