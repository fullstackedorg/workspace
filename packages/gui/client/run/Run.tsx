import React, {useEffect, useState} from "react";
import Nav from "./Nav";
import Logs from "./Logs";
import Bench from "./Bench";

export const views = [
    {
        title: "Logs",
        icon: <svg xmlns="http://www.w3.org/2000/svg"
                   className="icon icon-tabler icon-tabler-app-window" width="24" height="24"
                   viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none"
                   strokeLinecap="round" strokeLinejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
            <rect x="3" y="5" width="18" height="14" rx="2"></rect>
            <path d="M6 8h.01"></path>
            <path d="M9 8h.01"></path>
        </svg>,
        component: <Logs />
    },
    {
        title: "Bench",
        icon: <svg xmlns="http://www.w3.org/2000/svg"
                   className="icon icon-tabler icon-tabler-barbell" width="24" height="24"
                   viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none"
                   strokeLinecap="round" strokeLinejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
            <path d="M2 12h1"></path>
            <path d="M6 8h-2a1 1 0 0 0 -1 1v6a1 1 0 0 0 1 1h2"></path>
            <path d="M6 7v10a1 1 0 0 0 1 1h1a1 1 0 0 0 1 -1v-10a1 1 0 0 0 -1 -1h-1a1 1 0 0 0 -1 1z"></path>
            <path d="M9 12h6"></path>
            <path d="M15 7v10a1 1 0 0 0 1 1h1a1 1 0 0 0 1 -1v-10a1 1 0 0 0 -1 -1h-1a1 1 0 0 0 -1 1z"></path>
            <path d="M18 8h2a1 1 0 0 1 1 1v6a1 1 0 0 1 -1 1h-2"></path>
            <path d="M22 12h-1"></path>
        </svg>,
        component: <Bench />
    }
]

export default function (){
    const [activeViewIndex, setActiveViewIndex] = useState(0);

    return <>
        <Nav activeTabIndex={activeViewIndex} onTabClick={setActiveViewIndex} />
        <div className={"container-xl py-3"}>
            {views.map((view, index) =>
                <div className={activeViewIndex === index ? "d-block" : "d-none"}>{view.component}</div>)}
        </div>
    </>;
}
