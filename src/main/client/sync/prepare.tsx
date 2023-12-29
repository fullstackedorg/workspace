import React, { useEffect, useRef, useState } from "react";
import { client } from "../client";
import { RenderSyncIndicator, centeredPopupFeatures } from "./Indicator";
import type { RemoteStorageResponseType } from "../../server/sync/sync";

export function PrepareCloudStorage(props: {
    endpoint?: string,
    initialHelloResponse?: RemoteStorageResponseType
}) {
    const [helloResponse, setHelloResponse] = useState<RemoteStorageResponseType>(props.initialHelloResponse);

    useEffect(() => {
        if (!props.initialHelloResponse)
            retry();
    }, []);

    useEffect(() => {
        setHelloResponse(props.initialHelloResponse)
    }, [props.endpoint])

    const retry = async () => {
        if (props.endpoint)
            setHelloResponse(await client.post().storageHello(props.endpoint));
        else
            setHelloResponse(await client.post().initSync());
    }

    if (!helloResponse)
        return <></>;

    if (typeof helloResponse === "object") {
        switch (helloResponse.error) {
            case "authorization":
                switch (helloResponse.type) {
                    case "password":
                        return <div>Password Auth</div>;
                    case "external":
                        return <AuthFlow endpoint={props.endpoint} url={helloResponse.url} didAuthenticate={retry} />;
                }
            default:
                return <div style={{ color: "white" }}>Uh oh. Unknown response: [{JSON.stringify(helloResponse)}]</div>

        }
    }

    return typeof helloResponse === "boolean" && helloResponse
        ? <div>Success</div>
        : <div style={{ color: "white" }}>Uh oh. Unknown response: [{helloResponse}]</div>
}

let body = {}, win;
export function AuthFlow({ endpoint, url, didAuthenticate }) {
    const [code, setCode] = useState("");
    const [failedOpened, setFailedOpen] = useState(false);

    const openPopup = () => {
        win = window.open(url, "", centeredPopupFeatures())
    };

    useEffect(() => {
        const catchArgs = ({ data }) => {
            body = {
                ...body,
                ...data
            }
        };

        window.addEventListener("message", catchArgs);

        openPopup();

        if (!win) setFailedOpen(true);

        return () => {
            win = null;
            window.removeEventListener("message", catchArgs)
        }
    }, []);

    const submit = async (e) => {
        e.preventDefault();
        await client.post().authenticate(endpoint,
        {
            ...body,
            code: code.trim()
        });
        win?.close();
        didAuthenticate();
    }

    return <div className={"prepare-fs-remote"}>
        {failedOpened
            ? <button onClick={() => {
                openPopup();
                if (win)
                    setFailedOpen(false)
            }}>Authenticate</button>
            : <>
                <div>Enter the code or the token to authenticate this device</div>
                <form onSubmit={submit}>
                    <input type={"tel"} value={code} onChange={e => setCode(e.currentTarget.value)} />
                    <button>Submit</button>
                </form>
            </>}
    </div>
}

function Directory({ message, didSelectDirectory }) {
    const inputRef = useRef<HTMLInputElement>();
    const [value, setValue] = useState(null);

    useEffect(() => {
        client.get().mainDirectory().then(({ dir, sep }) => {
            setValue(dir + sep + "FullStacked");
            inputRef.current.focus()
        });
    }, [])

    const submit = async e => {
        e.preventDefault();
        await client.post().setDirectory(value);
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