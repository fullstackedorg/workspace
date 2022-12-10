import React, {useState, useRef} from "react";

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

export default function ({baseUrl, getSteps}) {
    const [deploying, setDeploying] = useState(false);
    const [deploymentStepIndex, setDeploymentStepIndex] = useState(null);
    const logsRef = useRef<HTMLPreElement>();

    return <div>
        <div className="btn btn-success w-100"
             onClick={async () => {
                 setDeploying(true);
                 setDeploymentStepIndex(0);

                 logsRef.current.innerText = "";

                 const data = {
                     ...getSteps().at(0).data,
                     nginxConfigs: JSON.stringify(getSteps().at(1).data)
                 };
                 const formData = new FormData();
                 Object.keys(data).forEach(key => {
                     if(!data[key]) return;

                     formData.append(key, data[key]);
                 });
                 const stream = await fetch(`${baseUrl}/deploy`, {
                     method: "POST",
                     body: formData
                 });
                 const reader = stream.body.getReader();
                 const td = new TextDecoder();
                 let done, value;
                 while (!done) {
                     ({ value, done } = await reader.read());
                     const data = JSON.parse(td.decode(value));
                     const message = data.error || data.success;
                     logsRef.current.innerHTML += `<div class="${data.error ? "text-danger" : "text-success"}">${message}</div>`;
                     if(data.success) setDeploymentStepIndex(deploymentStepIndex => deploymentStepIndex + 1);
                     logsRef.current.scrollTo(0, logsRef.current.scrollHeight);
                 }

                 setDeploying(false);
             }}>
            Launch Deployment
        </div>

        <div className={"d-flex mt-3"}>
            <div className={"col-4 pe-2"}>
                <ul className="steps steps-vertical">
                    {steps.map((step, stepIndex) =>  <li className={`step-item ${deploymentStepIndex === stepIndex && "active"}`}>
                        <div className="h4 m-0">{step.title}</div>
                        <small className="text-muted">{step.description}</small>
                    </li>)}
                </ul>
            </div>
            <div className={"col-8"}>
                <pre ref={logsRef} style={{
                    minHeight: "100%",
                    maxHeight: 600
                }}></pre>
            </div>
        </div>
    </div>
}
