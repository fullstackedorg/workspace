import React, {useEffect, useState} from "react";
import {WS} from "../../WebSocket";
import {DEPLOY_CMD, nginxConfig} from "../../../../types/deploy";

let dockerCompose;
const getDockerCompose = () => {
    if(!dockerCompose)
        dockerCompose = WS.cmd(DEPLOY_CMD.DOCKER_COMPOSE);
    return dockerCompose;
}

type nginxConfigProps = {
    defaultData: {nginxConfigs: nginxConfig[]},
    updateData: (data: {nginxConfigs: nginxConfig[]}) => void
}

export default function ({defaultData, updateData}: nginxConfigProps){
    const [nginxConfigs, setNginxConfigs] = useState<nginxConfig[]>([]);
    const [activeConfigIndex, setActiveConfigIndex] = useState(0);

    useEffect(() => {
        getDockerCompose().then(dockerCompose => {
            const configs: nginxConfig[] = Object.keys(dockerCompose.services).map(serviceName => {
                const ports = dockerCompose.services[serviceName].ports;
                return ports
                    ? ports.map(port => {
                        const internalPort = port.split(":").pop();

                        const existing = defaultData?.nginxConfigs?.find(service => service.name === serviceName && service.port === internalPort)
                            ?? {}

                        return {
                            ...existing,
                            name: serviceName,
                            port: internalPort
                        }
                    })
                    : []
            }).flat();

            updateData({nginxConfigs: configs})
            setNginxConfigs(configs);
        });
    }, []);

    const onInputChange = (configIndex) => {
        let serverNames = [];
        document.querySelectorAll(`#server-name-inputs-${configIndex} input`).forEach((input: HTMLInputElement) => {
            serverNames.push(input.value);
        });

        nginxConfigs[configIndex].serverNames = serverNames;

        updateData({nginxConfigs: nginxConfigs});
    }

    return <div>
        <div className="card">
            <div className="card-header">
                <ul className="nav nav-tabs card-header-tabs nav-fill" data-bs-toggle="tabs" role="tablist">
                    {
                        nginxConfigs.map((nginxConfig, configIndex) => <li className="nav-item" role="presentation">
                            <div className={`nav-link d-block cursor-pointer ${configIndex === activeConfigIndex && "active"}`}
                                 onClick={() => setActiveConfigIndex(configIndex)}>
                                <div>{nginxConfig.name}</div>
                                <div><small className={"text-muted"}>Port: {nginxConfig.port}</small></div>
                            </div>
                        </li>)
                    }
                </ul>
            </div>
            <div className="card-body">
                <div className="tab-content">
                    {nginxConfigs.map((nginxConfig, configIndex) => <div className={`tab-pane ${configIndex === activeConfigIndex && "active show"}`} id="tabs-home-11" role="tabpanel">
                        <div id={`server-name-inputs-${configIndex}`}>
                            <label className="form-label">Server Name</label>
                            {defaultData?.nginxConfigs?.at(configIndex)?.serverNames?.filter(serverName => serverName).map(serverName =>
                                <input type="text" className="form-control mb-2" defaultValue={serverName} placeholder="foo.example.com" onChange={() => onInputChange(configIndex)}/>)
                                ?? <input type="text" className="form-control mb-2" placeholder="foo.example.com" onChange={() => onInputChange(configIndex)}/>}

                        </div>
                        <div className={"text-center mt-1"} onClick={() => {
                            const input = document.createElement("input");
                            input.type = "text";
                            input.classList.add("form-control", "mb-2");
                            input.placeholder = "foo.example.com";
                            input.addEventListener('change', () => onInputChange(configIndex))
                            document.querySelector(`#server-name-inputs-${configIndex}`).append(input);
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
                                      defaultValue={defaultData?.nginxConfigs?.at(configIndex)?.nginxExtraConfigs?.join("\n")}
                                      placeholder="proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;" onChange={(e) => {
                                nginxConfigs[configIndex].nginxExtraConfigs = e.target.value.split("\n");
                                updateData({
                                    nginxConfigs: nginxConfigs
                                });
                            }}></textarea>
                        </div>
                        <div className={"card"}>
                            <div className={"card-body"}>
                                <label className="form-check form-switch">
                                    <input className="form-check-input" type="checkbox" onChange={(e) => {
                                        document.getElementById(`custom-port-form-${configIndex}`).classList.toggle("d-none");
                                    }} defaultChecked={!!(nginxConfig?.customPublicPort?.port)}/>
                                    <span className="form-check-label">Custom Public Port</span>
                                </label>

                                <div id={`custom-port-form-${configIndex}`}
                                     className={nginxConfig?.customPublicPort?.port ? "" : "d-none"}>
                                    <label className="form-label">Port</label>
                                    <input type="text" className="form-control mb-2" placeholder="8000"
                                        onChange={(e) => {
                                            if(!nginxConfigs[configIndex].customPublicPort){
                                                nginxConfigs[configIndex].customPublicPort = {
                                                    port: 0,
                                                    ssl: false
                                                }
                                            }

                                            nginxConfigs[configIndex].customPublicPort.port = parseInt(e.currentTarget.value);
                                            updateData({
                                                nginxConfigs: nginxConfigs
                                            });
                                        }}
                                           defaultValue={nginxConfig?.customPublicPort?.port}
                                    />

                                    <label className="form-check">
                                        <input className="form-check-input" type="checkbox"
                                               defaultChecked={nginxConfig?.customPublicPort?.ssl}
                                               onChange={(e) => {
                                                   if(!nginxConfigs[configIndex].customPublicPort){
                                                       nginxConfigs[configIndex].customPublicPort = {
                                                           port: 0,
                                                           ssl: false
                                                       }
                                                   }

                                                   nginxConfigs[configIndex].customPublicPort.ssl = e.currentTarget.checked;
                                                   updateData({
                                                       nginxConfigs: nginxConfigs
                                                   });
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
