export type SyncStatus = null |
    {
        status: "synced",
        lastSync: number
    } |
    {
        status: "initializing"
    } |
    {
        status: "syncing"
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
