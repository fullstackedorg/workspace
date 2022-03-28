# FullStacked
A fullstack webapp bundler and development kit.

A complete setup for a Typescript full stack application.
It has all the Server(Backend) setup and the WebApp(Frontend) setup including features like :
* Build
  * w/ Code Splitting
* Watch
  * w/ WebApp auto reload & Server auto restart
* Tests<sup>1</sup>
  * w/ Code Coverage

> <sup>1</sup>Work in progress

### Built with
* react
* express
* esbuild

## Getting Started
This should not take you more than a minute! Give it a try!

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
Create the default starter files
```shell
fullstacked create
```
Make your first build! (or use the `watch` command)
```shell
fullstacked build
```
Start your app like any other node project
```shell
node dist/index
```

## Commands

| command | uses |
| --- | --- |
| fullstacked create | Create the basic `index.tsx` and `server.ts` files |
| fullstacked build | Build your app to your `dist` folder |
| fullstacked watch | Rebuilds your app on changes.<br />On WebApp rebuild, the webpage reloads.<br />On Server rebuild, the server restarts.|

## Motivation
As any web developer, I have changed my toolset many times and typed way too many time this :
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
4. More debugging tools 💻 like [morgan](https://github.com/expressjs/morgan)
5. Deployment command 🚀
   1. Docker templates
   2. Docker-Compose templates
   3. Maybe systemd or pm2 kind of deployments

Down the road<br />
6. Develop the same concept with alternative tools
   1. NestJS (Server)<sup>2</sup>
   2. Svelte (WebApp)
   3. VueJS (WebApp)
> <sup>2</sup>currently has problem with esbuild since decorators aren't parsed.
> A workaround exists with [@anatine/esbuild-decorators](https://github.com/anatine/esbuildnx/tree/main/packages/esbuild-decorators) 
> but it is making the code coverage irrelevant since 
> it uses `tsc` before going through esbuild which generates the source maps...
