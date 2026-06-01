import type { BooruPost } from "$lib/server/booru/types";

const videoExtensions = [
	"mp4",
	"m4v",
	"mov",
	"avi",
	"wmv",
	"flv",
	"mkv",
	"webm",
	"mpeg",
	"mpg",
	"3gp",
	"ogv"
];

export function getExtensionType(ext: string): BooruPost["mediaType"] {
	return videoExtensions.includes(ext.toLowerCase()) ? "video" : "image";
}

export function getFileType(file: string): BooruPost["mediaType"] {
	const ext = file.split(".").at(-1);

	if (!ext) {
		console.error(`Invalid file name: ${file}`);
		return "image";
	}

	return getExtensionType(ext);
}
