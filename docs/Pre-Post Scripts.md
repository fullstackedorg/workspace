# Pre/Post Scripts

Pre/Post scripts are mimicked from [npm-script](https://docs.npmjs.com/cli/v9/using-npm/scripts#pre--post-scripts), but it's file based instead of bash commands. It works with the `*.[event].ts` naming syntax and you can either script at the top level or export a default function. With the default exported function, your `FullStackedConfig` will always be passed as the first argument. See the full list of attributes [here](https://github.com/cplepage/fullstacked/blob/main/index.ts). The export default function will `await` if it is `async` or if it returns a `Promise`.

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

There are threes events where you can add `pre` and `post` scripts.

### Build

The build event is perfect to add extra assets in your `dist` directory. `prebuild` is especially good to transpile some stuff like `css` and `postbuild` is perfect to move some static files that aren't imported by your web app *(i.e., a meta sharing image).* 

#### Filenames

- `prebuild.ts`/`prebuild.tsx`

- `*.prebuild.ts`/`*.prebuild.tsx`

- `postbuild.ts`/`postbuild.tsx`

- `*.postbuild.ts`/`*.postbuild.tsx`

### Run

**Run is only triggered when running locally**. It won't be triggered on your remote server during a deployment. This is usefull for loading a custom docker image.

#### Filenames

- `prerun.ts`/`prerun.tsx`

- `*.prerun.ts`/`*.prerun.tsx`

- `postrun.ts`/`postrun.tsx`

- `*.postrun.ts`/`*.postrun.tsx`

### Deploy

The `pre`/`post` deploy hook comes with a connected `SFTP` instance as second argument.

```ts
import FullStackedConfig from "fullstacked";
import SFTP from "ssh2-sftp-client"

export default function (config: FullStackedConfig, sftp: SFTP){
    // ...
}
```

Meaning you can use this with `utils/uploadFileWithProgress` to send extra files to your remote server.

#### Filenames

- `predeploy.ts`/`predeploy.tsx`

- `*.predeploy.ts`/`*.predeploy.tsx`

- `postdeploy.ts`/`postdeploy.tsx`

- `*.postdeploy.ts`/`*.postdeploy.tsx`
