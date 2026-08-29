import z from "zod";

export const BooruIdSchema = z.enum(["gelbooru", "danbooru", "e621"]);
export type BooruId = z.infer<typeof BooruIdSchema>;

const StringListSchema = z.codec(z.string(), z.array(z.string()), {
	decode: (str) => str.split(",").filter(Boolean),
	encode: (arr) => arr.join(",")
});

const PositiveIntSchema = z.codec(z.string(), z.number().int().min(1), {
	decode: (val) => Number(val),
	encode: (val) => val.toString()
});

export const SearchParamsSchema = z.strictObject({
	booru: BooruIdSchema,
	tags: StringListSchema,
	page: PositiveIntSchema,
	limit: PositiveIntSchema
});

export const TagMetadataParamsSchema = z.strictObject({
	booru: BooruIdSchema,
	names: StringListSchema,
	limit: PositiveIntSchema
});

export const AutocompleteParamsSchema = z.strictObject({
	booru: BooruIdSchema,
	tag: z.string(),
	limit: PositiveIntSchema
});
