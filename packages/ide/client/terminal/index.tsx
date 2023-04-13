import React, {useEffect, useRef, useState} from "react";

export default function () {
    const [logs, setLogs] = useState<string[]>([]);
    const inputRef = useRef<HTMLInputElement>();

    useEffect(() => {
        window.addEventListener("click", () => inputRef.current.focus());
        inputRef.current.focus()
    }, []);

    return <div className={"terminal"}>
        <div>{logs.map(log => <div>{log}</div>)}</div>
        <form onSubmit={e => {
            e.preventDefault();
            const value = "# " + inputRef.current.value;
            setLogs([...logs, value])
            e.currentTarget.reset();
        }}>
            <div>#</div>
            <input ref={inputRef} type={"text"} />
        </form>
    </div>
}
