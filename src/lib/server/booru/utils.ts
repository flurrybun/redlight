import { getFileType } from "$lib/utils/media";
import { type BooruAsset, type TagCategory, TagCategorySchema } from "./types";

export function isValidTagCategory(category: string): category is TagCategory {
	return TagCategorySchema.safeParse(category).success;
}

export function getPreviewAsset(assets: BooruAsset[]) {
	const images = assets.filter(
		(asset) => asset.width !== 0 && asset.height !== 0 && getFileType(asset.url) === "image"
	);

	let bestAbove = undefined;
	let bestBelow = undefined;

	for (const image of images) {
		if (image.width >= 500) {
			if (!bestAbove || image.width < bestAbove.width) {
				bestAbove = image;
			}
		} else {
			if (!bestBelow || image.width > bestBelow.width) {
				bestBelow = image;
			}
		}
	}

	return bestAbove ?? bestBelow;
}
