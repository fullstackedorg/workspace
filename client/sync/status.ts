export type SyncStatus = {
    lastSync?: number, // no last sync === initializing
    conflicts?: {
        [baseKey: string] : {
            [conflictingKey: string]: boolean // resolved
        }
    },
    syncing?: {
        [key: string]: "push" | "pull"
    },
    largeFiles?: {
        [key: string]: {
            progress: number,
            total: number
        }
    },
    errors?: string[]
}
