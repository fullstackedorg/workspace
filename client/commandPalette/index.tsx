import React, {useEffect, useRef, useState} from "react";
import "./index.css"
import {Workspace} from "../workspace";

export default function () {
    const inputRef = useRef<HTMLInputElement>();
    const [inputValue, setInputValue] = useState("");
    const [show, setShow] = useState(false);

    useEffect(() => {
        window.addEventListener("keydown", e => {
            if(e.key === "k" && (e.metaKey || e.ctrlKey)){
                e.preventDefault();
                setShow(true);
            }else if(e.key === "Escape" && document.querySelector("#command-palette"))
                setShow(false);
        })
    }, []);

    useEffect(() => {
        if(show)
            inputRef.current.focus();
    }, [show]);

    const filteredApps = Workspace.instance.state.apps
        .filter(app => inputValue ? app.title.toLowerCase().startsWith(inputValue) : true)
    
    const submit = e => {
        e.preventDefault();

        const app = filteredApps.at(0);
        if(!app) return;

        Workspace.instance.addWindow(app);
        setInputValue("");
        setShow(false);
    }

    return <div id={"command-palette"} style={{display: show ? "flex" : "none"}}>
        <div onClick={() => setShow(false)} />
        <div>
            <form onSubmit={submit} 
                style={!inputValue ? {opacity: 0, height: 0} : {}}>
                <input ref={inputRef} value={inputValue} onChange={e => setInputValue(e.currentTarget.value)} />
            </form>
            <div className="apps">{filteredApps.map(app => 
                    <div onClick={() => {
                        setShow(false);
                        setInputValue("")
                        Workspace.instance.addWindow(app);
                    }}>
                        <img src={app.icon} />
                        <div>{app.title}</div>
                    </div>)}
            </div>
        </div>
    </div>
}
