# Build

Bundle all of your web app. Both the backend and the frontend will be bundled into a single file each. Code-splitting will be applied if you use any `await import("./xyz")`. The build process also produces the `docker-compose.yml` that will run your entire web app stack.

```shell
npx fullstacked build
```

## Flags

### `--src=`

(optional)

Define your web app source root *(default: .)*

### `--out=`

(optional)

Define your bundled web app output directory *(default: ./dist)*

### `--production`

(optional)

Build your web app in production mode. WebApp and Server will be minified and without sourcemaps. The startup command won't have the `--development` flag.
