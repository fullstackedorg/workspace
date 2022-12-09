import React, {useState, ReactElement} from "react";
import Header from "./Header";
import Steps from "./Steps";
import SSH from "./Steps/SSH";
import Configs from "./Steps/Configs";
import Deployment from "./Steps/Deployment";
import SSL from "./Steps/SSL";

export const steps: {
    title: string,
    component({updateData, defaultData}): ReactElement,
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
        component: SSL
    }
]

export default function (){
    const [stepIndex, setStepIndex] = useState(0);

    const View = steps[stepIndex].component;

    return <>
        <Header />
        <Steps stepIndex={stepIndex} />
        <div className={"container col-lg-6 col-md-8 mt-3"}>
            <View defaultData={steps[stepIndex].data} updateData={data => steps[stepIndex].data = {
                ...steps[stepIndex].data,
                ...data
            }} />
            <div className={"d-flex justify-content-between mt-3"}>
                {stepIndex > 0
                    ? <div onClick={() => setStepIndex(stepIndex - 1)} className="btn btn-outline-secondary">
                        Previous
                    </div>
                    : <div />}

                <div onClick={() => {
                    console.log(steps[stepIndex].data)
                    setStepIndex(stepIndex + 1)
                }} className="btn btn-primary">
                    Next
                </div>
            </div>
        </div>
    </>
}
