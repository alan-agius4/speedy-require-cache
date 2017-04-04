import { RequireCache } from "./require-cache";
import { fork } from "child_process";
import { join } from "path";

describe("requireCacheSpec", () => {
	let cache: RequireCache;

	beforeEach(() => {
		cache = new RequireCache();
		cache.stats;
	});


	function runProcess() {
		return fork(join(__dirname, "require-cache-process.spec", [version ]);
	}

});