# Watch

This command acts just like the `run` command, but will restart your server on Server file changes and will reload your web browser page on WebApp file changes. 

```shell
npx fullstacked watch
```

## Flags

Same as the [run](./Run.md) command.

### `--watch-file=`

(optional)

If you want to watch extra files that are not imported in your app, like a `.scss` file if you use Sass or a `.php` file if you edit a wordpress theme. Use this flag.

### `--watch-dir=`

(optional)

Same as `--watch-file`, but for a directory.
