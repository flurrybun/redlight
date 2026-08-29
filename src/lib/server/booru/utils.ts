import { type TagCategory, TagCategorySchema } from "./types";

export function isValidTagCategory(category: string): category is TagCategory {
	return TagCategorySchema.safeParse(category).success;
}
