import React, {useState} from "react";
import {client} from "../client";
import { Workspace } from "../workspace";
import explorerIcon from "../icons/explorer.svg";
import "./index.css";
import Cloud from "./cloud";
import Local from "./local";
import AddApp from "../workspace/AddApp";

function Explorers() {
    const [activeTab, setActiveTab] = useState(0);

    return <div className={"explorer-with-tabs"}>
        <div className={"tabs"}>
            <div onClick={() => setActiveTab(0)} className={activeTab === 0 ? "active" : ""}>Local</div>
            <div onClick={() => setActiveTab(1)} className={activeTab === 1 ? "active" : ""}>Cloud</div>
        </div>
        <div>
            {activeTab === 0
                ? <Local />
                : <Cloud />}
        </div>
    </div>
}

const inDocker = await client.get(true).isInDockerRuntime();

AddApp({
    title: "Explorer",
    icon: explorerIcon,
    order: 1,
    element: () => inDocker ? <Local /> : <Explorers />
})
