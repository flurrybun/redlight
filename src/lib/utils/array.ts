/**
 * Splits an array into chunks of a specified size. The last chunk may contain
 * fewer elements if it's not perfectly divisible by the chunk size.
 *
 * @example
 * chunk([1, 2, 3, 4, 5], 2) // [[1, 2], [3, 4], [5]]
 * chunk([1, 2, 3, 4, 5], 3) // [[1, 2, 3], [4, 5]]
 *
 * @param array The array to process.
 * @param size The size of each chunk.
 * @returns An array of chunks, where each chunk is an array of elements from the input array.
 */
export function chunk<T>(array: T[], size: number): T[][] {
	if (array.length === 0 || size <= 0) return [];

	return Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
		array.slice(i * size, i * size + size)
	);
}

/**
 * Creates a duplicate-free version of an array.
 *
 * This function takes an array and returns a new array containing only the unique values
 * from the original array, preserving the order of first occurrence.
 *
 * @param arr The array to process.
 * @returns A new array with only unique values from the original array.
 *
 * @example
 * const array = [1, 2, 2, 3, 4, 4, 5];
 * const result = uniq(array);
 * // result will be [1, 2, 3, 4, 5]
 */
export function uniq<T>(arr: readonly T[]): T[] {
	return [...new Set(arr)];
}

/**
 * Returns a new array containing only the unique elements from the original array,
 * based on the values returned by the mapper function.
 *
 * When duplicates are found, the first occurrence is kept and the rest are discarded.
 *
 * @template T - The type of elements in the array.
 * @template U - The type of mapped elements.
 * @param arr - The array to process.
 * @param mapper - The function used to convert the array elements.
 * @returns A new array containing only the unique elements from the original array, based on the values returned by the mapper function.
 *
 * @example
 * ```ts
 * uniqBy([1.2, 1.5, 2.1, 3.2, 5.7, 5.3, 7.19], Math.floor);
 * // [1.2, 2.1, 3.2, 5.7, 7.19]
 * ```
 *
 * @example
 * const array = [
 *   { category: 'fruit', name: 'apple' },
 *   { category: 'fruit', name: 'banana' },
 *   { category: 'vegetable', name: 'carrot' },
 * ];
 * uniqBy(array, item => item.category).length
 * // 2
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
export function uniqBy<T, U>(
	arr: readonly T[],
	mapper: (item: T, index: number, array: readonly T[]) => U
): T[] {
	const map = new Map<U, T>();

	for (let i = 0; i < arr.length; i++) {
		const item = arr[i];
		const key = mapper(item, i, arr);

		if (!map.has(key)) {
			map.set(key, item);
		}
	}

	return Array.from(map.values());
}

/**
 * Determines the index of the smallest value in an array.
 *
 * @param arr The array to process.
 * @returns The index of the smallest value.
 */
// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
export function indexOfMin<T>(arr: T[]): number {
	if (arr.length === 0) return -1;

	let minIndex = 0;

	for (let i = 1; i < arr.length; i++) {
		if (arr[i] < arr[minIndex]) {
			minIndex = i;
		}
	}

	return minIndex;
}
