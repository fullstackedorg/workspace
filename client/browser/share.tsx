import React, {RefObject, useEffect, useRef, useState} from "react";
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

function copyToClipboard(str: string) {
    const input = document.createElement('textarea');
    input.innerHTML = str;
    document.body.appendChild(input);
    input.select();
    const result = document.execCommand('copy');
    document.body.removeChild(input);
    return result;
}

export default function (props: {port, close}) {
    const [password, setPassword] = useState("");
    const [shareState, setShareState] = useState<ShareState>(ShareState.NONE);
    const [shareURL, setShareURL] = useState("");
    const [loginURL, setLoginURL] = useState("");
    const [passwordCallback, setPasswordCallback] = useState(null);
    const [serverPassword, setServerPassword] = useState("");

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
                setLoginURL(data.login);
            }else if(data.password){
                setShareState(ShareState.PASSWORD);
                setPasswordCallback((() => (password: string) => {
                    ws.send(JSON.stringify({
                        id: data.id,
                        password
                    }))
                }))
            }
        }
    }

    const stopShare = async () => {
        await client.post().stopShare(props.port)
    }

    const sendSharePassword = e => {
        e.preventDefault();
        passwordCallback(serverPassword);
    }

    return <div className={"share"}>
        {shareState === ShareState.NONE || password
            ? <div style={{width: "100%", display: "flex", alignItems: "center"}}>
                <form style={{flexDirection: "column"}} onSubmit={share}>
                    <div>
                        <span>Password protection</span>
                        <input value={password}
                               onChange={e => setPassword(e.currentTarget.value)}
                               readOnly={shareState !== ShareState.NONE} />
                        <span id={"pass-msg"} style={{fontSize: 11, color: "#9ca3a9", textAlign: "left"}}></span>

                        {shareState === ShareState.NONE && <small>Leave blank for no password</small>}
                    </div>
                </form>
                {shareState === ShareState.SHARING && <button className={"icon-btn"} style={{padding: 3}} onClick={() => {
                    copyToClipboard(password);
                    document.querySelector<HTMLElement>("#pass-msg").innerText = "Copied to clipboard";
                    setTimeout(() => {
                        document.querySelector<HTMLElement>("#pass-msg").innerText = "";
                    }, 3000);
                }}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5"
                         stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round"
                              d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.057 1.123-.08M15.75 18H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08M15.75 18.75v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5A3.375 3.375 0 006.375 7.5H5.25m11.9-3.664A2.251 2.251 0 0015 2.25h-1.5a2.251 2.251 0 00-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M6.75 7.5H4.875c-.621 0-1.125.504-1.125 1.125v12c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V16.5a9 9 0 00-9-9z"/>
                    </svg>
                </button>}
            </div>
            : <></>}


        <button style={{display: shareState === ShareState.NONE ? "block" : "none"}} onClick={share}>Share</button>
        <img style={{display: shareState === ShareState.WAITING ? "block" : "none"}} src={loading} />
        <div style={{display: shareState === ShareState.LOGIN ? "block" : "none", textAlign: "center"}}>
            <div style={{marginBottom: 5}}><small>You need to activate the sharing feature</small></div>
            <a href={loginURL} target={"_blank"}><button>Activate</button></a>
        </div>
        <div style={{display: shareState === ShareState.PASSWORD ? "block" : "none", textAlign: "center"}}>
            <div style={{marginBottom: 5}}><small>The share server requires a password</small></div>
            <form onSubmit={sendSharePassword} style={{display: "flex"}}>
                <input style={{width: "calc(100% - 30px)"}} value={serverPassword} onChange={e => setServerPassword(e.currentTarget.value)} />
                <button className={"icon-btn"} style={{padding: 3}}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                </button>
            </form>
        </div>
        <div style={{
            display: shareState === ShareState.SHARING ? "block" : "none",
            width: "100%",
            textAlign: "center"
        }}>
            <div style={{
                display: "flex",
                alignItems: "center",
            }}>
                <input value={shareURL} readOnly />
                <button className={"icon-btn"} style={{padding: 3}} onClick={() => {
                    copyToClipboard(shareURL);
                    document.querySelector<HTMLElement>("#url-msg").innerText = "Copied to clipboard";
                    setTimeout(() => {
                        document.querySelector<HTMLElement>("#url-msg").innerText = "";
                    }, 3000);
                }}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5"
                         stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round"
                              d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.057 1.123-.08M15.75 18H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08M15.75 18.75v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5A3.375 3.375 0 006.375 7.5H5.25m11.9-3.664A2.251 2.251 0 0015 2.25h-1.5a2.251 2.251 0 00-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M6.75 7.5H4.875c-.621 0-1.125.504-1.125 1.125v12c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V16.5a9 9 0 00-9-9z"/>
                    </svg>
                </button>
            </div>
            <div id={"url-msg"} style={{fontSize: 11, color: "#9ca3a9", textAlign: "left"}}></div>
            <button style={{marginTop: 5}} className={"danger"} onClick={stopShare}>Stop Sharing</button>
        </div>

    </div>
}
