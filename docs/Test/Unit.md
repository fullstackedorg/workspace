# Unit Tests

Unit tests are quite straightforward. Simply use and follow mochajs guides and you should achieve decent unit test.

## Example

```ts
import {describe, it} from "mocha";
import {equal} from "assert";
import {foo} from "./foo.ts";

describe("Integration Test", () => {
    it("Should return bar", () => {
        // hit an endpoint
        equal(foo(), "bar");
    });
});
```


