# Building

### Command
```shell
npx fullstacked build
```
This produce a build in a `dist` directory at your project's root.

### Flags
| Flag                   | Description                                                                                                                           |
|------------------------|---------------------------------------------------------------------------------------------------------------------------------------|
| *--src=*  &nbsp;       | Change the entry directory of your app. In other words, where both your `webapp.tsx` and `server.ts` are. Default is `process.cwd()`. |
| *--out=* &nbsp;        | Change the location of the output dist directory. Default is `process.cwd()`.                                                         |
| *--production* &nbsp;  | Build your app `production` mode.                                                                                                     |
