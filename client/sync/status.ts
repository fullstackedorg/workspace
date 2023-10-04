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
        status: "error",
        message: string
    }
