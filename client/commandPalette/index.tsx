import React, {useEffect, useRef, useState} from "react";
import "./index.css"
import {Workspace} from "../workspace";
import Editor from "../editor";
import Terminal from "../terminal";

export default function () {
    const inputRef = useRef<HTMLInputElement>();
    const [inputValue, setInputValue] = useState("");
    const [show, setShow] = useState(false);

    useEffect(() => {
        window.addEventListener("keydown", e => {
            if(e.key === "k" && (e.metaKey || e.ctrlKey))
                setShow(true);
            else if(e.key === "Escape" && document.querySelector("#command-palette"))
                setShow(false);
        })
    }, []);

    useEffect(() => {
        if(show)
            inputRef.current.focus();
    }, [show]);

    const submit = e => {
        e.preventDefault();
        if(inputValue.startsWith("term"))
            Workspace.instance.addWindow(<Terminal onFocus={() => {}} />);
        else
            Workspace.instance.addWindow(<Editor filename={"./index.js"} />);

        setInputValue("");
        setShow(false);
    }

    return <div id={"command-palette"} style={{display: show ? "flex" : "none"}}>
        <div onClick={() => setShow(false)} />
        <div>
            <form onSubmit={submit}>
                <input ref={inputRef} value={inputValue} onChange={e => setInputValue(e.currentTarget.value)} />
            </form>
        </div>
    </div>
}
