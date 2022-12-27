# End-2-End Tests

To write an end-2-end test, use FullStacked `utils/testE2E` class. This class provide the setup to start puppeteer and and automate some action to make sure your web app responds as expected.

## Example

```ts
import {describe, it, before, after} from "mocha";
import {equal} from "assert";
import TestE2E from "fullstacked/utils/testE2E";
import {dirname, resolve} from "path";
import {fileURLToPath} from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

describe("Default Template Tests", function(){
    let test;
    before(async function(){
        // instantiate the E2E test
        // define your project root
        test = new TestE2E(resolve(__dirname, ".."));

        // the init method return a big number if docker needs to pull
        this.timeout(await test.init());

        // start the test            
        await test.start();
    });

    it('Should display main title', async function(){
        // your puppeteer page will always be at the page attribute
        // use puppeteer API to automate actions
        // https://pptr.dev/api/puppeteer.page
        const root = await test.page.$("h1");
        const innerHTML = await root.getProperty('innerHTML');
        const value = await innerHTML.jsonValue();
        equal(value, "Welcome to FullStacked!");
    });

    after(async function(){
        // don't forget to stop the test or it will hang
        await test.stop();
    });
});
```

## Coverage

This is cover your WebApp code. To this day, your Server code won't be cover by end-2-end tests.
