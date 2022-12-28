# Ignored Modules

Some npm packages have modules that are imported, but unused. Esbuild will throw build errors to any imported module that isn't installed, even if the module is unused. Instead of installing useless packages, create a `./ignore.json` file and define the ignored modules.

```json
{
    "ignore": [
        "useless-module",
        "another-module-you-dont-use"
    ]
}
```

FullStacked will use this list and add them to esbuild `external` build option. More about it [here](https://esbuild.github.io/api/#external).
