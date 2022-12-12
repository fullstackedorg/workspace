import React from "react";
import {fetch} from "fullstacked/webapp/fetch";

export default function ({baseUrl, getSteps}) {
    return <div>
        <p>
            Save your current configurations to your project.
        </p>
        <div className="mb-3">
            <label className="form-label">Password</label>
            <input id="config-pass" type="password" className="form-control" name="example-password-input" placeholder="********" />
        </div>
        <div className={"d-flex justify-content-end"}>
            <div className="cursor-pointer btn btn-primary"
                onClick={async () => {
                    const data = {
                        ...getSteps().at(0).data,
                        nginxConfigs: JSON.stringify(getSteps().at(1).data.nginxConfigs),
                        certificate: JSON.stringify(getSteps().at(2).data.certificate)
                    };
                    const formData = new FormData();
                    Object.keys(data).forEach(key => {
                        if(!data[key]) return;

                        formData.append(key, data[key]);
                    });

                    formData.append("password", (document.querySelector("#config-pass") as HTMLInputElement).value);

                    await fetch.post(`${baseUrl}/save`, formData, null, {
                        headers: {'Content-Type': 'multipart/form-data'}
                    });
                }}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-download" width="24"
                     height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none"
                     strokeLinecap="round" strokeLinejoin="round">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                    <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2"></path>
                    <polyline points="7 11 12 16 17 11"></polyline>
                    <line x1="12" y1="4" x2="12" y2="16"></line>
                </svg>
                Save to project
            </div>
        </div>
    </div>
}
