import React, {ReactElement} from "react";
import SSH from "./Steps/SSH";
import Configs from "./Steps/Configs";
import SSL from "./Steps/SSL";
import Deployment from "./Steps/Deployment";
import Save from "./Steps/Save";
import Steps from "./Steps";
import {Route, Routes} from "react-router-dom";

export let steps = [
    {
        slug: "",
        title: "SSH Connection",
        component: SSH
    },{
        slug: "/nginx",
        title: "Nginx Configuration",
        component: Configs
    },{
        slug: "/ssl",
        title: "SSL Certificates",
        component: SSL
    },{
        slug: "/deployment",
        title: "Deployment",
        component: Deployment
    },{
        slug: "/save",
        title: "Save",
        component: Save
    }
]

export default function () {
    return <>
        <Steps />

        <div className={"container-xl"}>
            <div className={"page-header"}>
                <h2 className={"page-title"}>Deploy</h2>
            </div>
            <Routes>
                {steps.map(step => <Route path={step.slug} element={<step.component />} />)}
            </Routes>
        </div>
    </>
}
