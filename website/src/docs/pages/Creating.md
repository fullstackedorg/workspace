# Creating

### Command
It generates the default starter files, simply run the following command:
```shell
npx fullstacked create
```
This create two files : `server.ts`, `index.tsx` and `test.ts`. 
These files are your entrypoints for your server, web app and tests respectively.

### Default Files
#### server.ts
```ts
import Server from "fullstacked/server";

const server = new Server();

server.express.get("/hello-world",
    (req, res) => res.send("Hello World"));

server.start();

export default server;
```
This is your Server(backend) entrypoint. No need register your public static folder. It's all taken care of

#### index.tsx
```tsx
import Webapp from "fullstacked/webapp";

Webapp(<>Welcome to FullStacked!</>);
```
This is your Webapp(frontend) entrypoint. No need to use render from react-dom or setup an HTML file. Once again, it's all take care of.

#### test.ts
```ts
import * as assert from "assert";
import {before, describe} from "mocha";
import Helper from "fullstacked/tests/e2e/Helper";
import server from "./server";
import axios from "axios";

describe("Integration", function(){
    let test;

    before(async function (){
        test = new Helper(__dirname);
        await test.start();
    });

    it('Should hit endpoint', async function(){
        assert.equal((await axios.get("/hello-world")).data, "Hello World");
    });

    after(async function(){
        await test.stop();
    });
});

describe("End-to-End", function(){
    before(async function (){
        server.start({silent: true, testing: true});
    });

    it('Should load default page', async function(){
        const root = await test.page.$("#root");
        const innerHTML = await root.getProperty('innerHTML');
        const value = await innerHTML.jsonValue();
        assert.equal(value, "Welcome to FullStacked!");
    });

    after(async function (){
        server.stop();
    });
});
```
This is your initial testing file. Tests written here are just good examples. You'll learn more about how to create and add some test in the next documentation page.

### Flags
| Flag | Description |
| --- | --- |
| *--skip-test=*  &nbsp;| Won't generate the default test file. |
