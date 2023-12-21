import React, {RefObject, createRef, useState} from "react";
import explorerIcon from "../icons/explorer.svg";
import "./index.css";
import Cloud from "./cloud";
import Local from "./local";
import {Workspace} from "../workspace";
import Explorer from "./explorer";

function Explorers(props: { explorerRef: RefObject<Explorer> }) {
    const [activeTab, setActiveTab] = useState(0);
    const [showHiddenFiles, setShowHiddenFiles] = useState(false);
    const [showDeleteButtons, setShowDeleteButtons] = useState(false);

    return <div className={"explorer-with-tabs"}>

        <div className={"options"}>
            <div>
                {/*<button className={"small"} onClick={() => {*/}

                {/*}}>Global Ignore</button>*/}
            </div>

            <div>
                <span className={"checkbox"}>
                    <label>Delete Buttons</label>
                    <input type={"checkbox"} onChange={e => setShowDeleteButtons(e.currentTarget.checked)} checked={showDeleteButtons} />
                </span>

                <span className={"checkbox"}>
                    <label>Hidden Files</label>
                    <input type={"checkbox"} onChange={e => setShowHiddenFiles(e.currentTarget.checked)} checked={showHiddenFiles} />
                </span>
            </div>
        </div>

        <div className={"tabs"}>
            <div onClick={() => setActiveTab(0)} className={activeTab === 0 ? "active" : ""}>Local</div>
            <div onClick={() => setActiveTab(1)} className={activeTab === 1 ? "active" : ""}>Cloud</div>
        </div>
        <div>
            {activeTab === 0
                ? <Local explorerRef={props.explorerRef} options={{showDeleteButtons, showHiddenFiles}} />
                : <Cloud explorerRef={props.explorerRef} options={{showDeleteButtons, showHiddenFiles}} />}
        </div>
    </div>
}
Workspace.addApp({
    title: "Explorer",
    icon: explorerIcon,
    order: 1,
    element: (app) => {
        const explorerRef = createRef<Explorer>();

        app.callbacks = {
            onFocus: () => {
                if(!explorerRef.current) return;
                explorerRef.current.reloadOpenedDirectories();
            }
        }
        

        return <Explorers explorerRef={explorerRef} />
    }
});
