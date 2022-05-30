# Testing

### Command
```shell
npx fullstacked test
```
This will run all your `test.ts` files in your project directory!

### Flags
| Flag | Description |
| --- | --- |
| *--headless*  &nbsp; | Will pass the headless flag to puppeteer. Very useful for running test in your CI. |
| *--coverage*  &nbsp; | Will generate code coverage. It will run `nyc` tool with your mocha tests. It uses the HTML and summary reporters. |
