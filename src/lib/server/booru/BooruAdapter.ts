import { ResultAsync, err, errAsync, ok, okAsync } from "neverthrow";
import type { BooruError, BooruInfo, BooruTag, SearchOptions, SearchResult } from "./types";

export abstract class BooruAdapter {
	protected info: BooruInfo;
	protected defaultParams: Record<string, string>;

	constructor(info: BooruInfo, defaultParams: Record<string, string> = {}) {
		this.info = info;
		this.defaultParams = defaultParams;
	}

	abstract search(options: SearchOptions): ResultAsync<SearchResult, BooruError>;
	abstract getTagMetadata(tags: string[]): ResultAsync<BooruTag[], BooruError>;
	abstract autocompleteTag(tag: string, limit: number): ResultAsync<BooruTag[], BooruError>;

	protected fetch(
		url: string,
		params: Record<string, string> = {}
	): ResultAsync<Response, BooruError> {
		const merged = { ...this.defaultParams, ...params };
		const fullUrl = `${url}?${new URLSearchParams(merged)}`;

		return ResultAsync.fromPromise(
			fetch(fullUrl, { headers: { Accept: "application/json" } }),
			(error): BooruError => ({ kind: "network", message: String(error) })
		)
			.andThen((res) => this.#checkRateLimit(res))
			.andThen((res) => {
				if (res.ok) return ok(res);

				return err<Response, BooruError>({
					kind: "http",
					status: res.status,
					statusText: res.statusText
				});
			});
	}

	#checkRateLimit(res: Response): ResultAsync<Response, BooruError> {
		if (res.status !== 429) return okAsync(res);

		const retryAfter = res.headers.get("retry-after");
		const retryDate = retryAfter && new Date(Date.now() + Number(retryAfter) * 1000);

		return errAsync<Response, BooruError>({
			kind: "rate-limit",
			retryDate: retryDate || undefined
		});
	}

	getName() {
		return this.info.name;
	}

	getId() {
		return this.info.id;
	}

	getInfo() {
		return this.info;
	}
}
