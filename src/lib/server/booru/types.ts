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

export interface SearchOptions {
	tags: string[];
	page?: number;
	limit?: number;
}

export interface SearchResult {
	posts: BooruPost[];
	total?: number; // not all boorus provide this
	page: number;
}

export interface BooruInfo {
	id: string; // e.g. "danbooru"
	name: string; // e.g. "Danbooru"
	baseUrl: string;
	supportsMultipleTags: boolean;
	maxLimit: number;
}

export type BooruError =
	| { kind: "network"; message: string }
	| { kind: "http"; status: number; statusText: string }
	| { kind: "parse"; message: string };
