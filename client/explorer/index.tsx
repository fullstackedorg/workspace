import React, {useState} from "react";
import explorerIcon from "../icons/explorer.svg";
import "./index.css";
import Cloud from "./cloud";
import Local from "./local";
import AddApp from "../workspace/AddApp";

function Explorers() {
    const [activeTab, setActiveTab] = useState(0);
    const [showHiddenFiles, setShowHiddenFiles] = useState(false);

    return <div className={"explorer-with-tabs"}>

        <div className={"checkbox"}>
            <label>Show Hidden Files</label>
            <input type={"checkbox"} onChange={e => setShowHiddenFiles(e.currentTarget.checked)} checked={showHiddenFiles} />
        </div>

        <div className={"tabs"}>
            <div onClick={() => setActiveTab(0)} className={activeTab === 0 ? "active" : ""}>Local</div>
            <div onClick={() => setActiveTab(1)} className={activeTab === 1 ? "active" : ""}>Cloud</div>
        </div>
        <div>
            {activeTab === 0
                ? <Local showHiddenFiles={showHiddenFiles} />
                : <Cloud showHiddenFiles={showHiddenFiles} />}
        </div>
    </div>
}
AddApp({
    title: "Explorer",
    icon: explorerIcon,
    order: 1,
    element: () => <Explorers />
});
