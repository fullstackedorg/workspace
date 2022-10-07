# Watching

### Command
```shell
npx fullstacked watch
```
This will run your app and hot reload the server and the web app 
on respective file changes. Your app will be accessible with
a web browser at an address like `http://localhost:8000`.

### Flags
| Flag                                        | Description                                                                                          |
|---------------------------------------------|------------------------------------------------------------------------------------------------------|
| *--timeout=*  &nbsp;                        | Let the `watcher` await your app for `X` amount of milliseconds.<br/> *Default: 3000*                |
| *--watch-file=* <br/> *--watch-dir=* &nbsp; | Watch extra files and directories. Will hot reload your web app when any of these files is modified. |