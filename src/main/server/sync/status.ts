import { WebSocket } from "ws";
import { SyncDirection } from "./types";
import { ProgressInfo } from "@fullstacked/sync/constants";
import { SyncStatus } from "../../client/sync/status";

export default class Status {
    static updateSyncingProgressInterval = 100;

    syncing: SyncStatus["syncing"] = {};
    conflicts: { [key: string]: { [fileKey: string]: boolean } } = {};
    errors: string[] = [];

    lastSync: number;

    private ws = new Set<WebSocket>();
    addWS(ws: WebSocket){
        this.ws.add(ws);
        ws.on("close", () => this.ws.delete(ws));

        this.sendStatus();
    }

    sendError(error: typeof this.errors[0]) {
        if(!this.errors.includes(error))
            this.errors.push(error);

        this.sendStatus();
    }
    dismissError(errorIndex: number){
        this.errors.splice(errorIndex, 1);
        this.sendStatus();
    }

    sendStatus(updateLastSync = false) {
        if (updateLastSync
            && Object.keys(this.syncing).length === 0
            && Object.keys(this.conflicts).length === 0) {
            this.lastSync = Date.now();
        }

        const strigified = JSON.stringify(this);
        this.ws.forEach(ws => ws.send(strigified));
    }

    addSyncingKey(itemKey: string, direction: SyncDirection, origin: string){
        this.syncing[itemKey] = {
            direction,
            origin
        };
        this.sendStatus();
    }

    removeSyncingKey(itemKey: string){
        delete this.syncing[itemKey];
        this.sendStatus(true);
    }

    lastUpdateSyncingProgress = Date.now();
    updateSyncProgress(itemKey: string, info: ProgressInfo) {
        if (!this.syncing[itemKey])
            return;

        this.syncing[itemKey].progress = info;

        const now = Date.now();
        if (now - this.lastUpdateSyncingProgress > Status.updateSyncingProgressInterval) {
            this.sendStatus();
            this.lastUpdateSyncingProgress = now;
        }
    }

    toJSON(){
        const { syncing, conflicts, errors, lastSync } = this;
        return {
            syncing, 
            conflicts, 
            errors,
            lastSync
        }
    }
}