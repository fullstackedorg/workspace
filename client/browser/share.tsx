import React, {useEffect, useRef, useState} from "react";
import {client} from "../client";
//@ts-ignore
import loading from "../icons/loading.gif";


enum ShareState {
    NONE,
    WAITING,
    PASSWORD,
    LOGIN,
    SHARING
}


export default function (props: {port, close}) {
    const wrap = useRef<HTMLDivElement>();
    const [password, setPassword] = useState("");

    const [shareState, setShareState] = useState<ShareState>(ShareState.NONE);

    const [shareURL, setShareURL] = useState("");

    useEffect(() => {
        const close = (e) => {
            if(wrap.current.parentElement.parentElement.contains(e.target))
                return;

            props.close();
            window.removeEventListener("click", close);
        }
        window.addEventListener("click", close);

        function checkIfInIframe(){
            window.requestAnimationFrame(checkIfInIframe);
            if(document.activeElement.tagName === "IFRAME") {
                props.close();
                window.removeEventListener("click", close);
            }
        }

        checkIfInIframe();
    }, []);

    const share = async (e) => {
        e.preventDefault();
        setShareState(ShareState.WAITING);
        await client.post().share(props.port, password);
        const ws = new WebSocket("ws" + (window.location.protocol === "https:" ? "s" : "") + "://" + window.location.host + "/fullstacked-share?port=" + props.port);
        ws.onmessage = message => {
            const data = JSON.parse(message.data);
            if(data.url){
                setShareURL(data.url);
                setShareState(ShareState.SHARING);
            }else if(data.end){
                setShareURL("");
                setShareState(ShareState.NONE);
            }else if(data.login){
                setShareState(ShareState.LOGIN);
            }
        }
    }

    const stopShare = async () => {
        await client.post().stopShare(props.port)
    }

    return <div ref={wrap} className={"share"}>
        {shareState === ShareState.NONE || password
            ? <form style={{flexDirection: "column"}} onSubmit={share}>
                <div>
                    <span>Password protection</span>
                    <input value={password} onChange={e => setPassword(e.currentTarget.value)} readOnly={shareState !== ShareState.NONE} />
                    {shareState === ShareState.NONE && <small>Leave blank for no password</small>}
                </div>
            </form>
            : <></>}


        <img style={{display: shareState === ShareState.WAITING ? "block" : "none"}} src={loading} />
        <button style={{display: shareState === ShareState.NONE ? "block" : "none"}} onClick={share}>Start Sharing</button>
        <div style={{display: shareState === ShareState.SHARING ? "block" : "none"}}>
            <input value={shareURL} readOnly/>
            <button className={"danger"} onClick={stopShare}>Stop Sharing</button>
        </div>

    </div>
}
