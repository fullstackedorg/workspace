import useAPI from "@fullstacked/webapp/client/react/useAPI";
import {fsCloud} from "../explorer/clients/cloud";
import React, {useEffect, useRef, useState} from "react";
import {client} from "../client";

export function PrepareFsRemote({onSuccess}) {
    const [start, refreshStart] = useAPI(fsCloud.get().start);

    if(start === null) return <></>;

    return typeof start === "object"
        ? (() => {
            switch (start.error){
                case "directory":
                    return <Directory didSelectDirectory={refreshStart} />
                case "authorization":
                    return <AuthFlow url={start.url} didAuthenticate={refreshStart} />;
                case "endpoint_selection":
                    return <EndpointSelection url={start.url} didSelectEndpoint={refreshStart} />;
                default:
                    return <div>Uh oh. Unknown response: [{JSON.stringify(start)}]</div>
            }
        })()
        : typeof start === "boolean" && start
            ? onSuccess()
            : <div>Uh oh. Unknown response: [{start}]</div>
}

let body = {}, win;
export function AuthFlow({url, didAuthenticate}){
    const [code, setCode] = useState("");
    const [failedOpened, setFailedOpen] = useState(false);

    const openPopup = () => {
        win = window.open(url, "", centeredPopupFeatures())
    };

    useEffect(() => {
        const catchArgs = ({data}) => {
            body = {
                ...body,
                ...data
            }
        };

        window.addEventListener("message", catchArgs);

        openPopup();

        if(!win) setFailedOpen(true);

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
                    <input type={"tel"} value={code} onChange={e => setCode(e.currentTarget.value)}/>
                    <button>Submit</button>
                </form>
            </>}
    </div>
}

function EndpointSelection({url, didSelectEndpoint}){
    const [failedOpen, setFailedOpen] = useState(false);

    const openPopup = () => {
        win = window.open(url, "", centeredPopupFeatures())
    };

    useEffect(() => {
        const catchEndpoint = ({data}) => {
            if(data.endpoint){
                fsCloud.post().setEndpoint(data.endpoint).then(() => {
                    win.close();
                    didSelectEndpoint();
                })
            }
        };

        window.addEventListener("message", catchEndpoint);

        openPopup();

        if(!win) setFailedOpen(true);

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

function Directory({didSelectDirectory}){
    const inputRef = useRef<HTMLInputElement>();
    const [value, setValue] = useState(null);

    useEffect(() => {
        client.get().homeDir().then(homeDir => {
            setValue(homeDir + "FullStacked");
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
        <form onSubmit={submit}>
            <input ref={inputRef} type={"text"} value={value} onChange={e => setValue(e.currentTarget.value)}  />
            <button>Submit</button>
        </form>
    </div>
}


function centeredPopupFeatures(){
    const w = 500;
    const h = 600;
    const dualScreenLeft = window.screenLeft !==  undefined ? window.screenLeft : window.screenX;
    const dualScreenTop = window.screenTop !==  undefined   ? window.screenTop  : window.screenY;

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
