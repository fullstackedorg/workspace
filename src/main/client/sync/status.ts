import type { ProgressInfo } from "@fullstacked/sync/constants"

export type SyncStatus = {
    lastSync: number,
    conflicts: {
        [baseKey: string] : {
            [conflictingKey: string]: boolean // resolved
        }
    },
    syncing: {
        [key: string]: {
            direction: "push" | "pull",
            origin: string,
            progress?: ProgressInfo,
            hide?: boolean
        }
    },
    errors: string[]
}
