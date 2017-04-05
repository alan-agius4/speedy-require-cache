# @speedy/require-cache
[![CircleCI](https://circleci.com/gh/alan-agius4/speedy-require-cache.svg?style=shield)](https://circleci.com/gh/alan-agius4/speedy-require-cache)
[![npm version](https://img.shields.io/npm/v/@speedy/require-cache.svg)](https://www.npmjs.com/package/@speedy/require-cache)
[![Dependency Status](https://img.shields.io/david/alan-agius4/speedy-require-cache.svg?style=flat-square)](https://david-dm.org/alan-agius4/speedy-require-cache)
[![devDependency Status](https://img.shields.io/david/dev/alan-agius4/speedy-require-cache.svg?style=flat-square)](https://david-dm.org/alan-agius4/speedy-require-cache?type=dev)

Speed up Node load time by caching resolved module paths to avoid module resolution and refetching each time the application is loaded.

The first time the application loads, resolved file paths are saved in the file system.

This modules patches the `_resolveFilename` method of Node `module`, caching the files it finds in order to improve Node loading performance.

This is inspired by [fast-boot](https://www.npmjs.com/package/fast-boot).

***Benchmark results***

| Library   | Uncached    | Cached     | Efficient | Duration    |
|-----------|-------------|------------|-----------|-------------|
| tslint    | 128.268 ms  | 82.189 ms  | 35.923 %  | -46.078 ms  |
| fs-extra  | 0.229 ms    | 0.236 ms   | -2.991 %  | 0.007 ms    |
| shelljs   | 59.767 ms   | 32.028 ms  | 46.412 %  | -27.739 ms  |
| stylelint | 1492.165 ms | 687.323 ms | 53.938 %  | -804.842 ms |
| postcss   | 71.924 ms   | 45.183 ms  | 37.179 %  | -26.74 ms   |
| yargs     | 97.382 ms   | 27.751 ms  | 71.503 %  | -69.632 ms  |
| eslint    | 359.556 ms  | 292.274 ms | 18.712 %  | -67.282 ms  |

Benchmark mark done on a `Windows 7 64 Bit`, `i7-5500U CPU @ 2.40Ghz` and `16GB RAM`.

## Getting Started

### Installation

```
npm install @speedy/require-cache --save
```

### Usage

```js
import { RequireCache } from "@speedy/require-cache";
new RequireCache().start();

import * as stylelint from "stylelint";
import * as _ from "lodash";
```

### Interfaces

#### CacheOptions
| Name          | Description                                                                                                                                                                                                                                                                                                 | Type                |
|---------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------|
| cacheKiller   | Used to invalidate the cache. By default it's set the version of `package.json`.<br><br>Normally one will pass the application version number assuming that a different version or a Unix timestamp when the cache should expire.<br><br>string: 'package.json' version: `1.0.0`<br>number: Unix timestamp: `1490873027` | `number` | `string` |
| cacheFilePath | Alternate cache file location. Default: `./.cache/speedy-require-cache.json`                                                                                                                                                                                                                                | `string`            |
 readOnlyMode   | When in `ReadOnly` mode. Any changes will be discharged once process is terminated. Default: `false`                                                                                                                                                                                                        | `boolean`          |

#### CacheStats
| Name      | Description                                                                                         | Type     |
|-----------|-----------------------------------------------------------------------------------------------------|----------|
| cacheHit  | Number of modules who's locations were found in the cache                                           | `number` |
| cacheMiss | Number of modules who's locations were not found in the cache and were added to the cache           | `number` |
| notCached | Number of modules not to be cached - either not in `node_modules` folder or `process.cwd()`         | `number` |

### Methods and Properties

#### new RequireCache([options]: Partial\<CacheOptions\>) ⇒ `RequireCache`
Creates an instance of RequireCache.

#### requireCache.isEnabled : <code>boolean</code>
Whether or not the cache is currently enabled.

**Read only**: true

#### requireCache.stats : <code>CacheStats</code>
Caching effectiveness statistics.

**Read only**: true

Start caching of module locations.

#### requireCache.stop()
Stop caching of the modules locations.

#### requireCache.reset()
Deletes the cache file.

#### requireCache.save()
Saves cached paths to file.

## Benchmark Yourself

If you'd like to run the benchmark yourself. Clone the Git repository and install all the dependencies executing the following commands in your terminal:

```
npm install
npm run benchmark-install
```

To benchmark run:
```
npm run benchmark
```
