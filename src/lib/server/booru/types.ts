export interface BooruPost {
	id: number;
	source: string;
	file?: BooruAsset;
	preview?: BooruAsset;
	mediaType: "image" | "video";
	tags: string[];
	rating: "safe" | "questionable" | "explicit";
	score: number;
	favorites?: number;
	createdAt: Date;
}

export interface BooruAsset {
	url: string;
	width: number;
	height: number;
}

export interface BooruTag {
	name: string;
	category: TagCategory;
	count: number;
	aliases?: string[];
	implications?: string[];
}

export type TagCategory =
	| "general"
	| "character"
	| "copyright"
	| "artist"
	| "meta"
	| "species"
	| "lore";

export interface SearchOptions {
	tags: string[];
	page: number;
	limit: number;
}

export interface SearchResult {
	posts: BooruPost[];
	total?: number;
	page: number;
}

export interface BooruInfo {
	id: string;
	name: string;
	baseUrl: string;
	supportsMultipleTags: boolean;
	maxLimit: number;
}

export type BooruError =
	| { kind: "network"; message: string }
	| { kind: "http"; status: number; statusText: string }
	| { kind: "parse"; message: string }
	| { kind: "validation"; message: string }
	| { kind: "rate-limit"; retryDate?: Date };
