import React, {useEffect, useState} from "react";
import useAPI from "@fullstacked/webapp/client/react/useAPI";
import Explorer from "./explorer";
import createClient from "@fullstacked/webapp/rpc/createClient";
import type {CloudFS} from "../../server/Explorer/cloud-fs";
import {client} from "../client";

const cloudFSClient = createClient<typeof CloudFS>(window.location.protocol + "//" + window.location.host + "/cloud-fs");

const isNeutralino = await client.get(true).isInNeutralinoRuntime();

export default function () {
    const [start, refreshStart] = useAPI(cloudFSClient.get().start);

    if(start === null) return <></>;

    return typeof start === "object"
            ? start.error === "authorization"
                ? <AuthFlow url={start.url} didAuthenticate={refreshStart} />
                : start.error === "endpoint_selection"
                    ? <EndpointSelection url={start.url} didSelectEndpoint={refreshStart} />
                    : <div>Uh oh. Unknown response: [{JSON.stringify(start)}]</div>
            : typeof start === "boolean" && start
                ? <Explorer client={cloudFSClient} />
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
        await cloudFSClient.post().authenticate({
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
                cloudFSClient.post().setCloudFSEndpoint(data.endpoint).then(() => {
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
