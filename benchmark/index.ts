import { RequireCache } from "../dist/require-cache";

// const NUMBER_OF_ITERATIONS = 1;

function benchmarkCached(pkg: string) {
	const timeKey = `Cached: ${pkg}`;
	const cache = new RequireCache().start();
	console.time(timeKey);

	// for (let i = 1; i <= NUMBER_OF_ITERATIONS; i++) {
		let lib = require(pkg);
		lib = undefined;
	// }

	console.timeEnd(timeKey);
	// console.log(timeKey, "stats", cache.getStats());
	cache.stop();
}

// function benchmarkUncached(pkg: string) {
// 	const timeKey = `Uncached: ${pkg}`;
// 	console.time(timeKey);

// 	// for (let i = 1; i <= NUMBER_OF_ITERATIONS; i++) {
// 		let lib = require(pkg);
// 		lib = undefined;
// 	// }

// 	console.timeEnd(timeKey);
// }

//benchmarkUncached("@speedy/node-core");
// benchmarkCached("@speedy/node-core");
// console.log("--------------------------");
// benchmarkUncached("tslint");
// benchmarkCached("tslint");
// console.log("--------------------------");
// benchmarkUncached("fs-extra");
// benchmarkCached("fs-extra");
// console.log("--------------------------");
// benchmarkUncached("typescript");
// benchmarkCached("typescript");
// console.log("--------------------------");
// benchmarkUncached("nodegit");
benchmarkCached("nodegit");
// console.log("--------------------------");

// require("tslint");
// require("fs-extra");