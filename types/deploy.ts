export enum DEPLOY_CMD {
    CHECK_SAVED_CONFIG,
    LOAD_CONFIG,
    TEST_REMOTE_SERVER,
    TEST_DOCKER,
    DOCKER_INSTALL,
    DOCKER_COMPOSE,
    DEPLOY,
    CERT,
    NEW_CERT,
    SAVE
}

export type sshCredentials = {
    host: string,
    port?: number,
    username: string,
    password?: string,
    privateKey?: string | Buffer,
    privateKeyFile?: string,
    appDir: string
}

export type nginxConfig = {
    name: string,
    port: number,
    serverNames?: string[],
    nginxExtraConfigs?: string[],
    customPublicPort?: {
        port: number,
        ssl: boolean
    }
}

export type nginxFile = {
    fileName: string,
    content: Buffer
}

export type certificate = {
    fullchain: string,
    privkey: string
}
