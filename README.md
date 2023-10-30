# FullStacked

**A ubiquitous workspace for developers**

Spin up [FullStacked](https://fullstacked.org) by running `npm i -g fullstacked@latest`

[DEMO](https://fullstacked.org/demo)

[![npm version](https://img.shields.io/npm/v/fullstacked?logo=npm)](https://www.npmjs.com/package/fullstacked)
[![Follow FullStacked on X](https://img.shields.io/twitter/follow/get_fullstacked)](https://twitter.com/get_fullstacked)
[![Roadmap](https://img.shields.io/badge/Roadmap-ffffff?logo=notion&logoColor=black)](https://fullstacked.notion.site/fullstacked/FullStacked-Roadmap-ebfcb685b77446c7a7898c05b219215e)

FullStacked is a bundle of tools for developers to work on their projects from any device. It runs locally to utilize powerful machines and runs in the cloud to leverage accessibility and cloud computing.

![FullStacked](https://files.cplepage.com/fullstacked/fullstacked-sharing.jpg)

## Table of Contents

* Installation
* Usage
* Environment variables
* FullStacked Cloud

### Other Pages

* Contributing
* Code of Conduct
* License

## Installation

### NPM
> Recommended for Local use

#### Requirement

* [NodeJS](https://nodejs.org/en) `>=18` with npm

```shell
npm i -g fullstacked@latest
```

#### NPX

If you want to spin up FullStacked only once, use `npx` to install and run it on the fly

```shell
npx fullstacked@latest
```

### Docker

> Recommended for Cloud/Self-Hosted use

#### Requirement

* [Docker](https://docs.docker.com/get-docker)

```shell
docker run --rm -p 8000:8000 -v workspace-data:/home fullstackedorg/workspace
```

If you intend to use docker in your workspace, run it with the `--privileged` flag to enable it.
Be aware that this opens up your container to more vulnerabilities.

```shell
docker run --rm -p 8000:8000 -v workspace-data:/home fullstackedorg/workspace
```


#### Docker Compose

```yaml
services:
  fullstacked:
    image: fullstackedorg/workspace
    # privileged: true
    ports:
      - 8000
    volumes:
      - workspace-data:/home

volumes:
  workspace-data:
```

## Environment Variables

> Boolean type is nothing for `false` and `1` for `true`  
> ie: `FORCE_PORT_USAGE=1` <= `true`

| Variable | Description | Type | Default Value |
|---|---|---|---|
| `FULLSTACKED_PORT` | Define a port where FullStacked will listen to | `number` | 8000 |
| `AUTO_SHUTDOWN` | Inactivity duration before ending process, never shutdowns if undefined | `number` | - |
| `PASS` | Password to access the workspace | `string` | - |
| `AUTH_URL` | URL against which to authorize token generation | `string` | - |
| `REVOKE_URL` | URL to poke on logout | `string` | - |
| `LOGOUT_REDIRECT` | URL to redirect to after logout | `string` | - |
| `STORAGE_ENDPOINT` | Endpoint to use for the storage Sync | `string` | `https://fullstacked.cloud/storages` |
| `USE_CLOUD_CONFIG` | Use the cloud config for storage Sync | `boolean` | `false` |
| `CONFIG_FILE` | Path to file to save storage Sync configs | `string` | `$HOME/.fullstacked-config` |
| `FORCE_PORT_USAGE` | Force the usage of direct port instead of port subdomain reverse-proxy (only useful in some docker install edge cases) | `boolean` | `false` |

## FullStacked Cloud

FullStacked Cloud completely decouples computing and storage. Through a global network of servers, it provides syncing across all of your workspace instances and also provides access to ephemeral workspace instances. Meaning that every single device is a login or a `npm` command away from your entire workspace.
