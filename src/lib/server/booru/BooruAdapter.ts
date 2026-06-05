import { ResultAsync, err, ok } from "neverthrow";
import { checkRateLimit } from "./pipeline";
import type { BooruError, BooruInfo, BooruTag, SearchOptions, SearchResult } from "./types";

export default abstract class BooruAdapter {
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
			fetch(fullUrl, {
				headers: { Accept: "application/json", "User-Agent": "flurrybun · bun.garden" }
			}),
			(error): BooruError => ({ kind: "network", message: String(error) })
		)
			.andThen(checkRateLimit)
			.andThen((res) => {
				if (res.ok) return ok(res);

				return err<Response, BooruError>({
					kind: "http",
					status: res.status,
					statusText: res.statusText
				});
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
