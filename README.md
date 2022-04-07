# FullStacked
A full stack web app build tool and development kit.

<img src="https://raw.githubusercontent.com/CPLepage/fullstacked/main/website/favicon.png" alt="FullStacked Logo" width="75px" />

[![version](https://fullstacked.org/version/badge.svg)](https://www.npmjs.com/package/fullstacked)
[![dependencies](https://fullstacked.org/dependencies/badge.svg)](https://www.npmjs.com/package/fullstacked?activeTab=dependencies)
[![module dependencies](https://fullstacked.org/dependencies/all/badge.svg)](https://npmgraph.js.org/?q=fullstacked)
[![code coverage](https://fullstacked.org/coverage/badge.svg)](https://fullstacked.org/coverage/)


A complete setup for a Typescript full stack application.
It has all the Server(Backend) setup and the WebApp(Frontend) setup including features like :
* Create
* Build
  * w/ Code Splitting
* Watch
  * w/ WebApp auto reload & Server auto restart
* Test<sup>1</sup>
  * w/ Code Coverage
* Deploy<sup>1</sup>

> <sup>1</sup>Work in progress

### Built with
* react
* express
* esbuild

## Getting Started
This should not take you more than a minute! Give it a try!

1. Create a folder were you will develop your awesome web app
```shell
mkdir my-awesome-project
cd my-awesome-project
```
2. Init npm
```shell
npm init -y
```
3. Install FullStacked
```shell
npm i fullstacked
```
4. Create the default starter files
```shell
npx fullstacked create
```
5. Make your first build! (or use the `watch` command and skip the next step)
```shell
npx fullstacked build
```
6. Start your app like any other node project
```shell
node dist/index
```

## Commands

| command | uses |
| --- | --- |
| npx fullstacked create | Generate the basic `index.tsx` and `server.ts` files |
| npx fullstacked build | Build your app to your `dist` folder |
| npx fullstacked watch | Rebuilds your app on changes.<br />On WebApp rebuild, the webpage reloads.<br />On Server rebuild, the server restarts.|

## Motivation
As any web developer, I have changed my toolset many times and typed way too many times this :
```js
ReactDOM.render(<App />, document.getElementById("root"));

// =================

const app = express();

app.use(express.static('public'));

app.listen(8000);
```
The idea is to create a package that includes all the basic tools and setup we always use as JS/TS web developers.

## Roadmap
1. Website + Guide/Documentation 📚
2. Improvements ⚙️
   1. WebApp watcher with a socket instead of a http request
   2. React-router automatically registering route in express
   3. Registering multiple apps to different subdomains or paths
3. Built-in tests command including code coverage 🛠
4. More debugging tools 💻 
   1. [morgan](https://github.com/expressjs/morgan) ✅
5. Deployment command 🚀
   1. Docker templates
   2. Docker-Compose templates
   3. Maybe systemd or pm2 kind of deployments

Down the road<br />
6. Alternative tools
   1. NestJS (Server)<sup>2</sup>
   2. Svelte (WebApp)
   3. VueJS (WebApp)
> <sup>2</sup>currently has problem with esbuild since decorators aren't parsed.
> A workaround exists with [@anatine/esbuild-decorators](https://github.com/anatine/esbuildnx/tree/main/packages/esbuild-decorators) 
> but it is making the code coverage irrelevant since 
> it uses `tsc` before going through esbuild which generates the source maps...
