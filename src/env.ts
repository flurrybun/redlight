import { defineEnvVars } from "@sveltejs/kit/env";
import z from "zod";

export const variables = defineEnvVars({
	DANBOORU_API_KEY: { public: false },
	DANBOORU_LOGIN: { public: false },
	DANBOORU_USER_ID: { public: false },
	E621_API_KEY: { public: false },
	E621_LOGIN: { public: false },
	GELBOORU_API_KEY: { public: false },
	GELBOORU_USER_ID: { public: false }
});
