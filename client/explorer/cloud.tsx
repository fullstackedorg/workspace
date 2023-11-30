import React, {useEffect, useState} from "react";
import Explorer, {ExplorerOptions} from "./explorer";
import {fsCloud} from "./clients/cloud";
import {Sync} from "../sync";
import { PrepareCloudStorage } from "../sync/prepare";

export default function (props: {options: ExplorerOptions}){
    return Sync.isInit
        ? <Explorer client={fsCloud} action={(item) => undefined} options={props.options}/>
        : <PrepareCloudStorage onSuccess={() => {
                Sync.isInit = true; 
                return <Explorer client={fsCloud} action={(item) => undefined} options={props.options}/>
            }}/>
}


