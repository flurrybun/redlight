import { Result, ResultAsync, err, ok } from "neverthrow";
import z from "zod";
import type {
	BooruError,
	BooruInfo,
	BooruPost,
	BooruTag,
	SearchOptions,
	SearchResult
} from "./types";

export abstract class BooruAdapter {
	protected info: BooruInfo;
	protected defaultParams: Record<string, string>;

	constructor(info: BooruInfo, defaultParams: Record<string, string> = {}) {
		this.info = info;
		this.defaultParams = defaultParams;
	}

	abstract search(options: SearchOptions): ResultAsync<SearchResult, BooruError>;
	abstract getPost(id: string): ResultAsync<BooruPost, BooruError>;
	abstract getTagMetadata(names: string[]): ResultAsync<BooruTag[], BooruError>;
	abstract searchTags(query: string, limit?: number): ResultAsync<BooruTag[], BooruError>;

	protected fetch(
		url: string,
		params: Record<string, string> = {}
	): ResultAsync<Response, BooruError> {
		const merged = { ...this.defaultParams, ...params };
		const fullUrl = `${url}?${new URLSearchParams(merged)}`;

		return ResultAsync.fromPromise(
			fetch(fullUrl, { headers: { Accept: "application/json" } }),
			(error): BooruError => ({ kind: "network", message: String(error) })
		).andThen((res) => {
			if (res.ok) return ok(res);

			return err<Response, BooruError>({
				kind: "http",
				status: res.status,
				statusText: res.statusText
			});
		});
	}

	protected parseJson(res: Response): ResultAsync<unknown, BooruError> {
		return ResultAsync.fromPromise(
			res.json(),
			(e): BooruError => ({ kind: "parse", message: String(e) })
		);
	}

	protected parseXml(res: Response): ResultAsync<Document, BooruError> {
		return ResultAsync.fromPromise(
			res.text(),
			(e): BooruError => ({ kind: "parse", message: String(e) })
		).andThen((text) => {
			const parser = new DOMParser();
			const doc = parser.parseFromString(text, "application/xml");
			const errorNode = doc.querySelector("parsererror");

			if (!errorNode) return ok(doc);

			return err<Document, BooruError>({
				kind: "parse",
				message: errorNode.textContent
			});
		});
	}

	protected validate<T extends z.ZodTypeAny>(
		schema: T,
		data: unknown
	): Result<z.infer<T>, BooruError> {
		const result = schema.safeParse(data);

		if (result.success) return ok(result.data);

		return err({
			kind: "validation" as const,
			message: "Schema validation failed"
		});
	}

	protected formatTags(tags: string[]): string {
		return tags.join(" ");
	}

	// #validate<T extends z.ZodTypeAny>(schema: T, data: unknown): Result<z.infer<T>, BooruError> {
	// 	const result = schema.safeParse(data);

	// 	if (result.success) {
	// 		return ok(result.data);
	// 	} else {
	// 		return err({
	// 			kind: "validation",
	// 			message: "Schema validation failed"
	// 		});
	// 	}
	// }

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
