# Building

### Command
```shell
npx fullstacked build
```
This produce a production build in a dist directory at your project's root.

### Run your Built App
You can easily startup your app with a simple :
```shell
node dist/index
```
Just like any other node script!

### Flags
| Flag | Description |
| --- | --- |
| *--src=*  &nbsp;| Change the entry directory of your app. In other words, where both your `index.tsx` and `server.ts` are. Default is `process.cwd()`. |
| *--out=* &nbsp;| Change the location of the output dist directory. Default is `process.cwd()`. |
