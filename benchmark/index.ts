import { fork } from "child_process";
import { Logger } from "@speedy/node-core";

(new Logger("Benchmark")).warn("On first run, cache won't be filled yet!, Run it 2x to fully utilize the cache.");
async function benchmark(pkg: string): Promise<void> {
	const logger = new Logger(pkg);

	const cachedTime = await new Promise<number>(resolve => {
		fork("./benchmark/benchmark", [pkg, "cached"])
			.on("message", (time: number) => resolve(time))
			.on("error", error => logger.error("", error));
	});

	const unCachedTime = await new Promise<number>(resolve => {
		fork("./benchmark/benchmark", [pkg, "uncached"])
			.on("message", (time: number) => resolve(time))
			.on("error", error => logger.error("", error));
	});

	logger.info(`Uncached: ${unCachedTime.toFixed(3)} ms`);
	logger.info(`Cached: ${cachedTime.toFixed(3)} ms`);
	logger.info(`Efficient: ${(100 - (cachedTime / unCachedTime * 100)).toFixed(3)} %`);
	logger.info(`Difference: ${-(unCachedTime - cachedTime).toFixed(3)} ms`);

	console.log("\n");
}

async function run() {
	console.log("\n");
	await benchmark("tslint");
	await benchmark("fs-extra");
	await benchmark("shelljs");
	await benchmark("stylelint");
	await benchmark("postcss");
	await benchmark("yargs");
	await benchmark("eslint");
}

run();