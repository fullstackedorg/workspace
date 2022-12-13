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
import {DEPLOY_CMD} from "fullstacked/types/deploy";

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
        <Steps stepIndex={stepIndex} />

        <div className={"container-fluid pt-3"}>
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
                                        ? <div onClick={() => {
                                            console.log(steps[stepIndex].data)
                                            setStepIndex(stepIndex + 1)
                                        }} className="btn btn-primary">
                                            Next
                                        </div>
                                        : <div onClick={() => {
                                            WS.cmd(DEPLOY_CMD.END);
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
        </div>
    </>
}
