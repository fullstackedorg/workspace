export type SyncStatus = null |
    {
        status: "synced",
        lastSync: number
    } |
    {
        status: "initializing"
    } |
    {
        status: "syncing",
        keys: string[]
    } |
    {
        status: "conflicts",
    } |
    {
        status: "large-file",
        message: string
    } |
    {
        status: "error",
        message: string
    }
