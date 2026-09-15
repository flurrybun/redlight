export function isDefined<T>(v: T | undefined): v is T {
	return v !== undefined;
}

type WithDefined<T, K extends keyof T> = {
	[P in keyof T]: P extends K ? Exclude<T[P], undefined> : T[P];
};

export function isPropertyDefined<T, K extends keyof T>(key: K) {
	return (item: T): item is WithDefined<T, K> => {
		return item[key] !== undefined;
	};
}
