import React, {useEffect, useState} from "react";
import Explorer, {ExplorerOptions} from "./explorer";
import createClient from "@fullstacked/webapp/rpc/createClient";
import type {fsCloud as fsCloudType} from "../../server/sync/fs-cloud";
import useAPI from "@fullstacked/webapp/client/react/useAPI";
import {client} from "../client";
import {RenderSyncIndicator} from "../sync/Indicator";

export const fsCloud = createClient<typeof fsCloudType>(window.location.protocol + "//" + window.location.host + "/fs-cloud");

export default function (props: {options: ExplorerOptions}){
    return <PrepareFsRemote onSuccess={() => {
        RenderSyncIndicator();
        return <Explorer client={fsCloud} action={(item) => undefined} options={props.options}/>
    }} />
}


const isNeutralino = await client.get(true).isInNeutralinoRuntime();

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
        const searchParams = new URLSearchParams(window.location.search);
        if(isNeutralino && !searchParams.get("auth")){
            client.post().openBrowserNative(window.location.href + `?auth=${url}`);
            return;
        }

        const catchArgs = ({data}) => {
            console.log(data);
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
            code
        });
        win?.close();
        didAuthenticate();
    }

    return failedOpened
        ? <button onClick={() => {
            openPopup();
            if(win)
                setFailedOpen(false)
        }}>Authenticate</button>
        : <form onSubmit={submit}>
            <input type={"tel"} value={code} onChange={e => setCode(e.currentTarget.value)} />
            <button>Submit</button>
        </form>;
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

    return failedOpen
        ? <button onClick={() => {
            openPopup()
            if(win)
                setFailedOpen(false);
        }}>Select Storage</button>
        : <div>Selecting Storage</div>
}

function Directory({didSelectDirectory}){
    const [value, setValue] = useState("");

    useEffect(() => {client.get().homeDir().then(setValue)}, []);

    const submit = async e => {
        e.preventDefault();
        await fsCloud.post().setDirectory(value);
        didSelectDirectory();
    }

    return <form onSubmit={submit}>
        <input type={"text"} value={value} onChange={e => setValue(e.currentTarget.value)}  />
        <button>Submit</button>
    </form>
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
