import {Workspace} from "../workspace";
import Merge from "../editor/merge";
import conflictIcon from "../icons/conflict.svg"
import React from "react";
import type { SyncStatus } from "./status";

export function keyIsConflicted(key: string, conflicts: SyncStatus["conflicts"]): {baseKey: string, resolved: boolean} | null {
    const baseKeys = Object.keys(conflicts);
    for(const baseKey of baseKeys){
        const subKeys = Object.keys(conflicts[baseKey]);
        for(const subKey of subKeys){
            if(subKey === key){
                return {
                    baseKey,
                    resolved: !conflicts[baseKey][subKey]
                };
            }
        }
    }

    return null;
}

export const hasUnresolvedConflict = (conflicts: {
    [subKey: string] : boolean
}) => {
    const subKeys = Object.keys(conflicts);
    return conflicts 
        && subKeys.length
        && subKeys.find(subKey => !conflicts[subKey])
}

export const compareAndResolveKey = (baseKey: string, key: string) => {
    Workspace.instance.addWindow({
        title: "Resolve",
        icon: conflictIcon,
        element: (app) =>
            <Merge baseKey={baseKey} fileKey={key}
                   didResolve={() => {Workspace.instance.removeWindow(app)}} />
    });
}

export const resolveAllKey = (baseKey: string, conflicts: {
    [subKey: string] : boolean
}) => {
    Object.keys(conflicts).forEach(subKey => {
        if(!conflicts[subKey])
            compareAndResolveKey(baseKey, subKey);
    })
}