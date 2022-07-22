declare type ConfigCreate = {
    skipTest? : boolean, // create without test setup
    pwa? : boolean // add the pwa minimum requirements
}

declare type ConfigBuild = {
    title?: string,
    src? : string, // in folder

    dist?: string   // root out folder
    out?: string    // version out folder
    public?: string // public out folder

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

declare type Config = ConfigCreate & ConfigBuild & ConfigTest & ConfigDeploy & {
    name? : string,
    version? : string,

    silent? : boolean, // silence logging
    allYes? : boolean
}
