# Pre/Post Events

Pre/Post events works in a mimicked from [npm-script](https://docs.npmjs.com/cli/v9/using-npm/scripts#pre--post-scripts), but file based insteand of bash commands. It works with the `*.[event].ts` naming syntax and you can either script at the top level of export a default function. With the default exported function, your `FullStackedConfig` will always be passed as the first argument. See the full list of attributes [here](https://github.com/cplepage/fullstacked/blob/main/index.ts).

## Example

Default export *(recommended)*

```ts
import fs from "fs";
import {resolve} from "path";
import FullStackedConfig from "fullstacked";

export default function (config: FullStackedConfig) {
    fs.cpSync(resolve(".", "image.jpg"), resolve(config.out, "image.jpg"));
}
```

Top level *(less recommended)*

```ts
import fs from "fs";
import {resolve} from "path";

fs.cpSync(resolve(".", "image.jpg"), resolve(".", "dist", "image.jpg"));
```

## Events

There are threes events where you can add `pre` and `post` scripts to adjust some stuff.

### build

- `prebuild.ts`/`prebuild.tsx`

- `*.prebuild.ts`/`*.prebuild.tsx`

- `postbuild.ts`/`postbuild.tsx`

- `*.postbuild.ts`/`*.postbuild.tsx`

### run

- `prerun.ts`/`prerun.tsx`

- `*.prerun.ts`/`*.prerun.tsx`

- `postrun.ts`/`postrun.tsx`

- `*.postrun.ts`/`*.postrun.tsx`

### deploy

- `predeploy.ts`/`predeploy.tsx`

- `*.predeploy.ts`/`*.predeploy.tsx`

- `postdeploy.ts`/`postdeploy.tsx`

- `*.postdeploy.ts`/`*.postdeploy.tsx`
