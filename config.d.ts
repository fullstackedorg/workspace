declare type ConfigBuild = {
    name? : string, // app name
    version? : string,  // version number
    hash? : string, // hash (git commit short hash)

    title?: string,
    src? : string, // in folder

    production?: boolean

    dist?: string   // root out folder
    out?: string    // version out folder
    public?: string // public out folder
}

declare type ConfigWatch = {
    timeout? : number,
    watchFile?: string | string[],
    watchDir?: string | string[]
}

declare type ConfigTest = {
    coverage? : boolean,
    headless? : boolean,

    testMode? : boolean,
    testFile? : string,
    testSuite? : string
}

declare type ConfigDeploy = {
    // ssh credentials
    host?       : string,
    sshPort?    : number,
    user?       : string,
    pass?       : string,
    privateKey? : string,

    appDir?     : string, // directory in server

    skipTest?   : boolean, // skip testing

    noNginx?    : boolean // skip nginx setup

    pull?       : boolean // force pull new docker images
}

declare type ConfigBackup = {
    volume? : string | string[],
    backupDir? : string
}

declare type Config = ConfigBuild & ConfigWatch & ConfigTest & ConfigDeploy & ConfigBackup & {
    silent? : boolean, // silence logging
    allYes? : boolean
}
