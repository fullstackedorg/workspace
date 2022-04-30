declare type ConfigCreate = {
    noTest? : boolean // create without test setup
}

declare type ConfigBuild = {
    src? : string, // in folders
    out?: string // out folders
    root? : string // project root
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
    user?       : string,
    pass?       : string,
    privateKey? : string,

    appDir?     : string // directory in server
}

declare type Config = ConfigCreate & ConfigBuild & ConfigWatch & ConfigTest & ConfigDeploy & {
    silent? : boolean // silence logging
}
