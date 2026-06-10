import z from "zod";

export const BooruIdSchema = z.enum(["gelbooru", "danbooru", "e621"]);
export type BooruId = z.infer<typeof BooruIdSchema>;

const stringListSchema = z.codec(z.string(), z.array(z.string()), {
	decode: (str) => str.split(",").filter(Boolean),
	encode: (arr) => arr.join(",")
});

const positiveIntSchema = z.codec(z.string(), z.number().int().min(1), {
	decode: (val) => Number(val),
	encode: (val) => val.toString()
});

export const SearchParamsSchema = z.strictObject({
	booru: BooruIdSchema,
	tags: stringListSchema,
	page: positiveIntSchema,
	limit: positiveIntSchema
});

export const TagMetadataParamsSchema = z.strictObject({
	booru: BooruIdSchema,
	names: stringListSchema,
	limit: positiveIntSchema
});
