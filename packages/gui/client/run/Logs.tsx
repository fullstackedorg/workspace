import React, {useEffect, useRef} from "react";
import {WS} from "../WebSocket";

export default function (){
    const logsRef = useRef<HTMLPreElement>();

    useEffect(() => {
        WS.logs = logsRef.current;
    });

    return <pre ref={logsRef}
                style={{
                    maxHeight: "calc(100vh - 200px)",
                    height: "100vh"
                }} />
}
