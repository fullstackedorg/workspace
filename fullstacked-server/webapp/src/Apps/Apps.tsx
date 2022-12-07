import React, {useEffect, useState} from "react";
import {DataStore} from "../../DataStore";
import AppsItem from "./AppsItem";

export default function (){
    const [appsIDs, setAppsIDs] = useState([]);

    useEffect(() => {
        DataStore.getAppsIDs().then(setAppsIDs);
    }, [])

    return <div className={"row row-card"}>
        {appsIDs.map(appID => <div className="col-md-6 col-lg-4">
            <AppsItem appID={appID} />
        </div>)}
    </div>;
}
