
import { RequireCache } from "./require-cache";
import { join } from "path";

const cacheKiller = process.argv[3];
const cache = new RequireCache({
	cacheKiller: cacheKiller.indexOf(".") > -1 ? cacheKiller : parseInt(cacheKiller, 10),
	cacheFilePath: join(__dirname, process.argv[4])
}).start();

require(process.argv[2]);

cache.stop();
process.send!(cache.stats);