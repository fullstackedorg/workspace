import React from "react";
import {views} from "./Run";
export default function ({activeTabIndex, onTabClick}){
    return <div className="navbar-expand-md">
        <div className="collapse navbar-collapse" id="navbar-menu">
            <div className="navbar navbar-light">
                <div className="container-xl">
                    <ul className="navbar-nav">
                        {views.map((view, index) => <li className={`nav-item ${index === activeTabIndex ? "active" : ""}`}>
                            <span className={"cursor-pointer nav-link"} onClick={() => onTabClick(index)}>
                                <span className="nav-link-icon d-md-none d-lg-inline-block">
                                    {view.icon}
                                </span>
                                <span className="nav-link-title">{view.title}</span>
                            </span>
                        </li>)}
                    </ul>
                </div>
            </div>
        </div>
    </div>
}
