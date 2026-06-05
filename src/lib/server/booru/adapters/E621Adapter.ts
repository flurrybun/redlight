import { getExtensionType } from "$lib/utils/media";
import type { ResultAsync } from "neverthrow";
import z from "zod";
import BooruAdapter from "../BooruAdapter";
import { parseJson, processSearchResult, validate } from "../pipeline";
import type {
	BooruError,
	BooruPost,
	BooruTag,
	SearchOptions,
	SearchResult,
	TagCategory
} from "../types";

export const E621PostSchema = z.object({
	id: z.number(),
	created_at: z.string(),
	updated_at: z.string(),
	file: z.object({
		width: z.number(),
		height: z.number(),
		ext: z.string(),
		size: z.number(),
		md5: z.string(),
		url: z.string().nullable() // jpg
	}),
	preview: z.object({
		width: z.number(),
		height: z.number(),
		url: z.string().nullable(), // jpg
		alt: z.string().nullable() // webp
	}),
	sample: z.object({
		has: z.boolean(),
		width: z.number(),
		height: z.number(),
		url: z.string().nullable(), // jpg
		alt: z.string().nullable() // webp
	}),
	score: z.object({
		up: z.number(),
		down: z.number(),
		total: z.number()
	}),
	tags: z.object({
		general: z.array(z.string()),
		artist: z.array(z.string()),
		contributor: z.array(z.string()),
		copyright: z.array(z.string()),
		character: z.array(z.string()),
		species: z.array(z.string()),
		invalid: z.array(z.string()),
		meta: z.array(z.string()),
		lore: z.array(z.string())
	}),
	locked_tags: z.array(z.string()),
	change_seq: z.number(),
	flags: z.object({
		pending: z.boolean(),
		flagged: z.boolean(),
		note_locked: z.boolean(),
		status_locked: z.boolean(),
		rating_locked: z.boolean(),
		deleted: z.boolean()
	}),
	rating: z.enum(["s", "q", "e"]),
	sources: z.array(z.string()),
	uploader_id: z.number(),
	uploader_name: z.string(),
	description: z.string(),
	comment_count: z.number(),
	is_favorited: z.boolean(),
	vote: z.number(),
	has_notes: z.boolean(),
	duration: z.nullable(z.number())
});

export const E621PostResponseSchema = z.object({
	posts: z.array(E621PostSchema)
});

export const E621TagSchema = z.object({
	id: z.number(),
	name: z.string(),
	post_count: z.number(),
	related_tags: z.string(),
	related_tags_updated_at: z.string(),
	category: z.number(),
	is_locked: z.boolean(),
	created_at: z.string(),
	updated_at: z.string()
});

export const E621TagResponseSchema = z.union([
	z.array(E621TagSchema),
	z.object({
		tags: z.tuple([])
	})
]);

export type E621Post = z.infer<typeof E621PostSchema>;
export type E621PostResponse = z.infer<typeof E621PostResponseSchema>;
export type E621Tag = z.infer<typeof E621TagSchema>;
export type E621TagResponse = z.infer<typeof E621TagResponseSchema>;

export default class E621Adapter extends BooruAdapter {
	constructor() {
		super(
			{
				id: "E621",
				name: "E621",
				baseUrl: "https://e621.net",
				supportsMultipleTags: true,
				maxLimit: 100
			},
			{
				// login: E621_USERNAME,
				// api_key: E621_API_KEY,
			}
		);
	}

	search(options: SearchOptions): ResultAsync<SearchResult, BooruError> {
		const url = `${this.info.baseUrl}/posts.json`;
		const params = {
			tags: options.tags.join(" "),
			page: String(options.page),
			limit: String(options.limit)
		};

		return processSearchResult(
			this.fetch(url, params)
				.andThen(parseJson)
				.andThen(validate(E621PostResponseSchema))
				.map((res) => ({
					posts: this.normalizePosts(res.posts),
					page: options.page
				}))
		);
	}

	getTagMetadata(tags: string[]): ResultAsync<BooruTag[], BooruError> {
		const url = `${this.info.baseUrl}/tags.json`;
		const params = {
			"search[name]": tags.join(",")
		};

		return this.fetch(url, params)
			.andThen(parseJson)
			.andThen(validate(E621TagResponseSchema))
			.map(this.normalizeTags);
	}

	autocompleteTag(tag: string, limit: number): ResultAsync<BooruTag[], BooruError> {
		const url = `${this.info.baseUrl}/tags.json`;
		const params = {
			"search[fuzzy_name_matches]": tag,
			"search[order]": "similarity",
			limit: String(limit)
		};

		return this.fetch(url, params)
			.andThen(parseJson)
			.andThen(validate(E621TagResponseSchema))
			.map(this.normalizeTags);
	}

	private normalizePosts(posts: E621Post[]): BooruPost[] {
		return posts.map((post) => this.normalizePost(post));
	}

	private normalizePost(raw: E621Post): BooruPost {
		return {
			id: raw.id,
			source: this.info.id,
			file: raw.file.url
				? {
						url: raw.file.url,
						width: raw.file.width,
						height: raw.file.height
					}
				: undefined,
			preview: raw.preview.alt
				? {
						url: raw.preview.alt,
						width: raw.preview.width,
						height: raw.preview.height
					}
				: undefined,
			mediaType: getExtensionType(raw.file.ext),
			tags: [
				...raw.tags.general,
				...raw.tags.artist,
				// ...raw.tags.contributor,
				...raw.tags.copyright,
				...raw.tags.character,
				...raw.tags.species,
				// ...raw.tags.invalid,
				...raw.tags.meta,
				...raw.tags.lore
			],
			rating: this.normalizeRating(raw.rating),
			score: raw.score.total,
			createdAt: new Date(raw.created_at)
		};
	}

	private normalizeTags(tags: E621TagResponse): BooruTag[] {
		if (!Array.isArray(tags)) return [];

		return tags.map((tag) => this.normalizeTag(tag));
	}

	private normalizeTag(tag: E621Tag): BooruTag {
		return {
			name: tag.name,
			category: this.normalizeTagCategory(tag.category),
			count: tag.post_count
		};
	}

	private normalizeTagCategory(category: E621Tag["category"]): TagCategory {
		switch (category) {
			case 0:
			default:
				return "general";
			case 1:
				return "artist";
			// case 2:
			// 	return "contributor";
			case 3:
				return "copyright";
			case 4:
				return "character";
			case 5:
				return "species";
			// case 6:
			// 	return "invalid";
			case 7:
				return "meta";
			case 8:
				return "lore";
		}
	}

	private normalizeRating(rating: E621Post["rating"]): BooruPost["rating"] {
		switch (rating) {
			case "s":
			default:
				return "safe";
			case "q":
				return "questionable";
			case "e":
				return "explicit";
		}
	}
}
