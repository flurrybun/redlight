import { defineEnvVars } from "@sveltejs/kit/env";
import { building } from "$app/env";

function schema(value: string | undefined) {
	if (value === undefined && !building) {
		throw new Error("Missing required environment variable");
	}

	return value ?? "";
}

export const variables = defineEnvVars({
	DANBOORU_API_KEY: { schema },
	DANBOORU_LOGIN: { schema },
	DANBOORU_USER_ID: { schema },
	E621_API_KEY: { schema },
	E621_LOGIN: { schema },
	GELBOORU_API_KEY: { schema },
	GELBOORU_USER_ID: { schema }
});
