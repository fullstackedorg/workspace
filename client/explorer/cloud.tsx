import React, {useEffect, useState} from "react";
import Explorer, {ExplorerOptions} from "./explorer";
import {fsCloud} from "./clients/cloud";
import {Sync} from "../sync";

export default function (props: {options: ExplorerOptions}){
    const [isInit, setIsInit] = useState(Sync.isInit)

    useEffect(() => {
        if(!isInit)
            Sync.init(() => setIsInit(Sync.isInit), true);
    }, []);

    return isInit
        ? <Explorer client={fsCloud} action={(item) => undefined} options={props.options}/>
        : <></>
}


