import * as nodeModule from "module";
import { resolve, join } from "path";
import { readJsonSync, writeJsonSync, ensureFileSync, removeSync } from "fs-extra";
import { Dictionary, Logger, packageJson } from "@speedy/node-core";

import { CacheOptions, CacheFile, CacheStats } from "./require-cache.model";

/**
 * Speed up Node load time by caching resolved module paths to avoid Node refetching
 * and resolving the modules each time the application is loaded.
 *
 * The first time the application loads, a cache of resolved file paths is saved in the file system.
 *
 * @example
 * import { RequireCache } from "@speedy/require-cache";
 * new RequireCache().start();
 *
 * import * as stylelint from "stylelint";
 * import * as _ from "lodash";
 *
 * @class RequireCache
 */
export class RequireCache {

	private isCacheModified = false;
	private logger = new Logger("Require Cache");
	private resolveFileNameOriginal = nodeModule._resolveFilename;
	private cwd = process.cwd();
	private filesLookUp: Dictionary<string> = {};
	private OPTIONS: CacheOptions = {
		readOnlyMode: false,
		cacheKiller: packageJson.getVersion(),
		cacheFilePath: resolve("./.cache/speedy-require-cache.json")
	};
	private _isEnabled = false;
	private _stats: CacheStats = {
		cacheHit: 0,
		cacheMiss: 0,
		notCached: 0
	};

	/**
	 * Creates an instance of RequireCache.
	 * @param {Partial<CacheOptions>} [options]
	 */
	constructor(
		options?: Partial<CacheOptions>
	) {
		this.OPTIONS = { ...this.OPTIONS, ...options };
	}

	/**
	 * Start caching of module locations.
	 *
	 * @returns {RequireCache}
	 */
	start(): RequireCache {
		this._isEnabled = true;
		nodeModule._resolveFilename = this.resolveFilenameOptimized.bind(this);

		process.once("exit", () => this.save());

		let cacheFile: CacheFile;

		try {
			cacheFile = readJsonSync(this.OPTIONS.cacheFilePath) as CacheFile;
		} catch (error) {
			return this;
		}

		const isKillerTimestamp = cacheFile.cacheKiller.toString().indexOf(".") === -1;

		if (!cacheFile ||
			(isKillerTimestamp && cacheFile.cacheKiller < new Date().getTime() / 1000) ||
			(!isKillerTimestamp && cacheFile.cacheKiller !== this.OPTIONS.cacheKiller)) {
			return this;
		}

		this.filesLookUp = cacheFile.paths;
		return this;
	}

	/** Stop caching of the modules locations. */
	stop() {
		this._isEnabled = false;
		nodeModule._resolveFilename = this.resolveFileNameOriginal;
		this.save();
	}

	/** Deletes the cache file. */
	reset() {
		removeSync(this.OPTIONS.cacheFilePath);
	}

	/** Saves cached paths to file. */
	save() {
		if (!this.isCacheModified) {
			this.logger.debug(this.save.name, "Save exited. Cache has not been modified");
			return;
		}

		if (this.OPTIONS.readOnlyMode) {
			this.logger.debug(this.save.name, "Save exited. Cache is in 'ReadOnly' mode");
			return;
		}

		const cacheFile: CacheFile = {
			cacheKiller: this.OPTIONS.cacheKiller,
			paths: this.filesLookUp
		};

		const { cacheHit, cacheMiss } = this._stats;

		this.logger.debug(this.save.name,
			`Trying to saving cache, Path: ${this.OPTIONS.cacheFilePath}, cacheHit: ${cacheHit}, cacheMiss: ${cacheMiss}`);
		ensureFileSync(this.OPTIONS.cacheFilePath);
		writeJsonSync(this.OPTIONS.cacheFilePath, cacheFile);
		this.logger.debug(this.save.name, `Saved cached successfully.`);
	}

	/**
	 * Whether or not the cache is currently enabled.
	 *
	 * @readonly
	 * @type {boolean}
	 */
	get isEnabled(): boolean {
		return this._isEnabled;
	}

	/**
	 * Caching effectiveness statistics.
	 *
	 * @readonly
	 * @type {CacheStats}
	 */
	get stats(): CacheStats {
		return this._stats;
	}

	private resolveFilenameOptimized(path: string, parentModule: NodeModule): string {
		const key = this.getCacheKey(parentModule.id, path);
		const cachedPath: string | undefined = this.filesLookUp[key];

		if (cachedPath) {
			this._stats.cacheHit++;
			return cachedPath;
		}

		const filename = this.resolveFileNameOriginal.apply(nodeModule, arguments) as string;
		if (filename.indexOf("node_modules") > -1) {
			this.filesLookUp[key] = filename;
			this._stats.cacheMiss++;
			this.isCacheModified = true;
		} else {
			this._stats.notCached++;
		}

		return filename;
	}

	private getCacheKey(path: string, filename: string): string {
		return join(path, filename).replace(this.cwd, "").replace(/\\/g, "/");
	}

}
