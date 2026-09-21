import type { BooruId } from "$lib/api/schemas";

export type SortPrefix = "order" | "sort";
export type ContentType = "posts" | "collections";

export interface BaseBooruMetadata {
	id: BooruId;
	name: string;
	url: string;

	contentType: ContentType[];

	sortPrefix: SortPrefix;
	ascSortTypes: string[];
	nonAscSortTypes: string[];

	hasSensitiveRating: boolean;
}

export interface BooruMetadata extends BaseBooruMetadata {
	ratings: string[];
	sortTypes: string[];
}

const gelbooruMetadata: BaseBooruMetadata = {
	id: "gelbooru",
	name: "Gelbooru",
	url: "https://gelbooru.com/index.php",
	contentType: ["posts"],
	sortPrefix: "sort",
	ascSortTypes: ["score", "id", "updated", "user", "source", "height", "width"],
	nonAscSortTypes: ["random"],
	hasSensitiveRating: false
};

const danbooruMetadata: BaseBooruMetadata = {
	id: "danbooru",
	name: "Danbooru",
	url: "https://danbooru.donmai.us",
	contentType: ["posts", "collections"],
	sortPrefix: "order",
	ascSortTypes: [
		"score",
		"favcount",
		"created_at",
		"md5",
		"change",
		"comment",
		"comment_bumped",
		"note",
		"artcomm",
		"mpixels",
		"filesize"
	],
	nonAscSortTypes: [
		"random",
		"tagcount",
		"comments",
		"rank",
		"id",
		"id_desc",
		"none",
		"notes",
		"pools",
		"child_count"
	],
	hasSensitiveRating: true
};

const e621Metadata: BaseBooruMetadata = {
	id: "e621",
	name: "e621",
	url: "https://e621.net/",
	contentType: ["posts", "collections"],
	sortPrefix: "order",
	ascSortTypes: [
		"score",
		"favcount",
		"created_at",
		"md5",
		"change",
		"comment",
		"comment_bumped",
		"note",
		"artcomm",
		"mpixels",
		"filesize"
	],
	nonAscSortTypes: [
		"random",
		"tagcount",
		"comments",
		"rank",
		"id",
		"id_desc",
		"none",
		"notes",
		"pools",
		"child_count"
	],
	hasSensitiveRating: false
};

function createMetadata(base: BaseBooruMetadata): BooruMetadata {
	const ascSuffix = base.sortPrefix === "order" ? "_asc" : ":asc";

	const sortTypes = [
		...base.ascSortTypes.flatMap((sortType) => [sortType, sortType + ascSuffix]),
		...base.nonAscSortTypes
	];

	const ratings = base.hasSensitiveRating
		? ["safe", "sensitive", "questionable", "explicit"]
		: ["safe", "questionable", "explicit"];

	return {
		...base,
		sortTypes,
		ratings
	};
}

const booruMetadataMap = new Map<BooruId, BooruMetadata>([
	["danbooru", createMetadata(danbooruMetadata)],
	["gelbooru", createMetadata(gelbooruMetadata)],
	["e621", createMetadata(e621Metadata)]
]);

export function getMetadata(id: BooruId): BooruMetadata {
	const entry = booruMetadataMap.get(id);
	if (!entry) throw new Error(`Unknown booru: "${id}"`);

	return entry;
}

export function getAllMetadata(): BooruMetadata[] {
	return [...booruMetadataMap.values()];
}
