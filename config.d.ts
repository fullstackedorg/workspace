declare type Config = {
    // in/out folders
    src?        : string,
    out?        : string,

    // listen
    port?       : string,

    // ssh credentials
    host?       : string,
    user?       : string,
    pass?       : string,
    // directory in server
    appDir?     : string,

    // webapp public path
    publicPath? : string,

    // project root
    root?       : string,

    // on rebuild method
    watcher? (): void,

    // silence logs
    silent?     : boolean,

    // tests options
    coverage? : boolean
    headless? : boolean
}
