**⚠️ FullStacked is still in early development. Commands and syntax are likely to change.**

# FullStacked
A full stack web app build tool and development kit.

[<img src="https://raw.githubusercontent.com/CPLepage/fullstacked/main/website/favicon.png" alt="FullStacked Logo" width="75px" />](https://fullstacked.org/)


[![version](https://fullstacked.org/badges/version.svg)](https://www.npmjs.com/package/fullstacked)
[![dependencies](https://fullstacked.org/badges/dependencies.svg)](https://www.npmjs.com/package/fullstacked?activeTab=dependencies)
[![module dependencies](https://fullstacked.org/badges/dependencies/all.svg)](https://npmgraph.js.org/?q=fullstacked)
[![code coverage](https://fullstacked.org/badges/coverage.svg)](https://fullstacked.org/coverage/)


A complete setup for a Typescript full stack application.
It has all the Server(Backend) setup and the WebApp(Frontend) setup including features like :
* Create
* Build
  * w/ Code Splitting
* Watch
  * w/ WebApp auto reload & Server auto restart
* Test
  * w/ Code Coverage
* Deploy

### Built with
* [react](https://github.com/facebook/react)
* [express](https://github.com/expressjs/express)
* [mocha](https://github.com/mochajs/mocha)
* [esbuild](https://github.com/evanw/esbuild)

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
| npx fullstacked create | Generate the default files `index.tsx` and `server.ts` files. |
| npx fullstacked watch | Rebuilds your app and hot reloads on changes. |
| npx fullstacked build | Build your app in production mode to your `dist` folder. |
| npx fullstacked test | Run tests throughout your app. |
| npx fullstacked deploy | Send a production build to a remote host to deploy your web app to the internet.|

see flags and requirements in the docs

## Motivation
As any web developer, I have changed my toolset many times. I wasted
too much time on configs and figuring out how to deploy my apps. FullStacked aims to skip
all the configuration phase to start developing as quickly as possible!

I also really like the iterative approach, so I look forward to implementing ways to help with 
sharing development environments for the purpose of testing and reviewing.

## Roadmap & Thoughts

* Create tests for `deploy` and `test` commands
* Add testing in deployment script
  * Stop deployment if tests fails
* Save command line args to skip the typing afterwards
* Allow *pre* and *post* scripts on different events
* Manage to create a simple and efficient way to test frontend component/class individually
* Switch to [Deno](https://github.com/denoland/deno)
  * ✅ No transpiling needed (no even from TS!)
  * ✅ No *node_modules* installation needed
  * ⛔️ Making e2e tests (no puppeteer modules yet)
  * ⛔️ Filesystem very less permissive
* Auto Import like [nuxt.js](https://v3.nuxtjs.org/guide/concepts/auto-imports/)
  * ✅ The dream
  * ⛔ Resources for indexing and resolving
  * ⛔ IDE needs extra plugins
* TypeScript Web Based IDE
  * Designed only for TypeScript projects, so it helps with all the features
    * Typing
    * Autocomplete
    * Imports resolving
  * It must be enabled with PWA features, so that it feels like a native app
  * My goal would be to develop from an iPad Pro with all the same feature Desktop IDE provides.
