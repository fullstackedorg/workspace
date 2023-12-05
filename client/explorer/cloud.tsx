import React, {RefObject} from "react";
import Explorer, {ExplorerOptions} from "./explorer";
import {fsCloud} from "./clients/cloud";
import {Sync} from "../sync";
import { PrepareCloudStorage } from "../sync/prepare";

export default function (props: {explorerRef: RefObject<Explorer>, options: ExplorerOptions}){
    return Sync.isInit
        ? <Explorer ref={props.explorerRef} client={fsCloud} action={(item) => undefined} options={props.options}/>
        : <PrepareCloudStorage onSuccess={() => {
                Sync.isInit = true; 
                return <Explorer ref={props.explorerRef} client={fsCloud} action={(item) => undefined} options={props.options}/>
            }}/>
}


