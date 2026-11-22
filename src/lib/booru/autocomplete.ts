import { autocompleteTag } from "#lib/api/client.ts";
import type { TagCategory } from "#lib/server/booru/types.ts";
import { okAsync, ResultAsync } from "neverthrow";
import type { BooruMetadata } from "./metadata";

/**
 * Similar to BooruTag, but category and count are nullable
 */
export interface AutocompleteTag {
	name: string;
	antecedent?: string;
	category?: TagCategory;
	count?: number;
}

export function autocompleteTagsForQuery(
	query: string,
	metadata: BooruMetadata
): ResultAsync<AutocompleteTag[], string> {
	const numericType = metadata.ascSortTypes.find((sortType) => query.startsWith(`${sortType}:`));

	if (numericType !== undefined) {
		const numericQuery = query.slice(numericType.length + 1);

		return okAsync(
			["=", ">=", ">", "<=", "<"]
				.filter((operator) => operator.startsWith(numericQuery))
				.map((operator) => ({
					name: `${numericType}:${operator}N`
				}))
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

	let tag = query;
	if (tag.startsWith("-")) tag = tag.slice(1);

	const tags = autocompleteTag({
		booru: metadata.id,
		tag,
		limit: 10
	});

	return tags
		.map((tags) =>
			query.startsWith("-")
				? tags.map((tag) => ({
						...tag,
						antecedent: tag.antecedent ? `-${tag.antecedent}` : undefined,
						name: `-${tag.name}`
					}))
				: tags
		)
		.mapErr((error) => error.message);
}

function parseSortQuery(query: string) {
	if (query.startsWith("sort:")) return query.substring(5);
	if (query.startsWith("order:")) return query.substring(6);
	return undefined;
}
