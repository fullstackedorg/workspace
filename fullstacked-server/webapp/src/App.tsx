import React from "react";
import Header from "./Header";
import PortalCertificates from "./PortalCertificates";
import Apps from "./Apps/Apps";

export default function (){
    return <>
        <Header />
        <div className={"container pt-3"}>
            <PortalCertificates />
            <Apps />
        </div>
    </>
}
