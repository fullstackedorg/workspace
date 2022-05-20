declare type ConfigCreate = {
    skipTest? : boolean // create without test setup
}

declare type ConfigBuild = {
    src? : string, // in folders
    out?: string // out folders
}

declare type ConfigWatch = {
    // listen port
    port?       : string,
    portHTTPS?  : string,
}

declare type ConfigTest = {
    coverage? : boolean
    headless? : boolean
}

declare type ConfigDeploy = {
    // ssh credentials
    host?       : string,
    sshPort?    : number,
    user?       : string,
    pass?       : string,
    privateKey? : string,

    appDir?     : string, // directory in server

    skipTest?   : boolean // skip testing
}

declare type Config = ConfigCreate & ConfigBuild & ConfigWatch & ConfigTest & ConfigDeploy & {
    silent? : boolean, // silence logging
    allYes? : boolean
}
