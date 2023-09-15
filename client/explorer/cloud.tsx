import React, {useEffect, useState} from "react";
import useAPI from "@fullstacked/webapp/client/react/useAPI";
import Explorer from "./explorer";
import createClient from "@fullstacked/webapp/rpc/createClient";
import type {CloudFS} from "../../server/Explorer/cloud-fs";

const cloudFSClient = createClient<typeof CloudFS>(window.location.href + "cloud-fs");

const AuthApp = await cloudFSClient.get(true).authAppEndpoint();

export default function () {
    const [hasAuth, refreshHasAuth] = useAPI(cloudFSClient.get().hasAuth);

    if(hasAuth === null) return <></>;

    return hasAuth ? <InitExplorer /> : <AuthFlow didAuthenticate={refreshHasAuth} />
}

function InitExplorer(){
    const [started] = useAPI(cloudFSClient.get().start);

    if(started === null) return <></>;

    return <Explorer client={cloudFSClient} />
}

let body = {}, win;
function AuthFlow({didAuthenticate}){
    const [code, setCode] = useState("");

    useEffect(() => {
        window.addEventListener("message", ({data}) => {
            body = {
                ...body,
                ...data
            }
        });

        win = window.open(`${AuthApp}?auth=1`, "", centeredPopupFeatures());
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
