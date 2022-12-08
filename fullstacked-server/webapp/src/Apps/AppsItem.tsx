import React, {useEffect, useRef, useState} from "react";
import {DataStore} from "../../DataStore";
import Cookie from "js-cookie";

const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
]

const dateToHuman = (date: Date) => {
    const minutes = date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes();
    const seconds = date.getSeconds() < 10 ? "0" + date.getSeconds() : date.getSeconds();
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()} ${date.getHours()}:${minutes}:${seconds}`;
}

export default function ({appID, openCertificateForm}){
    const [app, setApp] = useState();

    useEffect(() => {
        DataStore.getApp(appID).then(setApp)
    }, [])

    return <div className="card">
        <div className="card-header">
            <div>
                <h3 className="card-title">{appID}</h3>
                {app?.version && <p className="card-subtitle">v{app.version}</p>}
            </div>
            {app?.port
                && <div className="card-actions btn-actions me-1">
                    <div className={"btn btn-action"}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-download"
                             width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"
                             fill="none" stroke-linecap="round" stroke-linejoin="round">
                            <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                            <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2"></path>
                            <polyline points="7 11 12 16 17 11"></polyline>
                            <line x1="12" y1="4" x2="12" y2="16"></line>
                        </svg>
                    </div>
                <div onClick={() => {
                    Cookie.set("app", app.port);
                    window.location.reload();
                }} className="btn btn-primary">
                    Open
                </div>
            </div>}

        </div>
        <div className="card-body">
            <dl>
                {app?.port && <>
                    <dt>Port</dt>
                    <dl>{app.port}</dl>
                </>}
                {app?.serverNames && <>
                    <dt className={"d-flex justify-content-between"}>
                        <div>Server Name{app.serverNames.length > 1 ? "s" : ""}</div>
                    </dt>
                    <dl>
                        {app.serverNames.map(serverName => <div><a target={"_blank"} href={"http://" + serverName}>{serverName}
                            <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-external-link"
                                 width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"
                                 fill="none" strokeLinecap="round" strokeLinejoin="round">
                                <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                                <path d="M11 7h-5a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-5"></path>
                                <line x1="10" y1="14" x2="20" y2="4"></line>
                                <polyline points="15 4 20 4 20 9"></polyline>
                            </svg>
                        </a></div>)}
                    </dl>
                </>}
                {app?.nginxExtra && <>
                    <dt className={"d-flex justify-content-between"}>
                        <div>NGinx Extra Configs</div>
                    </dt>
                    <dl>
                        <pre className={"mt-2"}>{app.nginxExtra}</pre>
                    </dl>
                </>}
                {app?.certificates && <>
                    <dt className={"d-flex justify-content-between"}>
                        <div>Certificates</div>
                        <div onClick={openCertificateForm} className="btn btn-sm btn-outline-primary">
                            Generate
                        </div>
                    </dt>
                    <dl>{!app.certificates.length
                        ? "none"
                        : app.certificates.map(cert => {
                            const isExpired = (new Date(cert.validTo)).getTime() - Date.now() < 0;
                            return <div className={"card my-1"}>
                                <div className={`card-status-start ${isExpired ? "bg-danger" : "bg-success"}`}/>
                                <div className={"card-body"}>
                                    {cert.domains.map(domain => <div>{domain}</div>)}
                                </div>
                                <div className={"card-footer"}>
                                    <div className={"d-flex align-items-center justify-content-between"}>
                                        <small className={"text-muted"}>
                                            {isExpired
                                                ? "Expired since"
                                                : "Valid until"}&nbsp;
                                            {dateToHuman(new Date(cert.validTo))}</small>
                                        <a className="nav-link" href="#">
                                            <svg xmlns="http://www.w3.org/2000/svg"
                                                 className="icon icon-tabler icon-tabler-dots-vertical" width="24"
                                                 height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"
                                                 fill="none" strokeLinecap="round" strokeLinejoin="round">
                                                <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                                                <circle cx="12" cy="12" r="1"></circle>
                                                <circle cx="12" cy="19" r="1"></circle>
                                                <circle cx="12" cy="5" r="1"></circle>
                                            </svg>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        })}</dl>
                </>}
            </dl>
        </div>
        <div className="card-footer">
            {app?.date && <small>Deployed on {dateToHuman(new Date(app.date))}</small>}
        </div>
    </div>
}
