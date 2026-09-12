import { autocompleteTag } from "$lib/api/client";
import { getMetadata } from "$lib/booru/metadata";
import { gallery } from "$lib/gallery.svelte";
import type { TagCategory } from "$lib/server/booru/types";
import { okAsync, ResultAsync } from "neverthrow";

/**
 * Similar to BooruTag, but category and count are nullable
 */
export interface AutocompleteTag {
	name: string;
	antecedent?: string;
	category?: TagCategory;
	count?: number;
}

export function autocompleteTagsForQuery(query: string): ResultAsync<AutocompleteTag[], string> {
	const metadata = getMetadata(gallery.booru);

	const endsWithDigit = /\d/.test(query.at(-1) ?? "");
	const numericType = !endsWithDigit
		? metadata.ascSortTypes.find((sortType) => query.startsWith(`${sortType}:`))
		: undefined;

	if (numericType !== undefined) {
		const numericQuery = query.slice(numericType.length + 1);
		if (numericQuery.length > 2) return okAsync([]);

		return okAsync(
			["=", ">=", ">", "<=", "<"]
				.filter((operator) => operator.startsWith(numericQuery))
				.map((operator) => ({ name: `${numericType}:${operator}N` }))
		);
	}

	if (query.startsWith("rating:")) {
		const ratingQuery = query.slice(7);

		return okAsync(
			metadata.ratings
				.filter((rating) => rating.startsWith(ratingQuery))
				.map((rating) => ({ name: `rating:${rating}` }))
		);
	}

	const sortQuery = parseSortQuery(query);

	if (sortQuery !== undefined) {
		return okAsync(
			metadata.sortTypes
				.filter((tag) => tag.startsWith(sortQuery))
				.map((tag) => ({ name: `${metadata.sortPrefix}:${tag}` }))
		);
	}

	const tags = autocompleteTag({
		booru: gallery.booru,
		tag: query,
		limit: 10
	});

	return tags.mapErr((error) => error.message);
}

export function shouldThrottleQuery(query: string) {
	const metadata = getMetadata(gallery.booru);

	const endsWithDigit = /\d/.test(query.at(-1) ?? "");
	const numericType = !endsWithDigit
		? metadata.ascSortTypes.find((sortType) => query.startsWith(`${sortType}:`))
		: undefined;

	if (numericType !== undefined) return false;
	if (query.startsWith("rating:")) return false;

	const sortQuery = parseSortQuery(query);
	if (sortQuery !== undefined) return false;

	return true;
}

function parseSortQuery(query: string) {
	if (query.startsWith("sort:")) return query.substring(5);
	if (query.startsWith("order:")) return query.substring(6);
	return undefined;
}
