import { Dictionary } from "@speedy/node-core";

/** @internal */
export interface CacheFile {
	cacheKiller: number | string;
	paths: Dictionary<string>;
}

export interface CacheOptions {
	/**
	 * Used to invalidate the cache. By default it's set the version of `package.json`.
	 *
	 * Normally one will pass the application version number assuming that a different version
	 * or a Unix timestamp when the cache should expire.
	 *
	 * string: 'package.json' version: `1.0.0`.
	 *
	 * number: Unix timestamp: `1490873027`.
	 */
	cacheKiller: number | string;

	/** Alternate cache file location. Default: `./.cache/speedy-require-cache.json` */
	cacheFilePath: string;
}

export interface CacheStats {
	/** Number of modules who's locations were found in the cache. */
	cacheHit: number;

	/** Number of modules who's locations were not found in the cache and were added to the cache. */
	cacheMiss: number;

	/** Number of modules not to be cached - either not in a node_modules folder or process.cwd() */
	notCached: number;
}