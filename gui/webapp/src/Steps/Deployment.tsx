import React from "react";

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

export default function () {
    return <div>
        <div className="btn btn-success w-100">
            Launch Deployment
        </div>

        <div className={"d-flex"}>
            <div className={"col-4 pe-2"}>
                <ul className="steps steps-vertical">
                    {steps.map((step, stepIndex) =>  <li className={`step-item`}>
                        <div className="h4 m-0">{step.title}</div>
                        <small className="text-muted">{step.description}</small>
                    </li>)}
                </ul>
            </div>
            <div className={"col-8"}>
                <pre></pre>
            </div>
        </div>
    </div>
}
