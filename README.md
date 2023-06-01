<p align="center">
<a href="https://fullstacked.org/">
<img src="https://files.cplepage.com/fullstacked/favicon.png" alt="FullStacked Logo" width="50px" />
</a>
</p>
<h1 align="center">FullStacked</h1>
<h3 align="center">Web development at its finest</h3>
<p align="center">
<a href="https://www.npmjs.com/package/fullstacked"><img src="https://badgen.net/npm/v/fullstacked" alt="version"/>
</p>

> **Warning** <br />
> While FullStacked is probably the most efficient tool you'll ever use, bear in mind that it might not be production ready. 

FullStacked provides a whole set of commands and utilities useful for the whole web app lifecycle :
 
**Commands**
 * [create](https://www.npmjs.com/package/@fullstacked/create)
 * [build](https://www.npmjs.com/package/@fullstacked/build)
 * [run](https://www.npmjs.com/package/@fullstacked/run)
 * [watch](https://www.npmjs.com/package/@fullstacked/watch)
 * [deploy](https://www.npmjs.com/package/@fullstacked/deploy)
 * [backup (& restore)](https://www.npmjs.com/package/@fullstacked/backup)

**Utilities**
 * [gui](https://www.npmjs.com/package/@fullstacked/gui)
 * [ide](https://www.npmjs.com/package/@fullstacked/ide)
 * [webapp](https://www.npmjs.com/package/@fullstacked/webapp)
 
## Usage
#### Requirements
* NodeJS `>= 18.x` [https://nodejs.org/](https://nodejs.org/)
* Docker and Docker-Compose [https://www.docker.com/products/docker-desktop/](https://www.docker.com/products/docker-desktop/)
 
#### Getting Started

1. Create a folder where you will develop your awesome web app
```shell
mkdir my-awesome-project
cd my-awesome-project
```
2. Init fullstacked with npm
```shell
npm init @fullstacked@latest
```
3. Startup you project locally!
```shell
npm start
```
Open [http://localhost:8000](http://localhost:8000/) and start developing!

#### Commands

| command                     | uses                                                                                                                         |
|-----------------------------|------------------------------------------------------------------------------------------------------------------------------|
| npm init fullstacked@latest | Generate the default starter files. *View more in [create-fullstacked](https://github.com/cplepage/create-fullstacked) repo. |
| npx fullstacked run         | Run your web app.                                                                                                            |
| npx fullstacked build       | Build your web app.                                                                                                          |
| npx fullstacked watch       | Rebuilds your web app and hot reloads on changes.                                                                            |
| npx fullstacked test        | Run tests throughout your web app.                                                                                           |
| npx fullstacked deploy      | Ship a production build to a remote host to deploy your web app to the internet.                                             |
| npx fullstacked backup      | Backup your data volumes from your web app.                                                                                  |
| npx fullstacked restore     | Restore your data volumes from your web app.                                                                                 |

see flags in the [docs](https://docs.fullstacked.org/commands)

### <a name="gui"></a>GUI

> **Note** <br />
> The GUI is fairly new and is only working with the `deploy` command.

* Run a command using the `--gui` arg to pop up the FullStacked GUI.
* It helps a lot with setting up a couple of stuff and seeing the progress. 
* Finally, save and load your configs to a password encrypted file. 
This way, even if you commit the `.fullstacked` file in your repo (**<u>strongly not recommend in public repositories</u>**),
it is not revealing anything.
Only password holders, like you and your CI, can decrypt the info and run the command.

<img src=https://files.cplepage.com/fullstacked/fullstacked-gui.jpg />

### Use FullStacked Remotely

> 🚧 WIP

If you are looking to simply and quickly develop a web app, I strongly suggest to try [FullStacked IDE](https://ide.fullstacked.org).
It is a web based IDE that wraps FullStacked usage with clean and efficient interfaces.

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
 
> These are being implemented in [FullStacked IDE](https://ide.fullstacked.org) or the GUI

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
