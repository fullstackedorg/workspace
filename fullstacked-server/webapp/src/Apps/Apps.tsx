import React, {useEffect, useState} from "react";
import {DataStore} from "../../DataStore";
import AppsItem from "./AppsItem";
import AppCertificateForm from "./AppCertificateForm";

export default function (){
    const [appsIDs, setAppsIDs] = useState([]);
    const [formAppID, setFormAppID] = useState(null);

    useEffect(() => {
        DataStore.getAppsIDs().then(setAppsIDs);
    }, [])

    return <div className={"row row-card"}>
        {appsIDs.map(appID => <div className="col-md-6 col-lg-4">
            <AppsItem appID={appID} openCertificateForm={() => {setFormAppID(appID)}}/>
        </div>)}
        <AppCertificateForm appID={formAppID} onClose={() => setFormAppID(null)} />
    </div>;
}
