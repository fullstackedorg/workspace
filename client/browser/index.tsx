import React, {useEffect, useRef, useState} from "react";
import Console from "./console";
import Share from "./share";
import browserIcon from "../icons/browser.svg";
import {Workspace} from "../workspace";

Workspace.apps.push({
    title: "Browser",
    icon: browserIcon,
    element: () => <Browser />
});

declare global {
    interface Window {
        hasCredentialless: boolean
    }
}
function Browser(props: {id?: string, port?: string, path?: string}) {
    const [openShare, setOpenShare] = useState(false);
    const openShareRef = useRef<boolean>();

    const [path, setPath] = useState(props.path?.startsWith("/") ? props.path.slice(1) : "");
    const [port, setPort] = useState(props.port);

    const iframeRef = useRef<HTMLIFrameElement>();
    const consoleRef = useRef<Console>();
    const eTabRef = useRef<HTMLAnchorElement>();
    const shareTooltipRef = useRef<HTMLSpanElement>();

    let closeShareTooltip = (e) => {
        const bb = shareTooltipRef.current.getBoundingClientRect();
        if(bb.width === 0)
            window.removeEventListener("click", closeShareTooltip);

        if(!openShareRef.current || shareTooltipRef.current.contains(e.target))
            return;

        setOpenShare(false);
    };

    const checkIfInIframe = () =>{
        if(!openShareRef.current) return;

        window.requestAnimationFrame(checkIfInIframe);
        if(document.activeElement.tagName === "IFRAME") {
            setOpenShare(false);
        }
    }

    useEffect(() => {
        openShareRef.current = openShare;
        if(openShare)
            checkIfInIframe();
    }, [openShare]);

    useEffect(() => {
        // @ts-ignore
        // iframeRef.current.credentialless = true;
        if(props.port) {
            load();
        }

        window.addEventListener("click", closeShareTooltip);
    }, []);

    const load = () => {
        console.log(path)
        let url = new URL(window.location.href);
        url.searchParams.forEach((value, param) =>
            url.searchParams.delete(param));

        url.pathname = path;

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
            }}>
                <div>
                    http://localhost:
                    <input style={{width: 36}} value={port} onChange={(e) => setPort(e.currentTarget.value)}/>/
                    <input style={{width: 100}} value={path} onChange={(e) => setPath(e.currentTarget.value)}/>
                </div>
                <button className={"icon-btn"} style={{padding: 2}}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5"
                         stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75"/>
                    </svg>
                </button>
            </form>
            {window.hasCredentialless && <button onClick={() => consoleRef.current.setState({show: !consoleRef.current.state.show})}>Console</button>}
            <div>
                <a ref={eTabRef} href={"#"} target={"_blank"} onClick={e => {
                    if(!port) e.preventDefault();
                }}>
                    <button className={"icon-btn " + (!port ? "disabled" : "")} style={{padding: 3}}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5"
                             stroke="currentColor" >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"/>
                        </svg>
                    </button>
                </a>
                <span ref={shareTooltipRef} style={{position: "relative"}}>
                    <button className={"icon-btn " + (!port ? "disabled" : "")} style={{padding: 2}} onClick={() => {
                        if(!port) return;
                        setOpenShare(true)
                    }}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5"
                             stroke="currentColor" >
                            <path strokeLinecap="round" strokeLinejoin="round"
                                  d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15m0-3l-3-3m0 0l-3 3m3-3V15"/>
                        </svg>
                    </button>
                    <div className={"tooltip"} style={{display: openShare ? "block" : "none"}}>
                        <Share port={port} close={() => setOpenShare(false)} />
                    </div>
                </span>

            </div>
            {/*<small>*/}
            {/*    Credentialless <div className={"dot"} style={{backgroundColor: window.hasCredentialless ? "green" : "red"}} />*/}
            {/*</small>*/}
        </div>
        <iframe ref={iframeRef} id={props.id} />
        {window.hasCredentialless && <Console ref={consoleRef} iframeRef={iframeRef} />}
    </div>
}
