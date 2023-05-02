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
    const inputPathRef = useRef<HTMLInputElement>();

    useEffect(() => {
        const analyzeIframeResponse = (e) => {
            if(typeof e.data.credentialless !== 'boolean') return;
            setHasCredentialless(e.data.credentialless);
            window.removeEventListener('message', analyzeIframeResponse)
        }

        window.addEventListener('message', analyzeIframeResponse);

        const url = new URL(window.location.href);

        const winID = url.searchParams.get("winId");
        const token = url.searchParams.get("token");

        setCookie("test", "credentialless", 60);
        url.searchParams.forEach((value, param) => url.searchParams.delete(param));
        url.searchParams.set("test", "credentialless");
        if(token) url.searchParams.set("token", token);
        // @ts-ignore
        iframeRef.current.credentialless = true;
        iframeRef.current.src = url.toString();

        let hasFocus = false;
        setInterval(() => {
            if(document.activeElement === iframeRef.current){
                if(window.parent?.postMessage && !hasFocus) {
                    window.parent.postMessage({winID});
                    hasFocus = true;
                }
            }else{
                hasFocus = false;
            }
        }, 100);
    });

    const load = () => {
        const url = new URL(window.location.href);
        const token = url.searchParams.get("token");
        url.searchParams.forEach((value, param) => url.searchParams.delete(param));

        const port = inputPortRef.current.value;

        if(hasCredentialless){
            url.searchParams.set("port", port);
        }else{
            url.host = port + "." + url.host;
        }

        url.pathname = inputPathRef.current.value;
        if(token) url.searchParams.set("token", token);
        iframeRef.current.src = url.toString();
    }

    return <div className={"browser"}>
        <div className={"url-bar"}>
            <form onSubmit={e => {
                e.preventDefault();
                load();
                inputPortRef.current.blur();
            }}>
                Port : <input style={{width: 70}} ref={inputPortRef} />
                Path : <input style={{width: 100}} ref={inputPathRef} />
                <button>Go</button>
            </form>
            <small>
                Credentialless <div className={"dot"} style={{backgroundColor: hasCredentialless ? "green" : "red"}} />
            </small>
        </div>
        <iframe ref={iframeRef} />
    </div>
}
