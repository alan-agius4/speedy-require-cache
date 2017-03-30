import * as _ from "lodash";
import * as nodeModule from "module";
import { join } from "path";
import { readJsonSync, writeJsonSync, ensureFileSync, removeSync } from "fs-extra";
import { Dictionary, Logger, packageJson, fileSystem } from "@speedy/node-core";

import { CacheOptions, CacheFile, CacheStats } from "./require-cache.model";

const logger = new Logger("Require Cache");
const resolveFilenameOriginal = nodeModule._resolveFilename;

export class RequireCache {

	private filesLookUp: Dictionary<string> = {};
	private cacheTimerInstance: NodeJS.Timer;
	private stats: CacheStats = {
		cacheHit: 0,
		cacheMiss: 0
	};
	private OPTIONS: CacheOptions = {
		cacheKiller: packageJson.getVersion(),
		cacheFilePath: join(process.cwd(), "/.cache/cache-require-paths.json")
	};

	constructor(
		options?: Partial<CacheOptions>
	) {
		this.OPTIONS = { ...this.OPTIONS, ...options };
	}

	/** Start caching of the modules locations. */
	start() {
		nodeModule._resolveFilename = this.resolveFilenameOptimized;

		let cacheFile: CacheFile;

		try {
			cacheFile = readJsonSync(this.OPTIONS.cacheFilePath) as CacheFile;
		} catch (error) {
			return;
		}

		if (!cacheFile ||
			(_.isNumber(cacheFile.cacheKiller) && cacheFile.cacheKiller < new Date().getTime()) ||
			(_.isString(cacheFile.cacheKiller) && cacheFile.cacheKiller !== this.OPTIONS.cacheKiller)) {
			return;
		}

		this.filesLookUp = cacheFile.paths;
	}

	/** Stop caching of the modules locations. */
	stop() {
		nodeModule._resolveFilename = resolveFilenameOriginal;
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

	private resolveFilenameOptimized(path: string, parent: any): string {
		const key = `${fileSystem.getCanonicalPath(parent.id)}:${path}`;
		const cachedPath: string | undefined = this.filesLookUp[key];

		if (cachedPath) {
			this.stats.cacheHit++;
			return cachedPath;
		}

		const filename = resolveFilenameOriginal.apply(nodeModule, arguments);
		const uncachedPath = fileSystem.getCanonicalPath(filename);
		this.filesLookUp[key] = uncachedPath;
		this.stats.cacheMiss++;
		this.scheduleSaveCache();
		return uncachedPath;
	}

	private scheduleSaveCache() {
		if (this.cacheTimerInstance) {
			clearTimeout(this.cacheTimerInstance);
		}

		this.cacheTimerInstance = setTimeout(this.saveCache, 500);
	}

	private saveCache() {
		const cacheFile: CacheFile = {
			cacheKiller: this.OPTIONS.cacheKiller,
			paths: this.filesLookUp
		};

		const { cacheHit, cacheMiss } = this.getStats();

		logger.debug(this.saveCache.name,
			`Trying to saving cache, Path: ${this.OPTIONS.cacheFilePath}, cacheHit: ${cacheHit}, cacheMiss: ${cacheMiss}`);
		ensureFileSync(this.OPTIONS.cacheFilePath);
		writeJsonSync(this.OPTIONS.cacheFilePath, cacheFile);
		logger.debug(this.saveCache.name, `Saved cached successfully.`);
	}

}