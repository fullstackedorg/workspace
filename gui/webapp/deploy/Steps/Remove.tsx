import React, {useState} from "react";
import {DEPLOY_CMD} from "../../../../types/deploy";
import { WS } from "../../WebSocket";

const steps = [
    {
        title: "Connect",
        description: "Establishing a connection with your remote server through SSH."
    },{
        title: "Web App Exists",
        description: "Checking if the current web app exists on the remote host."
    },{
        title: "Down Web App",
        description: "Stopping the process of the web app and removing any data related."
    },{
        title: "Remove Web App Directory",
        description: "Delete the current web app directory."
    }
]

export default function ({getSteps}) {
    const [removing, setRemoving] = useState(false);
    const [removalStepIndex, setRemovalStepIndex] = useState(null);

    return <div>
        <div className={`btn btn-danger w-100 ${removing && "disabled"}`}
             onClick={async () => {
                 setRemoving(true);
                 setRemovalStepIndex(0);

                 const sshCredentials = {...getSteps().at(0).data};

                 if(sshCredentials?.file?.text)
                     sshCredentials.privateKey = await sshCredentials.file.text();

                 await WS.cmd(DEPLOY_CMD.REMOVE, {sshCredentials}, () => {
                     setRemovalStepIndex(prevState => prevState + 1);
                 })
                 setRemoving(false);
             }}>
            {removing
                ? <div className="spinner-border" role="status"></div>
                : "Launch Removal"}
        </div>

        <ul className="steps steps-vertical">
            {steps.map((step, stepIndex) =>  <li className={`step-item ${removalStepIndex === stepIndex && "active"}`}>
                <div className="h4 m-0">{step.title}</div>
                <small className="text-muted">{step.description}</small>
            </li>)}
        </ul>
    </div>
}
