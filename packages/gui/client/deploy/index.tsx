import React, {ReactElement, useEffect, useState} from "react";
import SSH from "./Steps/SSH";
import SSL from "./Steps/SSL";
import Deployment from "./Steps/Deployment";
import Save from "./Steps/Save";
import Steps from "./Steps";
import {Route, Routes} from "react-router-dom";
import {openConsole} from "../index";
import {Client} from "../client";
import ConfigLoader from "./ConfigLoader";
import Nginx from "./Steps/Nginx";

export let steps = [
    {
        slug: "",
        title: "SSH Connection",
        component: SSH
    },{
        slug: "/nginx",
        title: "Nginx Configuration",
        component: Nginx
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
    const [checkConfig, setCheckConfig] = useState<Awaited<ReturnType<typeof Client.deploy.hasConfig>>>(null);
    const [didLoadConfig, setDidLoadConfig] = useState<boolean>(false);
    useEffect(openConsole, []);

    useEffect(() => {
        Client.deploy.hasConfig()
            .then(setCheckConfig)
            .catch(() => {
                setCheckConfig({hasConfig: false});
                setDidLoadConfig(true)
            });
    }, []);

    if(checkConfig === null) return <></>;

    return <>
        <Steps />

        <div className={"container-xl"}>
            <div className={"page-header"}>
                <h2 className={"page-title"}>Deploy</h2>
            </div>

            {checkConfig?.hasConfig && !didLoadConfig
                ? <ConfigLoader pass={checkConfig.encrypted} didLoadConfig={() => setDidLoadConfig(true)} />
                : <div className={"page-body"}>
                    <Routes>
                        {steps.map(step => <Route path={step.slug} element={<step.component />} />)}
                    </Routes>
                </div>}

        </div>
    </>
}
