import { getFileType } from "#lib/utils/media.ts";
import { fromZod } from "#lib/utils/zod.ts";
import { PROXY_SECRET, PROXY_URL } from "$app/env/private";
import { Result, ResultAsync, err, errAsync, ok, okAsync } from "neverthrow";
import type z from "zod";
import { BooruErrorFactory } from "./BooruErrorFactory";
import type {
	BooruAsset,
	BooruError,
	BooruInfo,
	BooruTag,
	SearchOptions,
	SearchResult
} from "./types";

export default abstract class BooruAdapter {
	protected info: BooruInfo;
	protected errors: BooruErrorFactory;

	constructor(info: BooruInfo) {
		this.info = info;
		this.errors = new BooruErrorFactory(info);
	}

	abstract search(options: SearchOptions): ResultAsync<SearchResult, BooruError>;
	abstract getTagMetadata(tags: string[], limit: number): ResultAsync<BooruTag[], BooruError>;
	abstract autocompleteTag(tag: string, limit: number): ResultAsync<BooruTag[], BooruError>;

	protected fetch(
		url: string,
		params: Record<string, string> = {}
	): ResultAsync<Response, BooruError> {
		const merged = { ...this.info.baseParams, ...params };
		let fullUrl = `${url}?${new URLSearchParams(merged)}`;

		const headers = new Headers({
			Accept: "application/json",
			"User-Agent": this.formatUserAgent(),
			...this.info.baseHeaders
		});

		if (this.info.useProxy) {
			headers.set("x-proxy-secret", PROXY_SECRET);
			headers.set("x-target-url", fullUrl);
			fullUrl = PROXY_URL;
		}

		return ResultAsync.fromPromise(fetch(fullUrl, { headers }), () => this.errors.network())
			.andThen((res) => this.#checkRateLimit(res))
			.andThen((res) => {
				if (res.ok) return okAsync(res);
				return errAsync(this.errors.http(res.status));
			});
	}

	protected parseJson(res: Response): ResultAsync<unknown, BooruError> {
		return ResultAsync.fromPromise(res.json(), () => this.errors.parse());
	}

	protected parseXml(res: Response): ResultAsync<Document, BooruError> {
		return ResultAsync.fromPromise(res.text(), () => this.errors.parse()).andThen((text) => {
			const parser = new DOMParser();
			const doc = parser.parseFromString(text, "application/xml");
			const errorNode = doc.querySelector("parsererror");

			if (!errorNode) return ok(doc);
			return err(this.errors.parse());
		});
	}

	protected validate<T extends z.ZodType>(
		schema: T,
		data: unknown,
		context: { url: string }
	): Result<z.infer<T>, BooruError> {
		return fromZod(schema.safeParse(data), (error) => this.errors.validation(error, context));
	}

	protected processSearchResult(
		result: ResultAsync<SearchResult, BooruError>
	): ResultAsync<SearchResult, BooruError> {
		return result.map((res) => this.#deduplicatePostTags(res));
	}

	protected getUrls(assets: BooruAsset[]) {
		const images = assets.filter(
			(asset) =>
				asset.width > 0 &&
				asset.height > 0 &&
				asset.url !== "" &&
				getFileType(asset.url) === "image"
		);

		let bestAbove: BooruAsset | undefined = undefined;
		let bestBelow: BooruAsset | undefined = undefined;
		let lowest: BooruAsset | undefined = undefined;

		for (const image of images) {
			if (image.width >= 500) {
				if (!bestAbove || image.width < bestAbove.width) {
					bestAbove = image;
				}
			} else {
				if (!bestBelow || image.width > bestBelow.width) {
					bestBelow = image;
				}
			}

			if (!lowest || image.width < lowest.width) {
				lowest = image;
			}
		}

		return {
			previewUrl: bestAbove?.url ?? bestBelow?.url ?? images[0].url,
			placeholderUrl: lowest?.url ?? images[0].url
		};
	}

	protected formatUserAgent(): string {
		// some boorus are very particular about the user agent string, especially
		// when using large providers like cloudflare. override if necessary

		const username = this.info.username;
		return `Redlight/1.0${username ? `; user ${username}` : ""} (by flurrybun on GitHub)`;
	}

	#checkRateLimit(res: Response): ResultAsync<Response, BooruError> {
		if (res.status !== 429) return okAsync(res);

		const retryAfter = res.headers.get("retry-after");
		const retryDate = retryAfter ? new Date(Date.now() + Number(retryAfter) * 1000) : undefined;

		return errAsync(this.errors.rateLimit(retryDate));
	}

	#deduplicatePostTags(result: SearchResult): SearchResult {
		return {
			...result,
			posts: result.posts.map((post) => ({
				...post,
				tags: [...new Set(post.tags)]
			}))
		};
	}
}
