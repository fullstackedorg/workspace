import useAPI from "@fullstacked/webapp/client/react/useAPI";
import { fsCloud } from "../explorer/clients/cloud";
import React, { useEffect, useRef, useState } from "react";
import { client } from "../client";
import { AddSyncApp, RenderSyncIndicator } from "./Indicator";

export function PrepareCloudStorage({ onSuccess }) {
    const [response, retryInit] = useAPI(client.get().initSync);

    useEffect(() => {
        if (response) {
            RenderSyncIndicator();

            if (typeof response === "boolean") {
                AddSyncApp();
            }
        }
    }, [response])

    if (!response) return <></>;

    return typeof response === "object"
        ? (() => {
            switch (response.error) {
                case "no_configs":
                case "directory":
                    return <Directory
                        message={(response as any).reason}
                        didSelectDirectory={retryInit}
                    />
                case "authorization":
                    switch (response.type) {
                        case "password":
                            return <div>Password Auth</div>;
                        case "external":
                            return <AuthFlow url={response.url} didAuthenticate={retryInit} />;
                    }
                case "endpoint_selection":
                    return <EndpointSelection url={response.url} didSelectEndpoint={retryInit} />;
                default:
                    return <div style={{color: "white"}}>Uh oh. Unknown response: [{JSON.stringify(response)}]</div>
            }
        })()
        : typeof response === "boolean" && response
            ? onSuccess()
            : <div style={{color: "white"}}>Uh oh. Unknown response: [{response}]</div>
}

let body = {}, win;
export function AuthFlow({ url, didAuthenticate }) {
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
        await fsCloud.post().authenticate({
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

function EndpointSelection({ url, didSelectEndpoint }) {
    const [failedOpen, setFailedOpen] = useState(false);

    const openPopup = () => {
        win = window.open(url, "", centeredPopupFeatures())
    };

    useEffect(() => {
        const catchEndpoint = ({ data }) => {
            if (data.endpoint) {
                fsCloud.post().setEndpoint(data.endpoint).then(() => {
                    win.close();
                    didSelectEndpoint();
                })
            }
        };

        window.addEventListener("message", catchEndpoint);

        openPopup();

        if (!win) setFailedOpen(true);

        return () => {
            win = null;
            window.removeEventListener("message", catchEndpoint)
        }
    }, []);

    return <div className={"prepare-fs-remote"}>
        {failedOpen
            ? <button onClick={() => {
                openPopup()
                if (win)
                    setFailedOpen(false);
            }}>Select Storage</button>
            : <div>Selecting Storage</div>}
    </div>
}

function Directory({ message, didSelectDirectory }) {
    const inputRef = useRef<HTMLInputElement>();
    const [value, setValue] = useState(null);

    useEffect(() => {
        client.get().homeDir().then(({ dir, sep }) => {
            setValue(dir + sep + "FullStacked");
            inputRef.current.focus()
        });
    }, [])

    const submit = async e => {
        e.preventDefault();
        await fsCloud.post().setDirectory(value);
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


function centeredPopupFeatures() {
    const w = 500;
    const h = 600;
    const dualScreenLeft = window.screenLeft !== undefined ? window.screenLeft : window.screenX;
    const dualScreenTop = window.screenTop !== undefined ? window.screenTop : window.screenY;

    const width = window.outerWidth ? window.outerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : screen.width;
    const height = window.outerHeight ? window.outerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height;

    const systemZoom = width / window.screen.availWidth;
    const left = (width - w) / 2 / systemZoom + dualScreenLeft;
    const top = (height - h) / 2 / systemZoom + dualScreenTop;

    return `scrollbars=yes,
      width=${w / systemZoom}, 
      height=${h / systemZoom}, 
      top=${top}, 
      left=${left}
      `
}
