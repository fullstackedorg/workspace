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
        keys: [string, "push" | "pull"][]
    } |
    {
        status: "conflicts",
        keys: string[]
    } |
    {
        status: "large-file",
        message: string
    } |
    {
        status: "error",
        message: string
    }
