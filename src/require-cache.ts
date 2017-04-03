import * as _ from "lodash";
import * as nodeModule from "module";
import { resolve, relative } from "path";
import { readJsonSync, writeJsonSync, ensureFileSync, removeSync } from "fs-extra";
import { Dictionary, Logger, packageJson } from "@speedy/node-core";

import { CacheOptions, CacheFile, CacheStats } from "./require-cache.model";

export class RequireCache {

	private logger = new Logger("Require Cache");
	private resolveFileNameOriginal = nodeModule._resolveFilename;
	private cwd = process.cwd();
	private filesLookUp: Dictionary<string> = {};
	private cacheTimerInstance: NodeJS.Timer;
	private stats: CacheStats = {
		cacheHit: 0,
		cacheMiss: 0,
		notCached: 0
	};
	private OPTIONS: CacheOptions = {
		cacheKiller: packageJson.getVersion(),
		cacheFilePath: resolve("./.cache/speedy-require-cache.json")
	};

	constructor(
		options?: Partial<CacheOptions>
	) {
		this.OPTIONS = { ...this.OPTIONS, ...options };
	}

	/** Start caching of the modules locations. */
	start(): RequireCache {
		nodeModule._resolveFilename = this.resolveFilenameOptimized.bind(this);

		let cacheFile: CacheFile;

		try {
			cacheFile = readJsonSync(this.OPTIONS.cacheFilePath) as CacheFile;
		} catch (error) {
			return this;
		}

		if (!cacheFile ||
			(_.isNumber(cacheFile.cacheKiller) && cacheFile.cacheKiller < new Date().getTime()) ||
			(_.isString(cacheFile.cacheKiller) && cacheFile.cacheKiller !== this.OPTIONS.cacheKiller)) {
			return this;
		}

		this.filesLookUp = cacheFile.paths;
		return this;
	}

	/** Stop caching of the modules locations. */
	stop() {
		nodeModule._resolveFilename = this.resolveFileNameOriginal;
		this.saveCache();
	}

	/** Delete the cache file */
	reset() {
		removeSync(this.OPTIONS.cacheFilePath);
	}

	/**
	 * Get a statistics object about the caching effectiveness.
	 *
	 * @returns {CacheStats}
	 */
	getStats(): CacheStats {
		return this.stats;
	}

	private resolveFilenameOptimized(path: string, parentModule: NodeModule): string {
		const key = this.getCacheKey(parentModule.id, path);
		const cachedPath: string | undefined = this.filesLookUp[key];

		if (cachedPath) {
			this.stats.cacheHit++;
			return cachedPath;
		}

		const filename = this.resolveFileNameOriginal.apply(nodeModule, arguments) as string;
		if (filename.indexOf("node_modules") > -1) {
			this.filesLookUp[key] = filename;
			this.scheduleSaveCache();
			this.stats.cacheMiss++;
		} else {
			this.stats.notCached++;
		}

		return filename;
	}

	private getCacheKey(filename: string, path: string): string {
		return `${relative(this.cwd, filename).replace(/\\/g, "/")}:${path}`;
	}

	private scheduleSaveCache() {
		if (this.cacheTimerInstance) {
			clearTimeout(this.cacheTimerInstance);
		}

		this.cacheTimerInstance = setTimeout(this.saveCache.bind(this), 500);
	}

	private saveCache() {
		const cacheFile: CacheFile = {
			cacheKiller: this.OPTIONS.cacheKiller,
			paths: this.filesLookUp
		};

		const { cacheHit, cacheMiss } = this.getStats();

		this.logger.debug(this.saveCache.name,
			`Trying to saving cache, Path: ${this.OPTIONS.cacheFilePath}, cacheHit: ${cacheHit}, cacheMiss: ${cacheMiss}`);
		ensureFileSync(this.OPTIONS.cacheFilePath);
		writeJsonSync(this.OPTIONS.cacheFilePath, cacheFile);
		this.logger.debug(this.saveCache.name, `Saved cached successfully.`);
	}

}