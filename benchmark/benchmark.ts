import { RequireCache } from "../dist/require-cache";

const pkg = process.argv[2] as string;

if (process.argv[3] === "cached") {
	new RequireCache().start();
}

const time = process.hrtime();
require(pkg);

const data = process.hrtime(time);
const timeResult = (data[0] * 1e9 + data[1]) * 1e-6;
process.send!(timeResult);