import React, {useState, ReactElement} from "react";
import Header from "./Header";
import Steps from "./Steps";
import SSH from "./Steps/SSH";
import Configs from "./Steps/Configs";
import Deployment from "./Steps/Deployment";
import SSL from "./Steps/SSL";
import Save from "./Steps/Save";
import LoadConfigs from "./LoadConfigs";

export const steps: {
    title: string,
    component({baseUrl, updateData, defaultData, getSteps}): ReactElement,
    data?: any
}[] = [
    {
        title: "SSH Connection",
        component: SSH
    },{
        title: "Configurations",
        component: Configs
    },{
        title: "Deployment",
        component: Deployment
    },{
        title: "SSL Certificates",
        component: SSL
    },{
        title: "Save",
        component: Save
    }
]

export default function ({baseUrl, hasSavedConfigs}){
    const [stepIndex, setStepIndex] = useState(hasSavedConfigs ? null : 0);

    let View;
    if(stepIndex !== null)
        View = steps[stepIndex].component;

    return <>
        <Header />
        <Steps stepIndex={stepIndex} />

        <div className={"container col-lg-6 col-md-8 mt-3 pb-3"}>
            {
                stepIndex === null
                    ? <LoadConfigs baseUrl={baseUrl}
                                   loadData={({sshCredentials, nginxConfigs}) => {
                                       console.log(sshCredentials, nginxConfigs)
                                       if(sshCredentials) steps.at(0).data = sshCredentials;
                                       if(nginxConfigs) steps.at(1).data = { nginxConfigs };
                                       console.log(steps)
                                       setStepIndex(0);
                                   }}
                    />
                    : <>
                        <View baseUrl={baseUrl}
                              defaultData={steps[stepIndex].data}
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
                                : <div />}
                        </div>
                    </>
            }
        </div>
    </>
}
