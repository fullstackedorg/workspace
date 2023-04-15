import React, {useEffect, useRef, useState} from "react";

function setCookie(cname, cvalue, seconds) {
    const d = new Date();
    d.setTime(d.getTime() + (seconds*1000));
    let expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

export default function () {
    const [hasCredentialless, setHasCredentialless] = useState(false);
    const iframeRef = useRef<HTMLIFrameElement>();
    const inputPortRef = useRef<HTMLInputElement>();

    useEffect(() => {
        const analyzeIframeResponse = (e) => {
            if(typeof e.data.credentialless !== 'boolean') return;
            setHasCredentialless(e.data.credentialless);
            window.removeEventListener('message', analyzeIframeResponse)
        }

        window.addEventListener('message', analyzeIframeResponse);

        const url = new URL(window.location.href);
        setCookie("test", "credentialless", 60);
        url.searchParams.forEach((value, param) => url.searchParams.delete(param));
        url.searchParams.set("test", "credentialless");
        // @ts-ignore
        iframeRef.current.credentialless = true;
        iframeRef.current.src = url.toString();
    });

    const loadPort = () => {
        const url = new URL(window.location.href);
        url.searchParams.forEach((value, param) => url.searchParams.delete(param));

        const port = inputPortRef.current.value;

        if(hasCredentialless){
            url.searchParams.set("port", port);
            iframeRef.current.src = url.toString();
        }else{
            iframeRef.current.src = url.protocol + "//" + port + "." + url.host;
        }
    }

    return <div className={"browser"}>
        <div className={"url-bar"}>
            Port : <input ref={inputPortRef} />
            <button onClick={loadPort}>Go</button>
            Credentialless : {hasCredentialless ? "Active" : "Inactive"}
        </div>
        <iframe ref={iframeRef} />
    </div>
}
