import React, {useRef, useState} from "react";
import {DEPLOY_CMD} from "../../../../types/deploy";
import { WS } from "../../WebSocket";

const steps = [
    {
        title: "Connect",
        description: "Establishing a connection with your remote server through SSH."
    },{
        title: "Verify Docker",
        description: "Making sure Docker and Docker Compose is installed on your remote server."
    },{
        title: "Build Web App",
        description: "Creating a production build of your web app."
    },{
        title: "Setup Configurations",
        description: "Setting up your docker-compose.yml and nginx.conf files."
    },{
        title: "Upload Web App",
        description: "Shipping everything to your remote server."
    },{
        title: "Predeploy Scripts",
        description: "Running project (*.)predeploy.ts(x)"
    },{
        title: "Start Web App",
        description: "🚀🚀🚀"
    },{
        title: "Postdeploy Script",
        description: "Running project (*.)postdeploy.ts(x)"
    }
]

export default function ({getSteps}) {
    const [deploying, setDeploying] = useState(false);
    const [deploymentStepIndex, setDeploymentStepIndex] = useState(null);
    const logsRef = useRef<HTMLPreElement>();

    return <div>
        <div className={`btn btn-success w-100 ${deploying && "disabled"}`}
             onClick={async () => {
                 setDeploying(true);
                 setDeploymentStepIndex(0);

                 const sshCredentials = {...getSteps().at(0).data};

                 if(sshCredentials?.file?.text)
                     sshCredentials.privateKey = await sshCredentials.file.text();

                 const nginxConfigs = getSteps().at(1).data.nginxConfigs;
                 const certificate = getSteps().at(2).data.certificate;

                 await WS.cmd(DEPLOY_CMD.DEPLOY, {sshCredentials, nginxConfigs, certificate}, () => {
                     setDeploymentStepIndex(prevState => prevState + 1);
                 })
                 setDeploying(false);
             }}>
            {deploying
                ? <div className="spinner-border" role="status"></div>
                : "Launch Deployment"}
        </div>

        <ul className="steps steps-vertical">
            {steps.map((step, stepIndex) =>  <li className={`step-item ${deploymentStepIndex === stepIndex && "active"}`}>
                <div className="h4 m-0">{step.title}</div>
                <small className="text-muted">{step.description}</small>
            </li>)}
        </ul>
    </div>
}
