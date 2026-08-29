import type { Handle } from "@sveltejs/kit";

export const handle: Handle = async ({ event, resolve }) => {
	const lang = event.request.headers.get("accept-language");

	if (lang) {
		const locale = parseAcceptLanguage(lang);
		event.locals.locale = locale;
	}

	return resolve(event);
};

function parseAcceptLanguage(header: string) {
	return header
		.split(",")
		.map((chunk) => {
			const [lang, q] = chunk.trim().split(";q=");
			const weight = q ? parseFloat(q) : 1.0;

			return { lang, weight };
		})
		.sort((a, b) => b.weight - a.weight)
		.map((item) => item.lang);
}
