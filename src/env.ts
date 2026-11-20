import { defineEnvVars } from "@sveltejs/kit/env";

export const variables = defineEnvVars({
	DANBOORU_API_KEY: { static: true },
	DANBOORU_LOGIN: { static: true },
	DANBOORU_USER_ID: { static: true },
	E621_API_KEY: { static: true },
	E621_LOGIN: { static: true },
	GELBOORU_API_KEY: { static: true },
	GELBOORU_USER_ID: { static: true }
});
