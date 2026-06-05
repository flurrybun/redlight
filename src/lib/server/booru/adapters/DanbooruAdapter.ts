import type { ResultAsync } from "neverthrow";
import z from "zod";
import BooruAdapter from "../BooruAdapter";
import type {
	BooruError,
	BooruPost,
	BooruTag,
	SearchOptions,
	SearchResult,
	TagCategory
} from "../types";
import { getExtensionType } from "$lib/utils/media";
import { processSearchResult, parseJson, validate } from "../pipeline";

export const DanbooruPostSchema = z.object({
	id: z.number(),
	created_at: z.string(),
	uploader_id: z.number(),
	score: z.number(),
	source: z.string(),
	md5: z.string(),
	rating: z.enum(["g", "s", "q", "e"]),
	image_width: z.number(),
	image_height: z.number(),
	tag_string: z.string(),
	fav_count: z.number(),
	file_ext: z.string(),
	has_children: z.boolean(),
	tag_count_general: z.number(),
	tag_count_artist: z.number(),
	tag_count_character: z.number(),
	tag_count_copyright: z.number(),
	file_size: z.number(),
	up_score: z.number(),
	down_score: z.number(),
	is_pending: z.boolean(),
	is_flagged: z.boolean(),
	is_deleted: z.boolean(),
	tag_count: z.number(),
	updated_at: z.string(),
	is_banned: z.boolean(),
	has_active_children: z.boolean(),
	bit_flags: z.number(),
	tag_count_meta: z.number(),
	has_large: z.boolean(),
	has_visible_children: z.boolean(),
	media_asset: z.object({
		id: z.number(),
		created_at: z.string(),
		updated_at: z.string(),
		md5: z.string(),
		file_ext: z.string(),
		file_size: z.number(),
		image_width: z.number(),
		image_height: z.number(),
		duration: z.nullable(z.number()),
		status: z.string(),
		file_key: z.string(),
		is_public: z.boolean(),
		pixel_hash: z.string(),
		variants: z
			.array(
				z.object({
					type: z.string(),
					url: z.string(),
					width: z.number(),
					height: z.number(),
					file_ext: z.string()
				})
			)
			.optional()
	}),
	tag_string_general: z.string(),
	tag_string_character: z.string(),
	tag_string_copyright: z.string(),
	tag_string_artist: z.string(),
	tag_string_meta: z.string(),
	file_url: z.string(),
	large_file_url: z.string(),
	preview_file_url: z.string()
});

export const DanbooruPostResponseSchema = z.array(DanbooruPostSchema);

export const DanbooruTagSchema = z.object({
	id: z.number(),
	name: z.string(),
	post_count: z.number(),
	category: z.number(),
	created_at: z.string(),
	updated_at: z.string(),
	is_deprecated: z.boolean(),
	words: z.array(z.string())
});

export const DanbooruTagResponseSchema = z.array(DanbooruTagSchema);

export type DanbooruPost = z.infer<typeof DanbooruPostSchema>;
export type DanbooruPostResponse = z.infer<typeof DanbooruPostResponseSchema>;
export type DanbooruTag = z.infer<typeof DanbooruTagSchema>;
export type DanbooruTagResponse = z.infer<typeof DanbooruTagResponseSchema>;

export default class DanbooruAdapter extends BooruAdapter {
	constructor() {
		super(
			{
				id: "Danbooru",
				name: "Danbooru",
				baseUrl: "https://danbooru.donmai.us",
				supportsMultipleTags: true,
				maxLimit: 100
			},
			{
				// login: DANBOORU_USERNAME,
				// api_key: DANBOORU_API_KEY,
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
				.andThen(validate(DanbooruPostResponseSchema))
				.map((res) => ({
					posts: this.normalizePosts(res),
					page: options.page
				}))
		);
	}

	getTagMetadata(tags: string[], limit: number): ResultAsync<BooruTag[], BooruError> {
		const url = `${this.info.baseUrl}/tags.json`;
		const params = {
			"search[name_comma]": tags.join(","),
			limit: String(limit)
		};

		return this.fetch(url, params)
			.andThen(parseJson)
			.andThen(validate(DanbooruTagResponseSchema))
			.map((res) => this.normalizeTags(res));
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
			.andThen(validate(DanbooruTagResponseSchema))
			.map((res) => this.normalizeTags(res));
	}

	private normalizePosts(posts: DanbooruPost[]): BooruPost[] {
		return posts.map((post) => this.normalizePost(post));
	}

	private normalizePost(raw: DanbooruPost): BooruPost {
		const assets = (raw.media_asset.variants ?? []).toSorted((a, b) => b.width - a.width);

		const fileAsset = assets.at(0);
		const previewAsset = assets.at(1);

		return {
			id: raw.id,
			source: this.info.id,
			file: fileAsset
				? {
						url: fileAsset.url,
						width: fileAsset.width,
						height: fileAsset.height
					}
				: undefined,
			preview: previewAsset
				? {
						url: previewAsset.url,
						width: previewAsset.width,
						height: previewAsset.height
					}
				: undefined,
			mediaType: getExtensionType(raw.media_asset.file_ext),
			tags: raw.tag_string.split(" ").filter(Boolean),
			rating: this.normalizeRating(raw.rating),
			score: raw.score,
			createdAt: new Date(raw.created_at)
		};
	}

	private normalizeTags(tags: DanbooruTag[]): BooruTag[] {
		return tags.map((tag) => this.normalizeTag(tag));
	}

	private normalizeTag(tag: DanbooruTag): BooruTag {
		return {
			name: tag.name,
			category: this.normalizeTagCategory(tag.category),
			count: tag.post_count
		};
	}

	private normalizeTagCategory(category: DanbooruTag["category"]): TagCategory {
		switch (category) {
			case 0:
			default:
				return "general";
			case 1:
				return "artist";
			case 3:
				return "copyright";
			case 4:
				return "character";
			case 5:
				return "meta";
		}
	}

	private normalizeRating(rating: DanbooruPost["rating"]): BooruPost["rating"] {
		switch (rating) {
			case "g":
			default:
				return "safe";
			case "s":
			case "q":
				return "questionable";
			case "e":
				return "explicit";
		}
	}
}
