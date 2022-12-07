import React, {useEffect, useState} from "react";
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

export default function ({appID}){
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
                && <div className="card-actions">
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
                {app?.serverName && <>
                    <dt>Server Name</dt>
                    <dl>{app.serverName}</dl>
                </>}
            </dl>
        </div>
        <div className="card-footer">
            {app?.date && <small>Deployed on {dateToHuman(new Date(app.date))}</small>}
        </div>
    </div>
}
