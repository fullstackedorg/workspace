import React, {useEffect, useRef} from "react";
import Console from "./console";

declare global {
    interface Window {
        hasCredentialless: boolean
    }
}
export default function () {
    const iframeRef = useRef<HTMLIFrameElement>();
    const consoleRef = useRef<Console>();
    const eTabRef = useRef<HTMLAnchorElement>();
    const inputPortRef = useRef<HTMLInputElement>();
    const inputPathRef = useRef<HTMLInputElement>();

    useEffect(() => {
        // @ts-ignore
        // iframeRef.current.credentialless = true;

        const url = new URL(window.location.href);
        const winID = url.searchParams.get("winId");

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
        let url = new URL(window.location.href);
        url.searchParams.forEach((value, param) => url.searchParams.delete(param));

        const port = inputPortRef.current.value;
        url.pathname = inputPathRef.current.value;

        const urlCredentialless = new URL(url);
        urlCredentialless.searchParams.set("port", port);

        const urlSubDomain = new URL(url);
        urlSubDomain.host = port + "." + urlSubDomain.host;

        iframeRef.current.src = window.hasCredentialless
            ? urlCredentialless.toString()
            : urlSubDomain.toString();
        eTabRef.current.href = urlSubDomain.toString();
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
            {window.hasCredentialless && <button onClick={() => consoleRef.current.setState({show: !consoleRef.current.state.show})}>Console</button>}
            <a ref={eTabRef} href={"#"} target={"_blank"}><button>External Tab</button></a>
            <small>
                Credentialless <div className={"dot"} style={{backgroundColor: window.hasCredentialless ? "green" : "red"}} />
            </small>
        </div>
        <iframe ref={iframeRef} />
        {window.hasCredentialless && <Console ref={consoleRef} iframeRef={iframeRef} />}
    </div>
}
