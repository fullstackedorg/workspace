# Pre/Post Scripts

Sometimes you will need a bit of tweaking throughout some processes. 
The scripts files allows you to automate some setting up.
Simply create the file at the root of your project and they with be pickup at the right moment.

Export default a function/async function or go fully functional, both are fine. If you export default a function,
your FullStacked config is passed as `arg`. Meaning you have all the output paths (and more) available.

### Available Scripts

| File Name      | Description                                                                                         |
|----------------|-----------------------------------------------------------------------------------------------------|
| *prebuild.ts*  | Runs before your build process. <br/> **When watching, runs only once at beginning.*                |
| *postbuild.ts* | Runs after your build process.<br/> **When watching, runs everytime the web app or server rebuilds.* |
| *prerun.ts*    | Runs before your web app starts.<br/>**Only locally*                                                |
| *postrun.ts*   | Runs after your web app is started.<br/>**Only locally*                                             |
| *predeploy.ts* | Runs before your web app is started on your remote host.                                            |
| *postdeply.ts* | Runs after your web app is started on your remote host.                                             |
**You can always use the `.ts` or `.tsx` file extension*

### Example

Here, we are adding a static image to our `public` directory, 
so we can access it to something like `https://hostname/a-static-image.png`.

```ts
// postbuild.ts

import {FullStackedConfig} from "fullstacked";
import * as fs from "fs";
import * as path from "path";

export default function (config: FullStackedConfig) {
    const imageFileName = "a-static-image.png";
    const imagePath = path.resolve(__dirname, imageFileName);
    fs.copyFileSync(imagePath, path.resolve(config.public, imageFileName));
}

```