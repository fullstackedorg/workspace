import React, { useEffect, useRef, useState } from "react";
import { client } from "../client";
import { RenderSyncIndicator, centeredPopupFeatures } from "./Indicator";
import type { StorageResponse } from "../../server/sync/types";

export function PrepareCloudStorage(props: {
    origin: string,
    isReady: () => void
}) {
    const [helloResponse, setHelloResponse] = useState<StorageResponse>(null);

    useEffect(() => {retry()}, [props.origin]);
    useEffect(() => {if(!helloResponse) props.isReady()}, [helloResponse]);

    const retry = async () => {
        setHelloResponse(await client.get().storages.hello(props.origin))
    }

    if(!helloResponse)
        return <></>

    if (typeof helloResponse === "object") {
        switch (helloResponse.error) {
            case "authorization":
                switch (helloResponse.type) {
                    case "password":
                        return <div>Password Auth</div>;
                    case "external":
                        return <AuthFlow origin={props.origin} url={helloResponse.url} didAuthenticate={retry} />;
                }
            case "storage_endpoint_unreachable":
                return <div className="basic-window">
                    Cannot reach storage
                    <code>{props.origin}</code>
                </div>
            default:
                return <div>
                        Uh oh. Unknown response: 
                        {typeof helloResponse === "object"
                            ? <pre>{JSON.stringify(helloResponse, null, 2)}</pre>
                            : <div>[{helloResponse}]</div>}
                    </div>

        }
    }

    return typeof helloResponse === "boolean" && helloResponse
        ? <div>Success</div>
        : <div style={{ color: "white" }}>Uh oh. Unknown response: [{helloResponse}]</div>
}

let body = {}, win;
export function AuthFlow({ origin, url, didAuthenticate }) {
    const [code, setCode] = useState("");
    const [opened, setOpened] = useState(false);

    const openPopup = () => {
        win = window.open(url, "", centeredPopupFeatures());
        setOpened(!!win);
    };

    useEffect(() => {
        const catchArgs = ({ data }) => {
            body = {
                ...body,
                ...data
            }
        };

        window.addEventListener("message", catchArgs);

        return () => {
            win = null;
            window.removeEventListener("message", catchArgs)
        }
    }, []);

    const submit = async (e) => {
        e.preventDefault();
        await client.post().storages.auth(origin, {
            ...body,
            code: code.trim()
        });
        win?.close();
        didAuthenticate();
    }

    return <div className={"prepare-fs-remote"}>
        {opened
            ? <>
                <div>Enter the code or the token to authenticate this device</div>
                <form onSubmit={submit}>
                    <input type={"tel"} value={code} onChange={e => setCode(e.currentTarget.value)} />
                    <button>Submit</button>
                </form>
            </>
            : <button onClick={openPopup}>Authenticate</button>}
    </div>
}