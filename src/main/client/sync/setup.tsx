import useAPI from "@fullstacked/webapp/client/react/useAPI";
import React, { useEffect, useRef, useState } from "react";
import { client } from "../client";

export function Setup({didInit}){
    const [initResponse, retry] = useAPI(client.post().syncInit);

    useEffect(() => {
        if(initResponse?.error === "already_initialized")
            didInit();
    }, [initResponse]);

    if(!initResponse)
        return <></>

    switch (initResponse?.error) {
        case "corrupt_file":
            return <div>Corrupt File</div>
        case "no_config":
        case "directory":
            return <Directory message={(initResponse as any).reason} didSelectDirectory={retry} />
    }
}

function Directory({ message, didSelectDirectory }) {
    const inputRef = useRef<HTMLInputElement>();
    const [value, setValue] = useState(null);

    useEffect(() => {
        client.get().directory.main().then(({ dir, sep }) => {
            setValue(dir + sep + "FullStacked");
            inputRef.current.focus()
        });
    }, [])

    const submit = async e => {
        e.preventDefault();
        await client.post().directory.set(value);
        didSelectDirectory();
    }

    return <div className={"prepare-fs-remote"}>
        <div>Choose a directory where FullStacked will sync</div>
        {message && <div>{message}</div>}
        <form onSubmit={submit}>
            <input ref={inputRef} type={"text"} value={value} onChange={e => setValue(e.currentTarget.value)} />
            <button>Submit</button>
        </form>
    </div>
}