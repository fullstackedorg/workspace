import React, {useEffect, useState} from "react";
import {Client} from "../../client";
import type {NginxConfig} from "@fullstacked/deploy/index";


export default function () {
    const [nginxConfigs, setNginxConfigs] = useState<NginxConfig[]>([]);
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        Client.deploy.getServices().then(setNginxConfigs);
    }, []);

    return <div>
        <div className="card">
            <div className="card-header">
                <ul className="nav nav-tabs card-header-tabs nav-fill" data-bs-toggle="tabs" role="tablist">
                    {
                        nginxConfigs.map((nginxConfig, index) => <li className="nav-item" role="presentation">
                            <div className={`nav-link d-block cursor-pointer ${index === activeIndex && "active"}`}
                                 onClick={() => setActiveIndex(index)}>
                                <div>{nginxConfig.name}</div>
                                <div><small className={"text-muted"}>Port: {nginxConfig.port}</small></div>
                            </div>
                        </li>)
                    }
                </ul>
            </div>
            <div className="card-body">
                <div className="tab-content">
                    {nginxConfigs.map((nginxConfig, index) => <div className={`tab-pane ${index === activeIndex && "active show"}`} id="tabs-home-11" role="tabpanel">
                        <div id={`server-name-inputs-${index}`}>
                            <label className="form-label">Server Name</label>
                            <input type="text" className="form-control mb-2" defaultValue={""} placeholder="foo.example.com" onChange={() => {}}/>
                        </div>
                        <div className={"text-center mt-1"} onClick={() => {}}>
                            <div className="btn btn-primary">
                                <svg xmlns="http://www.w3.org/2000/svg" className="m-0 icon icon-tabler icon-tabler-plus" width="24"
                                     height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none"
                                     strokeLinecap="round" strokeLinejoin="round">
                                    <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                                    <line x1="12" y1="5" x2="12" y2="19"></line>
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                </svg>
                            </div>
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Nginx Extra Configs</label>
                            <textarea className="form-control" rows={6}
                                      defaultValue={""}
                                      placeholder="proxy_set_header Host $host;\nproxy_set_header X-Real-IP $remote_addr;"
                                      onChange={(e) => {}}></textarea>
                        </div>
                        <div className={"card"}>
                            <div className={"card-body"}>
                                <label className="form-check form-switch">
                                    <input className="form-check-input" type="checkbox" onChange={(e) => {
                                        document.getElementById(`custom-port-form-${index}`).classList.toggle("d-none");
                                    }} defaultChecked={!!(nginxConfig?.customPublicPort?.port)}/>
                                    <span className="form-check-label">Custom Public Port</span>
                                </label>

                                <div id={`custom-port-form-${index}`}
                                     className={nginxConfig?.customPublicPort?.port ? "" : "d-none"}>
                                    <label className="form-label">Port</label>
                                    <input type="text" className="form-control mb-2" placeholder="8000"
                                        onChange={(e) => {}}
                                           defaultValue={nginxConfig?.customPublicPort?.port}
                                    />

                                    <label className="form-check">
                                        <input className="form-check-input" type="checkbox"
                                               defaultChecked={nginxConfig?.customPublicPort?.ssl}
                                               onChange={(e) => {}}

                                        />
                                        <span className="form-check-label">SSL</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>)}
                </div>
            </div>
        </div>
    </div>
}
