import { E621_API_KEY, E621_LOGIN } from "$env/static/private";
import { getExtensionType } from "$lib/utils/media";
import { isDefined } from "$lib/utils/types";
import { okAsync, type ResultAsync } from "neverthrow";
import z from "zod";
import BooruAdapter from "../BooruAdapter";
import type {
	BooruAsset,
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
	files: z.object({
		meta: z.object({
			md5: z.string(),
			ext: z.string(),
			size: z.number(),
			duration: z.number().nullable(),
			has_sample: z.boolean()
		}),
		original: z.object({
			width: z.number(),
			height: z.number(),
			url: z.string().nullable()
		}),
		preview: z.object({
			width: z.number(),
			height: z.number(),
			jpg: z.string().nullable(),
			webp: z.string().nullable()
		}),
		sample: z.object({
			width: z.number(),
			height: z.number(),
			jpg: z.string().nullable(),
			webp: z.string().nullable()
		}),
		video: z
			.object({
				original: z.object({
					url: z.string().nullable()
				})
			})
			.optional()
	}),
	stats: z.object({
		score: z.object({
			up: z.number(),
			down: z.number(),
			total: z.number()
		}),
		fav_count: z.number(),
		hotness: z.number()
	}),
	description: z.string(),
	tags: z.array(z.string()),
	rating: z.enum(["s", "q", "e"])
});

export const E621PostResponseSchema = z.array(E621PostSchema);

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

export const E621AutocompleteSchema = z.object({
	id: z.number(),
	name: z.string(),
	post_count: z.number(),
	category: z.number(),
	antecedent_name: z.nullable(z.string())
});

export const E621AutocompleteResponseSchema = z.array(E621AutocompleteSchema);

export type E621Post = z.infer<typeof E621PostSchema>;
export type E621PostResponse = z.infer<typeof E621PostResponseSchema>;
export type E621Tag = z.infer<typeof E621TagSchema>;
export type E621TagResponse = z.infer<typeof E621TagResponseSchema>;
export type E621Autocomplete = z.infer<typeof E621AutocompleteSchema>;
export type E621AutocompleteResponse = z.infer<typeof E621AutocompleteResponseSchema>;

export default class E621Adapter extends BooruAdapter {
	constructor() {
		super({
			id: "e621",
			name: "e621",
			baseUrl: "https://e621.net",
			username: E621_LOGIN,
			baseParams: {
				login: E621_LOGIN,
				api_key: E621_API_KEY
			}
		});
	}

	search(options: SearchOptions): ResultAsync<SearchResult, BooruError> {
		const url = `${this.info.baseUrl}/posts.json`;
		const params = {
			tags: options.tags.join(" "),
			page: String(options.page),
			limit: String(options.limit)
		};

		return this.processSearchResult(
			this.fetch(url, params)
				.andThen((res) => this.parseJson(res))
				.andThen((res) => this.validate(E621PostResponseSchema, res, { url }))
				.map((res) => ({
					posts: this.normalizePosts(res),
					page: options.page
				}))
		);
	}

	getTagMetadata(tags: string[], limit: number): ResultAsync<BooruTag[], BooruError> {
		const url = `${this.info.baseUrl}/tags.json`;
		const params = {
			"search[name]": tags.join(","),
			limit: String(limit)
		};

		return this.fetch(url, params)
			.andThen((res) => this.parseJson(res))
			.andThen((res) => this.validate(E621TagResponseSchema, res, { url }))
			.map((res) => this.normalizeTags(res));
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	autocompleteTag(tag: string, limit: number): ResultAsync<BooruTag[], BooruError> {
		// e621 throws an error if the length is too short
		if (tag.length <= 2) return okAsync([]);

		const url = `${this.info.baseUrl}/tags/autocomplete.json`;
		const params = {
			"search[name_matches]": tag
			// limit = 10, cannot be changed
		};

		return this.fetch(url, params)
			.andThen((res) => this.parseJson(res))
			.andThen((res) => this.validate(E621AutocompleteResponseSchema, res, { url }))
			.map((res) =>
				res.map((tag) => ({
					name: tag.name,
					antecedent: tag.antecedent_name ?? undefined,
					category: this.normalizeTagCategory(tag.category),
					count: tag.post_count
				}))
			);
	}

	private normalizePosts(posts: E621Post[]): BooruPost[] {
		return posts.map((post) => this.normalizePost(post)).filter(isDefined);
	}

	private normalizePost(raw: E621Post): BooruPost | undefined {
		const original = raw.files.original;
		if (!original.url) return undefined;

		const { previewUrl, placeholderUrl } = this.getUrls(this.getAssets(raw));

		return {
			id: raw.id,
			source: this.info.id,
			url: original.url,
			previewUrl,
			placeholderUrl,
			width: original.width,
			height: original.height,
			mediaType: getExtensionType(raw.files.meta.ext),
			tags: raw.tags,
			rating: this.normalizeRating(raw.rating),
			score: raw.stats.score.total,
			createdAt: new Date(raw.created_at)
		};
	}

	private getAssets(raw: E621Post): BooruAsset[] {
		const assets: BooruAsset[] = [];

		const { original, preview, sample } = raw.files;
		const previewUrl = preview.webp ?? preview.jpg;
		const sampleUrl = sample.webp ?? sample.jpg;

		if (original.url) {
			assets.push({
				url: original.url,
				width: original.width,
				height: original.height
			});
		}

		if (previewUrl) {
			assets.push({
				url: previewUrl,
				width: preview.width,
				height: preview.height
			});
		}

		if (sampleUrl) {
			assets.push({
				url: sampleUrl,
				width: sample.width,
				height: sample.height
			});
		}

		return assets;
	}

	private normalizeTags(tags: E621TagResponse): BooruTag[] {
		if (!Array.isArray(tags)) return [];

		return tags.map((tag) => ({
			name: tag.name,
			category: this.normalizeTagCategory(tag.category),
			count: tag.post_count
		}));
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
