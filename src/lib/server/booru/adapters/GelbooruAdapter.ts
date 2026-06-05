import { GELBOORU_API_KEY, GELBOORU_USER_ID } from "$env/static/private";
import { getFileType } from "$lib/utils/media";
import { type ResultAsync } from "neverthrow";
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

export const GelbooruPostSchema = z.object({
	id: z.number(),
	created_at: z.string(),
	score: z.number(),
	width: z.number(),
	height: z.number(),
	md5: z.string(),
	directory: z.string(),
	image: z.string(),
	rating: z.enum(["general", "sensitive", "questionable", "explicit"]),
	source: z.string(),
	owner: z.string(),
	creator_id: z.number(),
	parent_id: z.number(),
	sample: z.union([z.literal(0), z.literal(1)]),
	preview_height: z.number(),
	preview_width: z.number(),
	tags: z.string(),
	title: z.string(),
	has_notes: z.enum(["true", "false"]),
	has_comments: z.enum(["true", "false"]),
	file_url: z.string(),
	preview_url: z.string(),
	sample_url: z.string(),
	sample_height: z.number(),
	sample_width: z.number(),
	status: z.string(),
	post_locked: z.union([z.literal(0), z.literal(1)]),
	has_children: z.enum(["true", "false"])
});

export const GelbooruPostResponseSchema = z.object({
	"@attributes": z.object({
		limit: z.number(),
		offset: z.number(),
		count: z.number()
	}),
	post: z.union([z.array(GelbooruPostSchema), GelbooruPostSchema, z.undefined()])
});

export const GelbooruTagSchema = z.object({
	id: z.number(),
	name: z.string(),
	count: z.number(),
	type: z.number(),
	ambiguous: z.union([z.literal(0), z.literal(1)])
});

export const GelbooruTagResponseSchema = z.object({
	"@attributes": z.object({
		limit: z.number(),
		offset: z.number(),
		count: z.number()
	}),
	tag: z.union([z.array(GelbooruTagSchema), GelbooruTagSchema, z.undefined()])
});

export type GelbooruPost = z.infer<typeof GelbooruPostSchema>;
export type GelbooruPostResponse = z.infer<typeof GelbooruPostResponseSchema>;
export type GelbooruTag = z.infer<typeof GelbooruTagSchema>;
export type GelbooruTagResponse = z.infer<typeof GelbooruTagResponseSchema>;

export default class GelbooruAdapter extends BooruAdapter {
	constructor() {
		super(
			{
				id: "gelbooru",
				name: "Gelbooru",
				baseUrl: "https://gelbooru.com/index.php",
				supportsMultipleTags: true,
				maxLimit: 100
			},
			{
				user_id: GELBOORU_USER_ID,
				api_key: GELBOORU_API_KEY,
				page: "dapi",
				q: "index",
				json: "1"
			}
		);
	}

	search(options: SearchOptions): ResultAsync<SearchResult, BooruError> {
		const params = {
			s: "post",
			tags: options.tags.join(" "),
			pid: String(options.page),
			limit: String(options.limit)
		};

		return processSearchResult(
			this.fetch(this.info.baseUrl, params)
				.andThen(parseJson)
				.andThen(validate(GelbooruPostResponseSchema))
				.map((res) => ({
					posts: this.normalizePosts(res.post),
					page: options.page,
					total: res["@attributes"].count
				}))
		);
	}

	getTagMetadata(tags: string[], limit: number): ResultAsync<BooruTag[], BooruError> {
		const params = {
			s: "tag",
			names: tags.join(" "),
			limit: String(limit)
		};

		return this.fetch(this.info.baseUrl, params)
			.andThen(parseJson)
			.andThen(validate(GelbooruTagResponseSchema))
			.map((res) => {
				const tag = res.tag ?? [];
				const tags = Array.isArray(tag) ? tag : [tag];

				return tags.map((tag) => ({
					name: tag.name,
					category: this.normalizeTagCategory(tag.type),
					count: tag.count
				}));
			});
	}

	autocompleteTag(tag: string, limit: number): ResultAsync<BooruTag[], BooruError> {
		const params = {
			s: "tag",
			name_pattern: `${tag}%`,
			limit: String(limit),
			orderby: "count"
		};

		return this.fetch(this.info.baseUrl, params)
			.andThen(parseJson)
			.andThen(validate(GelbooruTagResponseSchema))
			.map((res) => {
				const tag = res.tag ?? [];
				const tags = Array.isArray(tag) ? tag : [tag];

				return tags.map((tag) => ({
					name: tag.name,
					category: this.normalizeTagCategory(tag.type),
					count: tag.count
				}));
			});
	}

	private normalizePosts(post: GelbooruPost[] | GelbooruPost | undefined): BooruPost[] {
		if (post === undefined) return [];

		const posts = Array.isArray(post) ? post : [post];
		return posts.map((p) => this.normalizePost(p));
	}

	private normalizePost(raw: GelbooruPost): BooruPost {
		return {
			id: raw.id,
			source: this.info.id,
			file: {
				url: this.proxyUrl(raw.file_url),
				width: raw.width,
				height: raw.height
			},
			preview: {
				url: this.proxyUrl(raw.preview_url),
				width: raw.preview_width,
				height: raw.preview_height
			},
			mediaType: getFileType(raw.file_url),
			tags: raw.tags.split(" ").filter(Boolean),
			rating: this.normalizeRating(raw.rating),
			score: raw.score,
			createdAt: new Date(raw.created_at)
		};
	}

	private normalizeRating(raw: GelbooruPost["rating"]): BooruPost["rating"] {
		switch (raw) {
			case "general":
			default:
				return "safe";
			case "questionable":
			case "sensitive":
				return "questionable";
			case "explicit":
				return "explicit";
		}
	}

	private normalizeTagCategory(type: number): TagCategory {
		switch (type) {
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

	private proxyUrl(url: string): string {
		return `/api/proxy?url=${encodeURIComponent(url)}`;
	}
}
