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

declare type ConfigRun = {
    restored?: boolean
    docker?: any
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
    testSuite? : string,

    c8OutDir? : string
}

declare type ConfigCerts = {
    domain? : string |string[],
    email?: string
}

declare type ConfigDeploy = {
    // ssh credentials
    host?           : string,
    sshPort?        : number,
    username?           : string,
    password?           : string,
    privateKey?     : string,
    privateKeyFile? : string,

    appDir?     : string, // directory in server

    noHttps?    : boolean // skip cert setup

    pull?       : boolean // force pull new docker images
}

declare type ConfigBackup = {
    volume? : string | string[],
    backupDir? : string
}

declare type Config = ConfigBuild & ConfigRun & ConfigWatch & ConfigTest & ConfigDeploy & ConfigCerts & ConfigBackup & {
    silent? : boolean, // silence logging
    allYes? : boolean,
    gui?    : boolean,
}
