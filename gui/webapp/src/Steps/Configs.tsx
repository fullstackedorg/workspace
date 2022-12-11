import React, {useState, useEffect} from "react";
import {fetch} from "../../../../webapp/fetch";

let dockerCompose;
const getDockerCompose = url => {
    if(!dockerCompose)
        dockerCompose = fetch.get(url);
    return dockerCompose;
}

export default function ({baseUrl, defaultData, updateData, getSteps}){
    const [services, setServices] = useState([]);
    const [activeServiceIndex, setActiveServiceIndex] = useState(0);

    useEffect(() => {
        getDockerCompose(`${baseUrl}/docker-compose`).then(dockerCompose => {
            const services: {
                name: string,
                port: string
            }[] = Object.keys(dockerCompose.services).map(serviceName => {
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

            updateData({nginxConfigs: services})
            setServices(services);
        });
    }, []);

    const onInputChange = (service, serviceIndex) => {
        let server_names = [];
        document.querySelectorAll(`#server-name-inputs-${serviceIndex} input`).forEach((input: HTMLInputElement) => {
            server_names.push(input.value);
        });

        services[serviceIndex].server_names = server_names;

        updateData({
            nginxConfigs: services
        });
    }

    return <div>
        <div className="card">
            <div className="card-header">
                <ul className="nav nav-tabs card-header-tabs nav-fill" data-bs-toggle="tabs" role="tablist">
                    {
                        services.map((service, serviceIndex) => <li className="nav-item" role="presentation">
                            <div className={`nav-link d-block cursor-pointer ${serviceIndex === activeServiceIndex && "active"}`}
                                 onClick={() => setActiveServiceIndex(serviceIndex)}>
                                <div>{service.name}</div>
                                <div><small className={"text-muted"}>Port: {service.port}</small></div>
                            </div>
                        </li>)
                    }
                </ul>
            </div>
            <div className="card-body">
                <div className="tab-content">
                    {services.map((service, serviceIndex) => <div className={`tab-pane ${serviceIndex === activeServiceIndex && "active show"}`} id="tabs-home-11" role="tabpanel">
                        <div id={`server-name-inputs-${serviceIndex}`}>
                            <label className="form-label">Server Name</label>
                            {defaultData?.nginxConfigs?.at(serviceIndex)?.server_names?.map(server_name =>
                                <input type="text" className="form-control mb-2" defaultValue={server_name} placeholder="foo.example.com" onChange={() => onInputChange(service, serviceIndex)}/>)
                                ?? <input type="text" className="form-control mb-2" placeholder="foo.example.com" onChange={() => onInputChange(service, serviceIndex)}/>}



                        </div>
                        <div className={"text-center mt-1"} onClick={() => {
                            const input = document.createElement("input");
                            input.type = "text";
                            input.classList.add("form-control", "mb-2");
                            input.placeholder = "foo.example.com";
                            input.addEventListener('change', () => onInputChange(service, serviceIndex))
                            document.querySelector(`#server-name-inputs-${serviceIndex}`).append(input);
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
                                      defaultValue={defaultData?.nginxConfigs?.at(serviceIndex)?.nginx_extra_configs?.join("\n")}
                                      placeholder="proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;" onChange={(e) => {
                                services[serviceIndex].nginx_extra_configs = e.target.value.split("\n");
                                updateData({
                                    nginxConfigs: services
                                });
                            }}></textarea>
                                </div>
                        </div>)}
                </div>
            </div>
        </div>
    </div>
}
