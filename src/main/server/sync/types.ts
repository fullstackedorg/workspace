export type SyncInitResponse = 
    // if theres is no config file, don't force user into setting up Sync
    {
        error: "no_config"
    } |
    // user needs to define a local directory to sync files
    {
        error: "directory",
        reason: string
    } |
    // when failing to JSON.parse
    {
        error: "corrupt_file",
        message: string,
        filePath: string
    } |
    {
        error: "already_initialized"
    }

export type StorageSerialized = {
    isDefault?: boolean,
    name?: string,
    origin: string,
    keys?: string[],
    client?: {
        authorization?: string
    }
}

export enum StorageErrorType {
    AUTHORIZATION = "authorization",
    CLUSTER = "storages_cluster",
    UNREACHEABLE = "storage_endpoint_unreachable"
}

export type StorageResponse =
    // user needs to authenticate with password
    {
        error: StorageErrorType.AUTHORIZATION,
        name?: string,
        type: "password"
    } |
    // needs to launch the auth flow
    {
        error: StorageErrorType.AUTHORIZATION,
        name?: string,
        type: "external",
        url: string
    } |
    // clusters
    {
        error: StorageErrorType.CLUSTER,
        name?: string,
        endpoints: string[] | { name: string, url: string }[]
    } |
    {
        error: StorageErrorType.UNREACHEABLE,
        name?: string,
        message?: string
    }

export enum SyncDirection {
    PUSH = "push",
    PULL = "pull"
};

export enum DirectoryCheck {
    UNDEFINED = "Not defined",
    IS_FILE = "Is a file",
    NOT_UNDER_HOME = "Is not under home directory",
    NOT_EXISTS = "Does not exists",
}