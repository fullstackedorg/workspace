import React, {useEffect, useRef, useState} from "react";

let commandsWS;
export default function () {
    const [logs, setLogs] = useState<string[]>([]);
    const [running, setRunning] = useState(false);
    const inputRef = useRef<HTMLInputElement>();

    useEffect(() => {
        window.addEventListener('keydown', e => {
            if(e.key !== "c" || !e.ctrlKey) return;
            commandsWS.send("##KILL##");
        })
        window.addEventListener("click", () => inputRef?.current?.focus());
        commandsWS = new WebSocket("ws" +
            (window.location.protocol === "https:" ? "s" : "") +
            "://" + window.location.host + "/fullstacked-commands");
        commandsWS.onmessage = e => {
            if(e.data === "##END##") return setRunning(false);
            setLogs(logs => [...logs, e.data])
        };
    }, []);

    useEffect(() => {
        if(!running) inputRef.current.focus()
    }, [running])

    return <div className={"terminal"}>
        <pre>{logs.map(log => <div>{log}</div>)}</pre>
        <form onSubmit={e => {
            e.preventDefault();
            setRunning(true);
            const value = inputRef.current.value;
            setLogs(logs => [...logs, "# " + value]);
            e.currentTarget.reset();
            commandsWS.send(value);
        }}>
            {!running && <>
                <div>#</div>
                <input ref={inputRef} type={"text"} />
            </>}
        </form>
    </div>
}
