import { fork } from "child_process";
import { join } from "path";

import { CacheStats, CacheOptions } from "./require-cache.model";

describe("requireCacheSpec", () => {
	const TIMESTAMP_OPTIONS: CacheOptions = {
		cacheFilePath: "cache-timestamp.json",
		cacheKiller: getUnixTimestamp(2020)
	};
	const VERSION_OPTIONS: CacheOptions = {
		cacheFilePath: "cache-version.json",
		cacheKiller: "2.0.0"
	};
	const DEFAULT_PKG = "lodash";

	describe("given cache file doesn't exist", () => {
		it("should fetch files and save to cache", async done => {
			const data = await runProcess(TIMESTAMP_OPTIONS);
			expect(data.cacheHit).toBe(0);
			expect(data.cacheMiss).toBe(1);
			done();
		});
	});

	describe("given cache file exists", () => {
		describe("when cacheKiller is a 'Timestamp'", () => {
			describe("and cache is valid", () => {
				beforeEach(async done => {
					await runProcess(TIMESTAMP_OPTIONS);
					done();
				});

				it("should return files from cache", async done => {
					const data = await runProcess(TIMESTAMP_OPTIONS);
					expect(data.cacheHit).toBe(1);
					expect(data.cacheMiss).toBe(0);
					done();
				});
			});

			describe("and cache is not valid", () => {
				beforeEach(async done => {
					await runProcess({ ...TIMESTAMP_OPTIONS, cacheKiller: getUnixTimestamp(1800) });
					done();
				});

				it("should refetch files", async done => {
					const data = await runProcess(TIMESTAMP_OPTIONS);
					expect(data.cacheHit).toBe(0);
					expect(data.cacheMiss).toBe(1);
					done();
				});
			});
		});

		describe("when cacheKiller is a 'Version'", () => {
			beforeEach(async done => {
				await runProcess(VERSION_OPTIONS);
				done();
			});

			describe("and cache is valid", () => {
				it("should return files from cache", async done => {
					const data = await runProcess(VERSION_OPTIONS);
					expect(data.cacheHit).toBe(1);
					expect(data.cacheMiss).toBe(0);
					done();
				});
			});

			describe("and cache is not valid", () => {
				it("should refetch files", async done => {
					const data = await runProcess({ ...VERSION_OPTIONS, cacheKiller: "1.0.0" });
					expect(data.cacheHit).toBe(0);
					expect(data.cacheMiss).toBe(1);
					done();
				});
			});
		});
	});

	function getUnixTimestamp(year: number): number {
		return new Date(`${year}.01.01`).getTime() / 1000;
	}

	async function runProcess(options: CacheOptions, packageName = DEFAULT_PKG): Promise<CacheStats> {
		return await new Promise<CacheStats>((resolve, reject) => {
			fork(join(__dirname, "require-cache-process.mock"), [
				packageName,
				options.cacheKiller.toString(),
				options.cacheFilePath
			])
				.on("message", resolve)
				.on("error", reject);
		});
	}
});
