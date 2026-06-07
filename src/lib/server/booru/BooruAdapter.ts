import { fromZod } from "$lib/utils/zod";
import { Result, ResultAsync, err, errAsync, ok, okAsync } from "neverthrow";
import type z from "zod";
import { BooruErrorFactory } from "./BooruErrorFactory";
import type { BooruError, BooruInfo, BooruTag, SearchOptions, SearchResult } from "./types";

export default abstract class BooruAdapter {
	protected info: BooruInfo;
	protected errors: BooruErrorFactory;
	protected defaultParams: Record<string, string>;

	constructor(info: BooruInfo, defaultParams: Record<string, string> = {}) {
		this.info = info;
		this.errors = new BooruErrorFactory(info);
		this.defaultParams = defaultParams;
	}

	abstract search(options: SearchOptions): ResultAsync<SearchResult, BooruError>;
	abstract getTagMetadata(tags: string[], limit: number): ResultAsync<BooruTag[], BooruError>;
	abstract autocompleteTag(tag: string, limit: number): ResultAsync<BooruTag[], BooruError>;

	protected fetch(
		url: string,
		params: Record<string, string> = {}
	): ResultAsync<Response, BooruError> {
		const merged = { ...this.defaultParams, ...params };
		const fullUrl = `${url}?${new URLSearchParams(merged)}`;

		return ResultAsync.fromPromise(
			fetch(fullUrl, {
				headers: { Accept: "application/json", "User-Agent": "flurrybun · bun.garden" }
			}),
			() => this.errors.network()
		)
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
