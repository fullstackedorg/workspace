# Create

Create a new FullStacked project instantly.

```shell
npm init fullstacked@latest
```

This command translates to :

```shell
npm exec create-fullstacked@latest
```

Meaning all the codebase for this command is in `create-fullstacked` [repositery](https://github.com/cplepage/create-fullstacked). 

> More about the npm init command : [npm docs](https://docs.npmjs.com/cli/v9/commands/npm-init#description)

## Templates

You can directly install libraries, frameworks and external tools with tempates. Simply pass them as arguments in your init command like that :

```shell
npm init fullstacked@latest -- react express mongodb
```

The list of available templates is [here](https://github.com/cplepage/create-fullstacked/tree/main/templates).
