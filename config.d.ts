declare type Config = {
    // in/out folders
    src?        : string,
    out?        : string,

    // create without test file
    noTest? : boolean,

    // listen
    port?       : string,
    portHTTPS?  : string,

    // ssh credentials
    host?       : string,
    user?       : string,
    pass?       : string,
    privateKey? : string,

    // directory in server
    appDir?     : string,

    // webapp public path
    publicPath? : string,

    // project root
    root?       : string,

    // on rebuild method
    watcher?: (() => void) | boolean,

    // silence logs
    silent?     : boolean,

    // tests options
    coverage? : boolean
    headless? : boolean
}
