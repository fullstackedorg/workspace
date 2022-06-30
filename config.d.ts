declare type ConfigCreate = {
    skipTest? : boolean, // create without test setup
    pwa? : boolean // add the pwa minimum requirements
}

declare type ConfigBuild = {
    title?: string,
    src? : string, // in folder
    out?: string // version out folder
    dist?: string // root out folder
}

declare type ConfigWatch = {
    // listen port
    port?       : string
}

declare type ConfigTest = {
    coverage? : boolean,
    headless? : boolean
}

declare type ConfigDeploy = {
    // ssh credentials
    host?       : string,
    sshPort?    : number,
    user?       : string,
    pass?       : string,
    privateKey? : string,

    serverName? : string,

    appDir?     : string, // directory in server

    skipTest?   : boolean, // skip testing

    noNginx?    : boolean // skip nginx setup

    pull?       : boolean // force pull new docker images
}

declare type Config = ConfigCreate & ConfigBuild & ConfigWatch & ConfigTest & ConfigDeploy & {
    name? : string,
    version? : string,

    silent? : boolean, // silence logging
    allYes? : boolean
}
