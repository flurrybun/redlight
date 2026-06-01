import { ResultAsync, err, errAsync, ok } from "neverthrow";
import type { BooruError, BooruInfo, BooruPost, SearchOptions, SearchResult } from "./types";

export abstract class BooruAdapter {
	protected info: BooruInfo;
	protected defaultParams: Record<string, string>;

	constructor(info: BooruInfo, defaultParams: Record<string, string> = {}) {
		this.info = info;
		this.defaultParams = defaultParams;
	}

	abstract search(options: SearchOptions): ResultAsync<SearchResult, BooruError>;
	abstract getPost(id: string): ResultAsync<BooruPost, BooruError>;

	protected fetchJson<T>(
		url: string,
		params: Record<string, string> = {}
	): ResultAsync<T, BooruError> {
		const merged = { ...this.defaultParams, ...params };
		const fullUrl = `${url}?${new URLSearchParams(merged)}`;

		return ResultAsync.fromPromise(
			fetch(fullUrl, { headers: { Accept: "application/json" } }),
			(e): BooruError => ({ kind: "network", message: String(e) })
		).andThen((res) => {
			if (!res.ok) {
				return err<T, BooruError>({
					kind: "http",
					status: res.status,
					statusText: res.statusText
				});
			}

			return ResultAsync.fromPromise(
				res.json() as Promise<T>,
				(e): BooruError => ({ kind: "parse", message: String(e) })
			);
		});
	}

	protected fetchXml(
		url: string,
		params: Record<string, string> = {}
	): ResultAsync<Document, BooruError> {
		const mergedParams = { ...this.defaultParams, ...params };
		const fullUrl = `${url}?${new URLSearchParams(mergedParams)}`;

		return ResultAsync.fromPromise(
			fetch(fullUrl, { headers: { Accept: "application/xml" } }),
			(error): BooruError => ({ kind: "network", message: String(error) })
		)
			.andThen((res) => {
				if (!res.ok) {
					return errAsync<string, BooruError>({
						kind: "http",
						status: res.status,
						statusText: res.statusText
					});
				}

				return ResultAsync.fromPromise(
					res.text(),
					(e): BooruError => ({ kind: "parse", message: String(e) })
				);
			})
			.andThen((text) => {
				const parser = new DOMParser();
				const doc = parser.parseFromString(text, "application/xml");

				const errorNode = doc.querySelector("parsererror");

				if (errorNode) {
					return err<Document, BooruError>({
						kind: "parse",
						message: errorNode.textContent ?? "Unknown XML parse error"
					});
				}

				return ok<Document, BooruError>(doc);
			});
	}

	protected formatTags(tags: string[]): string {
		return tags.join(" ");
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
