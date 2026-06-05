/**
 * Splits an array into chunks of a specified size. The last chunk may contain
 * fewer elements if it's not perfectly divisible by the chunk size.
 *
 * @example
 * chunk([1, 2, 3, 4, 5], 2) // [[1, 2], [3, 4], [5]]
 * chunk([1, 2, 3, 4, 5], 3) // [[1, 2, 3], [4, 5]]
 *
 * @param array The input array to be chunked
 * @param size The size of each chunk
 * @returns An array of chunks, where each chunk is an array of elements from the input array
 */
export function chunk<T>(array: T[], size: number): T[][] {
	if (array.length === 0 || size <= 0) return [];

	return Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
		array.slice(i * size, i * size + size)
	);
}
