import React, {useEffect, useState} from "react";
import {Route, Routes} from "react-router-dom";
import {Client} from "../client";
import ConfigLoader from "./ConfigLoader";
import NextPrev from "./NextPrev";
import useAPI from "@fullstacked/webapp/client/react/useAPI";
import {openConsole} from "../Console";
import {steps} from "./Steps";
import Progress from "./Progress";

export default function () {
    const [didLoadConfig, setDidLoadConfig] = useState<boolean>(false);

    const [checkConfig] = useAPI(Client.get().deploy.hasConfig);

    useEffect(openConsole, []);

    return <>
        <Progress />

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

            <NextPrev />
        </div>
    </>
}
