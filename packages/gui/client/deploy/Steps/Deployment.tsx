import React, {useEffect, useState} from "react";
import {Client} from "../../client";

const steps = [
    {
        title: "Connect",
        description: "Establishing a connection with your remote server through SSH."
    },{
        title: "Verify Docker",
        description: "Making sure Docker and Docker Compose is installed on your remote server."
    },{
        title: "Setup Configurations",
        description: "Setting up your docker-compose.yml and nginx.conf files."
    },{
        title: "Upload Web App",
        description: "Shipping everything to your remote server."
    },{
        title: "Start Web App",
        description: "🚀🚀🚀"
    }
]

let progressPollInterval;
export default function () {
    const [deploying, setDeploying] = useState(false);
    const [pull, setPull] = useState(false);
    const [deploymentStepIndex, setDeploymentStepIndex] = useState(null);

    useEffect(() => {
        if(!deploying) {
            if(progressPollInterval) {
                clearInterval(progressPollInterval);
                progressPollInterval = null;
            }
            setDeploymentStepIndex(null);
            return;
        }

        if(progressPollInterval) return;

        progressPollInterval = setInterval(() => {
            Client.get().deploy.getDeploymentProgress().then(setDeploymentStepIndex);
        }, 200);
    }, [deploying])

    return <div className={"card"}>
        <div className={"card-body"}>
            <label className="form-check">
                <input className="form-check-input" type="checkbox"
                       disabled={deploying} onChange={e => setPull(e.currentTarget.checked)}
                       checked={pull} />
                <span className="form-check-label">Pull</span>
            </label>
            <div className={`btn btn-success w-100 ${deploying && "disabled"}`}
                 onClick={async () => {
                     setDeploying(true);
                     await Client.get().deploy.launch(pull);
                     setDeploying(false);
                 }}>
                {deploying
                    ? <div className="spinner-border" role="status"></div>
                    : "Launch Deployment"}
            </div>

            <ul className="steps steps-vertical">
                {steps.map((step, stepIndex) =>
                    <li className={`step-item ${deploymentStepIndex === stepIndex && "active"}`}>
                        <div className="h4 m-0">{step.title}</div>
                        <small className="text-muted">{step.description}</small>
                    </li>)}
            </ul>
        </div>
    </div>
}
