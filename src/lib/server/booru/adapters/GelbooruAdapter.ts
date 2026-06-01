import { GELBOORU_API_KEY, GELBOORU_USER_ID } from "$env/static/private";
import { getFileType } from "$lib/utils/media";
import { type ResultAsync } from "neverthrow";
import { BooruAdapter } from "../BooruAdapter";
import type { BooruError, BooruPost, SearchOptions, SearchResult } from "../types";

interface GelbooruPost {
	id: number;
	created_at: string;
	score: number;
	width: number;
	height: number;
	md5: string;
	directory: string;
	image: string; // file name without path
	rating: "general" | "sensitive" | "questionable" | "explicit";
	source: string;
	owner: string;
	creator_id: number;
	parent_id: number;
	sample: 0 | 1;
	preview_height: number;
	preview_width: number;
	tags: string;
	title: string; // "" if not provided
	has_notes: "true" | "false";
	has_comments: "true" | "false";
	file_url: string;
	preview_url: string;
	sample_url: string;
	sample_height: number;
	sample_width: number;
	status: string;
	post_locked: 0 | 1;
	has_children: "true" | "false";
}

interface GelbooruResponse {
	"@attributes": {
		limit: number;
		offset: number;
		count: number;
	};
	post: GelbooruPost[] | GelbooruPost | undefined;
}

export class GelbooruAdapter extends BooruAdapter {
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
				json: "1"
			}
		);
	}

	search(options: SearchOptions): ResultAsync<SearchResult, BooruError> {
		return this.fetchJson<GelbooruResponse>(`${this.info.baseUrl}/index.php`, {
			page: "dapi",
			s: "post",
			q: "index",
			tags: options.tags.join(" "),
			pid: String(options.page ?? 0),
			limit: String(options.limit ?? 20)
		}).map((res) => ({
			posts: this.normalizePosts(res.post),
			page: options.page ?? 0,
			total: res["@attributes"].count
		}));
	}

	getPost(id: string): ResultAsync<BooruPost, BooruError> {
		return this.fetchJson<GelbooruPost>(`${this.info.baseUrl}/posts/${id}.json`).map((rawPost) =>
			this.normalizePost(rawPost)
		);
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
				return "safe";
			case "questionable":
			case "sensitive":
				return "questionable";
			case "explicit":
				return "explicit";
		}
	}

	private proxyUrl(url: string): string {
		return `/api/proxy?url=${encodeURIComponent(url)}`;
	}
}
