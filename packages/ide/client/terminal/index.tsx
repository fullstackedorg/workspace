import React, {useEffect, useRef, useState} from "react";
import Convert from "ansi-to-html";

const convert = new Convert();

let commandsWS;
export default function () {
    const [logs, setLogs] = useState<string[]>([]);
    const [running, setRunning] = useState(false);
    const inputRef = useRef<HTMLInputElement>();
    const logsRef = useRef<HTMLPreElement>();

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
            if(e.data.at(-1) === "\n")
                setLogs(logs => [...logs, e.data])
            else
                setLogs(logs => {
                    logs[logs.length - 1] = e.data;
                    return [...logs];
                });
        };
    }, []);

    useEffect(() => {
        if(!running) inputRef.current.focus()
    }, [running])

    useEffect(() => logsRef.current.scrollIntoView(false), [logs]);

    return <div className={"terminal"}>
        <pre ref={logsRef}>{logs.map(log => <div dangerouslySetInnerHTML={{__html: convert.toHtml(log)}} />)}</pre>
        <form onSubmit={e => {
            e.preventDefault();
            setRunning(true);
            const value = inputRef.current.value;
            setLogs(logs => [...logs, "# " + value, ""]);
            e.currentTarget.reset();
            commandsWS.send(value);
        }}>
            {!running && <>
                <div>#</div>
                <input ref={inputRef} type={"text"} autoCapitalize={"off"}/>
            </>}
        </form>
    </div>
}
