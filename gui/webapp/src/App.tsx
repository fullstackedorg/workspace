import React, {ReactElement, useEffect, useRef, useState} from "react";
import Header from "./Header";
import Steps from "./Steps";
import SSH from "./Steps/SSH";
import Configs from "./Steps/Configs";
import Deployment from "./Steps/Deployment";
import SSL from "./Steps/SSL";
import Save from "./Steps/Save";
import LoadConfigs from "./LoadConfigs";
import {WS} from "../WebSocket";
import {GLOBAL_CMD} from "../../../types/gui";

export const steps: {
    title: string,
    component({updateData, defaultData, getSteps}): ReactElement,
    data?: any
}[] = [
    {
        title: "SSH Connection",
        component: SSH
    },{
        title: "Configurations",
        component: Configs
    },{
        title: "SSL Certificates",
        component: SSL
    },{
        title: "Deployment",
        component: Deployment
    },{
        title: "Save",
        component: Save
    }
]

export default function ({hasSavedConfigs}){
    const [stepIndex, setStepIndex] = useState(hasSavedConfigs ? null : 0);
    const logsRef = useRef<HTMLPreElement>();

    let View;
    if(stepIndex !== null)
        View = steps[stepIndex].component;

    useEffect(() => {
        WS.logs = logsRef.current
    }, [])

    return <>
        <Header />
        <Steps goToStep={index => setStepIndex(index)} stepIndex={stepIndex} />

        <div className={"container-xl py-3"}>
            <div className={"row"}>
                <div className={"col-6"}>
                    {
                        stepIndex === null
                            ? <LoadConfigs loadData={({sshCredentials, nginxConfigs, certificate}) => {
                                if(sshCredentials) steps.at(0).data = sshCredentials;
                                if(nginxConfigs) steps.at(1).data = {nginxConfigs};
                                if(certificate) steps.at(2).data = {certificate};

                                setStepIndex(0);
                            }}
                            />
                            : <>
                                <View defaultData={steps[stepIndex].data}
                                      getSteps={() => steps}
                                      updateData={data => steps[stepIndex].data = {
                                          ...steps[stepIndex].data,
                                          ...data
                                      }} />
                                <div className={"d-flex justify-content-between mt-3"}>
                                    {stepIndex > 0
                                        ? <div onClick={() => setStepIndex(stepIndex - 1)} className="btn btn-outline-secondary">
                                            Previous
                                        </div>
                                        : <div />}

                                    {stepIndex < steps.length - 1
                                        ? <div onClick={() => setStepIndex(stepIndex + 1)} className="btn btn-primary">
                                            Next
                                        </div>
                                        : <div onClick={() => {
                                            WS.cmd(GLOBAL_CMD.END);
                                            window.close();
                                        }} className="btn btn-warning">
                                            Close
                                        </div>}
                                </div>
                            </>
                    }
                </div>

                <div className={"col-6"}>
                    <pre ref={logsRef}
                         style={{
                             maxHeight: "calc(100vh - 200px)",
                             height: "100vh"
                        }} />
                </div>

            </div>

            <footer className="footer footer-transparent d-print-none">
                <div className="container-xl">
                    <div className="row text-center align-items-center flex-row-reverse">
                        <div className="col-lg-auto ms-lg-auto">
                            <ul className="list-inline list-inline-dots mb-0">
                                <li className="list-inline-item">
                                    Built with&nbsp;
                                    <a href="https://tabler.io" target={"_blank"}>tabler.io</a>&nbsp;
                                </li>
                                <li className="list-inline-item">
                                    Support Open Source
                                </li>
                                <li className="list-inline-item">
                                    <a href="https://github.com/cplepage/fullstacked/stargazers" target={"_blank"}>Give FullStacked a&nbsp;
                                        <svg style={{verticalAlign: "text-bottom", color: "#eac54f", height: 18, width: 18}}
                                             xmlns="http://www.w3.org/2000/svg"  className="icon icon-tabler icon-filled icon-tabler-star"
                                             viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"
                                             fill="none" strokeLinecap="round" strokeLinejoin="round">
                                            <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                                            <path d="M12 17.75l-6.172 3.245l1.179 -6.873l-5 -4.867l6.9 -1l3.086 -6.253l3.086 6.253l6.9 1l-5 4.867l1.179 6.873z"></path>
                                        </svg>
                                    </a>
                                </li>
                            </ul>
                        </div>
                        <div className="col-12 col-lg-auto mt-3 mt-lg-0">
                            <ul className="list-inline list-inline-dots mb-0">
                                <li className="list-inline-item">
                                    Released under the&nbsp;
                                    <a href="https://opensource.org/licenses/MIT" target={"_blank"}>MIT License</a>
                                </li>
                                <li className="list-inline-item">
                                    Copyright © 2022&nbsp;
                                    <a href="https://cplepage.com" target={"_blank"}>CP Lepage</a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    </>
}
