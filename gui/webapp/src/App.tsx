import React, {useState} from "react";
import Header from "./Header";
import Steps from "./Steps";
import SSH from "./Steps/SSH";
import Configs from "./Steps/Configs";
import Deployment from "./Steps/Deployment";
import SSL from "./Steps/SSL";

export const steps = [
    {
        title: "SSH Connection",
        component: <SSH/>
    },{
        title: "Configurations",
        component: <Configs />
    },{
        title: "Deployment",
        component: <Deployment />
    },{
        title: "SSL Certificates",
        component: <SSL />
    }
]

export default function (){
    const [stepIndex, setStepIndex] = useState(0);


    return <>
        <Header />
        <Steps stepIndex={stepIndex} />
        <div className={"container col-lg-6 col-md-8"}>
            {steps[stepIndex].component}
            <div className={"d-flex justify-content-between"}>
                {stepIndex > 0
                    ? <div onClick={() => setStepIndex(stepIndex - 1)} className="btn btn-outline-secondary">
                        Previous
                    </div>
                    : <div />}

                <div onClick={() => setStepIndex(stepIndex + 1)} className="btn btn-primary">
                    Next
                </div>
            </div>
        </div>
    </>
}
