import React, {useEffect, useState} from "react";
import {Client} from "../../client";
import type {NginxConfig} from "@fullstacked/deploy";

let throttler = null;

export default function () {
    const [nginxConfigs, setNginxConfigs] = useState<NginxConfig[]>(null);
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {Client.get().deploy.getServices().then(setNginxConfigs)}, []);
    useEffect(() => {
        if(!nginxConfigs) return;

        if(throttler) clearTimeout(throttler);
        throttler = setTimeout(() => {
            throttler = null;
            return Client.post().deploy.updateNginxConfigs(nginxConfigs);
        }, 300);

    }, [nginxConfigs]);

    return <div>
        <div className="card">
            <div className="card-header">
                <ul className="nav nav-tabs card-header-tabs nav-fill" data-bs-toggle="tabs" role="tablist">
                    {
                        nginxConfigs?.map((nginxConfig, index) => <li className="nav-item" role="presentation">
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
                    {nginxConfigs?.map((nginxConfig, index) => <div className={`tab-pane ${index === activeIndex && "active show"}`}>
                        <div>
                            <label className="form-label">Server Name</label>
                            {nginxConfig.serverNames?.map((serverName, i) =>
                                <input type="text" className="form-control mb-2" defaultValue={serverName} placeholder="foo.example.com" onChange={(e) => {
                                    nginxConfig.serverNames[i] = e.currentTarget.value;
                                    setNginxConfigs([...nginxConfigs])
                                }}/>)}
                        </div>
                        <div className={"text-center mt-1"} onClick={() => {
                            if(!nginxConfig.serverNames)
                                nginxConfig.serverNames = [];

                            nginxConfig.serverNames.push("")
                            setNginxConfigs([...nginxConfigs]);
                        }}>
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
                                      defaultValue={nginxConfig?.nginxExtraConfigs?.join("\n")}
                                      placeholder={`proxy_set_header Host $host;\nproxy_set_header X-Real-IP $remote_addr;`}
                                      onChange={(e) => {
                                          nginxConfig.nginxExtraConfigs = e.currentTarget.value
                                              .split("\n");
                                          setNginxConfigs([...nginxConfigs]);
                                      }}></textarea>
                        </div>
                        <div className="mb-3">
                            <div className="form-label">Reverse Proxy Protocol</div>
                            <div>
                                <label className="form-check">
                                    <input className="form-check-input" type="radio" name={`proto-${index}`} value={"http"}
                                           defaultChecked={!nginxConfig?.proto || nginxConfig.proto === "http"}
                                           onChange={() => {
                                               nginxConfig.proto = "http";
                                               setNginxConfigs([...nginxConfigs])
                                           }}
                                    />
                                    <span className="form-check-label">http</span>
                                </label>
                                <label className="form-check">
                                    <input className="form-check-input" type="radio" name={`proto-${index}`} value={"https"}
                                           defaultChecked={nginxConfig.proto === "https"}
                                           onChange={() => {
                                               nginxConfig.proto = "https";
                                               setNginxConfigs([...nginxConfigs])
                                           }}
                                    />
                                    <span className="form-check-label">https</span>
                                </label>
                            </div>
                        </div>
                        <div className={"card"}>
                            <div className={"card-body"}>
                                <label className="form-check form-switch">
                                    <input className="form-check-input" type="checkbox" onChange={(e) => {
                                        if(e.currentTarget.checked){
                                            nginxConfig.customPublicPort = {
                                                port: undefined,
                                                ssl: false
                                            };
                                        }else
                                            delete nginxConfig.customPublicPort;

                                        setNginxConfigs([...nginxConfigs])
                                    }} defaultChecked={!!(nginxConfig?.customPublicPort)}/>
                                    <span className="form-check-label">Custom Public Port</span>
                                </label>

                                <div id={`custom-port-form-${index}`}
                                     className={nginxConfig?.customPublicPort ? "" : "d-none"}>
                                    <label className="form-label">Port</label>
                                    <input type="text" className="form-control mb-2" placeholder="8000"
                                        onChange={(e) => {
                                            nginxConfig.customPublicPort.port = parseInt(e.currentTarget.value);
                                            setNginxConfigs([...nginxConfigs]);
                                        }}
                                           defaultValue={nginxConfig.customPublicPort?.port}
                                    />

                                    <label className="form-check">
                                        <input className="form-check-input" type="checkbox"
                                               defaultChecked={nginxConfig?.customPublicPort?.ssl}
                                               onChange={(e) => {
                                                   nginxConfig.customPublicPort.ssl = e.currentTarget.checked;
                                                   setNginxConfigs([...nginxConfigs]);
                                               }}

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
