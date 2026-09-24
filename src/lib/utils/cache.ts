export class Cache<T> {
	private readonly store: LimitedMap<string, T>;

	constructor(options: { limit: number }) {
		this.store = new LimitedMap<string, T>(options.limit);
	}

	public set(key: string, value: T) {
		this.store.set(key, value);
	}

	public get(key: string) {
		return this.store.get(key);
	}

	public has(key: string) {
		return this.store.has(key);
	}

	public async getOr(key: string, factory: () => Promise<T> | T) {
		if (this.store.has(key)) {
			return this.store.get(key) as T;
		}

		const value = await factory();
		this.store.set(key, value);
		return value;
	}

	public delete(key: string) {
		return this.store.delete(key);
	}

	public clear() {
		this.store.clear();
	}

	public get size() {
		return this.store.size;
	}
}

class LimitedMap<K, V> extends Map<K, V> {
	private readonly limit: number;

	constructor(limit: number, entries?: Iterable<[K, V]>) {
		super();
		this.limit = limit;

		if (entries) {
			for (const [k, v] of entries) this.set(k, v);
		}
	}

	get(key: K): V | undefined {
		if (!this.has(key)) return undefined;

		const value = super.get(key) as V;
		super.delete(key);
		super.set(key, value);

		return value;
	}

	set(key: K, value: V): this {
		if (this.has(key)) {
			super.delete(key);
		} else if (this.size >= this.limit) {
			const oldestKey = this.keys().next().value;
			if (oldestKey) this.delete(oldestKey);
		}

		super.set(key, value);
		return this;
	}
}
