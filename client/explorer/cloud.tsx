import React, {useEffect, useState} from "react";
import useAPI from "@fullstacked/webapp/client/react/useAPI";
import Explorer from "./explorer";
import createClient from "@fullstacked/webapp/rpc/createClient";
import type {CloudFS} from "../../server/Explorer/cloud-fs";

const cloudFSClient = createClient<typeof CloudFS>(window.location.protocol + "//" + window.location.host + "/cloud-fs");

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
function AuthFlow({url, didAuthenticate}){
    const [code, setCode] = useState("");

    useEffect(() => {
        window.addEventListener("message", ({data}) => {
            body = {
                ...body,
                ...data
            }
        });

        win = window.open(url, "", centeredPopupFeatures());
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

    return <form onSubmit={submit}>
        <input type={"tel"} value={code} onChange={e => setCode(e.currentTarget.value)} />
        <button>Submit</button>
    </form>;
}

function EndpointSelection({url, didSelectEndpoint}){
    useEffect(() => {
        window.addEventListener("message", ({data}) => {
            if(data.endpoint){
                cloudFSClient.post().setCloudFSEndpoint(data.endpoint).then(() => {
                    win.close();
                    didSelectEndpoint();
                })
            }
        });

        win = window.open(url, "", centeredPopupFeatures());
    }, []);

    return <div>Selecting Storage</div>
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
