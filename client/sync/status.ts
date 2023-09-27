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
        status: "error",
        message: string
    }
