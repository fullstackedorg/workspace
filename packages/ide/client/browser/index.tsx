import React, {useEffect, useRef} from "react";
import Console from "./console";

declare global {
    interface Window {
        hasCredentialless: boolean
    }
}
export default function (props: {port?: string, path?: string}) {
    const iframeRef = useRef<HTMLIFrameElement>();
    const consoleRef = useRef<Console>();
    const eTabRef = useRef<HTMLAnchorElement>();
    const inputPortRef = useRef<HTMLInputElement>();
    const inputPathRef = useRef<HTMLInputElement>();

    useEffect(() => {
        // @ts-ignore
        // iframeRef.current.credentialless = true;
        if(!props.port) return;

        load();
    });

    const load = () => {
        let url = new URL(window.location.href);
        url.searchParams.forEach((value, param) =>
            url.searchParams.delete(param));

        const port = inputPortRef.current.value;
        url.pathname = inputPathRef.current.value;

        const urlSubDomain = new URL(url);

        // webcontainer setup
        if(url.host.includes("-8000-")){
            urlSubDomain.host = urlSubDomain.host.replace(/-8000-/, `-${port}-`);
        }else{
            urlSubDomain.host = port + "." + urlSubDomain.host;
        }

        iframeRef.current.src = urlSubDomain.toString();
        eTabRef.current.href = urlSubDomain.toString();
    }

    return <div className={"browser"}>
        <div className={"url-bar"}>
            <form onSubmit={e => {
                e.preventDefault();
                load();
                inputPortRef.current.blur();
            }}>
                Port : <input style={{width: 70}} ref={inputPortRef} defaultValue={props.port} />
                Path : <input style={{width: 100}} ref={inputPathRef} defaultValue={props.path} />
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
