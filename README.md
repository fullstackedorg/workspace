# FullStacked
A fullstack webapp bundler and development kit.

A complete setup for a Typescript full stack applications.
It includes all the Server(Backend) setup and the WebApp(Frontend) setup :
* Build
* Watch
* Test

### Built with
* react
* express
* esbuild

## Getting Started
Setup your npm project
```shell
mkdir MyAwesomeProject
cd MyAwesomeProject
npm init
```
Install FullStacked
```shell
npm i fullstacked
```
Start with the basic files
```ts
//server.ts
import Server from "fullstacked/Server";

new Server().start();
```
```tsx
//index.tsx
import * as React from 'react';
import webapp from "fullstacked/WebApp";

webapp(<div>Welcome to FullStacked!</div>);
```
Start developping!
```shell
fullstacked watch
```

## Commands

| command | uses |
| --- | --- |
| fullstacked build | Build your app to your `dist` folder |
| fullstacked watch | Rebuilds your app on changes.<br />On WebApp rebuild, the webpage reloads.<br />On Server rebuild, the server restarts.|

## Motivation
As any web developer, I have changed my toolset many times and typed way too many time this :
```js
ReactDOM.render(<App />, document.getElementById("root"));

// =================

const app = express();

express.listen(8000);
```
The idea is to create a package that includes all the basic tools and setup we always use as JS/TS web developers.

## Roadmap
1. Improvements
   1. WebApp watcher with a socket instead of a http request
2. Guides
3. Built-in tests command including code coverage
4. More debugging tools
5. Deployment command
   1. Docker templates
   2. Docker-Compose templates
   3. Maybe systemd or pm2 kind of deployments

Down the road<br />
4. Develop the same concept with alternative tools
   1. NestJS (Server)<sup>1</sup>
   2. Svelte (WebApp)
   3. VueJS (WebApp)
> <sup>1</sup>currently has problem with esbuild since decorators aren't parsed.
> A workaround exists with [@anatine/esbuild-decorators](https://github.com/anatine/esbuildnx/tree/main/packages/esbuild-decorators) 
> but it is making the code coverage irrelevant since 
> it uses `tsc` before going through esbuild which generates the source maps...
