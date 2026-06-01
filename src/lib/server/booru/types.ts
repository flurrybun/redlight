export interface BooruPost {
	id: string;
	source: string;
	fileUrl: string;
	previewUrl: string;
	// mediaType: "image" | "video";
	tags: string[];
	rating: "safe" | "questionable" | "explicit";
	score: number;
	width: number;
	height: number;
	createdAt: Date;
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
