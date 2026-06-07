import z from "zod";
import type { BooruError, BooruErrorDetail, BooruInfo } from "./types";

export class BooruErrorFactory {
	readonly #info: BooruInfo;

	constructor(info: BooruInfo) {
		this.#info = info;
	}

	#make(detail: BooruErrorDetail): BooruError {
		return { info: this.#info, detail };
	}

	network(): BooruError {
		return this.#make({ kind: "network" });
	}

	http(status: number): BooruError {
		return this.#make({ kind: "http", status });
	}

	parse(): BooruError {
		return this.#make({ kind: "parse" });
	}

	rateLimit(retryDate: Date | undefined): BooruError {
		// TODO: log this somewhere more permanent than the console

		const delay = retryDate ? retryDate.getTime() - Date.now() : undefined;
		console.warn(
			`Rate limit hit for ${this.#info.name}. ${
				delay ? `Retry after ${String(delay * 1000)} seconds` : "Retry date unknown"
			}`
		);

		return this.#make({ kind: "rate-limit", retryDate });
	}

	validation(error: z.ZodError, context: { url: string }): BooruError {
		// TODO: log this somewhere more permanent than the console

		console.warn(
			`Validation error for ${this.#info.name} at ${context.url}: ${z.prettifyError(error)}`
		);

		return this.#make({ kind: "validation", error });
	}
}
