<p align="center">
<a href="https://fullstacked.org/">
<img src="https://fullstacked.org/favicon.png" alt="FullStacked Logo" width="50px" />
</a>
</p>
<h1 align="center">FullStacked</h1>
<h3 align="center">A TypeScript Web Apps Tool</h3>
<p align="center" ><small>The only tool you need from creation to deployment</small></p>
<p align="center">
<a href="https://www.npmjs.com/package/fullstacked"><img src="https://img.shields.io/badge/version-0.8.0-01b0de" alt="version"/>
<a href="https://www.npmjs.com/package/fullstacked?activeTab=dependencies"><img src="https://img.shields.io/badge/dependencies-13-yellowgreen" alt="dependencies"/></a>
<a href="https://npmgraph.js.org/?q=fullstacked"><img src="https://img.shields.io/badge/module%20deps-302-yellow" alt="module dependencies"/></a>
<a href="https://cplepage.github.io/fullstacked-code-coverage/"><img src="https://img.shields.io/badge/coverage-80.27%25-yellowgreen" alt="code coverage"/></a>
</p>

> **Warning** <br />
> FullStacked is still in early development. Commands and syntax are likely to change.

FullStacked provides a complete setup for a TypeScript full stack web application.
It has all the Server(Backend) setup and the WebApp(Frontend) setup with features like :
* ~~Create~~ Now in [`create-fullstacked`](https://github.com/cplepage/create-fullstacked) project
* Run
* Build
  * w/ Code Splitting
* Watch
  * w/ WebApp hot reload & Server auto restart
* Test
  * w/ Code Coverage
* Deploy
* Backup/Restore

## Requirements
### Remote Development

If you are looking to simply develop a web app, I strongly suggest you to try [FullStacked IDE](https://ide.fullstacked.org).
It is a web based IDE that wraps FullStacked usage with clean and efficient interfaces.

### Local Development

* NodeJS `>= 16.x`
* Docker and Docker-Compose

#### Install Guide
1. Install NodeJS : [https://nodejs.org/](https://nodejs.org/)
2. Install Docker Desktop : [https://www.docker.com/products/docker-desktop/](https://www.docker.com/products/docker-desktop/)
 

## Getting Started

1. Create a folder where you will develop your awesome web app
```shell
mkdir my-awesome-project
cd my-awesome-project
```
2. Init fullstacked with npm
```shell
npm init fullstacked
```
3. Startup you project locally!
```shell
npm start
```
Open [http://localhost:8000](http://localhost:8000/) and start developing!

## Commands

| command                 | uses                                                                             |
|-------------------------|----------------------------------------------------------------------------------|
| npm init fullstacked    | Generate the default starter files                                         |
| npx fullstacked run     | Run your web app.                                                                |
| npx fullstacked build   | Build your app.                                                                  |
| npx fullstacked watch   | Rebuilds your app and hot reloads on changes.                                    |
| npx fullstacked test    | Run tests throughout your app.                                                   |
| npx fullstacked deploy  | Ship a production build to a remote host to deploy your web app to the internet. |
| npx fullstacked backup  | Backup your data volumes from your app.                                          |
| npx fullstacked restore | Restore your data volumes from your app.                                         |

see flags in the [docs](https://fullstacked.org/docs/commands)

## Motivation
As many web developer, I have changed my toolset very often. We waste
so much time on configs and figuring out how to build and deploy web apps. FullStacked aims to skip
all the configuration phases to instead allow you to start developing as quickly as possible!

I also really like the iterative approach, so I look forward to implementing ways to help with 
sharing development environments for the purpose of testing and reviewing.

## Roadmap & Thoughts

* Manage to create a simple and efficient way to test frontend component/class individually
* ~~Switch to~~ Support [Deno](https://github.com/denoland/deno) and/or [bun](https://github.com/Jarred-Sumner/bun)  
<br /> 
 
> These are being implemented in [FullStacked IDE](https://ide.fullstacked.org)
 
 
* Add integration with [PWABuilder](https://github.com/pwa-builder/PWABuilder) to generate iOS and Android App
* <s>Switch nginx image for [nginx proxy manager](https://github.com/NginxProxyManager/nginx-proxy-manager) </s> 
Will create our own interface with [Tabler](https://github.com/tabler/tabler)
* TypeScript Web Based IDE using [monaco editor](https://github.com/microsoft/monaco-editor)
  * Designed only for TypeScript projects, so it helps with all the main features
    * Typing
    * Autocomplete
    * Imports resolving
  * It must be enabled with PWA features, so that it feels like a native app
  * My goal would be to develop from anywhere (tablet or desktop) with all the same feature popular IDE provide.
