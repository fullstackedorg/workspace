# Ignored Modules

Some npm packages have depencies declared, but unused. Esbuild will throw build errors to any module imported that isn't installed. Even if you don't even use the module. Instead of installing useless packages, create a `./ignore.json` file and define the ignored modules.

```json
{
    "ignore": [
        "useless-module",
        "another-module-you-dont-use"
    ]
}
```

FullStacked will use this list and add them to esbuild `external` build option. More about it [here](https://esbuild.github.io/api/#external).
